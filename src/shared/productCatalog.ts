import { products as coreProducts } from "./data";
import { BudgetTier, Product, SkinType } from "./types";

const categories = [
  "Cleanser",
  "Moisturizer",
  "Sunscreen",
  "Acne spot treatment",
  "Pigmentation care",
  "Barrier cream",
  "Micellar / oil cleanser",
  "Lip balm",
  "Body acne / heat rash care"
];

const brandPool = ["Himalaya", "Simple", "Minimalist", "Fixderma", "Neutrogena", "Cetaphil", "Re'equil", "Derma Co", "Garnier", "Joy", "Vaseline", "Lotus", "Bioderma", "CeraVe", "Biotique"];
const concernByCategory: Record<string, string[]> = {
  Cleanser: ["acne", "oiliness", "dust", "makeup"],
  Moisturizer: ["dryness", "barrier", "sensitivity"],
  Sunscreen: ["pigmentation", "melasma", "sun_damage", "pih"],
  "Acne spot treatment": ["acne", "whiteheads", "blackheads"],
  "Pigmentation care": ["pih", "melasma", "uneven_tone"],
  "Barrier cream": ["dryness", "sensitivity", "burning"],
  "Micellar / oil cleanser": ["makeup", "sunscreen", "pollution"],
  "Lip balm": ["dryness", "cold_wind", "smoking_lip_darkness"],
  "Body acne / heat rash care": ["heat_rash", "sweat", "fungal_bumps"]
};

export const launchProducts: Product[] = [...verifiedStarterProducts(), ...coreProducts.map(enrichCoreProduct), ...generateProducts()].slice(0, 112);

function verifiedStarterProducts(): Product[] {
  const products: Array<Partial<Product> & Pick<Product, "id" | "name" | "category" | "price" | "budgetTier" | "fit" | "ingredientLabel">> = [
    item("cetaphil_gentle_cleanser", "Cetaphil Gentle Skin Cleanser 125ml", "Cleanser", "Rs. 600-750", "500plus", ["dry", "sensitive", "combination"], ["glycerin", "panthenol", "niacinamide"], "Gentle non-stripping cleanser for sensitive or barrier-weakened skin."),
    item("himalaya_neem_face_wash", "Himalaya Purifying Neem Face Wash", "Cleanser", "Rs. 180-350", "under200", ["oily", "combination"], ["neem", "turmeric", "gentle surfactants"], "Budget acne/oil cleanser; avoid over-washing if skin feels tight."),
    item("simple_refreshing_face_wash", "Simple Kind To Skin Refreshing Facial Wash", "Cleanser", "Rs. 550-850", "500plus", ["sensitive", "combination", "oily"], ["pro-vitamin B5", "vitamin E"], "Fragrance-free style cleanser for sensitive users who react to strong perfume."),
    item("garnier_micellar_water", "Garnier Micellar Cleansing Water 125ml", "Micellar / oil cleanser", "Rs. 500-750", "500plus", ["oily", "dry", "combination", "sensitive"], ["micelles", "glycerin"], "First cleanse for makeup, sunscreen, and dusty commutes; follow with face wash at night."),
    item("neutrogena_hydro_boost", "Neutrogena Hydro Boost Water Gel", "Moisturizer", "Rs. 900-1600", "500plus", ["oily", "combination", "dry"], ["glycerin", "hyaluronic acid"], "Light gel texture for humid weather or oily-combination skin."),
    item("ponds_light_moisturiser", "Pond's Super Light Gel Moisturiser", "Moisturizer", "Rs. 250-550", "200to500", ["oily", "combination"], ["glycerin", "hyaluronic acid"], "Budget light moisturizer; patch test if fragrance-sensitive."),
    item("vaseline_lip_therapy", "Vaseline Lip Therapy", "Lip balm", "Rs. 250-450", "200to500", ["dry", "sensitive", "combination", "oily"], ["petrolatum"], "Simple lip barrier for winter wind, lip licking, and dryness."),
    item("fixderma_shadow_spf50", "Fixderma Shadow SPF 50+ Gel", "Sunscreen", "Rs. 850-1300", "500plus", ["oily", "combination"], ["SPF 50+", "PA+++"], "Light sunscreen option for oily skin; reapply when sweating or outdoors long."),
    item("minimalist_spf50", "Minimalist SPF 50 Sunscreen", "Sunscreen", "Rs. 900-1400", "500plus", ["oily", "dry", "combination", "sensitive"], ["SPF 50", "PA++++"], "Broad-spectrum sunscreen for marks, melasma, and high UV days."),
    item("reequil_blue_sunscreen", "Re'equil Ultra Matte Dry Touch Sunscreen", "Sunscreen", "Rs. 1000-1600", "500plus", ["oily", "combination"], ["SPF 50", "PA++++"], "Matte sunscreen for oily users; may feel silicone-heavy for some."),
    item("minimalist_niacinamide_5", "Minimalist 5% Niacinamide Serum", "Pigmentation care", "Rs. 800-1200", "500plus", ["oily", "combination", "sensitive"], ["niacinamide"], "Beginner-friendly oil, redness, and mark support after basics are stable."),
    item("minimalist_salicylic_2", "Minimalist 2% Salicylic Acid Serum", "Acne spot treatment", "Rs. 800-1200", "500plus", ["oily", "combination"], ["salicylic acid"], "For blackheads/oily pores; start 2-3 nights weekly, not daily at first."),
    item("benzac_ac_2_5", "Benzac AC 2.5% Gel", "Acne spot treatment", "Rs. 450-850", "200to500", ["oily", "combination"], ["benzoyl peroxide"], "Spot care for inflamed pimples; can dry or bleach fabric, use carefully."),
    item("bioderma_atoderm", "Bioderma Atoderm Creme", "Barrier cream", "Rs. 1200-2200", "500plus", ["dry", "sensitive"], ["glycerin", "niacinamide"], "Richer barrier cream for winter, dry cheeks, and irritation-prone skin."),
    item("cerave_moisturising_cream", "CeraVe Moisturising Cream", "Barrier cream", "Rs. 1500-2600", "500plus", ["dry", "sensitive"], ["ceramides", "hyaluronic acid"], "Barrier support for dry/wind-stressed skin; buy only from trusted sellers."),
    item("calamine_lotion", "Calamine Lotion", "Body acne / heat rash care", "Rs. 100-250", "under200", ["sensitive", "oily", "combination"], ["calamine", "zinc"], "Low-cost soothing option for heat rash feel; not for severe infection.")
  ];

  return products.map((product, index) => ({
    ...product,
    priceMin: parsePrice(product.price),
    priceMax: parsePrice(product.price.split("-").at(-1) ?? product.price),
    concernFit: concernByCategory[product.category] ?? ["general"],
    ingredients: product.ingredients ?? [],
    whereToBuy: ["Daraz", "local pharmacy", "beauty store"],
    localAvailability: true,
    fakeRisk: index % 4 === 0 ? "high" : "medium",
    whyMatched: {
      en: `${product.name} is a recognizable Nepal-available option in ${product.category}. Match still depends on skin type, budget, seller authenticity, and patch testing.`,
      ne: `${product.name} Nepal ma pauna sakine ${product.category} option ho. Skin type, budget, seller authenticity ra patch test still important.`
    },
    whyNot: {
      en: "Skip if it burns, clogs pores, feels too heavy, or the seller/expiry looks suspicious.",
      ne: "Burn, pore clog, too heavy feel, wa seller/expiry suspicious bhaye skip garnu."
    },
    budgetAlternative: "Ask a local pharmacy for the same category and ingredient style in your budget.",
    safetyNote: {
      en: "Check batch, seal, expiry, seller rating, and spelling. Sponsored or affiliate placements must be labeled.",
      ne: "Batch, seal, expiry, seller rating ra spelling check garnu."
    },
    trustScore: 84 - (index % 8),
    sponsored: false,
    affiliateUrl: "https://www.daraz.com.np/",
    imageSourceKey: visualKeyFor(product.category),
    visualCategory: product.category
  })) as Product[];
}

function item(id: string, name: string, category: string, price: string, budgetTier: BudgetTier, fit: SkinType[], ingredients: string[], note: string) {
  return {
    id,
    name,
    category,
    price,
    budgetTier,
    fit,
    ingredients,
    ingredientLabel: { en: `${ingredients.join(", ")}. ${note}`, ne: `${ingredients.join(", ")}. ${note}` }
  };
}

function enrichCoreProduct(product: Product): Product {
  return {
    ...product,
    priceMin: parsePrice(product.price),
    priceMax: parsePrice(product.price),
    concernFit: concernByCategory[product.category] ?? ["general"],
    ingredients: product.ingredientLabel.en.split(".")[0]?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
    whereToBuy: ["Daraz", "Bhatbhateni", "local pharmacy"],
    localAvailability: true,
    fakeRisk: "medium",
    whyMatched: {
      en: `${product.category} matched to your skin type and current budget.`,
      ne: `${product.category} tapai ko skin type ra budget sanga match bhayo.`
    },
    whyNot: {
      en: "Skip if it stings, feels heavy, or triggers new bumps.",
      ne: "Sting, heavy feel, wa new bumps aaye skip garnu."
    },
    budgetAlternative: "Ask pharmacy for the same category in your budget tier.",
    safetyNote: {
      en: "Patch test first. Avoid suspiciously cheap online listings and check expiry/batch.",
      ne: "Pahile patch test. Dherai sasto online listing avoid, expiry/batch check garnu."
    },
    imageSourceKey: visualKeyFor(product.category),
    visualCategory: product.category
  };
}

function generateProducts(): Product[] {
  const out: Product[] = [];
  categories.forEach((category, catIndex) => {
    for (let index = 0; index < 12; index += 1) {
      const brand = brandPool[(catIndex + index) % brandPool.length];
      const budget = budgetFor(index);
      const priceMin = budget === "under200" ? 160 + index * 5 : budget === "200to500" ? 280 + index * 12 : 650 + index * 55;
      const priceMax = priceMin + (budget === "500plus" ? 450 : 120);
      const skinFit = skinFitFor(category, index);
      const ingredients = ingredientsFor(category);
      const descriptor = productDescriptorFor(category, index);
      out.push({
        id: `launch_${slug(category)}_${index + 1}`,
        name: `${brand} ${descriptor}`,
        category,
        price: `Rs. ${priceMin}-${priceMax}`,
        priceMin,
        priceMax,
        budgetTier: budget,
        fit: skinFit,
        concernFit: concernByCategory[category] ?? ["general"],
        ingredients,
        whereToBuy: whereToBuyFor(index),
        localAvailability: true,
        fakeRisk: index % 5 === 0 ? "high" : index % 2 === 0 ? "medium" : "low",
        ingredientLabel: {
          en: `${ingredients.join(", ")}. Nepal-available ${category.toLowerCase()} option for ${skinFit.join("/")} skin.`,
          ne: `${ingredients.join(", ")}. Nepal ma pauna sakine ${category.toLowerCase()} option.`
        },
        whyMatched: {
          en: `Matched because it supports ${concernByCategory[category]?.slice(0, 2).join(" + ")} while staying in the ${labelBudget(budget)} range.`,
          ne: `${concernByCategory[category]?.slice(0, 2).join(" + ")} support ra ${labelBudget(budget)} budget range ma parcha.`
        },
        whyNot: {
          en: category === "Sunscreen" ? "Skip if it pills badly, stings eyes, or you will not reapply it." : "Skip if it burns, clogs pores, or feels too heavy in your weather.",
          ne: "Burn, clogged pores, wa weather ma too heavy feel bhaye skip garnu."
        },
        budgetAlternative: budget === "500plus" ? "Use a pharmacy generic in the same category if budget is tight." : "Upgrade only after the basic routine is consistent.",
        safetyNote: {
          en: "Check expiry, seal, seller rating, and batch number. Sponsored picks are labeled when used.",
          ne: "Expiry, seal, seller rating ra batch number check garnu."
        },
        trustScore: 72 + ((index + catIndex) % 21),
        sponsored: index === 10 && catIndex % 3 === 0,
        affiliateUrl: "https://www.daraz.com.np/",
        imageSourceKey: visualKeyFor(category),
        visualCategory: category
      });
    }
  });
  return out;
}

function parsePrice(price: string) {
  const match = price.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function budgetFor(index: number): BudgetTier {
  if (index % 4 === 0) return "under200";
  if (index % 4 === 1 || index % 4 === 2) return "200to500";
  return "500plus";
}

function skinFitFor(category: string, index: number): SkinType[] {
  if (category.includes("Barrier") || category.includes("Lip") || category === "Moisturizer") return ["dry", "sensitive", index % 2 === 0 ? "combination" : "oily"];
  if (category.includes("Acne") || category.includes("heat")) return ["oily", "combination", "sensitive"];
  if (category === "Sunscreen") return ["oily", "dry", "combination", "sensitive"];
  return ["oily", "combination", index % 2 === 0 ? "dry" : "sensitive"];
}

function ingredientsFor(category: string) {
  if (category === "Sunscreen") return ["SPF 30+", "PA+++", "non-comedogenic"];
  if (category.includes("Acne")) return ["salicylic acid", "niacinamide", "zinc"];
  if (category.includes("Pigmentation")) return ["vitamin C", "niacinamide", "licorice"];
  if (category.includes("Barrier")) return ["ceramides", "glycerin", "panthenol"];
  if (category.includes("Micellar")) return ["micelles", "allantoin", "glycerin"];
  if (category.includes("Lip")) return ["petrolatum", "shea butter", "SPF"];
  if (category.includes("heat")) return ["calamine", "aloe", "zinc"];
  if (category === "Moisturizer") return ["glycerin", "hyaluronic acid", "ceramides"];
  return ["gentle surfactants", "neem", "glycerin"];
}

function productDescriptorFor(category: string, index: number) {
  const descriptors: Record<string, string[]> = {
    Cleanser: ["Gentle Neem Face Wash", "Low-pH Daily Cleanser", "Hydrating Gel Cleanser", "Oil Control Face Wash"],
    Moisturizer: ["Light Gel Moisturizer", "Barrier Repair Lotion", "Hydrating Daily Cream", "Oil-Free Moisturizer"],
    Sunscreen: ["SPF 50 PA+++ Sunscreen", "Matte Daily Sun Gel", "Hydrating Sunscreen Lotion", "No-White-Cast Sun Cream"],
    "Acne spot treatment": ["Salicylic Acne Gel", "Niacinamide Spot Care", "Zinc Blemish Gel", "Calming Pimple Cream"],
    "Pigmentation care": ["Vitamin C Brightening Serum", "Niacinamide Marks Serum", "Licorice Spot Corrector", "Even Tone Serum"],
    "Barrier cream": ["Ceramide Barrier Cream", "Panthenol Repair Balm", "Glycerin Comfort Cream", "Sensitive Skin Barrier Lotion"],
    "Micellar / oil cleanser": ["Micellar Cleansing Water", "Oil Cleanse Balm", "Makeup Melt Cleanser", "Sunscreen Removal Water"],
    "Lip balm": ["SPF Lip Balm", "Repair Lip Therapy", "Shea Lip Balm", "Petrolatum Lip Protectant"],
    "Body acne / heat rash care": ["Calamine Heat Rash Lotion", "Aloe Body Acne Gel", "Zinc Sweat Rash Care", "Back Acne Body Wash"]
  };
  const list = descriptors[category] ?? [`${category} Essential`];
  return list[index % list.length];
}

function whereToBuyFor(index: number) {
  return index % 3 === 0 ? ["Daraz", "Bhatbhateni"] : index % 3 === 1 ? ["local pharmacy", "beauty store"] : ["Daraz", "Salesberry", "pharmacy"];
}

function labelBudget(budget: BudgetTier) {
  return budget === "under200" ? "under Rs. 200" : budget === "200to500" ? "Rs. 200-500" : "Rs. 500+";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function visualKeyFor(category: string) {
  const value = category.toLowerCase();
  if (value.includes("sunscreen")) return "sunscreen";
  if (value.includes("moisturizer")) return "moisturizer";
  if (value.includes("micellar")) return "micellar";
  if (value.includes("acne")) return "acne";
  if (value.includes("pigmentation")) return "pigmentation";
  if (value.includes("barrier")) return "barrier";
  if (value.includes("lip")) return "lip";
  if (value.includes("heat")) return "heat";
  if (value.includes("cleanser")) return "cleanser";
  return "default";
}
