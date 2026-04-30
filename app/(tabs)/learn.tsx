import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Card, H1, H2, Pill, ProgressBar, Screen, SectionLabel } from "@/shared/components";
import { contentDatabase, getFutureFeatureIdeas, getGlowPlanFeatures, getRecommendedArticles, getSeasonalCalendar } from "@/shared/knowledge/content";
import { ContentArticle } from "@/shared/knowledge/contentTypes";
import { generateRoutine } from "@/shared/knowledge/engine";
import { palettes, spacing } from "@/shared/theme";

export default function Learn() {
  const { language, themeMode, profile, completion } = useApp();
  const c = palettes[themeMode];
  const routine = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const conditionIds = routine.matches.map((match) => match.condition.id);
  const season = profile.quiz.environment.current_season;
  const articles = getRecommendedArticles(conditionIds, season);
  const calendar = getSeasonalCalendar(season);
  const features = getGlowPlanFeatures();
  const ideas = getFutureFeatureIdeas();
  const glowScore = calculateGlowScore(completion, profile.quiz.lifestyle.water_intake_liters, profile.quiz.lifestyle.sleep_hours);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
          <SectionLabel tone="accent">Weekly glow guide</SectionLabel>
          <H1>{language === "en" ? "Learn what your skin needs next" : "अब skin लाई के चाहिन्छ सिक्नुहोस्"}</H1>
          <Body muted>{contentDatabase.meta.description}</Body>
            </View>
          </View>
        </Card>

        <Card variant="seasonal" style={{ backgroundColor: c.surfaceGlow }}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <H2>Glow Score</H2>
              <Body muted>{language === "en" ? "A gentle weekly score from routine, water, and sleep habits." : "routine, पानी र sleep बाट बनेको gentle weekly score।"}</Body>
            </View>
            <Pill tone={glowScore >= 75 ? "secondary" : "accent"}>{glowScore}/100</Pill>
          </View>
          <ProgressBar value={glowScore} color={glowScore >= 75 ? c.secondary : c.primary} />
        </Card>

        <Card>
          <H2>{language === "en" ? "Recommended reads" : "Recommended reads"}</H2>
          {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
        </Card>

        <Card>
          <H2>{language === "en" ? "Seasonal calendar" : "Seasonal calendar"}</H2>
          {calendar.length > 0 ? calendar.map((item) => (
            <View key={`${item.week}-${item.theme}`} style={styles.calendarLine}>
              <Pill tone="secondary">Week {item.week}</Pill>
              <Body>{item.theme}</Body>
              <Body muted>{item.short_tip}</Body>
              {item.campaign ? <Pill tone="accent">{item.campaign}</Pill> : null}
            </View>
          )) : <Body muted>No calendar items for this season yet.</Body>}
        </Card>

        <Card>
          <H2>{language === "en" ? "Glow Plan features" : "Glow Plan features"}</H2>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.row}>
                <Pill tone={feature.priority === "high" ? "accent" : "primary"}>{feature.priority}</Pill>
                <Pill tone="secondary">{feature.category}</Pill>
              </View>
              <H2>{feature.name}</H2>
              <Body>{feature.description}</Body>
              <Body muted>{feature.user_benefit}</Body>
              <View style={styles.impactRow}>
                <Impact icon="repeat" label={`Retention ${feature.estimated_impact.retention}`} />
                <Impact icon="trending-up" label={`Growth ${feature.estimated_impact.acquisition}`} />
                <Impact icon="shield" label={`Trust ${feature.estimated_impact.trust}`} />
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <H2>{language === "en" ? "Next audience-growth ideas" : "Next audience-growth ideas"}</H2>
          {ideas.map((idea) => (
            <View key={idea.title} style={styles.ideaLine}>
              <Feather name="star" color={c.primary} size={18} />
              <View style={styles.flex}>
                <Body>{idea.title}</Body>
                <Body muted>{idea.body}</Body>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );

  function ArticleCard({ article }: { article: ContentArticle }) {
    const title = language === "ne" ? article.title_ne ?? article.title_en : article.title_en;
    return (
      <View style={[styles.articleCard, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <View style={styles.row}>
          <Pill tone={article.category === "diet" ? "accent" : article.category === "seasonal" ? "secondary" : "primary"}>{article.category}</Pill>
          <Pill tone="primary">{article.reading_time_min} min</Pill>
        </View>
        <H2>{title}</H2>
        <Body muted>{article.summary_en}</Body>
        <View style={styles.row}>
          <Body muted>{article.visual_hook.replace(/_/g, " ")}</Body>
          {article.condition_ids.length > 0 ? <Pill tone="secondary">{article.condition_ids.join(", ")}</Pill> : null}
        </View>
      </View>
    );
  }

  function Impact({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
    return (
      <View style={styles.impact}>
        <Feather name={icon} color={c.secondary} size={15} />
        <Body muted>{label}</Body>
      </View>
    );
  }
}

function calculateGlowScore(completion: Record<string, boolean>, water: string, sleep: string) {
  const routinePoints = Math.min(Object.values(completion).filter(Boolean).length * 9, 45);
  const waterPoints = water === "more_than_2" ? 25 : water === "1_to_2" ? 16 : 7;
  const sleepPoints = sleep === "6_to_8" || sleep === "more_than_8" ? 30 : sleep === "5_to_6" ? 18 : 8;
  return Math.min(100, routinePoints + waterPoints + sleepPoints);
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" },
  flex: { flex: 1, gap: spacing.xs },
  articleCard: { borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.sm, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  calendarLine: { gap: spacing.xs, paddingVertical: spacing.xs },
  featureCard: { gap: spacing.sm, paddingVertical: spacing.sm },
  impactRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  impact: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  ideaLine: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }
});
