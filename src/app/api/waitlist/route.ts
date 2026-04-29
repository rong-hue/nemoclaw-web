import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export async function POST(req: NextRequest) {
  try {
    const { email, locale = 'en' } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 写入 waitlist 表（重复邮箱忽略）
    const { error: dbError } = await supabase
      .from('waitlist')
      .upsert({ email, locale, created_at: new Date().toISOString() }, { onConflict: 'email', ignoreDuplicates: true });

    if (dbError) {
      console.error('DB error:', dbError);
      // 不阻断流程，继续发邮件
    }

    // 发确认邮件
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'NemoClaw Culture <hello@nemoclaw-web.com>';

    if (resendKey) {
      const subject = locale === 'zh'
        ? '🎉 你已加入 NemoClaw Culture 等待名单！'
        : locale === 'ja'
        ? '🎉 NemoClaw Culture ウェイトリストに登録されました！'
        : locale === 'ko'
        ? '🎉 NemoClaw Culture 대기자 명단에 등록되었습니다!'
        : '🎉 You\'re on the NemoClaw Culture waitlist!';

      const html = buildEmailHtml(email, locale);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: email, subject, html }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function buildEmailHtml(email: string, locale: string): string {
  const isZh = locale === 'zh';
  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const title = isZh ? '你已成功加入等待名单 🎉' : isJa ? 'ウェイトリスト登録完了 🎉' : isKo ? '대기자 명단 등록 완료 🎉' : 'You\'re on the waitlist! 🎉';
  const body = isZh
    ? '感谢你对 NemoClaw Culture 的关注！我们正在打造一个 AI 驱动的东方美学创作平台，让全球创作者都能轻松创作出属于自己的东方美学作品。<br><br>我们即将正式发布，你将是第一批收到通知的人。<br><br>早鸟用户可享受 <strong>$4.9/月终身锁定价格</strong>（正式价 $9.9/月），前 200 名专属。'
    : isJa
    ? 'NemoClaw Culture にご興味をお持ちいただきありがとうございます！AIを活用した東洋美学クリエイティブプラットフォームを構築中です。<br><br>正式リリース時に最初にお知らせします。<br><br>アーリーバードユーザーは <strong>$4.9/月の永久固定価格</strong>（通常価格 $9.9/月）をご利用いただけます。先着200名限定。'
    : isKo
    ? 'NemoClaw Culture에 관심을 가져주셔서 감사합니다! AI 기반 동양 미학 창작 플랫폼을 구축 중입니다.<br><br>정식 출시 시 가장 먼저 알려드리겠습니다.<br><br>얼리버드 사용자는 <strong>월 $4.9 평생 고정 가격</strong>(정가 월 $9.9)을 이용하실 수 있습니다. 선착순 200명 한정.'
    : 'Thank you for your interest in NemoClaw Culture! We\'re building an AI-powered Eastern aesthetics creation platform for global creators.<br><br>You\'ll be among the first to know when we launch.<br><br>Early bird users get <strong>$4.9/month locked forever</strong> (regular price $9.9/month) — first 200 only.';

  const cta = isZh ? '探索作品画廊' : isJa ? 'ギャラリーを見る' : isKo ? '갤러리 보기' : 'Explore the Gallery';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#f97316,#dc2626);padding:40px 32px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">🏮</div>
      <div style="color:white;font-size:22px;font-weight:700">NemoClaw Culture</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px">Eastern Aesthetics · AI Creation</div>
    </div>
    <div style="padding:32px">
      <h2 style="color:white;font-size:20px;margin:0 0 16px">${title}</h2>
      <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px">${body}</p>
      <a href="https://nemoclaw-web.pages.dev/${locale}/gallery"
         style="display:block;background:linear-gradient(135deg,#f97316,#dc2626);color:white;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
        ${cta} →
      </a>
    </div>
    <div style="padding:16px 32px 24px;text-align:center;color:#475569;font-size:12px">
      NemoClaw Culture · nemoclaw-web.com
    </div>
  </div>
</body>
</html>`;
}
