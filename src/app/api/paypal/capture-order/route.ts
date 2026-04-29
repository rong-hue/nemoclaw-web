
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
  try {
    const { paypalOrderId } = await req.json() as { paypalOrderId: string };
    if (!paypalOrderId) {
      return Response.json({ error: 'Missing paypalOrderId' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

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
      const err = await captureRes.text();
      return Response.json({ error: `PayPal capture failed: ${err}` }, { status: 500 });
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
