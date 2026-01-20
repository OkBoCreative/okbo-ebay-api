const EbayAuthToken = require('ebay-oauth-nodejs-client');

async function run() {
  const ebayAuthToken = new EbayAuthToken({ filePath: 'ebay-config.json' });

  const tokenResp = await ebayAuthToken.getApplicationToken('SANDBOX');

  console.log('\nRAW token response:\n');
  console.log(tokenResp);

  // Try common shapes:
  const appToken =
    (tokenResp && tokenResp.access_token) ||
    (tokenResp && tokenResp.body && tokenResp.body.access_token) ||
    (tokenResp && tokenResp.data && tokenResp.data.access_token) ||
    (typeof tokenResp === 'string' ? tokenResp : null);

  if (!appToken) {
    throw new Error('Could not find access_token in token response. See output above.');
  }

  console.log('\nAPP TOKEN CHECK:', 'length=', appToken.length, 'starts=', appToken.slice(0, 8));

  const url = 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=baseball%20card&limit=3';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${appToken}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await res.text();
  console.log('\nSTATUS:', res.status);
  console.log(text);
}

run().catch((e) => {
  console.error('\n❌ SCRIPT ERROR:\n', e);
});
