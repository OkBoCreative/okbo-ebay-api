// soldLinks.js
// Generates multiple eBay SOLD + Completed search links from a single card query.
// Usage: node soldLinks.js 2015 topps field access eli manning autograph gold /99

function enc(s) {
  return encodeURIComponent(s.trim().replace(/\s+/g, " "));
}


function ebaySoldUrl(keywordString, extraParams = "") {
  const base = "https://www.ebay.com/sch/i.html";
  const params =
    `?_nkw=${enc(keywordString)}` +
    `&LH_Sold=1&LH_Complete=1` +
    `&rt=nc` +
    extraParams;
  return base + params;
}


function normalize(q) {
  return q
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVariations(raw) {
  const q = normalize(raw);

  // Light parsing helpers
  const hasSlash = /\/\d+/.test(q);
  const slashMatch = q.match(/\/(\d+)/);
  const serialNum = slashMatch ? slashMatch[1] : null;

  // Common cleanup
  const noPunct = q.replace(/[|()[\]{}]/g, " ").replace(/\s+/g, " ").trim();

  // Token ideas
  const base1 = q;
  const base2 = noPunct;

  // If user includes "/99" style, add common alt notations
  const serialVariants = [];
  if (serialNum) {
    serialVariants.push(`${q.replace(/\/\d+/, "")} /${serialNum}`);
    serialVariants.push(`${q.replace(/\/\d+/, "")} #/${serialNum}`);
    serialVariants.push(`${q.replace(/\/\d+/, "")} ${serialNum}/${serialNum}`); // rare but seen
  }

  // If year is present, also try without year (helps when sellers omit it)
  const noYear = q.replace(/\b(19|20)\d{2}\b/g, "").replace(/\s+/g, " ").trim();

  // If "autograph" present, try "auto"
  const autoSwap = q
    .replace(/\bautograph\b/gi, "auto")
    .replace(/\s+/g, " ")
    .trim();

  // Try quoted player name if we can infer first+last (simple heuristic)
  const words = q.split(" ");
  let quotedName = null;
  // naive: find two consecutive capitalized words as a name
  for (let i = 0; i < words.length - 1; i++) {
    if (/^[A-Z][a-z]+$/.test(words[i]) && /^[A-Z][a-z]+$/.test(words[i + 1])) {
      quotedName = `"${words[i]} ${words[i + 1]}"`;
      break;
    }
  }

  const withQuotedName = quotedName
    ? q.replace(new RegExp(quotedName.replace(/"/g, ""), "g"), quotedName)
    : null;

  // Build list (dedupe later)
  const variations = [
    base1,
    base2,
    noYear,
    autoSwap,
    ...(withQuotedName ? [withQuotedName] : []),
    ...serialVariants,
  ]
    .map((s) => normalize(s))
    .filter((s) => s.length >= 5);

  // Dedupe preserving order
  const seen = new Set();
  const out = [];
  for (const v of variations) {
    const key = v.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

function main() {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.log("Usage: node soldLinks.js <card query>");
    process.exit(1);
  }

  const vars = buildVariations(input);

  console.log("\nEBAY SOLD + COMPLETED LINKS (open these in browser)\n");

  // A: Most strict (all sold+completed)
  console.log("A) Core SOLD searches:");
  vars.forEach((v, i) => {
    console.log(`${i + 1}. ${v}`);
    console.log("   " + ebaySoldUrl(v));
  });

  // B: Auction-only SOLD (sometimes cleaner comps)
  console.log("\nB) Auction-only SOLD (often better for comp pricing):");
  vars.slice(0, 4).forEach((v, i) => {
    console.log(`${i + 1}. ${v}`);
    console.log("   " + ebaySoldUrl(v, "&LH_Auction=1"));
  });

  // C: Category constrained (Sports Trading Cards category path)
  // Note: eBay category ids can vary by marketplace; 212 is the broad “Sports Trading Cards” parent on ebay.com.
  console.log("\nC) SOLD in Sports Trading Cards category (optional filter):");
  vars.slice(0, 4).forEach((v, i) => {
    console.log(`${i + 1}. ${v}`);
    console.log("   " + ebaySoldUrl(v, "&_sacat=212"));
  });

  console.log("\nTip: Start with A1/A2. If too broad, use B (auctions) or add more keywords.\n");
}

main();
