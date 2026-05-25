import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Needed for raw body to verify Stripe signature
export const config = { api: { bodyParser: false } };

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Payment successful → create member ──────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const email    = session.customer_details?.email || session.customer_email;
    const fullName = session.customer_details?.name  || email;

    const password = generatePassword();
    const member = {
      id:               Date.now(),
      name:             fullName,
      email:            email,
      password:         password,
      active:           true,
      createdAt:        new Date().toLocaleDateString('it-IT'),
      stripeCustomerId: session.customer,
      subscriptionId:   session.subscription,
    };

    // Save to Vercel KV
    const members = (await kv.get('hf:members')) || [];
    members.push(member);
    await kv.set('hf:members', members);

    // Send welcome email
    await resend.emails.send({
      from:    'MoveWithHelen <noreply@movewithHelen.com>',
      to:      email,
      subject: '💜 Benvenuta in MoveWithHelen!',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FDFAFF;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#D4B8E0,#50287A);display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:24px;font-weight:700;">HF</span>
            </div>
            <h1 style="font-family:Georgia,serif;color:#1E0A3C;font-size:26px;margin:16px 0 4px;">MoveWithHelen</h1>
            <p style="color:#50287A;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:0;">Training Portal</p>
          </div>

          <p style="color:#2D1B4E;font-size:16px;line-height:1.6;">Ciao <strong>${fullName}</strong>! 💜</p>
          <p style="color:#2D1B4E;font-size:15px;line-height:1.6;">
            Il tuo abbonamento è attivo! Ecco le tue credenziali per accedere al portale:
          </p>

          <div style="background:#F5F0FA;border-radius:14px;padding:20px 24px;margin:24px 0;border:1px solid rgba(212,184,224,.5);">
            <p style="margin:0 0 8px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;">La tua password</p>
            <p style="font-family:monospace;font-size:24px;color:#50287A;margin:0;letter-spacing:3px;font-weight:700;">${password}</p>
          </div>

          <div style="text-align:center;margin:28px 0;">
            <a href="${process.env.VITE_APP_URL}" 
               style="display:inline-block;padding:14px 32px;border-radius:50px;background:linear-gradient(135deg,#50287A,#1E0A3C);color:white;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:.5px;">
              Accedi al portale →
            </a>
          </div>

          <p style="color:#888;font-size:13px;line-height:1.6;text-align:center;">
            Salva questa email con la tua password! 🔐<br/>
            Per qualsiasi domanda scrivimi su Instagram <strong>@helenfalda.coach</strong>
          </p>
        </div>
      `,
    });

    console.log(`✅ New member created: ${email}`);
  }

  // ── Subscription cancelled → deactivate member ───────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub     = event.data.object;
    const members = (await kv.get('hf:members')) || [];
    const updated = members.map(m =>
      m.stripeCustomerId === sub.customer ? { ...m, active: false } : m
    );
    await kv.set('hf:members', updated);

    // Find member email and notify
    const member = members.find(m => m.stripeCustomerId === sub.customer);
    if (member?.email) {
      await resend.emails.send({
        from:    'MoveWithHelen <noreply@movewithHelen.com>',
        to:      member.email,
        subject: 'Il tuo abbonamento MoveWithHelen è stato cancellato',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
            <h2 style="font-family:Georgia,serif;color:#1E0A3C;">Abbonamento cancellato</h2>
            <p style="color:#555;">Ciao ${member.name}, il tuo abbonamento è stato cancellato e il tuo accesso è stato disattivato.</p>
            <p style="color:#555;">Se vuoi riattivarti, vai su <a href="${process.env.VITE_APP_URL}">movewithHelen.com</a> e abbonati di nuovo 💜</p>
          </div>
        `,
      });
    }

    console.log(`❌ Member deactivated: ${sub.customer}`);
  }

  res.json({ received: true });
}
