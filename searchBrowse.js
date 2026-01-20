require('dotenv').config();

const b64 = process.env.EBAY_APP_ACCESS_TOKEN_B64 || '';
const token = b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';

async function search(q, limit = 10) {
  const url = `https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  return { status: res.status, data };
}

(async () => {
  const query = process.argv.slice(2).join(' ') || '2015 Topps Field Access Eli Manning autograph /99';
  const { status, data } = await search(query, 10);

  console.log('STATUS:', status);
  console.log('TOTAL:', data.total ?? 'n/a');

  const items = data.itemSummaries || [];
  for (const it of items) {
    console.log('---');
    console.log(it.title);
    console.log(it.price ? `${it.price.value} ${it.price.currency}` : 'no price');
    console.log(it.itemWebUrl || '');
  }
})();
