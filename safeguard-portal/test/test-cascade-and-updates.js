/**
 * Integration tests: installation DELETE cascades (schema FKs) + cancelJob,
 * and updates: admin updateClient / updateInstallationStatus, client updateMyProfile.
 *
 * Prerequisites: .env with DB_* set (same as server), schema_fixed.sql + schemaChange.sql applied.
 *
 * Usage:
 *   cd server && node ../test/test-cascade-and-updates.js
 *
 * API sections need the server running (default http://localhost:5001).
 * Env: TEST_API_ORIGIN=http://localhost:5001
 *      TEST_EMPLOYEE_EMAIL / TEST_EMPLOYEE_PASSWORD (employee login for cancelJob)
 *      TEST_CLIENT_USERNAME / TEST_CLIENT_PASSWORD (client-auth for profile)
 */
import pool from '../server/db/db.js'

const ORIGIN = process.env.TEST_API_ORIGIN || 'http://localhost:5001'
const EMP_EMAIL = process.env.TEST_EMPLOYEE_EMAIL || 'bob@company.com'
const EMP_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD || 'Employee@123'
const CLIENT_USER = process.env.TEST_CLIENT_USERNAME || 'johnsmith'
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || 'John@2024!'

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
}

let passed = 0
let failed = 0

function section(name) {
  console.log(`\n${c.bold}${c.cyan}── ${name} ${'─'.repeat(Math.max(0, 52 - name.length))}${c.reset}`)
}
function ok(label, detail = '') {
  passed++
  console.log(`  ${c.green}✓${c.reset} ${label}${detail ? `  ${c.yellow}${detail}${c.reset}` : ''}`)
}
function fail(label, detail = '') {
  failed++
  console.log(`  ${c.red}✗${c.reset} ${label}${detail ? `  — ${detail}` : ''}`)
}

async function serverUp() {
  try {
    const r = await fetch(`${ORIGIN}/`, { signal: AbortSignal.timeout(3000) })
    return r.ok || r.status === 404
  } catch {
    return false
  }
}

async function employeeLogin() {
  const res = await fetch(`${ORIGIN}/api/employee/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMP_EMAIL, password: EMP_PASSWORD }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.token) throw new Error(data.message || `login ${res.status}`)
  return data.token
}

async function clientLogin() {
  const res = await fetch(`${ORIGIN}/api/client-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: CLIENT_USER, password: CLIENT_PASSWORD }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.token) throw new Error(data.message || `client login ${res.status}`)
  return { token: data.token, clientId: data.clientId }
}

// ─── 1) DB: DELETE installation cascades to assignment, servicevisit, installusage ───
section('DB — FK cascades on DELETE FROM installation')
let cascadeInstallationId = null
let cascadeEmployeeId = null
{
  const loc = await pool.query(`SELECT siteid FROM public.location LIMIT 1`)
  if (!loc.rows.length) {
    fail('need at least one location row')
  } else {
    const emp = await pool.query(`SELECT employeeid FROM public.employee LIMIT 1`)
    cascadeEmployeeId = emp.rows[0].employeeid

    const inst = await pool.query(
      `
      INSERT INTO public.installation (
        siteid, scheduleddate, internalcost, price, techniciannumbs, description, status, completeddate
      )
      VALUES ($1, CURRENT_DATE + 14, 1.00, 1.00, 1, 'CASCADE TEST ROW', 'Scheduled', NULL)
      RETURNING installationid
      `,
      [loc.rows[0].siteid]
    )
    cascadeInstallationId = inst.rows[0].installationid

    await pool.query(
      `INSERT INTO public.assignment (employeeid, installationid, hoursworked) VALUES ($1, $2, 1.0)`,
      [cascadeEmployeeId, cascadeInstallationId]
    )

    const vis = await pool.query(
      `
      INSERT INTO public.servicevisit (visitnumber, installationid, visitdate, visittype, outcomestatus, notes)
      VALUES (nextval('public.servicevisit_visitnumber_seq'), $1, CURRENT_DATE, 'Inspection', 'Pending', 'cascade test')
      RETURNING visitnumber
      `,
      [cascadeInstallationId]
    )
    const visitnumber = vis.rows[0].visitnumber

    let addedInstallusage = false
    const invSys = await pool.query(
      `SELECT i.inventoryid, s.systemid FROM public.inventory i CROSS JOIN public.system s LIMIT 1`
    )
    if (invSys.rows.length) {
      const { inventoryid, systemid } = invSys.rows[0]
      await pool.query(
        `INSERT INTO public.installusage (inventoryid, systemid, installationid) VALUES ($1, $2, $3)`,
        [inventoryid, systemid, cascadeInstallationId]
      )
      addedInstallusage = true
    } else {
      console.log(
        `  ${c.yellow}⚠ empty inventory or system — skipping installusage (cascade still tested on assignment + servicevisit)${c.reset}`
      )
    }

    const beforeA = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.assignment WHERE installationid = $1`,
      [cascadeInstallationId]
    )
    const beforeS = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.servicevisit WHERE installationid = $1`,
      [cascadeInstallationId]
    )
    const beforeU = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.installusage WHERE installationid = $1`,
      [cascadeInstallationId]
    )
    const needU = addedInstallusage ? beforeU.rows[0].n < 1 : false
    if (beforeA.rows[0].n < 1 || beforeS.rows[0].n < 1 || needU) {
      fail(
        'child rows not inserted',
        JSON.stringify({
          assignment: beforeA.rows[0].n,
          servicevisit: beforeS.rows[0].n,
          installusage: beforeU.rows[0].n,
        })
      )
    } else {
      ok(
        'inserted installation + assignment + servicevisit' + (addedInstallusage ? ' + installusage' : ''),
        `installationid=${cascadeInstallationId}`
      )
    }

    await pool.query(`DELETE FROM public.installation WHERE installationid = $1`, [cascadeInstallationId])

    const afterI = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.installation WHERE installationid = $1`,
      [cascadeInstallationId]
    )
    const afterA = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.assignment WHERE installationid = $1`,
      [cascadeInstallationId]
    )
    const afterS = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.servicevisit WHERE installationid = $1`,
      [cascadeInstallationId]
    )
    const afterU = await pool.query(
      `SELECT COUNT(*)::int AS n FROM public.installusage WHERE installationid = $1`,
      [cascadeInstallationId]
    )

    if (
      afterI.rows[0].n === 0 &&
      afterA.rows[0].n === 0 &&
      afterS.rows[0].n === 0 &&
      afterU.rows[0].n === 0
    ) {
      ok('DELETE installation removed child rows (cascade)', `visit#${visitnumber} cleaned up`)
    } else {
      fail(
        'cascade incomplete',
        `installation=${afterI.rows[0].n} assignment=${afterA.rows[0].n} servicevisit=${afterS.rows[0].n} installusage=${afterU.rows[0].n}`
      )
    }
    cascadeInstallationId = null
  }
}

// ─── 2) API: cancelJob deletes installation (same cascade) ───
section('API — DELETE /api/employee/cancel-job/:installationid')
if (!(await serverUp())) {
  console.log(`  ${c.yellow}⚠ server not reachable at ${ORIGIN} — skipped${c.reset}`)
} else {
  try {
    const token = await employeeLogin()
    const loc = await pool.query(`SELECT siteid FROM public.location LIMIT 1`)
    const empRow = await pool.query(`SELECT employeeid FROM public.employee WHERE email = $1`, [EMP_EMAIL])
    if (!empRow.rows.length) {
      throw new Error(`No employee with email ${EMP_EMAIL} — set TEST_EMPLOYEE_EMAIL`)
    }
    const empId = empRow.rows[0].employeeid

    const inst = await pool.query(
      `
      INSERT INTO public.installation (
        siteid, scheduleddate, internalcost, price, techniciannumbs, description, status, completeddate
      )
      VALUES ($1, CURRENT_DATE + 21, 1.00, 1.00, 1, 'CANCEL JOB API TEST', 'Scheduled', NULL)
      RETURNING installationid
      `,
      [loc.rows[0].siteid]
    )
    const iid = inst.rows[0].installationid
    await pool.query(
      `INSERT INTO public.assignment (employeeid, installationid, hoursworked) VALUES ($1, $2, 0)`,
      [empId, iid]
    )
    await pool.query(
      `
      INSERT INTO public.servicevisit (visitnumber, installationid, visitdate, visittype, outcomestatus, notes)
      VALUES (nextval('public.servicevisit_visitnumber_seq'), $1, CURRENT_DATE, 'Inspection', 'Pending', 'cancel API test')
      `,
      [iid]
    )

    const res = await fetch(`${ORIGIN}/api/employee/cancel-job/${iid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      fail('cancelJob', `${res.status} ${data.message || JSON.stringify(data)}`)
    } else {
      ok('cancelJob returns success', data.message || '')
    }

    const gone = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM public.installation WHERE installationid = $1) AS i,
        (SELECT COUNT(*) FROM public.assignment WHERE installationid = $1) AS a,
        (SELECT COUNT(*) FROM public.servicevisit WHERE installationid = $1) AS s`,
      [iid]
    )
    const g = gone.rows[0]
    if (Number(g.i) === 0 && Number(g.a) === 0 && Number(g.s) === 0) {
      ok('installation + assignment + servicevisit removed after cancelJob')
    } else {
      fail('rows remain after cancelJob', JSON.stringify(g))
    }
  } catch (e) {
    fail('cancelJob section', e.message)
  }
}

// ─── 3) Admin: updateClient + updateInstallationStatus ───
section('API — PUT /api/admin/updateClient + updateInstallationStatus')
if (!(await serverUp())) {
  console.log(`  ${c.yellow}⚠ server not reachable — skipped${c.reset}`)
} else {
  try {
    const cur = await pool.query(`SELECT clientid, fname, lname, email, phone, billingaddress, customertype FROM public.client WHERE clientid = 1`)
    if (!cur.rows.length) {
      fail('client id=1 not found')
    } else {
      const row = cur.rows[0]
      const suffix = ` (test ${Date.now()})`
      const res = await fetch(`${ORIGIN}/api/admin/updateClient`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientid: row.clientid,
          firstName: row.fname,
          lastName: row.lname + suffix.trim(),
          email: row.email,
          phone: row.phone,
          billingaddress: row.billingaddress,
          customertype: row.customertype,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        fail('updateClient', `${res.status} ${data.error || data.message}`)
      } else {
        ok('updateClient', `lname=${data.client?.lname || 'ok'}`)
      }
      await pool.query(`UPDATE public.client SET lname = $1 WHERE clientid = $2`, [row.lname, row.clientid])
      ok('restored client lname')
    }

    const loc2 = await pool.query(`SELECT siteid FROM public.location LIMIT 1`)
    if (!loc2.rows.length) {
      console.log(`  ${c.yellow}⚠ no location — updateInstallationStatus skipped${c.reset}`)
    } else {
      const ins = await pool.query(
        `
        INSERT INTO public.installation (
          siteid, scheduleddate, internalcost, price, techniciannumbs, description, status, completeddate
        )
        VALUES ($1, CURRENT_DATE, 0, 0, 1, 'ADMIN STATUS API TEST', 'Scheduled', NULL)
        RETURNING installationid
        `,
        [loc2.rows[0].siteid]
      )
      const installationid = ins.rows[0].installationid
      const res = await fetch(`${ORIGIN}/api/admin/updateInstallationStatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installationid, status: 'Completed' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        fail('updateInstallationStatus (Completed)', `${res.status} ${data.error || data.message || ''}`)
        await pool.query(`DELETE FROM public.installation WHERE installationid = $1`, [installationid])
      } else {
        const cd = data.installation?.completeddate
        ok('updateInstallationStatus → Completed', `completeddate=${cd}`)
        await pool.query(`DELETE FROM public.installation WHERE installationid = $1`, [installationid])
        ok('removed temp installation row')
      }
    }
  } catch (e) {
    fail('admin update section', e.message)
  }
}

// ─── 4) Client: updateMyProfile (incl. 409 stale) ───
section('API — PUT /api/client-auth/profile (updateMyProfile)')
if (!(await serverUp())) {
  console.log(`  ${c.yellow}⚠ server not reachable — skipped${c.reset}`)
} else {
  try {
    const { token, clientId } = await clientLogin()
    const before = await pool.query(
      `SELECT fname, lname, email, billingaddress, phone FROM public.client WHERE clientid = $1`,
      [clientId]
    )
    if (!before.rows.length) {
      fail('client row missing')
    } else {
      const b = before.rows[0]
      const newFname = b.fname.endsWith('-t') ? b.fname.slice(0, -2) : b.fname + '-t'

      const stale = await fetch(`${ORIGIN}/api/client-auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fname: newFname,
          expected: { fname: 'wrong', lname: b.lname, email: b.email, billingaddress: b.billingaddress, phone: b.phone },
        }),
      })
      stale.status === 409
        ? ok('409 when expected snapshot mismatches DB', 'stale guard')
        : fail('expected 409 stale profile', `got ${stale.status}`)

      const good = await fetch(`${ORIGIN}/api/client-auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fname: newFname }),
      })
      const gdata = await good.json().catch(() => ({}))
      if (!good.ok || gdata.fname !== newFname) {
        fail('updateMyProfile', `${good.status} ${gdata.message || JSON.stringify(gdata)}`)
      } else {
        ok('updateMyProfile updates fname', `fname=${gdata.fname}`)
      }
      await pool.query(
        `UPDATE public.client SET fname = $1, lname = $2, email = $3, billingaddress = $4, phone = $5 WHERE clientid = $6`,
        [b.fname, b.lname, b.email, b.billingaddress, b.phone, clientId]
      )
      ok('restored client profile')
    }
  } catch (e) {
    fail('client profile section', e.message)
  }
}

console.log(`\n${'─'.repeat(60)}`)
console.log(`${c.bold}Results: ${c.green}${passed} passed${c.reset}  ${failed > 0 ? c.red : c.bold}${failed} failed${c.reset}`)
console.log(`${'─'.repeat(60)}\n`)

await pool.end()
process.exit(failed > 0 ? 1 : 0)
