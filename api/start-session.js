module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const UPSTASH_URL = process.env.https://huge-oyster-114646.upstash.io;
    const UPSTASH_TOKEN = process.env.gQAAAAAAAb_WAAIgcDI2MTVkOWVjNjc5NDY0MTA4YTBmMDI1ZTg5NmU2NjUxMA;

    const response = await fetch(`${UPSTASH_URL}/ping`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });

    const text = await response.text();
    return res.status(200).json({ ping: text, url: UPSTASH_URL ? 'found' : 'missing', token: UPSTASH_TOKEN ? 'found' : 'missing' });
  } catch(e) {
    return res.status(200).json({ error: e.message, type: e.constructor.name });
  }
};
