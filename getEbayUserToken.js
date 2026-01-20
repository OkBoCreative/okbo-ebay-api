const EbayAuthToken = require('ebay-oauth-nodejs-client');

const ebayAuthToken = new EbayAuthToken({
  filePath: 'ebay-config.json'
});

const scopes = ['https://api.ebay.com/oauth/api_scope'];

const authUrl = ebayAuthToken.generateUserAuthorizationUrl('SANDBOX', scopes);

console.log('\nOPEN THIS URL IN YOUR BROWSER:\n');
console.log(authUrl);
console.log('\nAfter approving, copy the value after "code=" from the redirect URL.\n');
