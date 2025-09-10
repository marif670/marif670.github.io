// update-schema.js
const fs = require("fs");
const fetch = require("node-fetch");

// Gumroad product slugs
const slugs = ["50prompts", "75prompts", "100prompts", "125prompts", "ultimatebundle"];

(async () => {
  try {
    let html = fs.readFileSync("index.html", "utf8");

    for (const slug of slugs) {
      console.log(`📡 Fetching Gumroad product data for slug: ${slug}`);
      const res = await fetch(`https://gumroad.com/l/${slug}.json`);
      if (!res.ok) {
        console.error(`❌ Failed to fetch ${slug}, status: ${res.status}`);
        continue;
      }

      const p = await res.json();

      // Build schema with fallbacks (no undefined values)
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

      const schemaBlock = `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;

      // --- Insert or replace schema in index.html ---
      if (html.includes("</head>")) {
        if (html.includes("application/ld+json")) {
          console.log(`🔄 Found existing JSON-LD block for ${slug}, replacing it...`);
          html = html.replace(
            /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,
            schemaBlock
          );
        } else {
          console.log(`➕ No JSON-LD found for ${slug}, inserting new block...`);
          html = html.replace("</head>", `${schemaBlock}\n</head>`);
        }
        console.log(`✅ Inserted schema for ${slug}:`, JSON.stringify(schema).slice(0, 200) + "...");
      } else {
        console.error("❌ Could not find </head> in index.html — schema not inserted.");
      }
    }

    fs.writeFileSync("index.html", html, "utf8");
    console.log("🎉 index.html updated successfully with JSON-LD schema.");
  } catch (err) {
    console.error("💥 Script failed:", err);
    process.exit(1);
  }
})();
