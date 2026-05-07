export const runtime = 'edge';

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
      console.log('Contact form (no Resend key):', { name, email, subject, message });
      return Response.json({ success: true });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NemoClaw Culture <hello@nemoclaw-web.com>',
        to: ['hello@nemoclaw-web.com'],
        reply_to: email,
        subject: `[Contact] ${subject || 'New message'} — from ${name}`,
        html: `
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          <p>${message.replace(/\n/g, '<br/>')}</p>
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
