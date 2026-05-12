import rawContent from "./content_database.json";
import { enrichArticle } from "./education";
import { ContentArticle, ContentDatabase } from "./contentTypes";

export const contentDatabase = rawContent as ContentDatabase;
const launchExtraArticles: ContentArticle[] = [
  launchArticle("ART013", "Hard Water, Tanker Water, And Well Water: Face Washing In Nepal", "education", ["C003", "C006"], ["water", "hard_water", "tanker", "well_water"], "How mineral-heavy, muddy, or stored water can make skin feel tight, gritty, or irritated, plus low-budget final-rinse fixes."),
  launchArticle("ART014", "Makeup And Acne: A Nepali College And Office Guide", "education", ["C001", "C004"], ["makeup", "acne", "brush_hygiene", "college"], "How to wear makeup without sleeping in clogged pores: non-comedogenic choices, brush cleaning, double cleansing, and when to pause products."),
  launchArticle("ART015", "Fake Product Buying Guide For Daraz, Pharmacies, And Beauty Stores", "product_review", ["C001", "C002", "C003"], ["fake_products", "daraz", "pharmacy", "safety"], "A practical checklist for expiry, batch number, seller ratings, packaging, suspicious discounts, and when to buy from a pharmacy instead.")
];

export function getRecommendedArticles(conditionIds: string[], season?: string) {
  const byCondition = contentDatabase.articles.filter((article) =>
    article.condition_ids.some((id) => conditionIds.includes(id))
  );
  const seasonal = season
    ? contentDatabase.articles.filter((article) => article.seasonal_relevance.includes(season) || article.seasonal_relevance.includes("all"))
    : [];

  return uniqueArticles([...byCondition, ...seasonal, ...contentDatabase.articles, ...launchExtraArticles].filter((article) => article.is_evergreen || article.condition_ids.some((id) => conditionIds.includes(id)) || article.seasonal_relevance.includes(season ?? "all"))).slice(0, 8).map(enrichArticle);
}

export function getAllArticles() {
  return uniqueArticles([...contentDatabase.articles, ...launchExtraArticles]).map(enrichArticle);
}

export function getArticleById(id: string) {
  const article = [...contentDatabase.articles, ...launchExtraArticles].find((item) => item.id === id);
  return article ? enrichArticle(article) : undefined;
}

export function getSeasonalCalendar(season: string) {
  return contentDatabase.content_calendar.weekly_schedule
    .filter((item) => item.season === season || item.theme.toLowerCase().includes(season))
    .slice(0, 4);
}

function launchArticle(id: string, title_en: string, category: string, condition_ids: string[], tags: string[], summary_en: string): ContentArticle {
  return {
    id,
    title_en,
    category,
    condition_ids,
    tags,
    summary_en,
    reading_time_min: 7,
    seasonal_relevance: ["all"],
    visual_hook: "prabha_launch_guide",
    content_calendar_week: 0,
    is_evergreen: true
  };
}

export function articleVisualTone(article: ContentArticle) {
  if (article.category === "diet") return "accent";
  if (article.category === "seasonal") return "secondary";
  if (article.category === "motivation") return "primary";
  return "primary";
}

function uniqueArticles(articles: ContentArticle[]) {
  const map = new Map<string, ContentArticle>();
  for (const article of articles) map.set(article.id, article);
  return Array.from(map.values());
}
