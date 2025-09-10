// update-schema.js
const fs = require("fs");
const fetch = require("node-fetch");

// Gumroad product slugs
const slugs = ["50prompts", "75prompts", "100prompts", "125prompts", "ultimatebundle"];

(async () => {
  try {
    let html = fs.readFileSync("index.html", "utf8");

    // Start @graph with Organization
    let graph = [
      {
        "@type": "Organization",
        "name": "The AI-Powered SMB",
        "url": "https://marif670.github.io",
        "logo": "https://marif670.github.io/logo.png",
        "sameAs": [
          "https://gumroad.com/marif670"
        ]
      }
    ];

    for (const slug of slugs) {
      console.log(`📡 Fetching Gumroad product data for slug: ${slug}`);
      const res = await fetch(`https://gumroad.com/l/${slug}.json`);
      if (!res.ok) {
        console.error(`❌ Failed to fetch ${slug}, status: ${res.status}`);
        continue;
      }

      const p = await res.json();

      // Build product schema with safe defaults
      const schema = {
        "@type": "Product",
        "name": p.name || "AI Prompt Book",
        "description": p.description || "Exclusive AI prompts collection.",
        "url": `https://gumroad.com/l/${slug}`,
        "image": p.preview_url || "https://marif670.github.io/default-cover.png",
        "brand": {
          "@type": "Organization",
          "name": "The AI-Powered SMB"
        },
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

      graph.push(schema);
      console.log(`✅ Added schema for ${slug}: ${schema.name}`);
    }

    // Build final @graph JSON-LD
    const finalSchema = {
      "@context": "https://schema.org",
      "@graph": graph
    };

    const schemaBlock = `<script type="application/ld+json">${JSON.stringify(finalSchema, null, 2)}</script>`;

    // --- Insert or replace schema in index.html ---
    if (html.includes("</head>")) {
      if (html.includes("application/ld+json")) {
        console.log("🔄 Replacing existing JSON-LD block...");
        html = html.replace(
          /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,
          schemaBlock
        );
      } else {
        console.log("➕ Inserting new JSON-LD block...");
        html = html.replace("</head>", `${schemaBlock}\n</head>`);
      }
    } else {
      console.error("❌ Could not find </head> in index.html — schema not inserted.");
    }

    fs.writeFileSync("index.html", html, "utf8");
    console.log("🎉 index.html updated successfully with Organization + Products schema.");
  } catch (err) {
    console.error("💥 Script failed:", err);
    process.exit(1);
  }
})();
