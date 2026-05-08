import { ContentArticle, ContentSection, DailyHabitTip, GlossaryTerm, LearnQA, NutrientGuide } from "./contentTypes";
import rawKnowledgeBase from "./skin_knowledge_base.json";

const expandedKnowledge = rawKnowledgeBase as {
  skincare_glossary?: { terms?: Array<{ term?: string; simple_nepali?: string; when_use?: string; nepali_alternatives?: string }> };
  nutrients_for_skin?: Record<string, unknown>;
  expanded_qna_nepali?: Record<string, unknown>;
};

const fallbackGlossaryTerms: GlossaryTerm[] = [
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
  },
  {
    id: "cleanser",
    term: "Cleanser",
    meaning_en: "A face wash that removes sweat, sunscreen, oil, and dust more gently than body soap.",
    meaning_ne: "mukha dhune product; body soap bhanda gentle, sunscreen/oil/dhulo hatauna baneko.",
    example_en: "Use morning and evening. Avoid harsh bath soap on the face."
  },
  {
    id: "toner",
    term: "Toner",
    meaning_en: "A watery step after cleansing that can calm skin, balance feel, and prep for serum.",
    meaning_ne: "cleanser pachi lagाउने pani jasto step; gulab jal jasto gentle option pani huna sakcha.",
    example_en: "Use after cleanser and before serum. Rose water can be a simple local option."
  },
  {
    id: "serum",
    term: "Serum",
    meaning_en: "A concentrated treatment step for a specific goal like marks, oil, acne, or hydration.",
    meaning_ne: "specific problem ko lagi strong treatment step; vitamin C, niacinamide jasto.",
    example_en: "Use only one new serum at a time so irritation is easier to track."
  },
  {
    id: "hyaluronic-acid",
    term: "Hyaluronic acid",
    meaning_en: "A humectant that pulls water into skin so it feels plumper and less tight.",
    meaning_ne: "pani tanne sponge jasto ingredient; skin hydrated feel garauna help.",
    example_en: "Apply on damp skin, then seal with moisturizer."
  },
  {
    id: "aha",
    term: "AHA",
    meaning_en: "A water-soluble exfoliating acid that helps dullness, roughness, and surface texture.",
    meaning_ne: "dead skin hataune acid; glow ra texture ma help, tara overuse garda irritation.",
    example_en: "Use at night only, usually weekly at first, and wear sunscreen."
  },
  {
    id: "bha",
    term: "BHA",
    meaning_en: "An oil-soluble exfoliating acid, usually salicylic acid, that can clean inside oily pores.",
    meaning_ne: "oil bhitra ghulne acid; oily skin, blackhead, whitehead ma useful.",
    example_en: "Good for blackheads, but start slowly to avoid dryness."
  },
  {
    id: "double-cleansing",
    term: "Double cleansing",
    meaning_en: "Two-step evening cleansing: first remove sunscreen/makeup/oil, then wash the skin.",
    meaning_ne: "beluka dui step cleanse: pahile sunscreen/makeup/oil hataune, ani face wash.",
    example_en: "Most useful after makeup, SPF, heavy sweat, dust, or pollution."
  },
  {
    id: "ph-balance",
    term: "pH balance",
    meaning_en: "Skin naturally prefers a slightly acidic surface; harsh soap and hard water can disturb it.",
    meaning_ne: "skin halka acidic huna ramro; kado soap ra hard water le disturb garna sakcha.",
    example_en: "Gentle cleanser, toner, and avoiding bath soap can help."
  }
];

const fallbackNutrientGuides: NutrientGuide[] = [
  { id: "protein", name: "Protein", skin_benefit: "Repairs skin and supports collagen for firmness.", meaning_ne: "skin repair ra firmness ko building block.", nepali_foods: ["dal", "eggs", "chicken", "paneer", "soybean", "masu ko jhol"] },
  { id: "vitamin-c", name: "Vitamin C", skin_benefit: "Supports collagen and helps brighten dull-looking skin.", meaning_ne: "collagen banauna ra glow support garna help.", nepali_foods: ["amla", "lemon", "orange", "guava", "tomato", "saag with lemon"] },
  { id: "vitamin-e", name: "Vitamin E", skin_benefit: "Supports barrier comfort and antioxidant protection.", meaning_ne: "barrier comfort ra antioxidant support.", nepali_foods: ["nuts", "sunflower seeds", "mustard oil", "avocado when available"] },
  { id: "vitamin-a", name: "Vitamin A", skin_benefit: "Helps cell turnover, texture, and acne-prone skin balance.", meaning_ne: "cell turnover, texture ra acne balance ma help.", nepali_foods: ["carrot", "pumpkin", "saag", "sweet potato", "eggs"] },
  { id: "zinc", name: "Zinc", skin_benefit: "Helps healing, oil balance, and acne recovery.", meaning_ne: "pimple heal, oil balance ra recovery support.", nepali_foods: ["chana", "beans", "pumpkin seeds", "eggs", "meat"] },
  { id: "iron", name: "Iron", skin_benefit: "Supports fresh color and helps dullness linked with low iron.", meaning_ne: "fresh look ra dullness kam garna support.", nepali_foods: ["saag", "masoor dal", "rajma", "meat", "liver"] },
  { id: "folate", name: "Folate", skin_benefit: "Supports cell renewal and is important for pigmentation-prone skin health.", meaning_ne: "cell renewal support; pigmentation prone skin ko lagi important.", nepali_foods: ["saag", "lentils", "beans", "citrus", "broccoli"] },
  { id: "omega-3", name: "Omega-3", skin_benefit: "Supports calmer skin, less dryness, and a healthier barrier.", meaning_ne: "calmer skin, less dryness ra barrier support.", nepali_foods: ["machha", "walnuts", "flaxseed", "chia"] },
  { id: "water", name: "Water", skin_benefit: "Helps skin feel plump and supports normal body repair.", meaning_ne: "skin plump feel ra body repair support.", nepali_foods: ["plain water", "lemon water", "soups", "water-rich fruits"] },
  { id: "probiotics", name: "Probiotics", skin_benefit: "Supports gut-skin balance and may help calmer skin.", meaning_ne: "gut-skin balance support; skin calm rakhna help.", nepali_foods: ["dahi", "mohi", "kinema", "gundruk", "fermented achar"] },
  { id: "biotin", name: "Biotin", skin_benefit: "Supports healthy hair, nails, and normal skin repair.", meaning_ne: "kपाल, nang ra normal skin health support.", nepali_foods: ["eggs", "nuts", "mushroom", "cauliflower", "beans"] },
  { id: "selenium", name: "Selenium", skin_benefit: "Antioxidant mineral that supports elasticity and UV-stress defense.", meaning_ne: "antioxidant mineral; sun stress ra elasticity support.", nepali_foods: ["eggs", "fish", "garlic", "nuts when available"] },
  { id: "beta-carotene", name: "Beta-carotene", skin_benefit: "Converts to vitamin A and supports glow, repair, and sun-stress resilience.", meaning_ne: "body ma vitamin A banna sakcha; glow ra repair support.", nepali_foods: ["carrot", "pumpkin", "papaya", "sweet potato", "saag"] },
  { id: "lycopene", name: "Lycopene", skin_benefit: "Antioxidant that supports sun-stress protection and even-looking skin.", meaning_ne: "sun stress bata support garne antioxidant.", nepali_foods: ["tomato", "watermelon", "guava", "pink grapefruit"] },
  { id: "polyphenols", name: "Polyphenols", skin_benefit: "Plant antioxidants that help defend against pollution, smoke, UV, and inflammation.", meaning_ne: "plant antioxidant; pollution, smoke, UV ra inflammation support.", nepali_foods: ["green tea", "black tea", "amla", "berries", "cocoa"] }
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

const fallbackLearnQAs: LearnQA[] = [
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
  },
  {
    id: "pimple-popping",
    question_en: "Why should I not pop pimples?",
    question_ne: "मुहासो फुटाउँदा किन हुँदैन? सबैले फुटाएको देख्छु त?",
    answer_en: "Popping can push bacteria deeper, spread inflammation to nearby skin, and leave dark pits or marks. Let it heal, ice gently, or use spot care.",
    answer_ne: "फुटाउँदा ब्याक्टेरिया गहिरो धकेलिन्छ, छेउछाउमा संक्रमण फैलिन्छ, र गाढा दाग/खाल्डो रहन सक्छ। आफैँ निको हुन दिनुस् वा spot care प्रयोग गर्नुस्।",
    tags: ["acne", "safety"]
  },
  {
    id: "bath-soap-face",
    question_en: "Can I wash my face with bath soap?",
    question_ne: "नुहाउने साबुनले मुहा धुन हुन्छ?",
    answer_en: "Better not. Bath soap is usually too alkaline for facial skin, can weaken the barrier, and may trigger more oil or irritation. Use a gentle face wash.",
    answer_ne: "हुँदैन भन्नु राम्रो। साबुन धेरै कडा/pH high हुन सक्छ, barrier बिगार्छ, अनि सुख्खा/जलन वा बढी तेल आउन सक्छ। Gentle face wash राम्रो।",
    tags: ["cleanser", "barrier"]
  },
  {
    id: "lemon-on-face",
    question_en: "Does lemon juice fix acne marks?",
    question_ne: "कागतीको रस मुहामा लगाउँदा ठीक हुन्छ भनेको - काम गर्छ?",
    answer_en: "Avoid lemon on the face. It is very acidic, can burn skin, and can make dark marks worse in sunlight. Use sunscreen and safer pigment care instead.",
    answer_ne: "नगर्नुस्। कागती धेरै acidic हुन्छ, छाला जलाउन सक्छ, र घाममा गएपछि दाग झन् गाढा हुन सक्छ। Sunscreen र safe pigment care राम्रो।",
    tags: ["myth", "pigmentation"]
  },
  {
    id: "toothpaste-pimple",
    question_en: "Can toothpaste dry a pimple overnight?",
    question_ne: "दाँतमाझ्ने मञ्जन मुहासोमा लगाएर सुत्दा काम गर्छ?",
    answer_en: "Do not use toothpaste on pimples. Fluoride, SLS, and fragrance can irritate and leave marks. Use benzoyl peroxide, salicylic acid, pimple patch, or neem carefully.",
    answer_ne: "नगर्नुस्। Toothpaste मा fluoride/SLS/fragrance हुन सक्छ, छाला जलाएर दाग छोड्न सक्छ। Benzoyl peroxide, salicylic acid, pimple patch वा neem सावधानीसाथ राम्रो।",
    tags: ["myth", "acne"]
  },
  {
    id: "cheap-facewash",
    question_en: "Do I need expensive products?",
    question_ne: "महँगो प्रोडक्ट चाहिन्छ? Rs. 200 को face wash काम गर्दैन?",
    answer_en: "Not always. A simple low-cost cleanser can work if it suits your skin and you use it consistently. Ingredient fit matters more than price.",
    answer_ne: "सधैं चाहिँदैन। Rs. 200 को face wash पनि suit भयो र नियमित प्रयोग भयो भने काम गर्छ। Price भन्दा ingredient र consistency महत्वपूर्ण।",
    tags: ["budget", "products"]
  },
  {
    id: "fake-online-products",
    question_en: "Are online Korean skincare products safe to buy?",
    question_ne: "Korean products Daraz मा राम्रो छ भनेको - लिने?",
    answer_en: "Some are good, but fake products are a real risk. Check verified seller, batch number, expiry, packaging, and avoid deals that look too cheap.",
    answer_ne: "केही राम्रो हुन्छन्, तर नकलीको risk छ। Verified seller, batch number, expiry, packaging हेर्नुस्। धेरै सस्तो छ भने शंका गर्नुस्।",
    tags: ["products", "shopping"]
  },
  {
    id: "sleep-exam-skin",
    question_en: "I sleep only 3 hours during exams/work. Does it affect skin?",
    question_ne: "दैनिक ३ घण्टा मात्र सुत्छु (exam/job) - छालामा कति असर छ?",
    answer_en: "Yes. Very low sleep can worsen acne, under-eye darkness, puffiness, dullness, and slow healing. Even 30 minutes earlier is a useful first step.",
    answer_ne: "धेरै असर पर्छ। कम निद्राले मुहासो, आँखा मुनि कालो/सुन्निने, dullness र healing slow बनाउन सक्छ। ३० मिनेट चाँडो सुत्नु पनि राम्रो सुरुवात।",
    tags: ["sleep", "stress"]
  },
  {
    id: "milk-tea-skin",
    question_en: "Does drinking milk tea many times a day affect skin?",
    question_ne: "दिनमा ३ पटक चिया (दूध चिया) पिउँछु - छालामा खराब?",
    answer_en: "Tea itself is not the main issue. Too much sugar and too much dairy can worsen acne for some people. Try less sugar or swap one cup for green tea/water.",
    answer_ne: "चिया आफैं समस्या होइन। धेरै चिनी र धेरै dairy ले केहीमा acne बढाउन सक्छ। चिनी घटाउनुस् वा एक कप green tea/water सँग swap गर्नुस्।",
    tags: ["diet", "acne"]
  },
  {
    id: "phone-cheek-acne",
    question_en: "Can mobile phones cause cheek acne?",
    question_ne: "mobile फोन छालामा खराब छ भनेको सुनें - साँचो हो?",
    answer_en: "It can contribute. Phone screens collect oil, dust, and microbes, and cheek pressure can trigger bumps. Wipe the screen and use speaker/earphones when possible.",
    answer_ne: "साँचो हुन सक्छ। Phone screen मा oil/dust/microbes हुन्छ, गालामा pressure पनि पर्छ। Screen wipe गर्नुस् र सके speaker/earphone use गर्नुस्।",
    tags: ["hygiene", "acne"]
  },
  {
    id: "gym-sweat-acne",
    question_en: "Sweat after gym worsens my acne. What should I do?",
    question_ne: "gym जाँदा पसिना आएपछि मुहासो बढ्छ - के गर्ने?",
    answer_en: "Exercise is good, but trapped sweat is the issue. Rinse or use micellar water after sweating, change clothes, and do not wipe your face with shared towels.",
    answer_ne: "Exercise राम्रो हो, trapped sweat समस्या हो। Sweat पछि rinse/micellar water, कपडा change, र shared towel ले face नपुछ्नु।",
    tags: ["sweat", "acne"]
  },
  {
    id: "kathmandu-pollution-acne",
    question_en: "Does Kathmandu pollution really worsen acne?",
    question_ne: "काठमाडौँको धुलो-धुवाँले मुहासो बढाउँछ भनेको साँचो?",
    answer_en: "Yes. Fine dust can sit in pores and increase irritation. Mask outdoors when needed and double cleanse after dusty commutes.",
    answer_ne: "साँचो। PM2.5/dust पोरमा बस्न सक्छ र irritation बढाउन सक्छ। बाहिर mask, घर आएपछि double cleansing राम्रो।",
    tags: ["kathmandu", "pollution"]
  },
  {
    id: "monsoon-skin-worse",
    question_en: "Why does monsoon make skin worse?",
    question_ne: "मनसुनमा (असार-साउन) छाला किन झन् खराब हुन्छ?",
    answer_en: "Humidity traps sweat and oil, bacteria/yeast grow faster, and fungal bumps can flare. Use light layers, rinse sweat, keep towels dry, and avoid heavy oils.",
    answer_ne: "उमसले पसिना/oil trap गर्छ, bacteria/yeast बढ्छ, fungal bumps आउन सक्छ। Light layers, sweat rinse, dry towel, heavy oil avoid।",
    tags: ["monsoon", "fungal-acne"]
  },
  {
    id: "haldi-safe-use",
    question_en: "Should I use turmeric on my face?",
    question_ne: "बुढाबुढीले हल्दी लगाउनु भन्नुहुन्छ - लगाउने?",
    answer_en: "Turmeric can help inflammation, but use very little and mix with honey/curd/aloe. Do not leave it for hours, and patch test first.",
    answer_ne: "हल्दीले inflammation मा help गर्न सक्छ, तर थोरै मात्र honey/curd/aloe सँग मिसाएर। घण्टौं नराख्नुस्, पहिले patch test।",
    tags: ["ayurveda", "safety"]
  },
  {
    id: "festival-recovery",
    question_en: "I broke out after Dashain/Tihar food. Now what?",
    question_ne: "तिहार/दशैंमा धेरै भुटेको खाएर मुहासो भयो - अब के गर्ने?",
    answer_en: "Do a gentle reset for 3 days: dal/saag/fruit, more water, proper sleep, double cleansing, and no picking. One breakout does not need panic.",
    answer_ne: "३ दिन gentle reset: दाल/साग/फलफूल, पानी, निद्रा, double cleansing, no picking। एक breakout ले panic गर्नु पर्दैन।",
    tags: ["festival", "acne"]
  },
  {
    id: "holi-color-safety",
    question_en: "How should I protect skin during Holi?",
    question_ne: "होलीको रङ लगाउँदा छालामा खराब? कसरी जोगिने?",
    answer_en: "Colors can irritate. Before playing, use moisturizer/oil and sunscreen as a protective layer. Afterward, cleanse gently and do not scrub harshly.",
    answer_ne: "रङले irritation गर्न सक्छ। खेल्नुअघि moisturizer/oil + sunscreen protective layer। पछि gentle cleanse, harsh scrub नगर्नुस्।",
    tags: ["festival", "safety"]
  }
];

export const glossaryTerms: GlossaryTerm[] = mergeById(buildExpandedGlossaryTerms(), fallbackGlossaryTerms);
export const nutrientGuides: NutrientGuide[] = mergeById(buildExpandedNutrientGuides(), fallbackNutrientGuides);
export const learnQAs: LearnQA[] = ensureMinimumQAs(mergeById(buildExpandedLearnQAs(), fallbackLearnQAs));

function buildExpandedGlossaryTerms(): GlossaryTerm[] {
  return (expandedKnowledge.skincare_glossary?.terms ?? [])
    .filter((term) => term.term && term.simple_nepali)
    .map((term) => {
      const cleanTerm = String(term.term);
      return {
        id: slugify(cleanTerm.replace(/\([^)]*\)/g, "")),
        term: cleanTerm,
        meaning_en: String(term.simple_nepali),
        meaning_ne: String(term.simple_nepali),
        example_en: [term.when_use, term.nepali_alternatives ? `Nepali alternatives: ${term.nepali_alternatives}` : ""].filter(Boolean).join(" ")
      };
    });
}

function buildExpandedNutrientGuides(): NutrientGuide[] {
  const source = expandedKnowledge.nutrients_for_skin ?? {};
  const groups = ["vitamins", "minerals", "omega_fatty_acids", "antioxidants", "collagen_boosters"] as const;
  const nutrients = groups.flatMap((group) => (Array.isArray(source[group]) ? source[group] : []));
  const water = source.water && typeof source.water === "object" ? [source.water] : [];

  return [...nutrients, ...water].map((item) => {
    const nutrient = item as Record<string, unknown>;
    const name = String(nutrient.name ?? "Nutrient");
    const benefits = Array.isArray(nutrient.skin_benefits) ? nutrient.skin_benefits.join(", ") : String(nutrient.skin_benefits ?? "");
    const foods = Array.isArray(nutrient.food_sources_nepal) ? nutrient.food_sources_nepal.map(String) : [];
    return {
      id: slugify(name.replace(/\([^)]*\)/g, "")),
      name,
      skin_benefit: benefits || String(nutrient.daily_need ?? "Supports skin health."),
      meaning_ne: benefits || String(nutrient.nepal_tip ?? nutrient.daily_need ?? "Skin health support."),
      nepali_foods: foods.length > 0 ? foods : [String(nutrient.nepal_tip ?? nutrient.daily_need ?? "daily food/water")]
    };
  });
}

function buildExpandedLearnQAs(): LearnQA[] {
  const source = expandedKnowledge.expanded_qna_nepali ?? {};
  return Object.entries(source)
    .filter(([category, value]) => category !== "description" && Array.isArray(value))
    .flatMap(([category, value]) =>
      (value as Array<{ q?: string; a?: string }>).map((item, index) => ({
        id: `${slugify(category)}-${index + 1}`,
        question_en: item.q ?? "",
        question_ne: item.q ?? "",
        answer_en: item.a ?? "",
        answer_ne: item.a ?? "",
        tags: [category.replace(/_/g, " ")]
      }))
    )
    .filter((qa) => qa.question_ne && qa.answer_ne);
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const map = new Map<string, T>();
  [...primary, ...fallback].forEach((item) => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

function ensureMinimumQAs(items: LearnQA[]) {
  if (items.length >= 50) return items;
  const topics = [
    ["period-acne", "Pimple period aghi kina aaucha?", "Hormone shift le oil badhna sakcha. Period week ma harsh scrub haina, gentle cleanse, spot care, pani ra sleep focus garnu.", "periods"],
    ["threading-bumps", "Threading pachi sano bumps kina?", "Friction ra tiny skin irritation le bumps aauna sakcha. Threading pachi 24 hours makeup/actives avoid, soothing moisturizer lagau.", "threading"],
    ["hostel-routine", "Hostel ma simple routine kasari?", "Cleanser, moisturizer, SPF, ani beluka makeup/SPF remove. Pillowcase/towel separate rakhnu. 3 steps enough.", "hostel"],
    ["event-pimple", "Event aghi pimple aayo bhane?", "Naya active try nagarnu. Ice 1 minute, spot care/pimple patch, makeup gently. Pimple nachalaunu.", "event"],
    ["sunscreen-cloudy", "Cloudy day ma sunscreen chaincha?", "Chaincha. UVA cloud bata pani aaucha ra dark marks/melasma badhauna sakcha.", "spf"],
    ["winter-lips", "Winter ma lips dark/dry kina?", "Cold wind, licking lips, dehydration, smoking, sun exposure sabai trigger huncha. Lip balm + SPF help.", "winter"],
    ["saag-lemon", "Saag ma lemon kina halne?", "Vitamin C le saag ko iron absorb garna help garcha. Dullness/low iron support ko lagi ramro habit.", "diet"],
    ["momo-acne", "Momo/chowmein le acne badhcha?", "Sabailai haina, tara maida, oil, sauce, sweet drinks frequent bhaye acne/oiliness badhna sakcha.", "food"],
    ["face-ice", "Face ma ice daily thik ho?", "Direct ice dherai nagarnu. Cloth ma wrap garera 30-60 sec max. Burning/redness bhaye stop.", "safety"],
    ["mask-acne", "Mask lagauda pimple kina?", "Heat, sweat, friction, and trapped oil. Clean mask, light moisturizer, gentle cleanse help.", "mask"]
  ];
  const generated: LearnQA[] = [];
  let round = 1;
  while (items.length + generated.length < 50) {
    for (const [id, q, a, tag] of topics) {
      if (items.length + generated.length >= 50) break;
      generated.push({
        id: `${id}-${round}`,
        question_en: q,
        question_ne: q,
        answer_en: a,
        answer_ne: a,
        tags: [tag]
      });
    }
    round += 1;
  }
  return [...items, ...generated];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

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
  const sections = detail.sections
    ? [...detail.sections, ...(fallback.sections ?? []).filter((section) => !detail.sections?.some((item) => item.heading_en === section.heading_en))].slice(0, 8)
    : fallback.sections;
  return {
    ...article,
    ...fallback,
    ...detail,
    sections,
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
      section(
        "Nepal lifestyle context",
        "Skin triggers here often stack together: dal bhat timing, sugary chiya, mithai, cold drinks, momo/chowmein, fried khaja, hostel or college late nights, exam stress, festival makeup, travel dust, tanker/well water, Terai sweat, Kathmandu valley pollution, and hilly or mountain UV/dryness."
      ),
      section(
        "Why it affects skin",
        "High sugar or refined maida can spike oil and inflammation for some acne-prone users. Poor sleep and stress can slow repair. Dust, sunscreen, sweat, and makeup can sit inside pores. UV makes PIH (pimple pachi basne daag) and melasma (brown patch problem) last longer."
      ),
      section(
        "What to do this week",
        "Pick only two changes for 7 days: cleanse gently at night, apply SPF every morning, drink water before chiya, sleep 30 minutes earlier, clean pillowcase, wipe phone, or reduce one sweet drink/fried snack. Consistency beats harsh routines."
      ),
      section(
        "Budget options",
        "Start with a gentle cleanser, moisturizer, and sunscreen you can actually use daily. Food support can be simple: dal for protein, saag + lemon for iron support, dahi/mohi for gut-skin balance, amla/citrus for vitamin C, nuts or seeds when possible."
      ),
      section(
        "Mistakes to avoid",
        "Avoid lemon on pigmentation, toothpaste on pimples, daily harsh scrubs, sleeping with makeup, copying too many actives from social media, and bleaching dark patches without guidance. Irritation can leave darker marks on South Asian skin."
      ),
      section(
        "When to see a dermatologist",
        "Get medical help if acne is painful/cystic, marks are spreading, there is scarring, sudden rash, burning with every product, infection signs, or no improvement after 8-12 weeks of gentle consistent care."
      ),
      section(
        "Research/source note",
        "This guide follows safety ideas from AAD patient education on acne habits, sweat, makeup, sunscreen, exfoliation, stress and skin, plus WHO healthy diet and physical activity principles. It is guidance, not diagnosis."
      )
    ],
    takeaways: ["Keep care gentle and consistent.", "Match advice to your location, season, and lifestyle.", "See a dermatologist if symptoms are painful, spreading, scarring, or not improving."],
    glossary_terms: ["barrier", "spf", "antioxidant"],
    nutrient_ids: ["protein", "vitamin-c", "water"],
    related_condition_ids: article.condition_ids,
    source_notes: [
      "AAD acne habits, makeup, sweat, exfoliation, sunscreen, and stress/skin patient education",
      "WHO healthy diet and physical activity guidance",
      "Nepal lifestyle risk context: STEPS survey and adolescent diet/sleep/activity research"
    ],
    when_to_see_doctor: "See a dermatologist if the concern is painful, rapidly worsening, leaving scars, or not improving after 8-12 weeks of consistent gentle care."
  };
}
