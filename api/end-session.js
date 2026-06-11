// api/end-session.js
const { sessions } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  const sessionCode = (code || '').toUpperCase();

  if (!sessionCode) {
    return res.status(400).json({ error: 'Missing session code' });
  }

  const existed = !!sessions[sessionCode];

  // Immediate hard purge — overwrite then delete
  if (sessions[sessionCode]) {
    sessions[sessionCode].students = [];
    sessions[sessionCode] = null;
    delete sessions[sessionCode];
  }

  return res.status(200).json({
    success: true,
    purged: existed,
    message: existed
      ? 'Session terminated. All attendance data has been permanently deleted.'
      : 'Session already expired or not found.',
  });
};
