// api/remove-student.js
const { sessions } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, studentId } = req.body || {};
  const sessionCode = (code || '').toUpperCase();

  if (!sessionCode || !studentId) {
    return res.status(400).json({ error: 'Missing code or studentId' });
  }

  const session = sessions[sessionCode];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const before = session.students.length;
  session.students = session.students.filter(s => s.id !== studentId);
  const removed = session.students.length < before;

  return res.status(200).json({ success: true, removed });
};
