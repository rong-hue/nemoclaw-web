export const runtime = 'edge';

import { getServerUser } from '@/lib/supabase-auth';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function POST(req: Request) {
  // N-M1: 鉴权，必须登录
  const user = await getServerUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { paypalOrderId } = await req.json() as { paypalOrderId: string };
    if (!paypalOrderId) {
      return Response.json({ error: 'Missing paypalOrderId' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // P1-S1: 验证 order 归属 — 用 PayPal GET /v2/checkout/orders/{id} 获取 payer email，
    // 与当前登录用户 email 比对，防止已登录用户 capture 他人 order
    const orderRes = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!orderRes.ok) {
      console.error('[capture-order] Failed to fetch order:', await orderRes.text());
      return Response.json({ error: 'Failed to verify order' }, { status: 502 });
    }
    const orderData = await orderRes.json() as {
      payer?: { email_address?: string };
      status: string;
    };
    const payerEmail = orderData.payer?.email_address?.toLowerCase();
    if (!payerEmail || payerEmail !== user.email.toLowerCase()) {
      console.error(`[capture-order] Order ownership mismatch: payer=${payerEmail} user=${user.email}`);
      return Response.json({ error: 'Order does not belong to you' }, { status: 403 });
    }

    const captureRes = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!captureRes.ok) {
      console.error('[capture-order] PayPal error:', await captureRes.text());
      return Response.json({ error: 'Payment capture failed' }, { status: 502 });
    }

    const result = await captureRes.json() as {
      id: string;
      status: string;
      purchase_units: Array<{
        reference_id: string;
        payments: {
          captures: Array<{ id: string; amount: { value: string; currency_code: string } }>;
        };
      }>;
    };

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    const ourOrderId = result.purchase_units?.[0]?.reference_id;

    if (result.status !== 'COMPLETED') {
      return Response.json({ error: `Payment not completed: ${result.status}` }, { status: 400 });
    }

    return Response.json({
      success: true,
      paypalOrderId: result.id,
      captureId: capture?.id,
      amount: capture?.amount?.value,
      currency: capture?.amount?.currency_code,
      orderId: ourOrderId,
    });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
