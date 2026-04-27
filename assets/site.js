document.querySelectorAll('[data-signup]').forEach((form) => {
  const msg = form.parentElement.querySelector('[data-signup-message]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining…';
    if (msg) msg.textContent = 'Working on it…';

    try {
      const body = Object.fromEntries(new FormData(form).entries());
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Signup failed.');
      form.reset();
      if (msg) msg.textContent = data.message;
    } catch (err) {
      if (msg) msg.textContent = err.message || 'Something broke. Try again.';
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });
});
