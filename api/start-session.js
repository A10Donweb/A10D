const { redis } = require('./_store');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      return res.status(500).json({ error: 'Missing env vars', url: !!url, token: !!token });
    }

    const code = generateCode();
    const session = { code, createdAt: Date.now(), students: [] };
    await redis('set', `session:${code}`, JSON.stringify(session), 'EX', '1800');
    return res.status(200).json({ code, createdAt: session.createdAt });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
};
