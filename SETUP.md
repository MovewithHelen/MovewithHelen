# 🚀 Guida Deploy MoveWithHelen

## Cosa ti serve (tutto gratuito)
- ✅ Stripe — già ce l'hai
- ⬜ Vercel → vercel.com (hosting)
- ⬜ Resend → resend.com (email automatiche)
- ⬜ GitHub → github.com (per caricare il codice)

---

## PASSO 1 — Carica il codice su GitHub

1. Vai su **github.com** → crea account → clicca "New repository"
2. Chiamalo `movewithHelen` → clicca "Create repository"
3. Trascina tutti i file di questa cartella nel repository
4. Clicca "Commit changes"

---

## PASSO 2 — Crea il database su Vercel (KV)

1. Vai su **vercel.com** → accedi con GitHub
2. Clicca "Add New" → "Storage" → "KV Database"
3. Chiamala `movewithHelen-db` → crea
4. Vai su "Settings" → copia le variabili (KV_URL, KV_REST_API_URL, ecc.)

---

## PASSO 3 — Deploy su Vercel

1. Dashboard Vercel → "Add New" → "Project"
2. Seleziona il tuo repository GitHub `movewithHelen`
3. Clicca "Deploy"
4. Nota il tuo URL (es. `movewithHelen.vercel.app`)

---

## PASSO 4 — Configura le variabili d'ambiente

In Vercel → Settings → Environment Variables, aggiungi:

| Nome | Valore | Dove trovarlo |
|------|--------|---------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe → Developers → API Keys |
| `STRIPE_PRICE_ID` | `price_...` | Stripe → Products → ID prezzo |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Webhooks (vedi Passo 5) |
| `RESEND_API_KEY` | `re_...` | Resend → API Keys |
| `VITE_APP_URL` | `https://movewithHelen.vercel.app` | il tuo URL Vercel |
| `COACH_PASSWORD` | `helen2025` | scegli tu |

Dopo aver aggiunto tutte → clicca "Redeploy"

---

## PASSO 5 — Configura Stripe

### Crea il prodotto:
1. Stripe → Products → "Add product"
2. Nome: "MoveWithHelen - Abbonamento mensile"
3. Prezzo: €19/mese (recurring)
4. Copia l'**ID prezzo** (es. `price_abc123`) → mettilo in `STRIPE_PRICE_ID`

### Crea il webhook:
1. Stripe → Developers → Webhooks → "Add endpoint"
2. URL: `https://movewithHelen.vercel.app/api/webhook`
3. Seleziona eventi:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copia la **firma segreta** (`whsec_...`) → mettila in `STRIPE_WEBHOOK_SECRET`

---

## PASSO 6 — Configura Resend

1. Vai su **resend.com** → crea account
2. API Keys → "Create API Key" → copia → metti in `RESEND_API_KEY`
3. Domains → "Add Domain" → aggiungi il tuo dominio (opzionale, puoi usare il loro dominio di test all'inizio)

---

## ✅ Test finale

1. Vai sul tuo sito Vercel
2. Clicca "Abbonati"
3. Usa la carta di test Stripe: `4242 4242 4242 4242` scadenza `12/34` CVV `123`
4. Controlla l'email → dovresti ricevere la password automatica
5. Accedi con quella password

---

## 🔑 Accedere alla dashboard coach

Vai sul tuo sito → "Hai già un accesso?" → inserisci la password coach (`helen2025`)

---

## ❓ Problemi?

Scrivimi e ti aiuto step by step! 💜
