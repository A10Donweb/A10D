// api/add-student.js
const { sessions } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, name, rollNumber, mobile } = req.body || {};
  const sessionCode = (code || '').toUpperCase();

  if (!sessionCode || !name || !rollNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session = sessions[sessionCode];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const duplicate = session.students.find(
    s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Roll number already exists' });
  }

  const entry = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    rollNumber: rollNumber.trim().toUpperCase(),
    mobile: mobile ? mobile.trim() : '—',
    gps: null,
    cameraStatus: 'Manual Entry',
    timestamp: new Date().toISOString(),
    manual: true,
  };

  session.students.push(entry);

  return res.status(200).json({ success: true, entry });
};
