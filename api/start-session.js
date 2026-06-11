// api/start-session.js
const { sessions } = require('./_store');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,I,1)

function generateCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
  } while (sessions[code]);
  return code;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const code = generateCode();
  const now = Date.now();

  sessions[code] = {
    code,
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000, // 30-min safety expiry
    students: [],
  };

  // Auto-expire sessions after 30 minutes
  setTimeout(() => {
    delete sessions[code];
  }, 30 * 60 * 1000);

  return res.status(200).json({ code, createdAt: now });
};
