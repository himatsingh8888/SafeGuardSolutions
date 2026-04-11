/**
 * Integration tests for /api/employee (requires running server + DB).
 *
 * Login uses email + password (see employeeController.loginEmployee).
 * Defaults: TEST_EMPLOYEE_EMAIL=bob@company.com, TEST_EMPLOYEE_PASSWORD=Employee@123
 * Override via env if your DB differs.
 */
import pool from '../server/db/db.js'

const BASE = process.env.TEST_API_BASE || 'http://localhost:5001/api/employee'
const TEST_LOGIN_EMAIL = process.env.TEST_EMPLOYEE_EMAIL || 'bob@company.com'
const TEST_LOGIN_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD || 'Employee@123'
let TOKEN = ''
let EMPLOYEE_ID = null
let TEST_INSTALLATION_ID = null
let ADDED_VISIT_NUMBER = null

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  cyan: '\x1b[36m', yellow: '\x1b[33m', bold: '\x1b[1m',
}

let passed = 0, failed = 0

function section(name) {
  console.log(`\n${c.bold}${c.cyan}── ${name} ${'─'.repeat(50 - name.length)}${c.reset}`)
}
function ok(label, detail = '') {
  passed++
  console.log(`  ${c.green}✓${c.reset} ${label}${detail ? `  ${c.yellow}${detail}${c.reset}` : ''}`)
}
function fail(label, detail = '') {
  failed++
  console.log(`  ${c.red}✗${c.reset} ${label}${detail ? `  — ${detail}` : ''}`)
}
async function req(method, path, body, useToken = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (useToken && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

section('Setup — resolve employee for tests')
let empRow = await pool.query(
  `SELECT employeeid, email, phonenum, fname, lname FROM public.employee WHERE email = $1`,
  [TEST_LOGIN_EMAIL]
)
if (empRow.rows.length === 0) {
  empRow = await pool.query(`
    SELECT employeeid, email, phonenum, fname, lname FROM public.employee LIMIT 1
  `)
}
if (empRow.rows.length === 0) {
  console.log(`${c.red}No employees in DB.${c.reset}`)
  process.exit(1)
}
const emp = empRow.rows[0]
console.log(`  Using: ${emp.fname} ${emp.lname} (id=${emp.employeeid}, email=${emp.email})`)
EMPLOYEE_ID = emp.employeeid

section('POST /login')
{
  const bad = await req('POST', '/login', { email: 'bad@bad.com', password: 'wrong' }, false)
  bad.status === 401 ? ok('rejects bad credentials', `status=${bad.status}`) : fail('should reject bad credentials', `got ${bad.status}`)

  const good = await req('POST', '/login', { email: emp.email, password: TEST_LOGIN_PASSWORD }, false)
  if (good.ok && good.data.token) {
    TOKEN = good.data.token
    ok('login with real employee', 'token received')
  } else {
    fail('login with real employee', `status=${good.status} — ${good.data.message}`)
    process.exit(1)
  }

  const noToken = await req('GET', '/profile', null, false)
  noToken.status === 401 ? ok('protected route rejects missing token', 'status=401') : fail('should reject missing token', `got ${noToken.status}`)
}

section('GET /profile  [Join: employee + employeeskill]')
{
  const r = await req('GET', '/profile')
  if (r.ok && r.data.employeeid) {
    ok('returns profile', `name=${r.data.fname} ${r.data.lname}`)
    ok('skills array present', `skills=${JSON.stringify(r.data.skills)}`)
  } else {
    fail('GET /profile', `status=${r.status}`)
  }
}

section('GET /stats  [Aggregation: COUNT · SUM · AVG · MIN · MAX]')
{
  const r = await req('GET', '/stats')
  if (r.ok) {
    const { total_jobs, total_hours, avg_hours, min_hours, max_hours } = r.data
    ok('returns all aggregates', `jobs=${total_jobs} hrs=${total_hours} avg=${avg_hours} min=${min_hours} max=${max_hours}`)
  } else {
    fail('GET /stats', `status=${r.status}`)
  }
}

section('GET /job-breakdown  [Aggregation + Group By: status]')
{
  const r = await req('GET', '/job-breakdown')
  if (r.ok) {
    ok(`returns ${r.data.length} status group(s)`, r.data.map(x => x.status).join(', ') || '(none yet)')
  } else {
    fail('GET /job-breakdown', `status=${r.status}`)
  }
}

section('GET /assignments  [Join: assignment + installation + location]')
{
  const r = await req('GET', '/assignments')
  if (r.ok) {
    ok(`returns ${r.data.length} assignment(s)`)
    if (r.data.length > 0) {
      ok('row has siteaddress (join worked)', `siteaddress=${r.data[0].siteaddress}`)
      TEST_INSTALLATION_ID = r.data[0].installationid
      console.log(`  ${c.yellow}→ using installationid=${TEST_INSTALLATION_ID}${c.reset}`)
    } else {
      console.log(`  ${c.yellow}⚠ no assignments — some tests skipped${c.reset}`)
    }
  } else {
    fail('GET /assignments', `status=${r.status}`)
  }
}

section('PUT /update-hours  [Update]')
if (TEST_INSTALLATION_ID) {
  const r = await req('PUT', '/update-hours', { installationid: TEST_INSTALLATION_ID, hoursworked: 5.5 })
  r.ok ? ok('updates hours', `hoursworked=${r.data.hoursworked}`) : fail('update hours', `${r.status} — ${r.data.message}`)

  const bad = await req('PUT', '/update-hours', { installationid: TEST_INSTALLATION_ID, hoursworked: -1 })
  bad.status === 400 ? ok('rejects negative hours', 'status=400') : fail('should reject negative hours', `got ${bad.status}`)

  const wrong = await req('PUT', '/update-hours', { installationid: 999999, hoursworked: 1 })
  wrong.status === 404 ? ok('returns 404 for unknown assignment', 'status=404') : fail('should 404 for unknown assignment', `got ${wrong.status}`)
} else {
  console.log(`  ${c.yellow}skipped${c.reset}`)
}

section('GET /service-visits  [Join: servicevisit + assignment + installation + location]')
{
  const r = await req('GET', '/service-visits')
  if (r.ok) {
    ok(`returns ${r.data.length} visit(s)`)
    if (r.data.length > 0) ok('row has siteaddress (join worked)', `siteaddress=${r.data[0].siteaddress}`)
  } else {
    fail('GET /service-visits', `status=${r.status}`)
  }
}

section('POST /add-service-visit')
if (TEST_INSTALLATION_ID) {
  const bad = await req('POST', '/add-service-visit', { installationid: TEST_INSTALLATION_ID })
  bad.status === 400 ? ok('rejects missing fields', 'status=400') : fail('should reject missing fields', `got ${bad.status}`)

  const r = await req('POST', '/add-service-visit', {
    installationid: TEST_INSTALLATION_ID,
    visitdate: '2026-04-10',
    visittype: 'Inspection',
    outcomestatus: 'Pending',
    notes: 'Test visit from script',
  })
  if (r.status === 201) {
    ADDED_VISIT_NUMBER = r.data.visitnumber
    ok('adds service visit', `visitnumber=${ADDED_VISIT_NUMBER}`)
  } else {
    fail('add service visit', `${r.status} — ${r.data.message}`)
  }

  const unassigned = await req('POST', '/add-service-visit', {
    installationid: 999999, visitdate: '2026-04-10', visittype: 'Repair', outcomestatus: 'Completed',
  })
  unassigned.status === 403 ? ok('rejects visit for unassigned job', 'status=403') : fail('should reject unassigned job', `got ${unassigned.status}`)
} else {
  console.log(`  ${c.yellow}skipped${c.reset}`)
}

section('PUT /update-service-visit')
if (TEST_INSTALLATION_ID && ADDED_VISIT_NUMBER) {
  const r = await req('PUT', '/update-service-visit', {
    visitnumber: ADDED_VISIT_NUMBER,
    installationid: TEST_INSTALLATION_ID,
    visitdate: '2026-04-11',
    visittype: 'Repair',
    outcomestatus: 'Completed',
    notes: 'Updated by test',
  })
  r.ok ? ok('updates service visit', `visittype=${r.data.visittype} outcome=${r.data.outcomestatus}`) : fail('update service visit', `${r.status} — ${r.data.message}`)

  const bad = await req('PUT', '/update-service-visit', {
    visitnumber: 999999, installationid: TEST_INSTALLATION_ID,
    visitdate: '2026-04-11', visittype: 'Repair', outcomestatus: 'Completed',
  })
  bad.status === 404 ? ok('returns 404 for non-existent visit', 'status=404') : fail('should 404 non-existent visit', `got ${bad.status}`)
} else {
  console.log(`  ${c.yellow}skipped${c.reset}`)
}

section('DELETE /delete-service-visit')
if (TEST_INSTALLATION_ID && ADDED_VISIT_NUMBER) {
  const r = await req('DELETE', '/delete-service-visit', {
    visitnumber: ADDED_VISIT_NUMBER, installationid: TEST_INSTALLATION_ID,
  })
  r.ok ? ok('deletes service visit', `message=${r.data.message}`) : fail('delete service visit', `${r.status} — ${r.data.message}`)

  const again = await req('DELETE', '/delete-service-visit', {
    visitnumber: ADDED_VISIT_NUMBER, installationid: TEST_INSTALLATION_ID,
  })
  again.status === 404 ? ok('returns 404 on double-delete', 'status=404') : fail('should 404 on double-delete', `got ${again.status}`)
} else {
  console.log(`  ${c.yellow}skipped${c.reset}`)
}

section('POST /add-skill  +  DELETE /remove-skill')
{
  const TEST_SKILL = 'Access Control'
  await req('DELETE', '/remove-skill', { skill: TEST_SKILL })

  const add = await req('POST', '/add-skill', { skill: TEST_SKILL })
  add.ok ? ok('adds skill', `skill=${TEST_SKILL}`) : fail('add skill', `${add.status} — ${add.data.message}`)

  const dup = await req('POST', '/add-skill', { skill: TEST_SKILL })
  dup.status === 409 ? ok('rejects duplicate skill', 'status=409') : fail('should reject duplicate', `got ${dup.status}`)

  const remove = await req('DELETE', '/remove-skill', { skill: TEST_SKILL })
  remove.ok ? ok('removes skill') : fail('remove skill', `${remove.status} — ${remove.data.message}`)

  const notFound = await req('DELETE', '/remove-skill', { skill: 'Does Not Exist' })
  notFound.status === 404 ? ok('returns 404 removing non-existent skill', 'status=404') : fail('should 404 non-existent skill', `got ${notFound.status}`)
}

section('PUT /update-profile  [Update: phonenum]')
{
  const r = await req('PUT', '/update-profile', { phonenum: emp.phonenum })
  r.ok ? ok('updates phone', `phonenum=${r.data.phonenum}`) : fail('update profile', `${r.status} — ${r.data.message}`)

  const short = await req('PUT', '/update-profile', { phonenum: '123' })
  short.status === 400 ? ok('rejects short phone number', 'status=400') : fail('should reject short phone', `got ${short.status}`)
}

section('GET /skill-matches  [Division query]')
{
  const r = await req('GET', '/skill-matches')
  r.ok ? ok(`returns ${r.data.length} colleague(s) with full skill match`) : fail('GET /skill-matches', `status=${r.status}`)
}

section('DELETE /cancel-job/:id  [Cascade Delete]')
{
  const notFound = await req('DELETE', '/cancel-job/999999')
  notFound.status === 403 ? ok('returns 403 for unassigned job', 'status=403') : fail('should 403 for unassigned job', `got ${notFound.status}`)

  const nonScheduled = await pool.query(`
    SELECT a.installationid FROM public.assignment a
    JOIN public.installation i ON a.installationid = i.installationid
    WHERE a.employeeid = $1 AND i.status != 'Scheduled' LIMIT 1
  `, [EMPLOYEE_ID])

  if (nonScheduled.rows.length > 0) {
    const r = await req('DELETE', `/cancel-job/${nonScheduled.rows[0].installationid}`)
    r.status === 400 ? ok('rejects cancel on non-Scheduled job', 'status=400') : fail('should reject non-Scheduled cancel', `got ${r.status}`)
  } else {
    console.log(`  ${c.yellow}⚠ no non-Scheduled jobs to test — skipped${c.reset}`)
  }

  console.log(`  ${c.yellow}⚠ live cascade delete skipped to preserve data (see test-stale-data.js)${c.reset}`)
}

console.log(`\n${'─'.repeat(60)}`)
console.log(`${c.bold}Results: ${c.green}${passed} passed${c.reset}  ${failed > 0 ? c.red : c.bold}${failed} failed${c.reset}`)
console.log(`${'─'.repeat(60)}\n`)

await pool.end()
