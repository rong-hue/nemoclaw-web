export const runtime = 'edge';

import { ImageResponse } from '@vercel/og';
import { getServerUser } from '@/lib/supabase-auth';
import { oracleService, subscriptionsService } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const oracleId = searchParams.get('id');
    const locale = searchParams.get('locale') || 'en';

    if (!oracleId) {
      return new Response('Missing id', { status: 400 });
    }

    // 鉴权
    const user = await getServerUser(req);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 查神谕记录
    const oracle = await oracleService.getOracleById(oracleId);
    if (!oracle || oracle.user_id !== user.id) {
      return new Response('Not found', { status: 404 });
    }

    // 判断是否 Pro（Pro 版只保留 ✦，免费版加完整水印文字）
    const sub = await subscriptionsService.getActiveByUser(user.id).catch(() => null);
    const isPro = !!sub;

    // 神谕文字（按 locale）
    const oracleText = locale === 'zh' ? oracle.oracle_text : oracle.oracle_text_en;
    const dateStr = new Date(oracle.date).toLocaleDateString(
      locale === 'zh' ? 'zh-CN' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    // 加载字体
    const [serifFont, sansFont] = await Promise.all([
      fetch(new URL('/fonts/NotoSerifSC-Regular.woff2', req.url)).then(r => r.arrayBuffer()),
      fetch(new URL('/fonts/NotoSansSC-Regular.woff2', req.url)).then(r => r.arrayBuffer()),
    ]);

    // 神谕图片转 base64（避免跨域）
    let imageDataUrl = '';
    try {
      const imgRes = await fetch(oracle.image_url);
      const imgBuf = await imgRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
      const mime = imgRes.headers.get('content-type') || 'image/jpeg';
      imageDataUrl = `data:${mime};base64,${base64}`;
    } catch {
      imageDataUrl = oracle.image_url; // fallback
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            fontFamily: 'NotoSans',
          }}
        >
          {/* 神谕图片卡片 */}
          <div
            style={{
              width: 720,
              height: 720,
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 40,
              display: 'flex',
            }}
          >
            <img
              src={imageDataUrl}
              width={720}
              height={720}
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* 神谕文字 */}
          <div
            style={{
              color: '#f5f0e8',
              fontSize: 28,
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: 800,
              fontFamily: 'NotoSerif',
              marginBottom: 16,
            }}
          >
            {oracleText}
          </div>

          {/* 日期 */}
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, marginBottom: 0 }}>
            {dateStr}
          </div>

          {/* 水印 */}
          <div
            style={{
              position: 'absolute',
              bottom: 36,
              right: 48,
              color: isPro ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
              fontSize: isPro ? 20 : 22,
              fontFamily: 'NotoSans',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ✦{isPro ? '' : ' NemoClaw.com'}
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
        fonts: [
          { name: 'NotoSerif', data: serifFont, style: 'normal' },
          { name: 'NotoSans', data: sansFont, style: 'normal' },
        ],
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Oracle Share]', msg);
    return new Response(msg, { status: 500 });
  }
}
