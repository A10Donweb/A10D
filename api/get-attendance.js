const { redis } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const code = (req.query.code || '').toUpperCase();
    if (!code) return res.status(400).json({ error: 'Missing session code' });

    const raw = await redis('GET', `session:${code}`);
    if (!raw) return res.status(404).json({ error: 'Session not found or expired' });

    const session = JSON.parse(raw);
    return res.status(200).json({ ...session, count: session.students.length });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
