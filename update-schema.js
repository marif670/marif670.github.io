const fs = require("fs");
const fetch = require("node-fetch");

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

(async () => {
  const slugs = ["50prompts", "75prompts", "100prompts", "125prompts", "ultimatebundle"];
  const products = [];

  for (const slug of slugs) {
    const product = await fetchProduct(slug);
    if (product) products.push(product);
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": products.map(p => ({
      "@type": "Product",
      "name": p.name,
      "description": p.description,
      "image": p.preview_url,
      "offers": {
        "@type": "Offer",
        "url": p.short_url,
        "priceCurrency": p.currency,
        "price": p.price,
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2025-12-31",   // update yearly
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "USD"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            }
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "aggregateRating": p.rating_count > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": p.rating_average,
        "reviewCount": p.rating_count
      } : undefined
    }))
  };

  const schemaBlock = `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;

  let html = fs.readFileSync("index.html", "utf8");

  // remove old schema
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");

  // inject new schema before </head>
  html = html.replace("</head>", `${schemaBlock}\n</head>`);

  fs.writeFileSync("index.html", html, "utf8");

  console.log("✅ Schema updated in index.html");
})();
