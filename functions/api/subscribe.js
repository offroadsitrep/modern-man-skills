export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let source = 'website';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = String(body.email || '').trim().toLowerCase();
      source = String(body.source || 'website').slice(0, 80);
    } else {
      const form = await request.formData();
      email = String(form.get('email') || '').trim().toLowerCase();
      source = String(form.get('source') || 'website').slice(0, 80);
    }

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) return json({ ok: false, message: 'Enter a valid email.' }, 400);

    const ua = request.headers.get('user-agent') || '';
    const ip = request.headers.get('cf-connecting-ip') || '';
    const ipHash = ip ? await sha256(ip) : '';

    await env.EMAIL_DB.prepare(
      `INSERT OR IGNORE INTO email_signups (email, source, user_agent, ip_hash) VALUES (?, ?, ?, ?)`
    ).bind(email, source, ua.slice(0, 240), ipHash).run();

    return json({ ok: true, message: 'You’re on the list. No spam, no nonsense.' });
  } catch (err) {
    return json({ ok: false, message: 'Signup is having a moment. Try again soon.' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: true, message: 'Modern Man Skills signup endpoint.' });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
