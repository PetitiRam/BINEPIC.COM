// Each adapter exposes createCharge({ amount, currency, orderId, returnUrl })
// -> { providerReference, checkoutUrl, raw }. When the relevant secret key
// isn't set in .env, it falls back to a "sandbox" reference so the order/
// escrow flow is fully testable before real provider keys are wired in.

const sandbox = (provider, orderId) => ({
  providerReference: `${provider.toUpperCase()}-SANDBOX-${orderId}`,
  checkoutUrl: null,
  raw: { sandbox: true, provider }
});

export async function createStripeCharge({ amount, currency, orderId, returnUrl }) {
  if (!process.env.STRIPE_SECRET_KEY) return sandbox('stripe', orderId);
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      mode: 'payment',
      success_url: returnUrl,
      cancel_url: returnUrl,
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': `JEDIDA order ${orderId}`,
      'line_items[0][price_data][unit_amount]': Math.round(amount * 100),
      'line_items[0][quantity]': '1'
    })
  });
  const data = await res.json();
  return { providerReference: data.id, checkoutUrl: data.url, raw: data };
}

export async function createFlutterwaveCharge({ amount, currency, orderId, returnUrl }) {
  if (!process.env.FLUTTERWAVE_SECRET_KEY) return sandbox('flutterwave', orderId);
  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref: `jedida-${orderId}-${Date.now()}`,
      amount, currency, redirect_url: returnUrl
    })
  });
  const data = await res.json();
  return { providerReference: data?.data?.id, checkoutUrl: data?.data?.link, raw: data };
}

export async function createDpoCharge({ amount, currency, orderId, returnUrl }) {
  if (!process.env.DPO_COMPANY_TOKEN) return sandbox('dpo', orderId);
  // DPO Pay uses XML over HTTPS; shape kept minimal here, swap for the real
  // CreateToken XML request once the company token + service codes are set.
  const body = `<?xml version="1.0" encoding="utf-8"?><API3G><CompanyToken>${process.env.DPO_COMPANY_TOKEN}</CompanyToken><Request>createToken</Request><Transaction><PaymentAmount>${amount}</PaymentAmount><PaymentCurrency>${currency}</PaymentCurrency><CompanyRef>${orderId}</CompanyRef><RedirectURL>${returnUrl}</RedirectURL><BackURL>${returnUrl}</BackURL></Transaction></API3G>`;
  const res = await fetch('https://secure.3gdirectpay.com/API/v6/', { method: 'POST', body });
  const text = await res.text();
  return { providerReference: orderId, checkoutUrl: null, raw: { text } };
}

export async function createCoinbaseCharge({ amount, currency, orderId, returnUrl }) {
  if (!process.env.COINBASE_COMMERCE_API_KEY) return sandbox('coinbase', orderId);
  const res = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY,
      'X-CC-Version': '2018-03-22',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `JEDIDA order ${orderId}`,
      pricing_type: 'fixed_price',
      local_price: { amount: String(amount), currency },
      redirect_url: returnUrl,
      cancel_url: returnUrl,
      metadata: { orderId }
    })
  });
  const data = await res.json();
  return { providerReference: data?.data?.id, checkoutUrl: data?.data?.hosted_url, raw: data };
}

export const ADAPTERS = {
  stripe: createStripeCharge,
  flutterwave: createFlutterwaveCharge,
  dpo: createDpoCharge,
  coinbase: createCoinbaseCharge
};
