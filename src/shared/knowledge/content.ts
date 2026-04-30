import rawContent from "./content_database.json";
import rawFeatures from "./features_database.json";
import { ContentArticle, ContentDatabase, FeaturesDatabase, RoadmapFeature } from "./contentTypes";

export const contentDatabase = rawContent as ContentDatabase;
export const featuresDatabase = rawFeatures as FeaturesDatabase;

export function getRecommendedArticles(conditionIds: string[], season?: string) {
  const byCondition = contentDatabase.articles.filter((article) =>
    article.condition_ids.some((id) => conditionIds.includes(id))
  );
  const seasonal = season
    ? contentDatabase.articles.filter((article) => article.seasonal_relevance.includes(season) || article.seasonal_relevance.includes("all"))
    : [];

  return uniqueArticles([...byCondition, ...seasonal, ...contentDatabase.articles.filter((article) => article.is_evergreen)]).slice(0, 8);
}

export function getSeasonalCalendar(season: string) {
  return contentDatabase.content_calendar.weekly_schedule
    .filter((item) => item.season === season || item.theme.toLowerCase().includes(season))
    .slice(0, 4);
}

export function getGlowPlanFeatures() {
  const ids = ["FEAT001", "FEAT003", "FEAT002", "FEAT006"];
  return ids.map((id) => featuresDatabase.features.find((feature) => feature.id === id)).filter(Boolean) as RoadmapFeature[];
}

export function getFutureFeatureIdeas() {
  return [
    {
      title: "Skin Emergency Mode",
      body: "Quick safe steps for burning, breakouts, dryness, and dermatologist escalation."
    },
    {
      title: "Event Glow Countdown",
      body: "7-day prep for weddings, Teej, Dashain, dates, photoshoots, and college events."
    },
    {
      title: "Budget Basket Builder",
      body: "Builds a routine under Rs. 500, Rs. 1000, or Rs. 2000 with local availability."
    },
    {
      title: "Myth Buster Cards",
      body: "Short cards for lemon, toothpaste, over-scrubbing, and oily-skin moisturizer myths."
    },
    {
      title: "Skin Confidence Journal",
      body: "Private weekly notes beside selfies for emotional retention and progress reflection."
    }
  ];
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
