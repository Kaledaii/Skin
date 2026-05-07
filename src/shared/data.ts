import { CommunityQuestion, Product, RoutineLog, RoutineStep, Tip } from "./types";

export const morningSteps: RoutineStep[] = [
  {
    "id": "morning-1",
    "title": {
      "en": "Gentle Cleanser",
      "ne": "Gentle Cleanser"
    },
    "description": {
      "en": "Neem or micellar water — removes overnight buildup and sweat",
      "ne": "Neem or micellar water — removes overnight buildup and sweat"
    },
    "reason": {
      "en": "Use lukewarm water. Hot water strips the moisture barrier permanently over time. Ayurveda option: Rice water splash instead — balances and preps skin.",
      "ne": "Use lukewarm water. Hot water strips the moisture barrier permanently over time. Ayurveda option: Rice water splash instead — balances and preps skin."
    }
  },
  {
    "id": "morning-2",
    "title": {
      "en": "Toner / Rose Water",
      "ne": "Toner / Rose Water"
    },
    "description": {
      "en": "Balances skin pH, preps skin to absorb serums better",
      "ne": "Balances skin pH, preps skin to absorb serums better"
    },
    "reason": {
      "en": "Press — don't wipe. Patting retains more product and avoids friction. Ayurveda option: Pure gulab jal (rose water) — 100% equivalent.",
      "ne": "Press — don't wipe. Patting retains more product and avoids friction. Ayurveda option: Pure gulab jal (rose water) — 100% equivalent."
    }
  },
  {
    "id": "morning-3",
    "title": {
      "en": "Vitamin C Serum",
      "ne": "Vitamin C Serum"
    },
    "description": {
      "en": "Your antioxidant shield against UV, dust, smoke, and city pollution. 3 drops only.",
      "ne": "UV, dhulo, smoke ra city pollution bata antioxidant shield. 3 drops only."
    },
    "reason": {
      "en": "This step helps on high-UV, dusty, smoky, or polluted days. Apply before sunscreen. Ayurveda option: Fresh amla juice diluted 50/50 with water — applied with cotton pad.",
      "ne": "High-UV, dusty, smoky wa polluted day ma help garcha. Sunscreen aghi apply garnuhos. Ayurveda option: fresh amla juice 50/50 water ma dilute garera cotton pad le."
    }
  },
  {
    "id": "morning-4",
    "title": {
      "en": "Light Moisturiser",
      "ne": "Light Moisturiser"
    },
    "description": {
      "en": "Gel or light lotion — seals in the serum",
      "ne": "Gel or light lotion — seals in the serum"
    },
    "reason": {
      "en": "Apply while skin is still slightly damp for significantly better absorption. Ayurveda option: 1 drop aloe vera gel mixed with rose water — lightweight and effective.",
      "ne": "Apply while skin is still slightly damp for significantly better absorption. Ayurveda option: 1 drop aloe vera gel mixed with rose water — lightweight and effective."
    }
  },
  {
    "id": "morning-5",
    "title": {
      "en": "Sunscreen SPF 30+",
      "ne": "Sunscreen SPF 30+"
    },
    "description": {
      "en": "Non-negotiable. Every. Single. Day. Even indoors.",
      "ne": "Non-negotiable. Every. Single. Day. Even indoors."
    },
    "reason": {
      "en": "Nepal's high altitude means UV is 25–30% stronger. UV penetrates glass — SPF indoors too.",
      "ne": "Nepal's high altitude means UV is 25–30% stronger. UV penetrates glass — SPF indoors too."
    }
  }
];

export const eveningSteps: RoutineStep[] = [
  {
    "id": "evening-1",
    "title": {
      "en": "First Cleanse (Oil / Micellar)",
      "ne": "First Cleanse (Oil / Micellar)"
    },
    "description": {
      "en": "Removes pollution, SPF, and makeup — nothing else can do this step",
      "ne": "Removes pollution, SPF, and makeup — nothing else can do this step"
    },
    "reason": {
      "en": "PM2.5 particles are oil-soluble. Only an oil-based first cleanse removes them. This is the most critical step in Kathmandu. Ayurveda option: Sesame or coconut oil massage — wipe off with warm damp cloth.",
      "ne": "PM2.5 particles are oil-soluble. Only an oil-based first cleanse removes them. This is the most critical step in Kathmandu. Ayurveda option: Sesame or coconut oil massage — wipe off with warm damp cloth."
    }
  },
  {
    "id": "evening-2",
    "title": {
      "en": "Second Cleanse (Foaming)",
      "ne": "Second Cleanse (Foaming)"
    },
    "description": {
      "en": "Water-based cleanser removes any remaining oil and impurities",
      "ne": "Water-based cleanser removes any remaining oil and impurities"
    },
    "reason": {
      "en": "Do not skip step 1 and try to do this alone — it cannot remove PM2.5 without oil first. Ayurveda option: Besan (chickpea flour) mixed with milk — natural foaming face wash.",
      "ne": "Do not skip step 1 and try to do this alone — it cannot remove PM2.5 without oil first. Ayurveda option: Besan (chickpea flour) mixed with milk — natural foaming face wash."
    }
  },
  {
    "id": "evening-3",
    "title": {
      "en": "Treatment Serum",
      "ne": "Treatment Serum"
    },
    "description": {
      "en": "Niacinamide for pores/oiliness OR retinol for aging. Alternate nights.",
      "ne": "Niacinamide for pores/oiliness OR retinol for aging. Alternate nights."
    },
    "reason": {
      "en": "Never mix retinol and Vitamin C in the same routine. One in morning, one at night. Ayurveda option: Diluted neem oil in coconut carrier oil — apply with fingertips on spots.",
      "ne": "Never mix retinol and Vitamin C in the same routine. One in morning, one at night. Ayurveda option: Diluted neem oil in coconut carrier oil — apply with fingertips on spots."
    }
  },
  {
    "id": "evening-4",
    "title": {
      "en": "Rich Moisturiser / Night Cream",
      "ne": "Rich Moisturiser / Night Cream"
    },
    "description": {
      "en": "Skin repairs overnight — give it the right fuel",
      "ne": "Skin repairs overnight — give it the right fuel"
    },
    "reason": {
      "en": "Night is when skin cell renewal is 3x faster. This step directly impacts how you look in the morning. Ayurveda option: Curd + honey mask 3x/week as your night treatment.",
      "ne": "Night is when skin cell renewal is 3x faster. This step directly impacts how you look in the morning. Ayurveda option: Curd + honey mask 3x/week as your night treatment."
    }
  },
  {
    "id": "evening-5",
    "title": {
      "en": "Spot Treatment",
      "ne": "Spot Treatment"
    },
    "description": {
      "en": "Target active pimples only — not whole face",
      "ne": "Target active pimples only — not whole face"
    },
    "reason": {
      "en": "Use a cotton swab for precision. Over-applying spreads bacteria to clear areas. Ayurveda option: Dab of pure neem oil on spots with a cotton bud — leave overnight.",
      "ne": "Use a cotton swab for precision. Over-applying spreads bacteria to clear areas. Ayurveda option: Dab of pure neem oil on spots with a cotton bud — leave overnight."
    }
  }
];

export const products: Product[] = [
  {
    "id": "prod_001",
    "name": "Himalaya Purifying Neem Face Wash",
    "category": "Cleanser",
    "price": "Rs. 180",
    "budgetTier": "under200",
    "fit": [
      "oily",
      "combination"
    ],
    "ingredientLabel": {
      "en": "Neem, Turmeric. Best budget cleanser available locally. Effective for Kathmandu oily-acne skin.",
      "ne": "Neem, Turmeric. Best budget cleanser available locally. Effective for Kathmandu oily-acne skin."
    },
    "trustScore": 84,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_002",
    "name": "Garnier Vitamin C Brightening Serum",
    "category": "Serum",
    "price": "Rs. 750",
    "budgetTier": "500plus",
    "fit": [
      "oily",
      "dry",
      "combination",
      "sensitive"
    ],
    "ingredientLabel": {
      "en": "Vitamin C, Niacinamide, Salicylic Acid. Most accessible Vitamin C serum in Nepal. Use every morning before SPF.",
      "ne": "Vitamin C, Niacinamide, Salicylic Acid. Most accessible Vitamin C serum in Nepal. Use every morning before SPF."
    },
    "trustScore": 80,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_003",
    "name": "Lotus Herbals Safe Sun SPF 40",
    "category": "Sunscreen",
    "price": "Rs. 550",
    "budgetTier": "500plus",
    "fit": [
      "oily",
      "dry",
      "combination",
      "sensitive"
    ],
    "ingredientLabel": {
      "en": "Zinc oxide, Titanium dioxide. Physical sunscreen, minimal white cast for medium Nepali skin tones. Great for high-altitude UV.",
      "ne": "Zinc oxide, Titanium dioxide. Physical sunscreen, minimal white cast for medium Nepali skin tones. Great for high-altitude UV."
    },
    "trustScore": 86,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_004",
    "name": "Neutrogena Hydro Boost Water Gel",
    "category": "Moisturiser",
    "price": "Rs. 1200",
    "budgetTier": "500plus",
    "fit": [
      "dry"
    ],
    "ingredientLabel": {
      "en": "Hyaluronic acid. Best lightweight moisturiser available. Works under SPF without pilling.",
      "ne": "Hyaluronic acid. Best lightweight moisturiser available. Works under SPF without pilling."
    },
    "trustScore": 90,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_005",
    "name": "The Moms Co. Natural AHA Glow Face Cream",
    "category": "Natural",
    "price": "Rs. 890",
    "budgetTier": "500plus",
    "fit": [
      "sensitive"
    ],
    "ingredientLabel": {
      "en": "AHA, Vitamin C, Niacinamide. Best natural option for sensitive Nepali skin. No harsh chemicals.",
      "ne": "AHA, Vitamin C, Niacinamide. Best natural option for sensitive Nepali skin. No harsh chemicals."
    },
    "trustScore": 82,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_006",
    "name": "Simple Kind to Skin Micellar Water",
    "category": "Cleanser",
    "price": "Rs. 480",
    "budgetTier": "200to500",
    "fit": [
      "oily",
      "dry",
      "combination",
      "sensitive"
    ],
    "ingredientLabel": {
      "en": "Micellar technology, Allantoin. Essential for Kathmandu double cleansing. Use as Step 1 every evening.",
      "ne": "Micellar technology, Allantoin. Essential for Kathmandu double cleansing. Use as Step 1 every evening."
    },
    "trustScore": 88,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_007",
    "name": "Biotique Bio Papaya Face Scrub",
    "category": "Exfoliant",
    "price": "Rs. 220",
    "budgetTier": "200to500",
    "fit": [
      "oily",
      "dry",
      "combination",
      "sensitive"
    ],
    "ingredientLabel": {
      "en": "Papain enzymes, Honey, Neem. Good weekly exfoliant. Enzyme-based so gentler than physical scrubs.",
      "ne": "Papain enzymes, Honey, Neem. Good weekly exfoliant. Enzyme-based so gentler than physical scrubs."
    },
    "trustScore": 78,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  },
  {
    "id": "prod_008",
    "name": "Kama Ayurveda Pure Rose Water",
    "category": "Toner",
    "price": "Rs. 650",
    "budgetTier": "500plus",
    "fit": [
      "oily",
      "dry",
      "combination",
      "sensitive"
    ],
    "ingredientLabel": {
      "en": "Rosa damascena distillate. Purest rose water available in Nepal. Worth the price — lasts 3+ months.",
      "ne": "Rosa damascena distillate. Purest rose water available in Nepal. Worth the price — lasts 3+ months."
    },
    "trustScore": 92,
    "sponsored": false,
    "affiliateUrl": "https://www.daraz.com.np/"
  }
];

export const tips: Tip[] = [
  {
    "id": "blog_001",
    "title": {
      "en": "Why your grandmother's haldi doodh is better than any serum",
      "ne": "Why your grandmother's haldi doodh is better than any serum"
    },
    "body": {
      "en": "The science behind turmeric milk and how curcumin outperforms many marketed brightening actives for South Asian skin.",
      "ne": "The science behind turmeric milk and how curcumin outperforms many marketed brightening actives for South Asian skin."
    },
    "season": "summer",
    "duration": "4 min"
  },
  {
    "id": "blog_002",
    "title": {
      "en": "Nepal pollution skin guide: protect against PM2.5",
      "ne": "Nepal pollution skin guide: PM2.5 bata protect"
    },
    "body": {
      "en": "A science-backed approach to protecting your skin when the AQI hits 200+. No expensive products needed.",
      "ne": "A science-backed approach to protecting your skin when the AQI hits 200+. No expensive products needed."
    },
    "season": "summer",
    "duration": "6 min"
  },
  {
    "id": "blog_003",
    "title": {
      "en": "The Nepali skin diet: what to eat for clear, glowing skin",
      "ne": "The Nepali skin diet: what to eat for clear, glowing skin"
    },
    "body": {
      "en": "Dal, achar, and ghee — which traditional foods help your skin and which silently cause breakouts?",
      "ne": "Dal, achar, and ghee — which traditional foods help your skin and which silently cause breakouts?"
    },
    "season": "summer",
    "duration": "5 min"
  },
  {
    "id": "blog_004",
    "title": {
      "en": "Monsoon skin survival guide for Nepal",
      "ne": "Monsoon skin survival guide for Nepal"
    },
    "body": {
      "en": "Humidity, fungal breakouts, and sudden acne flares — your complete monsoon skincare reset.",
      "ne": "Humidity, fungal breakouts, and sudden acne flares — your complete monsoon skincare reset."
    },
    "season": "monsoon",
    "duration": "5 min"
  },
  {
    "id": "blog_005",
    "title": {
      "en": "Niacinamide vs Vitamin C: which does Nepal skin need more?",
      "ne": "Niacinamide vs Vitamin C: which does Nepal skin need more?"
    },
    "body": {
      "en": "Breaking down the two most popular skincare actives and which addresses our specific climate better.",
      "ne": "Breaking down the two most popular skincare actives and which addresses our specific climate better."
    },
    "season": "summer",
    "duration": "4 min"
  }
];

export const questions: CommunityQuestion[] = [
  {
    "id": "qa_001",
    "title": {
      "en": "My skin gets super oily in Kathmandu summer — is it the pollution or the heat?",
      "ne": "My skin gets super oily in Kathmandu summer — is it the pollution or the heat?"
    },
    "answer": {
      "en": "Both, but heat is the bigger driver. When temperature rises, sebaceous glands produce more oil as a cooling mechanism. Pollution clogs pores and traps the oil. Switch to gel moisturiser in summer, add niacinamide serum, and double cleanse every evening without fail.",
      "ne": "Both, but heat is the bigger driver. When temperature rises, sebaceous glands produce more oil as a cooling mechanism. Pollution clogs pores and traps the oil. Switch to gel moisturiser in summer, add niacinamide serum, and double cleanse every evening without fail."
    },
    "verified": true
  },
  {
    "id": "qa_002",
    "title": {
      "en": "Can I use multani mitti mask every day? My pores are huge.",
      "ne": "Can I use multani mitti mask every day? My pores are huge."
    },
    "answer": {
      "en": "Maximum 2x per week. Daily clay masks strip natural oils, triggering rebound — your skin produces more oil to compensate. For daily pore care: niacinamide serum + rose water toner. Reserve multani mitti for twice weekly.",
      "ne": "Maximum 2x per week. Daily clay masks strip natural oils, triggering rebound — your skin produces more oil to compensate. For daily pore care: niacinamide serum + rose water toner. Reserve multani mitti for twice weekly."
    },
    "verified": true
  },
  {
    "id": "qa_003",
    "title": {
      "en": "Does drinking amla juice actually help with pigmentation or is it a myth?",
      "ne": "Does drinking amla juice actually help with pigmentation or is it a myth?"
    },
    "answer": {
      "en": "Very real — not a myth. Amla has 20x the Vitamin C of oranges. Vitamin C inhibits tyrosinase (the enzyme that produces melanin). Results take 6–8 weeks of consistent daily intake, but they're real and lasting.",
      "ne": "Very real — not a myth. Amla has 20x the Vitamin C of oranges. Vitamin C inhibits tyrosinase (the enzyme that produces melanin). Results take 6–8 weeks of consistent daily intake, but they're real and lasting."
    },
    "verified": true
  },
  {
    "id": "qa_004",
    "title": {
      "en": "Best local sunscreen under NPR 500 that doesn't leave white cast?",
      "ne": "Best local sunscreen under NPR 500 that doesn't leave white cast?"
    },
    "answer": {
      "en": "Lotus Herbals UV Smart SPF 40 (around NPR 450 at Bhatbhateni) — chemical sunscreen, no white cast. For medium to deeper skin tones, Neutrogena Clear Face or Lakme Sun Expert also work well.",
      "ne": "Lotus Herbals UV Smart SPF 40 (around NPR 450 at Bhatbhateni) — chemical sunscreen, no white cast. For medium to deeper skin tones, Neutrogena Clear Face or Lakme Sun Expert also work well."
    },
    "verified": true
  },
  {
    "id": "qa_005",
    "title": {
      "en": "Why does my acne get worse during Dashain? Is it the mutton?",
      "ne": "Why does my acne get worse during Dashain? Is it the mutton?"
    },
    "answer": {
      "en": "Three factors: 1) Excess red meat raises IGF-1 → spikes sebum, 2) Fried snacks and sweets cause insulin spikes → more oil, 3) Festival stress raises cortisol → acne. Balance with amla juice daily, more water, and keep your evening routine consistent through the festival.",
      "ne": "Three factors: 1) Excess red meat raises IGF-1 → spikes sebum, 2) Fried snacks and sweets cause insulin spikes → more oil, 3) Festival stress raises cortisol → acne. Balance with amla juice daily, more water, and keep your evening routine consistent through the festival."
    },
    "verified": true
  }
];

export const routineLogs: RoutineLog[] = [
  {
    "date": "Mon",
    "morning": true,
    "evening": true,
    "hydration": 7,
    "sleep": 7
  },
  {
    "date": "Tue",
    "morning": true,
    "evening": false,
    "hydration": 5,
    "sleep": 6
  },
  {
    "date": "Wed",
    "morning": true,
    "evening": true,
    "hydration": 8,
    "sleep": 8
  },
  {
    "date": "Thu",
    "morning": false,
    "evening": true,
    "hydration": 6,
    "sleep": 5
  },
  {
    "date": "Fri",
    "morning": true,
    "evening": true,
    "hydration": 9,
    "sleep": 7
  }
];
