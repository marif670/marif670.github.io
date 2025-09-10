// update-schema.js
const fs = require("fs");
const fetch = require("node-fetch");

const products = [
  { slug: "50prompts", position: 1, url: "https://marif670.github.io/book1.html" },
  { slug: "75prompts", position: 2, url: "https://marif670.github.io/book2.html" },
  { slug: "100prompts", position: 3, url: "https://marif670.github.io/book3.html" },
  { slug: "125prompts", position: 4, url: "https://marif670.github.io/book4.html" },
  { slug: "ultimatebundle", position: 5, url: "https://marif670.github.io/bundle.html" }
];

async function fetchProduct(slug) {
  try {
    const res = await fetch(`https://gumroad.com/l/${slug}.json`);
    const json = await res.json();
    return json.product;
  } catch (e) {
    console.error(`❌ Failed to fetch ${slug}`, e);
    return null;
  }
}

(async function updateSchema() {
  const itemList = [];

  for (const product of products) {
    const p = await fetchProduct(product.slug);
    if (!p) continue;

    itemList.push({
      "@type": "Product",
      "position": product.position,
      "name": p.name,
      "image": p.preview_url || "",
      "description": p.description || "",
      "brand": { "@type": "Brand", "name": "AI Business Tools" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": p.rating || "4.8",
        "reviewCount": p.reviews_count || "10"
      },
      "offers": {
        "@type": "Offer",
        "url": product.url,
        "priceCurrency": "USD",
        "price": (p.price / 100).toFixed(2),
        "priceValidUntil": "2026-01-01",
        "availability": "https://schema.org/InStock"
      }
    });
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "AI-Powered SMB Prompt Books Collection",
    "description": "A collection of AI Prompt Books for small businesses and entrepreneurs. Includes 4 books and 1 bundle with 350+ professional prompts.",
    "itemListElement": itemList
  };

  // Make schema block
  const schemaBlock = <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>;

  // Read file
  let html = fs.readFileSync("index.html", "utf8");

  // Replace or insert JSON-LD
  if (html.includes('<script type="application/ld+json">')) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, schemaBlock);
  } else {
    html = html.replace("</head>", schemaBlock + "\n</head>");
  }

  // Write back
  fs.writeFileSync("index.html", html, "utf8");
  console.log("✅ Schema updated in index.html");
})();
