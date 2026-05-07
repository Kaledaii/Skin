import rawContent from "./content_database.json";
import { enrichArticle } from "./education";
import { ContentArticle, ContentDatabase } from "./contentTypes";

export const contentDatabase = rawContent as ContentDatabase;

export function getRecommendedArticles(conditionIds: string[], season?: string) {
  const byCondition = contentDatabase.articles.filter((article) =>
    article.condition_ids.some((id) => conditionIds.includes(id))
  );
  const seasonal = season
    ? contentDatabase.articles.filter((article) => article.seasonal_relevance.includes(season) || article.seasonal_relevance.includes("all"))
    : [];

  return uniqueArticles([...byCondition, ...seasonal, ...contentDatabase.articles.filter((article) => article.is_evergreen)]).slice(0, 8).map(enrichArticle);
}

export function getAllArticles() {
  return contentDatabase.articles.map(enrichArticle);
}

export function getArticleById(id: string) {
  const article = contentDatabase.articles.find((item) => item.id === id);
  return article ? enrichArticle(article) : undefined;
}

export function getSeasonalCalendar(season: string) {
  return contentDatabase.content_calendar.weekly_schedule
    .filter((item) => item.season === season || item.theme.toLowerCase().includes(season))
    .slice(0, 4);
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
