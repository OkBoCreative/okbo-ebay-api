require('dotenv').config();

const b64 = process.env.EBAY_APP_ACCESS_TOKEN_B64 || '';
const token = b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';

console.log('TOKEN length:', token.length);
console.log('TOKEN starts with:', token.slice(0, 10));

async function run() {
  const res = await fetch(
    'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=baseball%20card&limit=3',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const text = await res.text();
  console.log('\nSTATUS:', res.status);
  console.log(text);
}

run().catch(console.error);
