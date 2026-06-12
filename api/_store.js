// _store.js — Ephemeral in-memory session store
// Data lives only as long as the serverless function instance is warm.
// Sessions are explicitly purged when the teacher ends the session.
const UPSTASH_URL = process.env.https://huge-oyster-114646.upstash.io;
const UPSTASH_TOKEN = process.env.gQAAAAAAAb_WAAIgcDI2MTVkOWVjNjc5NDY0MTA4YTBmMDI1ZTg5NmU2NjUxMA;

async function redis(command, ...args) {
  const res = await fetch(`${UPSTASH_URL}/${command}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

module.exports = { redis };
