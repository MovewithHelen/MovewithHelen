import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password mancante' });

  // Check coach password
  const coachPwd = (await kv.get('hf:coach_pwd')) || process.env.COACH_PASSWORD;
  if (password === coachPwd) {
    return res.json({ role: 'coach' });
  }

  // Check member passwords
  const members = (await kv.get('hf:members')) || [];
  const member  = members.find(m => m.password === password && m.active);
  if (member) {
    return res.json({ role: 'member', member: { id: member.id, name: member.name, email: member.email } });
  }

  return res.status(401).json({ error: 'Password non corretta' });
}
