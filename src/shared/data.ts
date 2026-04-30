import { CommunityQuestion, Product, RoutineLog, RoutineStep, Tip } from "./types";

export const morningSteps: RoutineStep[] = [
  {
    id: "cleanser-am",
    title: { en: "Gentle cleanser", ne: "माइल्ड क्लेन्जर" },
    description: { en: "Wash away sweat and dust without scrubbing hard.", ne: "पसिना र धुलो हल्का रूपमा सफा गर्नुहोस्।" },
    reason: { en: "Clean skin helps sunscreen sit evenly.", ne: "सफा छालामा sunscreen राम्रोसँग बस्छ।" }
  },
  {
    id: "moisturizer-am",
    title: { en: "Light moisturizer", ne: "हल्का मोइस्चराइजर" },
    description: { en: "Use a pea-sized amount, more if your cheeks feel tight.", ne: "थोरै लगाउनुहोस्, गाला तन्किएजस्तो भए अलि बढी।" },
    reason: { en: "Hydrated skin repairs better through the day.", ne: "hydrated छाला दिनभरि राम्रो रहन्छ।" }
  },
  {
    id: "sunscreen-am",
    title: { en: "Sunscreen SPF 30+", ne: "SPF 30+ sunscreen" },
    description: { en: "Apply two finger lengths to face and neck.", ne: "अनुहार र घाँटीमा दुई औंला बराबर लगाउनुहोस्।" },
    reason: { en: "Kathmandu valley UV can still be harsh through clouds.", ne: "बादल हुँदा पनि UV कडा हुन सक्छ।" }
  }
];

export const eveningSteps: RoutineStep[] = [
  {
    id: "cleanser-pm",
    title: { en: "Cleanse dust and sunscreen", ne: "धुलो र sunscreen सफा" },
    description: { en: "If water feels harsh, finish with filtered water or micellar water.", ne: "पानी कडा लागे filtered water वा micellar water प्रयोग गर्नुहोस्।" },
    reason: { en: "Evening cleansing helps reduce clogged pores.", ne: "बेलुका सफा गर्दा pores बन्द हुने सम्भावना घट्छ।" }
  },
  {
    id: "acne-cream-pm",
    title: { en: "Acne-friendly cream", ne: "acne-friendly cream" },
    description: { en: "Use only on affected areas unless prescribed.", ne: "prescribed नभएसम्म समस्या भएको भागमा मात्र लगाउनुहोस्।" },
    reason: { en: "Targeted use reduces irritation.", ne: "लक्षित प्रयोगले irritation कम गर्छ।" }
  },
  {
    id: "hydrate-pm",
    title: { en: "Hydration check", ne: "hydration जाँच" },
    description: { en: "Drink water and apply moisturizer before sleep.", ne: "सुत्नुअघि पानी पिउनुहोस् र moisturizer लगाउनुहोस्।" },
    reason: { en: "Skin barrier recovery is strongest overnight.", ne: "छालाको barrier राति बढी recover हुन्छ।" }
  },
  {
    id: "weather-adapt",
    title: { en: "Weather-adaptive boost", ne: "मौसम अनुसार boost" },
    description: { en: "Dry air means heavier moisturizer; hot days mean more hydration.", ne: "सुख्खा मौसममा heavy moisturizer, गर्मीमा hydration बढाउनुहोस्।" },
    reason: { en: "Premium adapts routine to UV, humidity, and temperature.", ne: "Premium ले UV, humidity र temperature अनुसार routine बदल्छ।" },
    premiumOnly: true
  }
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Garnier Vitamin C Face Wash",
    category: "Face wash",
    price: "Rs. 190",
    budgetTier: "under200",
    fit: ["oily", "combination"],
    ingredientLabel: { en: "Good for oily skin", ne: "oily skin का लागि राम्रो" },
    trustScore: 78,
    sponsored: false,
    affiliateUrl: "https://www.daraz.com.np/"
  },
  {
    id: "p2",
    name: "Simple Hydrating Light Moisturizer",
    category: "Moisturizer",
    price: "Rs. 480",
    budgetTier: "200to500",
    fit: ["dry", "sensitive", "combination"],
    ingredientLabel: { en: "May suit sensitive skin", ne: "sensitive skin लाई मिल्न सक्छ" },
    trustScore: 86,
    sponsored: false,
    affiliateUrl: "https://www.daraz.com.np/"
  },
  {
    id: "p3",
    name: "Fixderma Shadow SPF 50 Gel",
    category: "Sunscreen",
    price: "Rs. 780",
    budgetTier: "500plus",
    fit: ["oily", "combination"],
    ingredientLabel: { en: "Lightweight sunscreen option", ne: "हल्का sunscreen option" },
    trustScore: 84,
    sponsored: true,
    affiliateUrl: "https://www.daraz.com.np/"
  }
];

export const tips: Tip[] = [
  {
    id: "t1",
    title: { en: "Dashain dust reset", ne: "दशैं धुलो reset" },
    body: { en: "Cleanse at night even if you are tired after travel.", ne: "यात्रा पछि थाक्नुभए पनि बेलुका cleanser प्रयोग गर्नुहोस्।" },
    season: "dashain",
    duration: "18s"
  },
  {
    id: "t2",
    title: { en: "Monsoon sweat care", ne: "मनसुन sweat care" },
    body: { en: "Keep skin folds dry and avoid sharing towels.", ne: "skin folds सुख्खा राख्नुहोस् र towel share नगर्नुहोस्।" },
    season: "monsoon",
    duration: "22s"
  },
  {
    id: "t3",
    title: { en: "Winter barrier save", ne: "जाडो barrier care" },
    body: { en: "Apply moisturizer while skin is still slightly damp.", ne: "छाला अलि भिजेको बेला moisturizer लगाउनुहोस्।" },
    season: "winter",
    duration: "16s"
  }
];

export const questions: CommunityQuestion[] = [
  {
    id: "q1",
    title: { en: "Can I skip sunscreen on cloudy days?", ne: "बादल लागेको दिन sunscreen छोड्न मिल्छ?" },
    answer: { en: "No. UV can pass through clouds, especially at altitude.", ne: "मिल्दैन। UV बादलबाट पनि आउन सक्छ, विशेषगरी altitude मा।" },
    verified: true
  },
  {
    id: "q2",
    title: { en: "Kathmandu water makes my skin tight. What helps?", ne: "काठमाडौंको पानीले छाला tight हुन्छ। के गर्ने?" },
    answer: { en: "Try filtered final rinse, gentle cleanser, and moisturizer immediately after washing.", ne: "filtered पानीले final rinse, mild cleanser र तुरुन्त moisturizer प्रयोग गर्नुहोस्।" },
    verified: true
  }
];

export const routineLogs: RoutineLog[] = [
  { date: "Mon", morning: true, evening: true, hydration: 7, sleep: 7 },
  { date: "Tue", morning: true, evening: false, hydration: 5, sleep: 6 },
  { date: "Wed", morning: true, evening: true, hydration: 8, sleep: 8 },
  { date: "Thu", morning: false, evening: true, hydration: 6, sleep: 5 },
  { date: "Fri", morning: true, evening: true, hydration: 9, sleep: 7 }
];
