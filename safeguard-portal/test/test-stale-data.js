import pool from '../server/db/db.js'

const BASE = 'http://localhost:5001/api/employee'

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', cyan: '\x1b[36m',
  yellow: '\x1b[33m', bold: '\x1b[1m', dim: '\x1b[2m',
}

const sep  = () => console.log(`${c.dim}${'─'.repeat(64)}${c.reset}`)
const hdr  = msg => console.log(`\n${c.bold}${c.cyan}${msg}${c.reset}`)
const step = msg => console.log(`  ${c.yellow}▶${c.reset} ${msg}`)
const ok   = msg => console.log(`  ${c.green}✓${c.reset} ${msg}`)

function pause(msg) {
  return new Promise(resolve => {
    process.stdout.write(`\n  ${c.bold}${c.yellow}[PAUSE]${c.reset} ${msg}\n  Press ENTER when ready… `)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', () => { process.stdin.pause(); resolve() })
  })
}

hdr('Setup')
sep()

const empRow = await pool.query(`SELECT * FROM public.employee LIMIT 1`)
if (empRow.rows.length === 0) {
  console.log('No employees in DB.'); process.exit(1)
}
const emp = empRow.rows[0]
step(`Employee: ${emp.fname} ${emp.lname} (id=${emp.employeeid})`)

const loginRes = await fetch(`${BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emp.email, phone: emp.phonenum }),
})
const loginData = await loginRes.json()
if (!loginRes.ok || !loginData.token) {
  console.log(`Login failed: ${loginData.message}`); process.exit(1)
}
const TOKEN = loginData.token
ok('Logged in')

hdr('Scenario A — Edit Hours on a deleted job')
sep()

const loc    = await pool.query(`SELECT siteid FROM public.location LIMIT 1`)
const client = await pool.query(`SELECT clientid FROM public.client LIMIT 1`)

if (!loc.rows.length || !client.rows.length) {
  console.log(`  ${c.yellow}No location/client data — skipping Scenario A${c.reset}`)
} else {
  const instRes = await pool.query(`
    INSERT INTO public.installation (siteid, clientid, scheduleddate, status, description, price, techniciannumbs)
    VALUES ($1, $2, CURRENT_DATE + 7, 'Scheduled', 'STALE TEST — safe to delete', 0, 1)
    RETURNING installationid
  `, [loc.rows[0].siteid, client.rows[0].clientid])
  const tempId = instRes.rows[0].installationid

  await pool.query(
    `INSERT INTO public.assignment (employeeid, installationid, hoursworked) VALUES ($1, $2, 0)`,
    [emp.employeeid, tempId]
  )

  ok(`Created temp job #${tempId}`)
  step(`Go to the frontend → My Assignments → find Job #${tempId} → click "Edit Hours"`)
  await pause(`Have the Edit Hours popup OPEN for Job #${tempId}, then press ENTER`)

  await pool.query(`DELETE FROM public.installation WHERE installationid = $1`, [tempId])
  ok(`Deleted installation #${tempId}`)

  step(`Now click "Save" in the popup — backend returns 404`)
  step(`You should see the yellow staleBanner on the dashboard`)
  await pause(`Confirm staleBanner appeared, then press ENTER`)
}

hdr('Scenario B — Cancel Job after status changed to non-Scheduled')
sep()

const schedRow = await pool.query(`
  SELECT a.installationid FROM public.assignment a
  JOIN public.installation i ON a.installationid = i.installationid
  WHERE a.employeeid = $1 AND i.status = 'Scheduled' LIMIT 1
`, [emp.employeeid])

if (!schedRow.rows.length) {
  console.log(`  ${c.yellow}No Scheduled jobs — skipping Scenario B${c.reset}`)
} else {
  const sid = schedRow.rows[0].installationid
  step(`Found Scheduled job #${sid}`)
  step(`Go to the frontend → My Assignments → find Job #${sid} → click "Cancel"`)
  await pause(`Have the Cancel popup OPEN, then press ENTER`)

  await pool.query(`UPDATE public.installation SET status = 'In Progress' WHERE installationid = $1`, [sid])
  ok(`Changed job #${sid} to "In Progress"`)

  step(`Click "Cancel Job" in the popup — backend returns 400`)
  step(`staleBanner should appear and the row refreshes to "In Progress"`)
  await pause(`Confirm staleBanner appeared, then press ENTER`)

  await pool.query(`UPDATE public.installation SET status = 'Scheduled' WHERE installationid = $1`, [sid])
  ok(`Restored job #${sid} to Scheduled`)
}

hdr('Scenario C — Edit a service visit that was removed')
sep()

const visitRow = await pool.query(`
  SELECT sv.visitnumber, sv.installationid FROM public.servicevisit sv
  JOIN public.assignment a ON sv.installationid = a.installationid
  WHERE a.employeeid = $1 LIMIT 1
`, [emp.employeeid])

if (!visitRow.rows.length) {
  const assignRow = await pool.query(
    `SELECT installationid FROM public.assignment WHERE employeeid = $1 LIMIT 1`,
    [emp.employeeid]
  )
  if (!assignRow.rows.length) {
    console.log(`  ${c.yellow}No assignments — skipping Scenario C${c.reset}`)
  } else {
    const iid = assignRow.rows[0].installationid
    const newVisit = await pool.query(`
      INSERT INTO public.servicevisit (visitnumber, installationid, visitdate, visittype, outcomestatus, notes)
      VALUES (nextval('public.servicevisit_visitnumber_seq'), $1, CURRENT_DATE, 'Inspection', 'Pending', 'Stale test visit')
      RETURNING visitnumber
    `, [iid])
    const vn = newVisit.rows[0].visitnumber
    ok(`Created temp visit #${vn}`)
    step(`Go to the frontend → Service Visits → visit #${vn} → click "Edit"`)
    await pause(`Have the Edit popup OPEN, then press ENTER`)

    await pool.query(`DELETE FROM public.servicevisit WHERE visitnumber = $1 AND installationid = $2`, [vn, iid])
    ok(`Deleted visit #${vn}`)

    step(`Click "Save Changes" — backend returns 404`)
    step(`staleBanner should appear and the visit disappears`)
    await pause(`Confirm staleBanner appeared`)
  }
} else {
  const { visitnumber, installationid } = visitRow.rows[0]
  step(`Found visit #${visitnumber} on job #${installationid}`)
  step(`Go to the frontend → Service Visits → visit #${visitnumber} → click "Edit"`)
  await pause(`Have the Edit popup OPEN, then press ENTER`)

  await pool.query(`DELETE FROM public.servicevisit WHERE visitnumber = $1 AND installationid = $2`, [visitnumber, installationid])
  ok(`Deleted visit #${visitnumber}`)

  step(`Click "Save Changes" — backend returns 404`)
  step(`staleBanner should appear and the visit disappears`)
  await pause(`Confirm staleBanner appeared`)

  await pool.query(`
    INSERT INTO public.servicevisit (visitnumber, installationid, visitdate, visittype, outcomestatus, notes)
    VALUES ($1, $2, CURRENT_DATE, 'Inspection', 'Pending', 'Restored by stale test')
  `, [visitnumber, installationid])
  ok(`Restored visit #${visitnumber}`)
}

sep()
console.log(`\n${c.bold}${c.green}All stale-data scenarios complete.${c.reset}\n`)

await pool.end()
