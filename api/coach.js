import { kv } from '@vercel/kv';

const DEFAULT_PLAN = {
  month: 'Giugno 2025', tagline: 'Forza & Mobilità',
  days: [
    { day: 'Lunedì',   focus: 'Lower Body',     emoji: '🦵', video: '', exercises: [
      { name: 'Squat Goblet',      sets:'4', reps:'12',     rest:'60s', note:'Talloni a terra, petto alto' },
      { name: 'Romanian Deadlift', sets:'3', reps:'10',     rest:'60s', note:'Schiena dritta' },
      { name: 'Hip Thrust',        sets:'4', reps:'15',     rest:'60s', note:'Strizza il gluteo in alto' },
      { name: 'Affondi Alternati', sets:'3', reps:'12/lato',rest:'45s', note:'' },
    ]},
    { day: 'Martedì',  focus: 'Mobilità & Core', emoji: '🌀', video: '', exercises: [
      { name: 'Cat-Cow',   sets:'3', reps:'10',     rest:'30s', note:'Respiro sincronizzato' },
      { name: 'Plank',     sets:'4', reps:'30s',    rest:'30s', note:'Gluti e core contratti' },
      { name: 'Dead Bug',  sets:'3', reps:'8/lato', rest:'30s', note:'Lombare a terra' },
      { name: 'Hip 90/90', sets:'3', reps:'10/lato',rest:'30s', note:'' },
    ]},
    { day: 'Giovedì',  focus: 'Upper Body',      emoji: '💪', video: '', exercises: [
      { name: 'Push-up',           sets:'4', reps:'10-12',  rest:'60s', note:'Gomiti a 45°' },
      { name: 'Rematore manubrio', sets:'3', reps:'12/lato',rest:'60s', note:'' },
      { name: 'Press Spalle',      sets:'3', reps:'10',     rest:'60s', note:'' },
      { name: 'Bicep Curl',        sets:'3', reps:'12',     rest:'45s', note:'' },
    ]},
    { day: 'Venerdì',  focus: 'Full Body',        emoji: '🔥', video: '', exercises: [
      { name: 'Kettlebell Swing', sets:'4', reps:'15',    rest:'60s', note:'Esplosiva in salita' },
      { name: 'Squat + Press',    sets:'3', reps:'10',    rest:'60s', note:'' },
      { name: 'Mountain Climber', sets:'3', reps:'20 tot',rest:'30s', note:'' },
      { name: 'Stacchi Sumo',     sets:'4', reps:'12',    rest:'60s', note:'' },
    ]},
  ],
  restDays: ['Mercoledì', 'Sabato', 'Domenica'],
  guides: [
    { title: 'Guida Pancia Piatta', subtitle: '5 pillar per un addome funzionale', emoji: '📘' },
    { title: 'Routine Drenante',    subtitle: 'Anti-ritenzione e anti-cellulite',  emoji: '💧' },
  ],
};

async function verifyCoach(req) {
  const token  = req.headers['x-coach-token'];
  const stored = (await kv.get('hf:coach_pwd')) || process.env.COACH_PASSWORD;
  return token === stored;
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── Public: get plan ──────────────────────────────────────────────────────
  if (req.method === 'GET' && action === 'plan') {
    const plan = (await kv.get('hf:plan')) || DEFAULT_PLAN;
    return res.json(plan);
  }

  // ── All other actions require coach auth ──────────────────────────────────
  if (!(await verifyCoach(req))) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  // GET members
  if (req.method === 'GET' && action === 'members') {
    const members = (await kv.get('hf:members')) || [];
    return res.json(members);
  }

  // POST save plan
  if (req.method === 'POST' && action === 'plan') {
    await kv.set('hf:plan', req.body);
    return res.json({ ok: true });
  }

  // POST save members
  if (req.method === 'POST' && action === 'members') {
    await kv.set('hf:members', req.body);
    return res.json({ ok: true });
  }

  // POST change coach password
  if (req.method === 'POST' && action === 'coach-pwd') {
    await kv.set('hf:coach_pwd', req.body.password);
    return res.json({ ok: true });
  }

  res.status(404).json({ error: 'Azione non trovata' });
}
