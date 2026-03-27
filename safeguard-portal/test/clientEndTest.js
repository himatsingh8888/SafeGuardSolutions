const BASE_URL = 'http://localhost:5000/api';
const CLIENT_ID = '1';
const BAD_ID = '999999';
const INSTALL_ID = '1';

const results = [];

async function run(label, method, path, { body, expect } = {}) {
  const url = `${BASE_URL}${path}`;
  let res, json;

  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    json = await res.json();
  } catch (err) {
    console.log(`\n❌  ${label}`);
    console.log(`    ${method} ${path}`);
    console.log(`    ERROR: ${err.message}`);
    results.push({ label, ok: false });
    return;
  }

  const failures = [];

  if (expect.status && res.status !== expect.status) {
    failures.push(`status: got ${res.status}, want ${expect.status}`);
  }

  if (expect.fields) {
    const target = Array.isArray(json) ? json[0] : json;
    if (!target) {
      failures.push('response body is empty or not an object');
    } else {
      for (const [key, type] of Object.entries(expect.fields)) {
        if (!(key in target)) {
          failures.push(`missing field "${key}"`);
        } else if (type !== 'any' && typeof target[key] !== type && target[key] !== null) {
          failures.push(`field "${key}": got ${typeof target[key]}, want ${type}`);
        }
      }
    }
  }

  if (expect.isArray !== undefined) {
    if (expect.isArray && !Array.isArray(json)) failures.push('expected array response');
    if (!expect.isArray && Array.isArray(json)) failures.push('expected object response');
  }

  if (expect.errorField && !json.error) {
    failures.push('expected an "error" field in response');
  }

  const ok = failures.length === 0;
  console.log(`\n${ok ? '✅' : '❌'}  ${label}`);
  console.log(`    ${method} ${path}`);
  if (!ok) failures.forEach(f => console.log(`    ⚠  ${f}`));
  else console.log(`    status ${res.status} · ${JSON.stringify(json).slice(0, 80)}…`);

  results.push({ label, ok });
}

async function main() {
  await run('GET client – valid', 'GET', `/client/${CLIENT_ID}`, {
    expect: {
      status: 200,
      isArray: false,
      fields: {
        clientId: 'any',
        fname: 'string',
        lname: 'string',
        address: 'any',
        customerType: 'any',
        email: 'any',
        phone: 'any',
      },
    },
  });

  await run('GET client – not found', 'GET', `/client/${BAD_ID}`, {
    expect: { status: 404, errorField: true },
  });

  await run('PUT client – valid', 'PUT', `/client/${CLIENT_ID}`, {
    body: {
      fname: 'John',
      lname: 'Doe',
      address: '123 Main St',
      email: 'john.doe@example.com',
      phone: '555-1234',
    },
    expect: {
      status: 200,
      isArray: false,
      fields: {
        clientId: 'any',
        fname: 'string',
        lname: 'string',
        email: 'any',
      },
    },
  });

  await run('PUT client – not found', 'PUT', `/client/${BAD_ID}`, {
    body: { fname: 'X', lname: 'X', address: 'X', email: 'x@x.com', phone: '000' },
    expect: { status: 404, errorField: true },
  });

  await run('GET installations – valid', 'GET', `/client/${CLIENT_ID}/installations`, {
    expect: {
      status: 200,
      isArray: true,
      fields: {
        installationId: 'any',
        siteId: 'any',
        address: 'any',
        scheduledDate: 'any',
        status: 'any',
      },
    },
  });

  await run('GET installations – limit=1', 'GET', `/client/${CLIENT_ID}/installations?limit=1`, {
    expect: { status: 200, isArray: true },
  });

  await run('GET installations – limit=0 (bad)', 'GET', `/client/${CLIENT_ID}/installations?limit=0`, {
    expect: { status: 400, errorField: true },
  });

  await run('GET installations – limit=-1 (bad)', 'GET', `/client/${CLIENT_ID}/installations?limit=-1`, {
    expect: { status: 400, errorField: true },
  });

  await run('GET installations – limit=abc (bad)', 'GET', `/client/${CLIENT_ID}/installations?limit=abc`, {
    expect: { status: 400, errorField: true },
  });

  await run('GET installations – client not found', 'GET', `/client/${BAD_ID}/installations`, {
    expect: { status: 404, errorField: true },
  });

  await run('GET installation detail – valid', 'GET', `/client/${CLIENT_ID}/installations/${INSTALL_ID}`, {
    expect: {
      status: 200,
      isArray: false,
      fields: {
        installationId: 'any',
        status: 'any',
        scheduledDate: 'any',
        site: 'object',
        systems: 'object',
        serviceVisitList: 'object',
      },
    },
  });

  await run('GET installation detail – wrong client', 'GET', `/client/${BAD_ID}/installations/${INSTALL_ID}`, {
    expect: { status: 404, errorField: true },
  });

  await run('GET payments – valid', 'GET', `/client/${CLIENT_ID}/payments`, {
    expect: {
      status: 200,
      isArray: true,
      fields: {
        paymentId: 'any',
        status: 'any',
        dueDate: 'any',
        totalAmount: 'any',
        paymentType: 'any',
      },
    },
  });

  await run('GET payments – client not found', 'GET', `/client/${BAD_ID}/payments`, {
    expect: { status: 404, errorField: true },
  });

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log('\n' + '─'.repeat(54));
  console.log(' SUMMARY');
  console.log('─'.repeat(54));
  results.forEach(r => console.log(` ${r.ok ? '✅' : '❌'}  ${r.label}`));
  console.log('─'.repeat(54));
  console.log(` ${passed}/${results.length} passed${failed ? `  (${failed} failed)` : ''}`);
  console.log('─'.repeat(54) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
