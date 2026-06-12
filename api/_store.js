const UPSTASH_URL = process.env.https://huge-oyster-114646.upstash.io;
const UPSTASH_TOKEN = process.env.gQAAAAAAAb_WAAIgcDI2MTVkOWVjNjc5NDY0MTA4YTBmMDI1ZTg5NmU2NjUxMA;

async function redis(command, ...args) {
  const url = `${UPSTASH_URL}/${[command, ...args].map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

module.exports = { redis };
