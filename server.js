require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3007;

const API_VERSION = "v1";

let cachedProdToken = null;
let cachedProdTokenExpiresAt = 0;

async function fetchProdAppToken() {
  const clientId = (process.env.EBAY_PROD_CLIENT_ID || '').trim();
  const clientSecret = (process.env.EBAY_PROD_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    throw new Error('Missing EBAY_PROD_CLIENT_ID or EBAY_PROD_CLIENT_SECRET in .env');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // OAuth App Token endpoint (Production)
  const url = 'https://api.ebay.com/identity/v1/oauth2/token';

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.ebay.com/oauth/api_scope'
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const json = await res.json();

  if (!res.ok || !json.access_token) {
    throw new Error(`Token fetch failed: ${res.status} ${JSON.stringify(json)}`);
  }

  // Cache token, subtract 60s for safety
  const expiresIn = Number(json.expires_in || 7200);
  cachedProdToken = json.access_token;
  cachedProdTokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

  return cachedProdToken;
}

async function getProdAppToken() {
  if (cachedProdToken && Date.now() < cachedProdTokenExpiresAt) {
    return cachedProdToken;
  }
  return await fetchProdAppToken();
}


// Decode PROD token if present (optional; we will replace this with auto-refresh next)
function getProdToken() {
  const b64 = process.env.EBAY_APP_ACCESS_TOKEN_B64_PROD || '';
  return b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';
}

app.get('/health', (_req, res) => res.json({ ok: true, version: API_VERSION }));

app.get('/ebay/browse', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (q.length < 3) return res.status(400).json({ error: 'Query too short' });

    async function callOnce() {
      const token = await getProdAppToken();
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=10`;

      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await r.text();
      return { status: r.status, text };
    }

    // First attempt
    let out = await callOnce();

    // If token got rejected, refresh once and retry
    if (out.status === 401) {
      cachedProdToken = null;
      cachedProdTokenExpiresAt = 0;
      out = await callOnce();
    }

    res.status(out.status).type('application/json').send(out.text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});


app.get('/ebay/sold-links', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (q.length < 5) return res.status(400).json({ error: 'Query too short' });


  res.json({
    query: q,
    links: {
      core: ebaySoldUrl(q),
      auctionOnly: ebaySoldUrl(q, '&LH_Auction=1'),
      category212: ebaySoldUrl(q, '&_sacat=212')
    }
  });
});

app.get('/openapi.json', (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "OkBo eBay Tools",
      version: "1.0.0",
      description: "OkBo endpoints for eBay Browse and Sold-link generation"
    },
    servers: [{ url: "http://localhost:3007" }],
    paths: {
      "/health": {
        get: {
          operationId: "health",
          responses: {
            "200": { description: "Health check" }
          }
        }
      },
      "/ebay/sold-links": {
        get: {
          operationId: "getEbaySoldLinks",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Search keywords for eBay completed/sold listings"
            }
          ],
          responses: {
            "200": { description: "Sold search links" },
            "400": { description: "Bad request" }
          }
        }
      },
      "/ebay/browse": {
        get: {
          operationId: "browseEbay",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Search keywords for eBay Browse API"
            }
          ],
          responses: {
            "200": { description: "Browse search results" },
            "400": { description: "Bad request" }
          }
        }
      }
    }
  });
});


app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
