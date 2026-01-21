/**
 * server.js — OkBo eBay Tools (clean + deploy-safe)
 * - /health
 * - /ebay/browse?q=...
 * - /ebay/sold-links?q=...
 * - /openapi.json (OpenAPI 3.1.0)
 */
require("dotenv").config();

const express = require("express");
const app = express();

const PORT = Number(process.env.PORT) || 3007;

// Use a build stamp so you can confirm Render is running the latest deploy
const API_VERSION = "v1";
const BUILD = process.env.BUILD || "openapi-3.1.0-clean-1";

let cachedProdToken = null;
let cachedProdTokenExpiresAt = 0;

function requireEnv(name) {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`Missing ${name} in environment variables`);
  return v;
}

async function fetchProdAppToken() {
  const clientId = requireEnv("EBAY_PROD_CLIENT_ID");
  const clientSecret = requireEnv("EBAY_PROD_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const url = "https://api.ebay.com/identity/v1/oauth2/token";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await res.json();

  if (!res.ok || !json.access_token) {
    throw new Error(`Token fetch failed: ${res.status} ${JSON.stringify(json)}`);
  }

  // Cache token with 60s safety buffer
  const expiresIn = Number(json.expires_in || 7200);
  cachedProdToken = json.access_token;
  cachedProdTokenExpiresAt = Date.now() + Math.max(0, expiresIn - 60) * 1000;

  return cachedProdToken;
}

async function getProdAppToken() {
  if (cachedProdToken && Date.now() < cachedProdTokenExpiresAt) {
    return cachedProdToken;
  }
  return fetchProdAppToken();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: API_VERSION, build: BUILD });
});

app.get("/ebay/browse", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) return res.status(400).json({ error: "Query too short" });

    const callOnce = async () => {
      const token = await getProdAppToken();
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
        q
      )}&limit=10`;

      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await r.text();
      return { status: r.status, text };
    };

    // First attempt
    let out = await callOnce();

    // If token rejected, refresh once and retry
    if (out.status === 401) {
      cachedProdToken = null;
      cachedProdTokenExpiresAt = 0;
      out = await callOnce();
    }

    res.status(out.status).type("application/json").send(out.text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Sold/completed links generator (no eBay API call needed)
function buildSoldLinks(q) {
  const enc = encodeURIComponent(String(q || "").trim());
  const base = `https://www.ebay.com/sch/i.html?_nkw=${enc}&LH_Sold=1&LH_Complete=1&rt=nc`;

  return {
    core: base,
    auctionOnly: `${base}&LH_Auction=1`,
    category212: `${base}&_sacat=212`,
  };
}

app.get("/ebay/sold-links", (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing q query param" });

  return res.json({ query: q, links: buildSoldLinks(q) });
});

app.get("/openapi.json", (_req, res) => {
  const serverUrl =
    (process.env.PUBLIC_BASE_URL || "").trim() || "https://okbo-ebay-api.onrender.com";

  res.json({
    openapi: "3.1.0",
    info: {
      title: "OkBo eBay Tools",
      version: "1.0.1",
      description: "OkBo endpoints for eBay Browse and Sold-link generation",
    },
    servers: [{ url: serverUrl }],
    paths: {
      "/health": {
        get: {
          operationId: "health",
          responses: { "200": { description: "Health check" } },
        },
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
              description: "Search keywords for eBay completed/sold listings",
            },
          ],
          responses: {
            "200": { description: "Sold search links" },
            "400": { description: "Bad request" },
          },
        },
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
              description: "Search keywords for eBay Browse API",
            },
          ],
          responses: {
            "200": { description: "Browse search results" },
            "400": { description: "Bad request" },
          },
        },
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

