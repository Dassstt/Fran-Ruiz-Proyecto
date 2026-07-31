function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { nombre, telefono, email, poblacion, tipo, mensaje } = req.body || {};

  if (!nombre || !telefono) {
    res.status(400).json({ error: 'Faltan datos obligatorios' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const toAddress = process.env.CONTACT_TO || 'cmfranruiz@gmail.com';

  if (!apiKey) {
    res.status(500).json({ error: 'Servicio de email no configurado' });
    return;
  }

  const html = `
    <h2>Nueva solicitud de presupuesto — web Ruiz</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email) || '-'}</p>
    <p><strong>Población:</strong> ${escapeHtml(poblacion) || '-'}</p>
    <p><strong>Tipo de trabajo:</strong> ${escapeHtml(tipo) || '-'}</p>
    <p><strong>Mensaje:</strong><br>${escapeHtml(mensaje).replace(/\n/g, '<br>')}</p>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Web Ruiz <${fromAddress}>`,
        to: [toAddress],
        reply_to: email || undefined,
        subject: `Solicitud de presupuesto — ${nombre}`,
        html
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('Resend error:', errText);
      res.status(502).json({ error: 'No se pudo enviar el email' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
};
