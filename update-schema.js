// update-schema.js
const fs = require("fs");
const fetch = require("node-fetch");

// Gumroad product slugs
const slugs = ["50prompts", "75prompts", "100prompts", "125prompts", "ultimatebundle"];

(async () => {
  try {
    let html = fs.readFileSync("index.html", "utf8");

    // Collect schema blocks for all products
    let schemaBlocks = "";

    for (const slug of slugs) {
      console.log(`📡 Fetching Gumroad product data for slug: ${slug}`);
      const res = await fetch(`https://gumroad.com/l/${slug}.json`);
      if (!res.ok) {
        console.error(`❌ Failed to fetch ${slug}, status: ${res.status}`);
        continue;
      }

      const p = await res.json();

      // Build schema with fallbacks
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.name || "AI Prompt Book",
        "description": p.description || "Exclusive AI prompts collection.",
        "url": `https://gumroad.com/l/${slug}`,
        "image": p.preview_url || "https://marif670.github.io/default-cover.png",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": p.price ? (p.price / 100).toFixed(2) : "0.00",
          "availability": "https://schema.org/InStock",
          "url": `https://gumroad.com/l/${slug}`,
          "priceValidUntil": "2025-12-31"
        },
        ...(p.rating_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                "ratingValue": p.rating_average,
                "reviewCount": p.rating_count
              }
            }
          : {})
      };

      const schemaBlock = `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>\n`;
      schemaBlocks += schemaBlock;

      console.log(`✅ Prepared schema for ${slug}:`, JSON.stringify(schema).slice(0, 200) + "...");
    }

    // --- Insert or replace all schema blocks in index.html ---
    if (html.includes("</head>")) {
      if (html.includes("application/ld+json")) {
        console.log("🔄 Replacing existing JSON-LD blocks...");
        html = html.replace(
          /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g,
          ""
        );
      } else {
        console.log("➕ No JSON-LD found, inserting new blocks...");
      }
      html = html.replace("</head>", `${schemaBlocks}\n</head>`);
    } else {
      console.error("❌ Could not find </head> in index.html — schema not inserted.");
    }

    fs.writeFileSync("index.html", html, "utf8");
    console.log("🎉 index.html updated successfully with JSON-LD schema for all products.");
  } catch (err) {
    console.error("💥 Script failed:", err);
    process.exit(1);
  }
})();
