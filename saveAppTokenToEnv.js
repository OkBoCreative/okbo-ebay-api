const fs = require('fs');
const EbayAuthToken = require('ebay-oauth-nodejs-client');

function extractAccessToken(tokenResp) {
  // Case 1: already an object
  if (tokenResp && typeof tokenResp === 'object' && tokenResp.access_token) {
    return tokenResp.access_token;
  }

  // Case 2: stringified JSON
  if (typeof tokenResp === 'string') {
    try {
      const parsed = JSON.parse(tokenResp);
      if (parsed && parsed.access_token) return parsed.access_token;
    } catch (e) {
      // not JSON
    }
  }

  // Case 3: object with body/data wrappers
  if (tokenResp && tokenResp.body && tokenResp.body.access_token) return tokenResp.body.access_token;
  if (tokenResp && tokenResp.data && tokenResp.data.access_token) return tokenResp.data.access_token;

  return null;
}

async function run() {
  const ebayAuthToken = new EbayAuthToken({ filePath: 'ebay-config.json' });

  const tokenResp = await ebayAuthToken.getApplicationToken('SANDBOX');
  const accessToken = extractAccessToken(tokenResp);

  if (!accessToken || accessToken.length < 100) {
    console.log('RAW tokenResp type:', typeof tokenResp);
    console.log('RAW tokenResp:\n', tokenResp);
    throw new Error('Did not receive a valid application access token.');
  }

  const envPath = '.env';
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  const line = `EBAY_APP_ACCESS_TOKEN=${accessToken}`;

  if (/^EBAY_APP_ACCESS_TOKEN=.*$/m.test(env)) {
    env = env.replace(/^EBAY_APP_ACCESS_TOKEN=.*$/m, line);
  } else {
    env = env.trimEnd() + '\n' + line + '\n';
  }

  fs.writeFileSync(envPath, env, 'utf8');

  console.log('✅ Saved EBAY_APP_ACCESS_TOKEN to .env');
  console.log('TOKEN length:', accessToken.length, 'starts:', accessToken.slice(0, 10));
}

run().catch((e) => {
  console.error('❌ ERROR:', e.message || e);
});
