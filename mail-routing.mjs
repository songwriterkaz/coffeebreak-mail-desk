/* Honest mail routing for Coffeebreak pages. No provider keys belong in this file. */
export const LIVE_API = 'https://cbmail-live.coffeebreaks.workers.dev/api';
export const LOCAL_NOTE_FOLDER = 'On this device';
export const MAIL_DOMAIN = 'coffeebreakmail.dpdns.org';

const HANDLE = /^[a-z0-9._-]{3,30}$/;
const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const SEEDED = /^(Welcome to Coffeebreak Mail|Your Toolbox tour|Meet Coffeebreak Drive|Need internet on the go|Music, movies and the VR lounge)$/;

export function planRecipients(raw, localUsers) {
  const users = new Set((localUsers || []).map(u => String(u).toLowerCase()));
  const parts = String(raw || '').split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const local = [];
  const outside = [];
  const invalid = [];
  for (const input of parts) {
    if (!input.includes('@')) {
      if (HANDLE.test(input) && users.has(input)) local.push({ input, handle: input });
      else invalid.push({ input, reason: 'That handle is not on this device and is not an internet address.' });
      continue;
    }
    const bits = input.split('@');
    const handle = bits[0];
    const domain = bits[1];
    if (bits.length !== 2 || !handle || !domain) {
      invalid.push({ input, reason: 'That address is not right.' });
      continue;
    }
    if (domain === 'coffeebreak') {
      if (HANDLE.test(handle) && users.has(handle)) local.push({ input, handle });
      else invalid.push({ input, reason: 'That handle is not on this device and is not an internet address.' });
      continue;
    }
    if (!EMAIL.test(input)) {
      invalid.push({ input, reason: 'That address is not right.' });
      continue;
    }
    if (domain === MAIL_DOMAIN && HANDLE.test(handle) && users.has(handle)) local.push({ input, handle });
    outside.push({ input, address: input });
  }
  return { local, outside, invalid };
}

export function describeSend({ localCount = 0, outsideCount = 0, signedIn = false, accepted = 0, error = '', waiting = false } = {}) {
  const parts = [];
  if (localCount) parts.push('Copied to ' + localCount + ' account' + (localCount > 1 ? 's' : '') + ' on this device. Not sent over the internet.');
  if (outsideCount && !signedIn) parts.push('Saved on this device. Not sent. Sign in to send outside mail.');
  else if (outsideCount && waiting) parts.push('The mail service stored this in the outbox. Not sent yet.');
  else if (outsideCount && accepted) parts.push('The mail service accepted ' + accepted + ' outside address' + (accepted > 1 ? 'es' : '') + '. That is not the same as it arriving in their inbox.');
  else if (outsideCount && error) parts.push('Not sent. ' + error);
  else if (outsideCount) parts.push('Not sent.');
  else if (!localCount) parts.push('Nothing to send.');
  return parts.join(' ');
}

export function describeReceive({ signedIn = false, error = '', count = 0 } = {}) {
  if (!signedIn) return 'On this device only. Sign in to check for outside mail.';
  if (error) return error;
  if (!count) return 'No new outside mail from the server.';
  return count + ' new outside email' + (count > 1 ? 's' : '') + ' from the server.';
}

export function describeLiveStatus(status, session) {
  if (!status || status.error) return 'Could not read the mail service. Outside mail stays off until it answers.';
  const domain = status.domain || 'the Coffeebreak mail domain';
  const cap = status.outsidePerDay ? ' Up to ' + status.outsidePerDay + ' outside emails a day.' : '';
  const flags = [];
  if (!status.outsideSend) flags.push('Outside sending is off on the server.');
  if (!status.outsideReceive) flags.push('Outside receive is off on the server.');
  const extra = flags.length ? ' ' + flags.join(' ') : '';
  if (session && session.address) {
    return 'Signed in as ' + session.address + '. Send and Receive use the mail service on ' + domain + '.' + cap + extra + ' This page does not send until you press Send.';
  }
  return 'Outside mail on ' + domain + ' is available after you sign in.' + cap + ' This page does not send by itself.' + extra;
}

export function localNotes(name, handle) {
  return [{
    folder: LOCAL_NOTE_FOLDER,
    onDevice: true,
    subject: 'This handle stays on this device',
    body: 'Hi ' + name + ',\n\n' + handle + '@coffeebreak is a name on this device. It is not an internet email address. Mail copied to other handles on this device is not sent over the internet.\n\nTo send and receive outside email, sign in with a Coffeebreak Mail address on the Mail screen. This page does not send by itself.'
  }];
}

export function rehomeDeviceNotes(messages) {
  return (messages || []).map(m => {
    if (m && m.folder === 'Inbox' && m.from === 'karen@coffeebreak' && SEEDED.test(m.subject || '')) {
      return Object.assign({}, m, { folder: LOCAL_NOTE_FOLDER, onDevice: true });
    }
    return m;
  });
}

export function createLiveClient({ fetchImpl, base = LIVE_API, onUnauthorized } = {}) {
  const doFetch = fetchImpl || globalThis.fetch;
  async function call(path, { method = 'GET', token, body } = {}) {
    let res;
    try {
      const headers = { 'content-type': 'application/json' };
      if (token) headers.authorization = 'Bearer ' + token;
      const opt = { method, headers };
      if (body !== undefined) opt.body = JSON.stringify(body);
      res = await doFetch(base + path, opt);
    } catch (e) {
      throw new Error('Could not reach Coffeebreak Mail. Check your internet.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (res.status === 401 && path !== '/login' && !path.startsWith('/login') && path !== '/signup') {
      if (onUnauthorized) onUnauthorized();
      throw new Error(data.error || 'Please sign in again');
    }
    if (!res.ok && !data.results) throw new Error(data.error || 'Coffeebreak Mail did not answer.');
    return data;
  }
  return {
    status: () => call('/status'),
    signup: body => call('/signup', { method: 'POST', body }),
    login: body => call('/login', { method: 'POST', body }),
    pull: (token, since = 0) => call('/mail?since=' + Number(since || 0), { token }),
    send: (token, body) => call('/send', { method: 'POST', token, body })
  };
}

export const CBMailRoute = {
  LIVE_API,
  LOCAL_NOTE_FOLDER,
  MAIL_DOMAIN,
  planRecipients,
  describeSend,
  describeReceive,
  describeLiveStatus,
  localNotes,
  rehomeDeviceNotes,
  createLiveClient
};

if (typeof window !== 'undefined') {
  window.CBMailRoute = CBMailRoute;
  window.dispatchEvent(new Event('cbmailroute'));
}
