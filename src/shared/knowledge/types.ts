import { Language } from "../types";

export type KnowledgeRoutineStep = {
  step: number;
  action: string;
  instruction_en: string;
  instruction_ne?: string;
  duration_seconds?: number;
};

export type KnowledgeWeeklyStep = {
  frequency: string;
  action: string;
  instruction_en: string;
  instruction_ne?: string;
};

export type KnowledgeFood = {
  food_en: string;
  food_ne?: string;
  reason_en?: string;
  reason_ne?: string;
};

export type HomeRemedy = {
  remedy: string;
  verdict: "safe_effective" | "safe_mild" | "harmful" | string;
  note?: string;
  reason?: string;
  nepali?: string;
  ingredients?: string;
  method?: string;
  frequency?: string;
  why_it_works?: string;
  caution?: string;
};

export type KnowledgeCondition = {
  id: string;
  name_en: string;
  name_ne: string;
  severity: string;
  prevalence_nepal?: string;
  description_en: string;
  description_ne?: string;
  trigger_symptoms: {
    primary: string[];
    secondary: string[];
  };
  trigger_lifestyle?: {
    high_impact?: string[];
    moderate_impact?: string[];
  };
  trigger_environment?: string[];
  trigger_age?: string[];
  routine: {
    morning?: KnowledgeRoutineStep[];
    evening?: KnowledgeRoutineStep[];
    weekly?: KnowledgeWeeklyStep[];
  };
  diet_recommendations?: {
    eat_more?: KnowledgeFood[];
    avoid?: KnowledgeFood[];
  };
  nepal_context_tips?: Array<{
    category: string;
    tip_en: string;
    tip_ne?: string;
  }>;
  home_remedies_verdict?: {
    effective?: HomeRemedy[];
    avoid?: HomeRemedy[];
  };
  when_to_see_doctor?: string;
};

export type KnowledgeBase = {
  meta: {
    version: string;
    description: string;
    total_conditions: number;
    regions_covered: string[];
    languages: Language[];
    expanded_context_version?: string;
    expanded_context_name?: string;
    new_features?: string[];
  };
  quiz_fields: {
    skin_type: string[];
    primary_concerns: string[];
    symptoms: string[];
    lifestyle: Record<string, string[]>;
    environment: Record<string, string[]>;
    age_group: string[];
    gender: string[];
    current_routine: Record<string, string[]>;
  };
  conditions: KnowledgeCondition[];
  adaptive_layer: {
    weather_rules: Array<Record<string, unknown>>;
    seasonal_rules: Array<Record<string, unknown>>;
    lifestyle_alerts: Array<Record<string, unknown>>;
    nepal_special_events: Array<Record<string, unknown>>;
  };
  smart_filtering_rules?: Record<string, unknown>;
  skincare_glossary?: {
    description: string;
    terms: Array<Record<string, unknown>>;
  };
  nutrients_for_skin?: Record<string, unknown>;
  medical_terms_explained?: Record<string, unknown>;
  expanded_qna_nepali?: Record<string, unknown>;
  smoking_alcohol_makeup_warnings?: Record<string, unknown>;
  location_specific_causes?: Record<string, unknown>;
};

export type QuizProfile = {
  primaryConcerns: string[];
  symptoms: string[];
  ageGroup: string;
  lifestyle: Record<string, string>;
  environment: Record<string, string>;
  currentRoutine: Record<string, string>;
};

export type ConditionMatch = {
  condition: KnowledgeCondition;
  score: number;
  reasons: string[];
};

export type GeneratedStep = {
  id: string;
  action: string;
  instruction: Record<Language, string>;
  durationSeconds?: number;
  frequency?: string;
};

export type WaterQualityTip = {
  id: string;
  title: Record<Language, string>;
  tips: Record<Language, string[]>;
};

export type DailyMicroTip = {
  id: string;
  text: Record<Language, string>;
  tag: string;
};

export type GeneratedRoutineResult = {
  matches: ConditionMatch[];
  morning: GeneratedStep[];
  evening: GeneratedStep[];
  weekly: GeneratedStep[];
  dietEatMore: KnowledgeFood[];
  dietAvoid: KnowledgeFood[];
  contextTips: Array<{ category: string; text: Record<Language, string> }>;
  waterTip: WaterQualityTip;
  dailyMicroTips: DailyMicroTip[];
};
