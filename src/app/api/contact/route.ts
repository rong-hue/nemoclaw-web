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

// 简单 IP 频率限制：同一 IP 60秒内最多提交 3 次
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const ipTimestamps = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipTimestamps.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);
  return true;
}

export async function POST(req: Request) {
  // 频率限制
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Too many requests, please wait a moment' }, { status: 429 });
  }

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
