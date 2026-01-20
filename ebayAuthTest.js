require('dotenv').config();
const EbayAuthToken = require('ebay-oauth-nodejs-client');

const ebayAuthToken = new EbayAuthToken({
  clientId: process.env.EBAY_CLIENT_ID,
  clientSecret: process.env.EBAY_CLIENT_SECRET,
  redirectUri: process.env.EBAY_REDIRECT_URI
});

console.log('eBay OAuth client initialized with .env values');
