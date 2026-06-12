const https = require('https');

const UPSTASH_URL = process.env.https://huge-oyster-114646.upstash.io;
const UPSTASH_TOKEN = process.env.gQAAAAAAAb_WAAIgcDI2MTVkOWVjNjc5NDY0MTA4YTBmMDI1ZTg5NmU2NjUxMA;

function redis(command, ...args) {
  return new Promise((resolve, reject) => {
    const path = '/' + [command, ...args].map(encodeURIComponent).join('/');
    const url = new URL(UPSTASH_URL);
    const options = {
      hostname: url.hostname,
      path: path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error));
          else resolve(json.result);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { redis };
