// api/get-attendance.js
const { sessions } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const code = (req.query.code || '').toUpperCase();

  if (!code) {
    return res.status(400).json({ error: 'Missing session code' });
  }

  const session = sessions[code];
  if (!session) {
    return res.status(404).json({ error: 'Session not found or has expired' });
  }

  return res.status(200).json({
    code: session.code,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    students: session.students,
    count: session.students.length,
  });
};
