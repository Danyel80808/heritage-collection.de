// products.js
window.PRODUCTS = [
  {
    id: "wool-knit-sweater",
    name: "Wollstrick-Pullover (Slim Fit)",
    category: "Herren",
    price: 49.90,
    currency: "EUR",
    shippingTime: "10–15 Tage",
    images: [
      "https://s.alicdn.com/@sc01/kf/H82c3749d549f4e50bab3cc6c6ce8f5ecW.jpg_720x720q50.jpg"
    ],
    options: {
      colors: ["Schwarz", "Beige", "Navy"],
      sizes: ["S", "M", "L", "XL", "XXL"]
    },
    highlights: [
      "100% Wolle",
      "Slim Fit",
      "Atmungsaktiv & hochwertig"
    ],
    details: [
      "Material: 100% Wolle",
      "Pullover mit langen Ärmeln",
      "Anti-Pilling & formstabil"
    ],
    description:
      "Eleganter Herren-Pullover im Slim-Fit-Design – perfekt für Alltag und Smart-Casual-Outfits."
  },

  {
    id: "fleece-sweatpants",
    name: "Fleece Sweatpants (Loose Fit)",
    category: "Herren",
    price: 34.90,
    currency: "EUR",
    shippingTime: "12–20 Tage",
    images: [
      "https://s.alicdn.com/@sc04/kf/H333e2fa53a3545d28f7e84d3aa02326cj.png_960x960q80.jpg"
    ],
    options: {
      colors: ["Grau", "Schwarz", "Cream"],
      sizes: ["XS", "S", "M", "L", "XL"]
    },
    highlights: [
      "Weiches Fleece-Material",
      "Elastischer Bund",
      "Bequemer Loose Fit"
    ],
    details: [
      "Material: Polyester / Baumwolle",
      "Verschluss: Elastischer Bund",
      "Länge: Full Length",
      "Stoffgewicht: 220g"
    ],
    description:
      "Moderne Herren-Sweatpants mit cleanem Look – ideal für Alltag, Reisen und Freizeit."
  }
];

// Rabattcodes
window.COUPONS = {
  "WELCOME10": { type: "percent", value: 10 },
  "SAVE5": { type: "fixed", value: 5 }
};
