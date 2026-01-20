const EbayAuthToken = require('ebay-oauth-nodejs-client');
const readline = require('readline');

const ebayAuthToken = new EbayAuthToken({ filePath: 'ebay-config.json' });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the FULL code value (just after code=):\n', async (code) => {
  try {
    const data = await ebayAuthToken.exchangeCodeForAccessToken('SANDBOX', code.trim());
    console.log('\n✅ TOKEN RESPONSE:\n');
    console.log(data);
  } catch (err) {
    console.error('\n❌ ERROR:\n');
    console.error(err);
  } finally {
    rl.close();
  }
});
