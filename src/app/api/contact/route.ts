export const runtime = 'edge';

// G-L3: HTML 转义，防止用户输入内容在邮件里成为 HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json() as {
      name: string; email: string; subject: string; message: string;
    };

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      // 没有配置 Resend，静默成功（开发环境）
      return Response.json({ success: true });
    }

    const safeName    = escapeHtml(name);
    const safeEmail   = escapeHtml(email);
    const safeSubject = escapeHtml(subject || '');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NemoClaw Culture <hello@nemoclaw-web.com>',
        to: ['hello@nemoclaw-web.com'],
        reply_to: safeEmail,
        subject: `[Contact] ${safeSubject || 'New message'} — from ${safeName}`,
        html: `
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr/>
          <p>${safeMessage}</p>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      // 不向用户暴露邮件错误，静默成功
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
