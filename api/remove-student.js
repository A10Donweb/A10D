const { redis } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, studentId } = req.body || {};
    if (!code || !studentId) return res.status(400).json({ error: 'Missing code or studentId' });

    const raw = await redis('GET', `session:${code.toUpperCase()}`);
    if (!raw) return res.status(404).json({ error: 'Session not found' });

    const session = JSON.parse(raw);
    session.students = session.students.filter(s => s.id !== studentId);
    await redis('SET', `session:${code.toUpperCase()}`, JSON.stringify(session), 'EX', 1800);
    return res.status(200).json({ success: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
