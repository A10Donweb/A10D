module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    return res.status(200).json({ 
      message: 'alive',
      hasUrl: !!url, 
      hasToken: !!token,
      urlPreview: url ? url.substring(0, 30) : 'missing'
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
