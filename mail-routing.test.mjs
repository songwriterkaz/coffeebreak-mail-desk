import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LIVE_API,
  LOCAL_NOTE_FOLDER,
  planRecipients,
  describeSend,
  describeReceive,
  describeLiveStatus,
  localNotes,
  rehomeDeviceNotes,
  createLiveClient
} from './mail-routing.mjs';

function page(name) {
  return readFileSync(new URL(name, import.meta.url), 'utf8');
}

test('known handles on this device stay local', () => {
  const plan = planRecipients('sunny, sunny@coffeebreak', ['sunny']);
  assert.equal(plan.local.length, 2);
  assert.deepEqual(plan.local.map(x => x.handle), ['sunny', 'sunny']);
  assert.equal(plan.outside.length, 0);
  assert.equal(plan.invalid.length, 0);
});

test('a bare unknown handle is not treated as an outside address', () => {
  const plan = planRecipients('stranger', ['sunny']);
  assert.equal(plan.outside.length, 0);
  assert.equal(plan.local.length, 0);
  assert.equal(plan.invalid.length, 1);
  assert.match(plan.invalid[0].reason, /not an internet address/i);
});

test('an unknown @coffeebreak handle is not an outside address', () => {
  const plan = planRecipients('stranger@coffeebreak', []);
  assert.equal(plan.outside.length, 0);
  assert.equal(plan.invalid.length, 1);
});

test('a normal email is outside mail', () => {
  const plan = planRecipients('person@example.com', ['sunny']);
  assert.equal(plan.outside.length, 1);
  assert.equal(plan.outside[0].address, 'person@example.com');
});

test('a Coffeebreak mail domain address is sent through the server', () => {
  const plan = planRecipients('ada@coffeebreakmail.dpdns.org', ['sunny']);
  assert.equal(plan.outside.length, 1);
  assert.equal(plan.outside[0].address, 'ada@coffeebreakmail.dpdns.org');
});

test('the same person on this device and on the mail domain is both', () => {
  const plan = planRecipients('sunny@coffeebreakmail.dpdns.org', ['sunny']);
  assert.equal(plan.local.length, 1);
  assert.equal(plan.outside.length, 1);
});

test('empty and broken addresses are invalid', () => {
  assert.equal(planRecipients('', []).invalid.length, 0);
  assert.equal(planRecipients('   ', []).invalid.length, 0);
  const bad = planRecipients('not an email, a@b', []);
  assert.equal(bad.outside.length, 0);
  assert.ok(bad.invalid.length >= 1);
});

test('local copies are never described as delivered', () => {
  const text = describeSend({ localCount: 2, outsideCount: 0, signedIn: false });
  assert.match(text, /on this device/i);
  assert.match(text, /not sent over the internet/i);
  assert.doesNotMatch(text, /deliver/i);
});

test('outside mail without a sign-in is not sent', () => {
  const text = describeSend({ localCount: 0, outsideCount: 1, signedIn: false });
  assert.match(text, /not sent/i);
  assert.match(text, /sign in/i);
});

test('server acceptance is not described as arrival', () => {
  const text = describeSend({ outsideCount: 1, signedIn: true, accepted: 1 });
  assert.match(text, /accepted/i);
  assert.match(text, /not the same as it arriving/i);
  assert.doesNotMatch(text, /deliver/i);
});

test('a waiting outbox is not described as sent', () => {
  const text = describeSend({ outsideCount: 1, signedIn: true, waiting: true });
  assert.match(text, /outbox/i);
  assert.match(text, /not sent yet/i);
});

test('a rejected send names the failure', () => {
  const text = describeSend({ outsideCount: 1, signedIn: true, accepted: 0, error: 'Daily limit reached' });
  assert.match(text, /not sent/i);
  assert.match(text, /Daily limit reached/);
});

test('receive copy stays honest', () => {
  assert.match(describeReceive({ signedIn: false }), /sign in/i);
  assert.match(describeReceive({ signedIn: false }), /on this device/i);
  assert.equal(describeReceive({ signedIn: true, error: 'Please sign in again' }), 'Please sign in again');
  assert.match(describeReceive({ signedIn: true, count: 0 }), /no new outside mail/i);
  assert.match(describeReceive({ signedIn: true, count: 2 }), /2 new outside emails/i);
});

test('live status never claims a message arrived', () => {
  const signedOut = describeLiveStatus({ ok: true, domain: 'coffeebreakmail.dpdns.org', outsideSend: true, outsideReceive: true, outsidePerDay: 25 }, null);
  assert.match(signedOut, /coffeebreakmail\.dpdns\.org/);
  assert.match(signedOut, /25/);
  assert.match(signedOut, /does not send by itself/i);
  assert.doesNotMatch(signedOut, /arriv/i);
  const signedIn = describeLiveStatus({ ok: true, domain: 'coffeebreakmail.dpdns.org', outsideSend: true, outsideReceive: true, outsidePerDay: 25 }, { address: 'ada@coffeebreakmail.dpdns.org' });
  assert.match(signedIn, /ada@coffeebreakmail\.dpdns\.org/);
  assert.match(signedIn, /until you press Send/i);
  const off = describeLiveStatus({ ok: true, domain: 'coffeebreakmail.dpdns.org', outsideSend: false, outsideReceive: false, outsidePerDay: 25 }, null);
  assert.match(off, /sending is off/i);
  assert.match(off, /receive is off/i);
  assert.match(describeLiveStatus(null, null), /outside mail stays off/i);
});

test('device notes are not an inbox delivery', () => {
  const notes = localNotes('Ada', 'ada');
  assert.equal(notes.length, 1);
  assert.equal(notes[0].folder, LOCAL_NOTE_FOLDER);
  assert.equal(LOCAL_NOTE_FOLDER, 'On this device');
  assert.match(notes[0].body, /not an internet email address/i);
});

test('old welcome seeds move out of the inbox', () => {
  const moved = rehomeDeviceNotes([
    { folder: 'Inbox', from: 'karen@coffeebreak', subject: 'Welcome to Coffeebreak Mail', body: 'Hi' },
    { folder: 'Inbox', from: 'karen@coffeebreak', subject: 'Your Toolbox tour', body: 'Tools' },
    { folder: 'Inbox', from: 'friend@example.com', subject: 'Hello', body: 'Real' }
  ]);
  assert.equal(moved[0].folder, 'On this device');
  assert.equal(moved[0].onDevice, true);
  assert.equal(moved[1].folder, 'On this device');
  assert.equal(moved[2].folder, 'Inbox');
  assert.equal(moved[2].onDevice, undefined);
});

test('the client does not call the network until a method is used', async () => {
  const calls = [];
  const client = createLiveClient({
    fetchImpl: async (url, opt) => {
      calls.push({ url, opt });
      return { ok: true, status: 200, json: async () => ({ ok: true, mail: [] }) };
    }
  });
  assert.deepEqual(calls, []);
  await client.status();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, LIVE_API + '/status');
  assert.equal(calls[0].opt.method, 'GET');
  assert.equal(calls[0].opt.body, undefined);
});

test('send posts only the message the person asked to send', async () => {
  const calls = [];
  const client = createLiveClient({
    fetchImpl: async (url, opt) => {
      calls.push({ url, opt });
      return { ok: true, status: 200, json: async () => ({ ok: true, results: [{ ok: true }] }) };
    }
  });
  await client.send('test-token', { to: 'person@example.com', subject: 'Hi', text: 'Body' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, LIVE_API + '/send');
  assert.equal(calls[0].opt.method, 'POST');
  assert.equal(calls[0].opt.headers.authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(calls[0].opt.body), { to: 'person@example.com', subject: 'Hi', text: 'Body' });
});

test('a 401 clears the session and does not pretend mail arrived', async () => {
  let cleared = 0;
  const client = createLiveClient({
    onUnauthorized() { cleared += 1; },
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: 'Please sign in again' }) })
  });
  await assert.rejects(() => client.pull('stale-token'), /sign in again/i);
  assert.equal(cleared, 1);
});

test('signup and login are explicit posts', async () => {
  const calls = [];
  const client = createLiveClient({
    fetchImpl: async (url, opt) => {
      calls.push({ url, method: opt.method });
      return { ok: true, status: 200, json: async () => ({ ok: true, token: 'test-token', address: 'ada@coffeebreakmail.dpdns.org' }) };
    }
  });
  await client.signup({ handle: 'ada', name: 'Ada', password: 'test-password' });
  await client.login({ handle: 'ada', password: 'test-password' });
  assert.deepEqual(calls.map(c => c.url + ' ' + c.method), [
    LIVE_API + '/signup POST',
    LIVE_API + '/login POST'
  ]);
});

test('routing source keeps provider secrets out of the page', () => {
  const src = page('mail-routing.mjs');
  assert.doesNotMatch(src, /xkeysib-|BREVO_API_KEY|CB_INBOUND_SECRET|CB_MAIL_SECRET|api-key/i);
  assert.match(src, /cbmail-live\.coffeebreaks\.workers\.dev\/api/);
});

test('Mail Desk drops coming soon and does not call a local copy delivered', () => {
  const html = page('index.html');
  const app = page('app.js');
  const sw = page('sw.js');
  assert.doesNotMatch(html, /coming soon/i);
  assert.doesNotMatch(app, /coming soon/i);
  assert.doesNotMatch(app, /Delivered to/);
  assert.doesNotMatch(app, /until sending goes live/i);
  assert.doesNotMatch(html + app, /Gmail|Outlook|GMX/);
  assert.match(html, /On this device/);
  assert.match(html, /does not send by itself/i);
  assert.match(html, /cbreport\.js/);
  assert.match(html, /alt="Coffeebreak logo"/);
  assert.match(html, /https:\/\/www\.tesla\.com/);
  assert.match(html, /https:\/\/www\.starlink\.com/);
  assert.match(html, /claims no ownership/);
  assert.match(app, /createLiveClient/);
  assert.match(app, /planRecipients/);
  assert.match(app, /describeSend/);
  assert.match(app, /describeReceive/);
  assert.match(app, /rehomeDeviceNotes/);
  assert.match(app, /localNotes/);
  assert.match(app, /id="liveNew"|Create address/);
  assert.match(app, /live\.signup/);
  assert.match(app, /live\.login/);
  assert.match(app, /if\(plan\.outside\.length&&liveTok\(\)\)sendLive\(/);
  assert.match(app, /not new outside mail/);
  assert.doesNotMatch(app, /const fresh=load\(\)/);
  assert.match(app, /ensureAccount\(\);\r?\nrender\(\);checkShare\(\);renderLive\(\);if\(liveTok\(\)\)pullLive\(false\);/);
  assert.equal((app.match(/sendLive\(/g) || []).length, 2);
  assert.match(sw, /mail-routing\.mjs/);
  assert.match(sw, /cbreport\.js/);
  assert.doesNotMatch(html + app + sw, /xkeysib-|BREVO_API_KEY|CB_INBOUND_SECRET|CB_MAIL_SECRET/);
});
