module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    const session = { code, createdAt: Date.now(), students: [] };

    const UPSTASH_URL = process.env.https://huge-oyster-114646.upstash.io;
    const UPSTASH_TOKEN = process.env.gQAAAAAAAb_WAAIgcDI2MTVkOWVjNjc5NDY0MTA4YTBmMDI1ZTg5NmU2NjUxM;

    const response = await fetch(
      `${UPSTASH_URL}/set/session:${code}/${encodeURIComponent(JSON.stringify(session))}?EX=1800`,
      {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      }
    );

    const result = await response.json();
    if (result.error) throw new Error(result.error);

    return res.status(200).json({ code, createdAt: session.createdAt });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
