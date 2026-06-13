const { redis } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Missing session code' });

    await redis('DEL', `session:${code.toUpperCase()}`);
    return res.status(200).json({ success: true, message: 'Session terminated. All data purged.' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
