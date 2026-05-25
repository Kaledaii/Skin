import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, FloatingBadge, H1, H2, Pill, ProgressBar, Screen, SectionLabel } from "@/shared/components";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { getAllArticles, getRecommendedArticles, getSeasonalCalendar } from "@/shared/knowledge/content";
import { ContentArticle } from "@/shared/knowledge/contentTypes";
import { dailyHabitTips, glossaryTerms, nutrientGuides } from "@/shared/knowledge/education";
import { generateRoutine } from "@/shared/knowledge/engine";
import { calculateSkinHabitScore } from "@/shared/knowledge/tracking";
import { ImagePromoCard, marketingImages } from "@/shared/marketingVisuals";
import { palettes, spacing } from "@/shared/theme";
import { visualCueForText } from "@/shared/visualCues";

const categories = ["recommended", "all", "education", "seasonal", "diet", "glow_up", "product_review", "motivation"];

export default function Learn() {
  const { language, themeMode, tier, profile, completion, todayCheckIn } = useApp();
  const router = useRouter();
  const c = palettes[themeMode];
  const premiumLocked = tier !== "premium";
  const [selectedCategory, setSelectedCategory] = useState("recommended");
  const routine = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const conditionIds = routine.matches.map((match) => match.condition.id);
  const season = profile.quiz.environment.current_season;
  const recommendedArticles = getRecommendedArticles(conditionIds, season);
  const allArticles = getAllArticles();
  const articles =
    selectedCategory === "recommended"
      ? recommendedArticles
      : selectedCategory === "all"
        ? allArticles
        : allArticles.filter((article) => article.category === selectedCategory);
  const calendar = getSeasonalCalendar(season);
  const habitScore = calculateSkinHabitScore({ completion, routineSteps: [...routine.morning, ...routine.evening], profile, checkIn: todayCheckIn });

  return (
    <ErrorBoundary screenName="Learn">
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">Learn hub</SectionLabel>
              <H1>{language === "en" ? "Learn what your skin needs next" : "Skin lai ke chahinchha, sajilo tarika le bujhnuhos"}</H1>
              <Body muted>Articles, glossary, nutrients, and daily habits tuned for Nepal's weather, water, budget, and lifestyle.</Body>
              <View style={styles.badgeRow}>
                <FloatingBadge label="Readable articles" />
                <FloatingBadge label="Roman Nepali help" tone="secondary" />
                <FloatingBadge label="No diagnosis" tone="accent" />
              </View>
            </View>
          </View>
        </Card>

        <ImagePromoCard
          item={{
            id: "skin-progress-education",
            image: marketingImages.skinProgress,
            eyebrow: "📈 Learn gently",
            title: "Skin changes slowly. Track gently.",
            body: "Use articles to understand acne, marks, SPF, food, water, and products without fear-based advice.",
            cta: "Read guides",
            icon: "book-open",
            emoji: "🌸"
          }}
        />

        <Card variant="seasonal" style={{ backgroundColor: c.surfaceGlow }}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <H2>Skin Habit Score</H2>
              <Body muted>Gentle score from routine, care basics, lifestyle, food/water/sleep, weather readiness, and logs.</Body>
            </View>
            <Pill tone={habitScore.score >= 75 ? "secondary" : "accent"}>{habitScore.score}/100</Pill>
          </View>
          <ProgressBar value={habitScore.score} color={habitScore.score >= 75 ? c.secondary : c.primary} />
          <Body muted>{habitScore.reasons.slice(0, 2).join(" ")}</Body>
        </Card>

        <Card>
          <H2>Daily healthy habits</H2>
          {dailyHabitTips.map((tip) => (
            <View key={tip.id} style={[styles.infoTile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <View style={styles.row}>
                <Pill tone="accent">{tip.tags[0]}</Pill>
                <Feather name="check-circle" color={c.secondary} size={18} />
              </View>
              <H2>{visualCueForText(tip.title, tip.why, tip.how)} {tip.title}</H2>
              <Body>{tip.why}</Body>
              <Body muted>{tip.how}</Body>
            </View>
          ))}
        </Card>

        <Card>
          <H2>Readable articles</H2>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    { backgroundColor: active ? c.primary : c.surfaceAlt, borderColor: active ? c.primary : c.border, transform: [{ scale: pressed ? 0.97 : 1 }] }
                  ]}
                >
                  <Text style={[styles.categoryText, { color: active ? "#FFFFFF" : c.muted }]}>{labelForCategory(category)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} locked={premiumLocked && index >= 4} />
          ))}
        </Card>

        <Card>
          <H2>Glossary: hard words made simple</H2>
          <View style={styles.termGrid}>
            {glossaryTerms.map((term) => (
              <View key={term.id} style={[styles.infoTile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                <Pill tone="primary">{visualCueForText(term.term, term.meaning_en, term.meaning_ne)} {term.term}</Pill>
                <Body>{term.meaning_en}</Body>
                <Body muted>{term.meaning_ne}</Body>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <H2>Nutrients for skin</H2>
          <View style={styles.termGrid}>
            {nutrientGuides.map((nutrient) => (
              <View key={nutrient.id} style={[styles.infoTile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                <Pill tone="secondary">{visualCueForText(nutrient.name, nutrient.skin_benefit, nutrient.nepali_foods.join(" "))} {nutrient.name}</Pill>
                <Body>{nutrient.skin_benefit}</Body>
                <Body muted>{nutrient.meaning_ne}</Body>
                <Body muted>Foods: {nutrient.nepali_foods.join(", ")}</Body>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <H2>This season's care notes</H2>
          {calendar.length > 0 ? (
            calendar.map((item) => (
              <View key={`${item.week}-${item.theme}`} style={styles.calendarLine}>
                <Pill tone="secondary">Week {item.week}</Pill>
                <Body>{item.theme}</Body>
                <Body muted>{item.short_tip}</Body>
                {item.campaign ? <Pill tone="accent">{item.campaign}</Pill> : null}
              </View>
            ))
          ) : (
            <Body muted>No calendar items for this season yet.</Body>
          )}
        </Card>
      </ScrollView>
    </Screen>
    </ErrorBoundary>
  );

  function ArticleCard({ article, locked }: { article: ContentArticle; locked: boolean }) {
    const title = language === "ne" ? article.title_ne ?? article.title_en : article.title_en;
    return (
      <Pressable
        onPress={() => locked ? router.push("/paywall" as never) : router.push(`/learn/${article.id}` as never)}
        style={({ pressed }) => [
          styles.articleCard,
          { backgroundColor: c.surfaceAlt, borderColor: c.border, transform: [{ scale: pressed ? 0.99 : 1 }] }
        ]}
      >
        <View style={styles.row}>
          <Pill tone={article.category === "diet" ? "accent" : article.category === "seasonal" ? "secondary" : "primary"}>{visualCueForText(article.title_en, article.summary_en, article.category)} {labelForCategory(article.category)}</Pill>
          <Pill tone="primary">{article.reading_time_min} min</Pill>
          {locked ? <Pill tone="accent">Premium guide</Pill> : null}
        </View>
        <H2>{visualCueForText(title, article.summary_en)} {title}</H2>
        <Body muted>{locked ? "Unlock the full long-form guide with budget options, local product examples, warning signs, and source notes." : article.summary_en}</Body>
        <View style={styles.row}>
          <Body muted>{locked ? "Tap to unlock" : "Tap to read full guide"}</Body>
          <Feather name="arrow-right" color={c.primary} size={18} />
        </View>
        {locked ? <Button label="See premium value" onPress={() => router.push("/paywall" as never)} secondary /> : null}
      </Pressable>
    );
  }
}

function labelForCategory(category: string) {
  return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  flex: { flex: 1, gap: spacing.xs },
  categoryRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  categoryChip: { minHeight: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  categoryText: { fontSize: 13, fontWeight: "800" },
  articleCard: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.sm, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  termGrid: { gap: spacing.sm },
  infoTile: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.xs },
  calendarLine: { gap: spacing.xs, paddingVertical: spacing.xs }
});
