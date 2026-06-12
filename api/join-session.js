const { redis } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, name, rollNumber, mobile, gps, cameraStatus } = req.body || {};
  if (!code || !name || !rollNumber) return res.status(400).json({ error: 'Missing required fields' });

  const raw = await redis('get', `session:${code.toUpperCase()}`);
  if (!raw) return res.status(404).json({ error: 'Session not found or expired' });

  const session = JSON.parse(raw);
  if (session.students.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase())) {
    return res.status(409).json({ error: 'Roll number already submitted' });
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    rollNumber: rollNumber.trim().toUpperCase(),
    mobile: mobile ? mobile.trim() : '—',
    gps: gps || null,
    cameraStatus: cameraStatus || 'Unknown',
    timestamp: new Date().toISOString(),
  };

  session.students.push(entry);
  await redis('set', `session:${code.toUpperCase()}`, JSON.stringify(session), 'EX', '1800');
  return res.status(200).json({ success: true, entry });
};
