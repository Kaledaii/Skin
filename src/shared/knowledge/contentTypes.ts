export type ContentArticle = {
  id: string;
  title_en: string;
  title_ne?: string;
  category: string;
  condition_ids: string[];
  tags: string[];
  summary_en: string;
  reading_time_min: number;
  seasonal_relevance: string[];
  visual_hook: string;
  content_calendar_week: number;
  display_trigger?: string;
  is_evergreen?: boolean;
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

export type RoadmapFeature = {
  id: string;
  name: string;
  description: string;
  user_benefit: string;
  visual_component: string | null;
  data_source: string | null;
  status: "planned" | "in_progress" | "launched" | "backlog";
  priority: "high" | "medium" | "low";
  category: string;
  estimated_impact: {
    retention: string;
    acquisition: string;
    trust: string;
  };
};

export type FeaturesDatabase = {
  meta: {
    version: string;
    name: string;
    description: string;
    total_features: number;
    status_options: string[];
    priority_options: string[];
    categories: string[];
  };
  features: RoadmapFeature[];
};
