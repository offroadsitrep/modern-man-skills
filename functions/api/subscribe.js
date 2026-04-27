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

    if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
      console.error('Beehiiv credentials not configured');
      return json({ ok: false, message: 'Signup is having a moment. Try again soon.' }, 500);
    }

    const beehiivResponse = await fetch(
      `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: source,
        }),
      },
    );

    if (!beehiivResponse.ok) {
      const errorBody = await beehiivResponse.text();
      console.error('Beehiiv API error:', beehiivResponse.status, errorBody);

      // 400/422 typically mean validation issues with the request itself
      if (beehiivResponse.status === 400 || beehiivResponse.status === 422) {
        return json({ ok: false, message: 'Could not subscribe that email. Try again.' }, 400);
      }

      return json({ ok: false, message: 'Signup is having a moment. Try again soon.' }, 500);
    }

    return json({ ok: true, message: "You're on the list. No spam, no nonsense." });
  } catch (err) {
    console.error('Subscribe error:', err);
    return json({ ok: false, message: 'Signup is having a moment. Try again soon.' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: true, message: 'Modern Man Skills signup endpoint.' });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
