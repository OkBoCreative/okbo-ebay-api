const EbayAuthToken = require('ebay-oauth-nodejs-client');

const ebayAuthToken = new EbayAuthToken({
  filePath: 'ebay-config.json'
});

(async () => {
  try {
    const data = await ebayAuthToken.getApplicationToken('SANDBOX');
    console.log('\n✅ APPLICATION TOKEN:\n');
    console.log(data);
  } catch (err) {
    console.error('\n❌ ERROR:\n');
    console.error(err);
  }
})();

