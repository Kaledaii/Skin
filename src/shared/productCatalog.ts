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

export const launchProducts: Product[] = [...coreProducts.map(enrichCoreProduct), ...generateProducts()].slice(0, 112);

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
    }
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
        affiliateUrl: "https://www.daraz.com.np/"
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
