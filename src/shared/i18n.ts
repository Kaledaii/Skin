import { Language } from "./types";

export const copy = {
  en: {
    appName: "Skin Nepal",
    tagline: "Simple skincare for Nepal's weather, water, and real budgets.",
    start: "Start quiz",
    dashboard: "Today",
    progress: "Progress",
    products: "Products",
    tips: "Tips",
    community: "Q&A",
    settings: "Settings",
    morning: "Morning",
    evening: "Evening",
    premium: "Premium",
    free: "Free",
    upgrade: "Unlock premium",
    disclaimer: "Guidance only, not a medical diagnosis. For painful, bleeding, infected, or worsening skin concerns, consult a dermatologist.",
    sponsored: "Sponsored",
    verified: "Verified by experts",
    deleteData: "Delete my data",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark"
  },
  ne: {
    appName: "स्किन नेपाल",
    tagline: "नेपालको मौसम, पानी र बजेट अनुसार सजिलो स्किनकेयर।",
    start: "क्विज सुरु गर्नुहोस्",
    dashboard: "आज",
    progress: "प्रगति",
    products: "प्रोडक्ट",
    tips: "टिप्स",
    community: "प्रश्नोत्तर",
    settings: "सेटिङ",
    morning: "बिहान",
    evening: "बेलुका",
    premium: "प्रिमियम",
    free: "नि:शुल्क",
    upgrade: "प्रिमियम खोल्नुहोस्",
    disclaimer: "यो सुझाव मात्र हो, मेडिकल निदान होइन। दुख्ने, रगत आउने, संक्रमण वा बिग्रँदो समस्या भए dermatologist भेट्नुहोस्।",
    sponsored: "प्रायोजित",
    verified: "विशेषज्ञबाट प्रमाणित",
    deleteData: "मेरो डाटा मेटाउनुहोस्",
    language: "भाषा",
    theme: "थिम",
    light: "लाइट",
    dark: "डार्क"
  }
} satisfies Record<Language, Record<string, string>>;

export function t(language: Language, key: keyof typeof copy.en) {
  return copy[language][key] ?? copy.en[key];
}
