
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { amount, currency = 'USD', orderId } = await req.json() as {
      amount: number;
      currency?: string;
      orderId: string;
    };

    const accessToken = await getAccessToken();

    const origin = new URL(req.url).origin;

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': orderId, // 幂等键
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: `NemoClaw Order ${orderId}`,
          },
        ],
        application_context: {
          brand_name: 'NemoClaw',
          locale: 'en-US',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${origin}/en/payment/success?orderId=${orderId}`,
          cancel_url: `${origin}/en/payment?orderId=${orderId}&cancelled=1`,
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      return Response.json({ error: `PayPal order creation failed: ${err}` }, { status: 500 });
    }

    const order = await orderRes.json() as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    // 找到 PayPal 付款跳转链接
    const approveLink = order.links.find((l) => l.rel === 'approve')?.href;

    return Response.json({
      paypalOrderId: order.id,
      approveUrl: approveLink,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
