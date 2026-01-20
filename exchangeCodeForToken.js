const EbayAuthToken = require('ebay-oauth-nodejs-client');

const ebayAuthToken = new EbayAuthToken({
  filePath: 'ebay-config.json'
});

// Paste ONLY the code value (no &expires_in=...)
const authCode = 'v%5E1.1%23i%5E1%23p%5E3%23r%5E1%23f%5E0%23I%5E3%23t%5EUl41XzExOjEyODc4RERFMkI0REE2NzI1RDJCQjhCRTZCREU2NjA1XzFfMSNFXjEyODQ%3D';

ebayAuthToken.exchangeCodeForAccessToken('SANDBOX', authCode)
  .then((data) => {
    console.log('\n✅ TOKEN RESPONSE:\n');
    console.log(data);
  })
  .catch((err) => {
    console.error('\n❌ ERROR:\n');
    console.error(err);
  });
