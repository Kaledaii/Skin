import { ContentArticle, ContentSection, DailyHabitTip, GlossaryTerm, LearnQA, NutrientGuide } from "./contentTypes";

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "micellar-water",
    term: "Micellar water",
    meaning_en: "A gentle cleansing water that lifts sunscreen, light makeup, oil, and dust before your face wash.",
    meaning_ne: "cleanser aghi sunscreen, light makeup ra dhulo hatauna use garne gentle pani jasto cleanser.",
    example_en: "Useful when water feels harsh, after makeup, or after a dusty commute."
  },
  {
    id: "peptides",
    term: "Peptides",
    meaning_en: "Small protein pieces that signal skin to repair and support firmness over time.",
    meaning_ne: "skin lai repair garna signal dine sano protein pieces; firmness support garna help garcha.",
    example_en: "Best for dryness, fine lines, and barrier support; results are gradual."
  },
  {
    id: "exfoliation",
    term: "Exfoliation",
    meaning_en: "Removing dead skin cells from the surface so skin looks smoother and brighter.",
    meaning_ne: "mathi ko dead skin cells hataune process, jasle skin smooth ra bright dekhincha.",
    example_en: "Do it gently, usually weekly; overdoing it can cause redness, acne, or dark marks."
  },
  {
    id: "collagen",
    term: "Collagen",
    meaning_en: "A support protein that keeps skin firm, bouncy, and less saggy.",
    meaning_ne: "skin lai tight, bouncy ra firm rakhne support protein.",
    example_en: "Protein foods plus vitamin C help your body make collagen."
  },
  {
    id: "ceramides",
    term: "Ceramides",
    meaning_en: "Natural skin fats that seal the barrier and reduce dryness, stinging, and flaking.",
    meaning_ne: "skin barrier seal garne natural fats; dryness ra sting kam garna help garcha.",
    example_en: "Very useful in winter, mountains, retinol dryness, or over-cleansed skin."
  },
  {
    id: "niacinamide",
    term: "Niacinamide",
    meaning_en: "Vitamin B3 used in skincare to support barrier, oil control, redness, and dark marks.",
    meaning_ne: "Vitamin B3; oil control, barrier support ra pimple pachi ko daag ma help garna sakcha.",
    example_en: "Good beginner ingredient for oily, dull, or uneven skin."
  },
  {
    id: "retinol",
    term: "Retinol",
    meaning_en: "A vitamin A ingredient that helps acne, texture, fine lines, and cell turnover, but can irritate if started fast.",
    meaning_ne: "Vitamin A ingredient; acne, texture ra fine lines ma help, tara slowly start garnu parcha.",
    example_en: "Use at night, start 1-2 times weekly, and never skip sunscreen."
  },
  {
    id: "spf",
    term: "SPF",
    meaning_en: "The sunscreen number that mainly tells you UVB burn protection.",
    meaning_ne: "sunscreen ko number; mainly sunburn garne UVB protection ko idea dincha.",
    example_en: "For Nepal, SPF 30+ daily is the minimum; SPF 50 is better for strong sun."
  },
  {
    id: "pa",
    term: "PA++++",
    meaning_en: "A UVA protection rating. UVA worsens tanning, melasma, dark spots, and early aging.",
    meaning_ne: "UVA protection rating; tanning, melasma, dark spots ra aging badhaune rays bata protect garcha.",
    example_en: "For melasma or pigmentation, PA+++ or PA++++ matters a lot."
  },
  {
    id: "melasma",
    term: "Melasma",
    meaning_en: "Brown or grey-brown patches, often on cheeks, forehead, or upper lip, triggered by sun, hormones, heat, and stress.",
    meaning_ne: "gaala, nidhar wa upper lip tira aaune brown patch problem; sun, heat, hormones le badhauna sakcha.",
    example_en: "Daily tinted sunscreen and heat control matter more than quick bleaching."
  },
  {
    id: "pih",
    term: "PIH",
    meaning_en: "Post-inflammatory hyperpigmentation: dark marks left after pimples, cuts, burns, or irritation.",
    meaning_ne: "pimple pachi basne daag; irritation, burn, cut pachi pani aauna sakcha.",
    example_en: "Picking pimples and skipping sunscreen make PIH last longer."
  },
  {
    id: "comedogenic",
    term: "Comedogenic",
    meaning_en: "Likely to clog pores and create blackheads, whiteheads, or makeup-related bumps.",
    meaning_ne: "pores clog garna sakne; blackhead, whitehead wa makeup bumps badhauna sakne.",
    example_en: "Look for non-comedogenic makeup/sunscreen if acne-prone."
  },
  {
    id: "antioxidant",
    term: "Antioxidant",
    meaning_en: "A protector that helps defend skin from UV, pollution, smoke, and stress damage.",
    meaning_ne: "UV, pollution, smoke ra stress bata skin damage kam garna help garne protector.",
    example_en: "Vitamin C, vitamin E, green tea, amla, and colorful fruits are antioxidant sources."
  },
  {
    id: "barrier",
    term: "Skin barrier",
    meaning_en: "The outer shield of your skin that keeps water in and irritants out.",
    meaning_ne: "skin ko outer shield; pani vitra rakhcha ra irritants bahira rakhcha.",
    example_en: "If skin burns with every product, the barrier may be weak."
  }
];

export const nutrientGuides: NutrientGuide[] = [
  { id: "protein", name: "Protein", skin_benefit: "Repairs skin and supports collagen for firmness.", meaning_ne: "skin repair ra firmness ko building block.", nepali_foods: ["dal", "eggs", "chicken", "paneer", "soybean", "masu ko jhol"] },
  { id: "vitamin-c", name: "Vitamin C", skin_benefit: "Supports collagen and helps brighten dull-looking skin.", meaning_ne: "collagen banauna ra glow support garna help.", nepali_foods: ["amla", "lemon", "orange", "guava", "tomato", "saag with lemon"] },
  { id: "vitamin-e", name: "Vitamin E", skin_benefit: "Supports barrier comfort and antioxidant protection.", meaning_ne: "barrier comfort ra antioxidant support.", nepali_foods: ["nuts", "sunflower seeds", "mustard oil", "avocado when available"] },
  { id: "vitamin-a", name: "Vitamin A", skin_benefit: "Helps cell turnover, texture, and acne-prone skin balance.", meaning_ne: "cell turnover, texture ra acne balance ma help.", nepali_foods: ["carrot", "pumpkin", "saag", "sweet potato", "eggs"] },
  { id: "zinc", name: "Zinc", skin_benefit: "Helps healing, oil balance, and acne recovery.", meaning_ne: "pimple heal, oil balance ra recovery support.", nepali_foods: ["chana", "beans", "pumpkin seeds", "eggs", "meat"] },
  { id: "iron", name: "Iron", skin_benefit: "Supports fresh color and helps dullness linked with low iron.", meaning_ne: "fresh look ra dullness kam garna support.", nepali_foods: ["saag", "masoor dal", "rajma", "meat", "liver"] },
  { id: "folate", name: "Folate", skin_benefit: "Supports cell renewal and is important for pigmentation-prone skin health.", meaning_ne: "cell renewal support; pigmentation prone skin ko lagi important.", nepali_foods: ["saag", "lentils", "beans", "citrus", "broccoli"] },
  { id: "omega-3", name: "Omega-3", skin_benefit: "Supports calmer skin, less dryness, and a healthier barrier.", meaning_ne: "calmer skin, less dryness ra barrier support.", nepali_foods: ["machha", "walnuts", "flaxseed", "chia"] },
  { id: "water", name: "Water", skin_benefit: "Helps skin feel plump and supports normal body repair.", meaning_ne: "skin plump feel ra body repair support.", nepali_foods: ["plain water", "lemon water", "soups", "water-rich fruits"] },
  { id: "probiotics", name: "Probiotics", skin_benefit: "Supports gut-skin balance and may help calmer skin.", meaning_ne: "gut-skin balance support; skin calm rakhna help.", nepali_foods: ["dahi", "mohi", "kinema", "gundruk", "fermented achar"] }
];

export const dailyHabitTips: DailyHabitTip[] = [
  { id: "haldi-doodh", title: "Haldi doodh at night", why: "Turmeric has antioxidant support and warm milk can fit a calming night routine.", how: "Use a pinch of haldi, not a huge spoon. If dairy triggers acne for you, skip or use warm water.", tags: ["glow", "night"] },
  { id: "dahi", title: "Dahi or mohi with lunch", why: "Probiotics support gut-skin balance and are easy in Nepali meals.", how: "Keep it plain. Too much sugar in sweet lassi can work against acne-prone skin.", tags: ["gut", "diet"] },
  { id: "saag-lemon", title: "Saag + lemon trick", why: "Vitamin C helps your body absorb iron from greens, which can help dullness linked with low iron.", how: "Squeeze lemon on saag or dal. Chiya right after meals can reduce iron absorption, so wait a bit.", tags: ["dullness", "iron"] },
  { id: "spf", title: "SPF before leaving home", why: "Nepal's UV can worsen tanning, melasma, PIH, and early aging even on cloudy days.", how: "Apply on face, neck, and ears. Reapply if sweating or outdoors long.", tags: ["uv", "pigmentation"] },
  { id: "makeup-off", title: "Remove makeup before sleep", why: "Sleeping in makeup traps oil, sweat, sunscreen, and dust in pores.", how: "Micellar water or oil cleanse first, then gentle face wash.", tags: ["makeup", "acne"] },
  { id: "brush-cleaning", title: "Clean makeup brushes weekly", why: "Brushes collect oil, dead skin, and bacteria-like buildup that can trigger bumps.", how: "Wash with gentle soap, dry fully, and do not share eye/lip products.", tags: ["makeup", "hygiene"] },
  { id: "pillowcase", title: "Change pillowcase twice a week", why: "Oil, hair products, and dust transfer to cheeks and jawline.", how: "Flip on day 2, wash every 3-4 days if acne-prone.", tags: ["acne", "habit"] },
  { id: "sleep", title: "Sleep before midnight when possible", why: "Low sleep increases stress hormones and makes skin recovery slower.", how: "Even 30 minutes earlier is progress. Keep phone away for the first 20 minutes in bed.", tags: ["sleep", "repair"] }
];

export const learnQAs: LearnQA[] = [
  {
    id: "makeup-acne",
    question_en: "Can I wear makeup if I have pimples?",
    question_ne: "Pimple chha bhane makeup lagauna milcha?",
    answer_en: "Yes, but choose non-comedogenic products and remove everything before sleep. If tiny bumps started after a new foundation, pause it for 2 weeks and clean brushes.",
    answer_ne: "Milcha, tara non-comedogenic product choose garnu. Sutnu aghi sabai makeup hataunu. Naya foundation pachi sano bumps aayo bhane 2 weeks pause garera brush clean garnu.",
    tags: ["makeup", "acne"]
  },
  {
    id: "smoking-skin",
    question_en: "Does smoking really affect skin?",
    question_ne: "Smoking le skin ma effect parcha ra?",
    answer_en: "Yes. It reduces oxygen flow, breaks collagen faster, slows pimple healing, and can make lips/under-eyes look darker. No shame, just reduce step by step.",
    answer_ne: "Parcha. Oxygen flow kam, collagen chhito break, pimple healing slow, lips/under-eye dark dekhina sakcha. Shame haina, bistarai reduce garnu.",
    tags: ["smoking", "aging"]
  },
  {
    id: "alcohol-puffy",
    question_en: "Why do I look puffy after alcohol?",
    question_ne: "Alcohol pachi face puffy kina huncha?",
    answer_en: "Alcohol dehydrates the body, affects sleep, and can shift fluid around the face. Next day: water, light food, gentle cleanse, moisturizer, SPF.",
    answer_ne: "Alcohol le dehydration, sleep disturb ra face ma fluid shift garna sakcha. Next day pani, halka khana, gentle cleanse, moisturizer, SPF.",
    tags: ["alcohol", "puffiness"]
  },
  {
    id: "terai-sweat",
    question_en: "In Terai heat, should I skip moisturizer?",
    question_ne: "Terai ko garmi ma moisturizer skip garne?",
    answer_en: "No. Use a light gel or lotion. Sweat and heat can irritate skin, but skipping moisturizer can still weaken the barrier.",
    answer_ne: "Skip nagarnu. Light gel/lotion use garnu. Sweat ra heat le irritate garna sakcha, tara moisturizer skip garda barrier weak huncha.",
    tags: ["terai", "barrier"]
  },
  {
    id: "mountain-dry",
    question_en: "Why does mountain air make my face tight?",
    question_ne: "Mountain ma face tight kina huncha?",
    answer_en: "Cold, wind, and dry air pull water from skin faster. Use lukewarm water and moisturize while skin is still damp.",
    answer_ne: "Cold, wind ra dry air le skin bata pani chhito nikalcha. Lukewarm water use garera skin damp huda moisturizer lagaunu.",
    tags: ["mountain", "dryness"]
  },
  {
    id: "melasma-home",
    question_en: "Can lemon remove melasma?",
    question_ne: "Lemon le melasma hataucha?",
    answer_en: "Avoid lemon on melasma. It can irritate and make patches darker in sun. Daily sunscreen and gentle pigment-safe care work better.",
    answer_ne: "Melasma ma lemon avoid garnu. Irritation bhayera sun ma patch ajhai dark huna sakcha. Daily sunscreen better.",
    tags: ["melasma", "pigmentation"]
  }
];

const articleDetails: Record<string, Partial<ContentArticle>> = {
  ART001: {
    glossary_terms: ["antioxidant", "barrier", "micellar-water"],
    nutrient_ids: ["vitamin-c", "vitamin-e", "water"],
    takeaways: [
      "Pollution guidance should match your selected location, not always Kathmandu.",
      "Evening cleansing matters after dust, sunscreen, makeup, or heavy sweat.",
      "Antioxidant foods and sunscreen are the low-budget protection layer."
    ],
    sections: [
      section("What this means for Nepal", "Dust, smoke, UV, hard water, and heat can all make skin look dull or irritated. Kathmandu users may need more pollution cleansing; Terai users need sweat and humidity control; mountain users need barrier repair."),
      section("Simple routine", "Morning: gentle cleanser, moisturizer, SPF. Evening: remove sunscreen/makeup/dust first, then gentle cleanser and moisturizer."),
      section("Budget fix", "Filtered final rinse, dahi/saag/amla in diet, and consistent SPF usually help more than buying many random serums.")
    ]
  },
  ART002: {
    glossary_terms: ["pih", "barrier"],
    nutrient_ids: ["water", "probiotics", "zinc"],
    takeaways: ["Festival food is okay; balance is the goal.", "Late nights plus fried snacks can trigger pimples.", "Hydration and sleep recovery matter after events."],
    sections: [
      section("Dashain/Tihar skin reality", "Sel roti, mithai, fried snacks, alcohol, travel, and late nights can combine into breakouts. The fix is not fear; it is a recovery plan."),
      section("Two-day reset", "Drink water, use gentle cleanser, avoid picking pimples, eat dahi or dal, and sleep earlier for two nights."),
      section("Makeup note", "If you wear makeup for tika/photos, remove it fully before bed and wash brushes after heavy use.")
    ]
  },
  ART003: {
    glossary_terms: ["non-comedogenic", "spf", "niacinamide"],
    nutrient_ids: ["protein", "vitamin-c", "probiotics"],
    takeaways: ["A cheap consistent routine beats an expensive random routine.", "Cleanser, moisturizer, and SPF are the base.", "Add only one active at a time."],
    sections: [
      section("The base routine", "Cleanser, moisturizer, and sunscreen are enough to start. Use them for 2 weeks before adding serums."),
      section("When to add actives", "For oil/pores try niacinamide. For acne try salicylic acid or benzoyl peroxide carefully. For marks, sunscreen comes first."),
      section("Nepali budget tip", "Spend first on sunscreen you will actually use. A perfect serum cannot fix daily UV damage.")
    ]
  },
  ART004: {
    glossary_terms: ["comedogenic", "barrier", "exfoliation"],
    nutrient_ids: ["water", "zinc", "probiotics"],
    takeaways: ["Humidity does not mean skin has enough water.", "Sweat should be rinsed gently, not scrubbed.", "Use light layers in monsoon."],
    sections: [
      section("Monsoon skin pattern", "High humidity, sweat, and dust can clog pores and cause itchy bumps. Keep routine light and clean."),
      section("What to do", "Use a gentle cleanser after heavy sweat, light moisturizer, non-comedogenic SPF, and dry towels/pillowcases."),
      section("Avoid", "Avoid heavy oils on acne-prone areas and avoid daily harsh scrubs.")
    ]
  },
  ART005: {
    glossary_terms: ["barrier", "pih", "exfoliation"],
    nutrient_ids: ["vitamin-c", "vitamin-e"],
    takeaways: ["Natural does not always mean safe.", "Patch test DIY remedies.", "Avoid lemon on dark spots/melasma."],
    sections: [
      section("Kitchen remedies: useful but careful", "Haldi, honey, aloe, and dahi can be gentle for some people, but strong lemon, toothpaste, and harsh scrubs can burn skin."),
      section("Patch test rule", "Try behind ear or jaw for 24 hours before full face. Stop if burning, itching, or redness happens."),
      section("Best safe direction", "Use DIY as support, not replacement for SPF, cleanser, moisturizer, and dermatologist care when needed.")
    ]
  },
  ART006: {
    glossary_terms: ["spf", "pa", "melasma", "pih"],
    nutrient_ids: ["vitamin-c", "vitamin-e"],
    takeaways: ["SPF protects against burns and dark marks.", "PA rating matters for pigmentation.", "Melasma needs daily sun and heat control."],
    sections: [
      section("Why Nepal sun is serious", "UV is strong in hills and mountains, and even short daily exposure can darken PIH and melasma."),
      section("What to buy", "Choose broad-spectrum SPF 30+ minimum; SPF 50 PA+++ or PA++++ is better for pigmentation."),
      section("How to use", "Apply enough on face, neck, ears, and reapply if sweating, outdoors long, or after washing.")
    ]
  },
  ART007: {
    glossary_terms: ["barrier", "comedogenic"],
    nutrient_ids: ["water", "protein", "zinc"],
    takeaways: ["Stress can worsen oil and picking.", "A 3-minute routine is better than no routine.", "Sleep recovery helps skin healing."],
    sections: [
      section("Exam skin pattern", "Stress, chips, less water, and late nights can trigger breakouts around forehead, cheeks, or jaw."),
      section("Minimum routine", "Morning SPF. Night cleanser and moisturizer. Keep pimple patches or spot care for active pimples."),
      section("Tiny habits", "Water before tea, pillowcase change, phone screen wipe, and no picking during study breaks.")
    ]
  },
  ART008: {
    glossary_terms: ["barrier", "ceramides"],
    nutrient_ids: ["omega-3", "vitamin-e", "water"],
    takeaways: ["Mountain and winter skin needs barrier repair.", "Hot water worsens dryness.", "Moisturize on damp skin."],
    sections: [
      section("Why it feels tight", "Cold air, wind, and low humidity pull water from skin faster. The barrier gets weak and flaky."),
      section("Routine shift", "Use lukewarm water, cream moisturizer, lip balm, and a thin protective layer on flaky areas at night."),
      section("Local support", "Soups, water, nuts/seeds, and omega-3 foods support dryness from inside too.")
    ]
  },
  ART010: {
    glossary_terms: ["retinol", "pih", "barrier", "spf"],
    nutrient_ids: ["protein", "vitamin-c"],
    takeaways: ["Start retinol slowly.", "Irritation can worsen dark marks.", "SPF is mandatory with retinol."],
    sections: [
      section("Retinol beginner rule", "Start once or twice weekly at night. Use moisturizer before and after if sensitive."),
      section("Who should pause", "Do not start if skin is burning, peeling, or barrier is weak. Avoid during pregnancy unless doctor says otherwise."),
      section("South Asian skin note", "Irritation can leave dark marks, so slow progress is safer than aggressive use.")
    ]
  }
};

function section(heading_en: string, body_en: string, bullets?: string[]): ContentSection {
  return { heading_en, body_en, bullets };
}

export function enrichArticle(article: ContentArticle): ContentArticle {
  const fallback = buildFallbackArticle(article);
  const detail = articleDetails[article.id] ?? {};
  return {
    ...article,
    ...fallback,
    ...detail,
    sections: detail.sections ?? fallback.sections,
    takeaways: detail.takeaways ?? fallback.takeaways,
    glossary_terms: detail.glossary_terms ?? fallback.glossary_terms,
    nutrient_ids: detail.nutrient_ids ?? fallback.nutrient_ids,
    related_condition_ids: detail.related_condition_ids ?? article.condition_ids,
    source_notes: detail.source_notes ?? fallback.source_notes,
    when_to_see_doctor: detail.when_to_see_doctor ?? fallback.when_to_see_doctor
  };
}

function buildFallbackArticle(article: ContentArticle): Partial<ContentArticle> {
  return {
    sections: [
      section("What it means", article.summary_en),
      section("Nepal-context plan", "Keep the routine simple: gentle cleanse, moisturizer, SPF in the morning, and proper evening cleansing after dust, sweat, sunscreen, or makeup."),
      section("Food and habit support", "Add dal, saag, dahi, amla or lemon, enough water, and better sleep where possible. Small daily habits beat extreme routines.")
    ],
    takeaways: ["Keep care gentle and consistent.", "Match advice to your location, season, and lifestyle.", "See a dermatologist if symptoms are painful, spreading, scarring, or not improving."],
    glossary_terms: ["barrier", "spf", "antioxidant"],
    nutrient_ids: ["protein", "vitamin-c", "water"],
    related_condition_ids: article.condition_ids,
    source_notes: ["AAD skin-care and sunscreen patient education", "WHO healthy diet principles"],
    when_to_see_doctor: "See a dermatologist if the concern is painful, rapidly worsening, leaving scars, or not improving after 8-12 weeks of consistent gentle care."
  };
}
