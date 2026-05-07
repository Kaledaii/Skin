export type ContentArticle = {
  id: string;
  title_en: string;
  title_ne?: string;
  category: string;
  condition_ids: string[];
  tags: string[];
  summary_en: string;
  summary_ne?: string;
  reading_time_min: number;
  seasonal_relevance: string[];
  visual_hook: string;
  content_calendar_week: number;
  sections?: ContentSection[];
  takeaways?: string[];
  glossary_terms?: string[];
  nutrient_ids?: string[];
  related_condition_ids?: string[];
  source_notes?: string[];
  when_to_see_doctor?: string;
  display_trigger?: string;
  is_evergreen?: boolean;
};

export type ContentSection = {
  heading_en: string;
  heading_ne?: string;
  body_en: string;
  body_ne?: string;
  bullets?: string[];
};

export type GlossaryTerm = {
  id: string;
  term: string;
  meaning_en: string;
  meaning_ne: string;
  example_en: string;
};

export type NutrientGuide = {
  id: string;
  name: string;
  skin_benefit: string;
  meaning_ne: string;
  nepali_foods: string[];
};

export type LearnQA = {
  id: string;
  question_en: string;
  question_ne: string;
  answer_en: string;
  answer_ne: string;
  tags: string[];
};

export type DailyHabitTip = {
  id: string;
  title: string;
  why: string;
  how: string;
  tags: string[];
};

export type ContentBook = {
  id: string;
  title: string;
  author: string;
  relevance: string;
  topics: string[];
  app_blog_angle: string;
};

export type ContentCampaign = {
  name: string;
  timing: string;
  goal: string;
};

export type ContentCalendarItem = {
  week: number;
  month: string;
  season: string;
  theme: string;
  article_id: string | null;
  short_tip: string;
  campaign?: string;
};

export type ContentDatabase = {
  meta: {
    version: string;
    name: string;
    description: string;
    total_articles: number;
    total_books: number;
    total_visuals: number;
    total_campaigns: number;
    languages: string[];
    update_frequency: string;
  };
  articles: ContentArticle[];
  books: ContentBook[];
  visual_library: {
    glow_up_visuals: Array<{
      id: string;
      theme: string;
      description: string;
      usage: string[];
      search_keywords: string;
      mood: string;
    }>;
  };
  content_calendar: {
    weekly_schedule: ContentCalendarItem[];
    campaign_list: ContentCampaign[];
  };
};
