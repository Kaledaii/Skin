import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, FloatingBadge, H1, H2, Pill, ProgressBar, Screen, SectionLabel, SignalCard, ToggleGroup } from "@/shared/components";
import { products } from "@/shared/data";
import { t } from "@/shared/i18n";
import { contextualConditionDescription, generateRoutine, localized } from "@/shared/knowledge/engine";
import { dailyHabitTips } from "@/shared/knowledge/education";
import { buildLifestyleSignals } from "@/shared/knowledge/lifestyleSignals";
import { calculateSkinHabitScore } from "@/shared/knowledge/tracking";
import { GeneratedStep, HomeRemedy } from "@/shared/knowledge/types";
import { buildWeatherActions, WeatherAction } from "@/shared/knowledge/weatherGuidance";
import { getAqiGuidance, useEnvironmentalData } from "@/shared/services/environment";
import { palettes, spacing } from "@/shared/theme";

export default function Home() {
  const { language, setLanguage, themeMode, setThemeMode, tier, setTier, profile, completion, toggleCompletion, todayCheckIn } = useApp();
  const c = palettes[themeMode];
  const scrollRef = useRef<ScrollView>(null);
  const [showTopButton, setShowTopButton] = useState(false);
  const [routinePeriod, setRoutinePeriod] = useState<"morning" | "evening">("morning");
  const [expandedConcernId, setExpandedConcernId] = useState<string | null>(null);
  const environment = useEnvironmentalData();
  const result = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const lifestyleSignals = useMemo(() => buildLifestyleSignals(profile, todayCheckIn), [profile, todayCheckIn]);
  const weatherActions = useMemo(() => (environment.data ? buildWeatherActions(environment.data) : []), [environment.data]);
  const visibleEvening = useMemo(() => (tier === "premium" ? result.evening : result.evening.slice(0, 4)), [result.evening, tier]);
  const routineSteps = useMemo(() => [...result.morning, ...visibleEvening], [result.morning, visibleEvening]);
  const completed = routineSteps.filter((step) => completion[step.id]).length;
  const percent = routineSteps.length ? Math.round((completed / routineSteps.length) * 100) : 0;
  const habitScore = useMemo(
    () => calculateSkinHabitScore({ completion, routineSteps, profile, checkIn: todayCheckIn, weatherActions }),
    [completion, profile, routineSteps, todayCheckIn, weatherActions]
  );
  const topMatch = result.matches[0];
  const activeSteps = routinePeriod === "morning" ? result.morning : visibleEvening;
  const remedies = useMemo(() => collectRemedies(topMatch ? [topMatch.condition] : []), [topMatch]);
  const topAction = result.morning[0]?.action ?? result.evening[0]?.action ?? "Start with a gentle cleanser";
  const productMatches = products
    .filter((item) => item.fit.includes(profile.skinType) && (tier === "premium" || item.budgetTier === profile.budgetTier))
    .slice(0, 3);

  return (
    <Screen>
      <View style={styles.quickActions}>
        <View style={styles.quickButtonRow}>
          <QuickIconButton
            icon={themeMode === "dark" ? "sun" : "moon"}
            onPress={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            background={c.surface}
            color={c.primary}
            border={c.borderStrong}
          />
          <QuickTextButton
            label={language === "en" ? "EN" : "ने"}
            onPress={() => setLanguage(language === "en" ? "ne" : "en")}
            background={c.surface}
            color={c.text}
            border={c.borderStrong}
          />
        </View>
        <ScoreBubble score={habitScore.score} percent={percent} completed={completed} total={routineSteps.length} colors={c} />
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={({ nativeEvent }) => setShowTopButton(nativeEvent.contentOffset.y > 260)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Pill tone={tier === "premium" ? "accent" : "primary"}>{tier === "premium" ? t(language, "premium") : t(language, "free")}</Pill>
            <H1>{language === "en" ? `Namaste, ${profile.name}` : `नमस्ते, ${profile.name}`}</H1>
            <View style={styles.badgeRow}>
              <FloatingBadge label="Nepal weather-aware" />
              <FloatingBadge label={`${profile.quiz.environment.location_type ?? profile.location} region`} tone="secondary" />
              <FloatingBadge label={`${profile.budgetTier} budget`} tone="accent" />
            </View>
          </View>
        </View>

        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark />
            <View style={styles.flex}>
              <SectionLabel tone="accent">{language === "en" ? "Today's skin read" : "Today's skin read"}</SectionLabel>
              <H2>{topMatch ? localized(language, topMatch.condition.name_en, topMatch.condition.name_ne) : "Skin guidance is ready"}</H2>
              <Body muted>{language === "en" ? `Top action: ${topAction}. Guidance only, not diagnosis.` : `Top action: ${topAction}. Guidance only, diagnosis होइन।`}</Body>
            </View>
          </View>
          <ProgressBar value={Math.min((topMatch?.score ?? 0) * 10, 100)} color={c.primary} />
        </Card>

        <EnvironmentalCard environment={environment} colors={c} />

        {weatherActions.length > 0 ? (
          <Card>
            <View style={styles.sectionTitle}>
              <Feather name="cloud" color={c.secondary} size={22} />
              <H2>Today's weather actions</H2>
            </View>
            {weatherActions.slice(0, 4).map((action) => (
              <WeatherActionCard key={action.id} action={action} />
            ))}
          </Card>
        ) : null}

        <Card>
          <H2>{language === "en" ? "Matched skin concern" : "Matched skin concern"}</H2>
          {topMatch ? (
            <>
              <View style={styles.row}>
                <Pill tone="secondary">Score {topMatch.score}</Pill>
                <Pill>{topMatch.condition.severity}</Pill>
              </View>
              <H2>{localized(language, topMatch.condition.name_en, topMatch.condition.name_ne)}</H2>
              <Body muted>{contextualConditionDescription(topMatch.condition, profile.quiz, language)}</Body>
              <Body>{language === "en" ? "Recommended guidance only, not a medical diagnosis." : "यो recommended guidance मात्र हो, medical diagnosis होइन।"}</Body>
            </>
          ) : (
            <Body muted>{language === "en" ? "No strong condition match yet. Add more symptoms in onboarding." : "अहिले strong match छैन। onboarding मा थप symptoms छान्नुहोस्।"}</Body>
          )}
        </Card>

        {result.matches.length > 0 ? (
          <Card>
            <H2>{language === "en" ? "Other likely concerns" : "Other likely concerns"}</H2>
            <View style={styles.row}>
              {result.matches.map((match) => (
                <Pill key={match.condition.id} tone={match === topMatch ? "accent" : "secondary"}>
                  {localized(language, match.condition.name_en, match.condition.name_ne)} • {match.score}
                </Pill>
              ))}
            </View>
          </Card>
        ) : null}

        {result.matches.length > 0 ? (
          <Card variant="accent">
            <H2>{language === "en" ? "Concern details" : "Concern details"}</H2>
            {result.matches.map((match) => {
              const expanded = expandedConcernId === match.condition.id;
              return (
                <Pressable
                  key={match.condition.id}
                  onPress={() => setExpandedConcernId(expanded ? null : match.condition.id)}
                  style={({ pressed }) => [
                    styles.concernCard,
                    {
                      borderColor: expanded ? c.borderStrong : c.border,
                      backgroundColor: expanded ? c.surfaceAlt : c.surface,
                      transform: [{ scale: pressed ? 0.99 : 1 }]
                    }
                  ]}
                >
                  <View style={styles.row}>
                    <Pill tone={match === topMatch ? "accent" : "secondary"}>Score {match.score}</Pill>
                    <Feather name={expanded ? "chevron-up" : "chevron-down"} color={c.muted} size={18} />
                  </View>
                  <Body>{localized(language, match.condition.name_en, match.condition.name_ne)}</Body>
                  {expanded ? <Body muted>{contextualConditionDescription(match.condition, profile.quiz, language)}</Body> : null}
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {result.contextTips.length > 0 ? (
          <Card>
            <H2>{language === "en" ? "Lifestyle notes for your plan" : "Lifestyle notes"}</H2>
            {result.contextTips.map((tip) => (
              <View key={`${tip.category}-${tip.text.en}`} style={styles.tipLine}>
                <Pill tone={tip.category === "smoking" || tip.category === "alcohol" ? "accent" : "secondary"}>{tip.category}</Pill>
                <Body>{tip.text[language]}</Body>
              </View>
            ))}
          </Card>
        ) : null}

        {lifestyleSignals.length > 0 ? (
          <Card>
            <H2>Your Lifestyle Signals</H2>
            <Body muted>Every quiz and check-in answer should visibly change your plan. These are the strongest signals today.</Body>
            {lifestyleSignals.slice(0, 6).map((signal) => (
              <SignalCard key={signal.id} tone={signal.tone} icon={signal.icon} label={signal.label} title={signal.title}>
                {signal.body}
              </SignalCard>
            ))}
          </Card>
        ) : null}

        <Card>
          <View style={styles.sectionTitleBetween}>
            <View style={styles.sectionTitle}>
              <Feather name="check-circle" color={c.secondary} size={22} />
              <H2>Daily healthy habits</H2>
            </View>
            <Button label="View all" onPress={() => router.push("/(tabs)/learn" as never)} secondary />
          </View>
          <Body muted>Small Nepal-friendly habits that support the routine you are completing today.</Body>
          {dailyHabitTips.slice(0, 3).map((tip) => (
            <HabitPreviewCard key={tip.id} tip={tip} colors={c} />
          ))}
        </Card>

        <Card>
          <H2>{language === "en" ? "Routine streak" : "Routine streak"}</H2>
          <Body>{language === "en" ? `You followed ${percent}% of today's generated routine. Missed a step? No stress, restart with cleanser.` : `आजको generated routine ${percent}% पूरा भयो। छुट्यो भने cleanser बाट restart गर्नुहोस्।`}</Body>
          <ProgressBar value={percent} color={c.secondary} />
        </Card>

        <Card>
          <View style={styles.scoreHeader}>
            <View style={styles.sectionTitle}>
              <Feather name={routinePeriod === "morning" ? "sun" : "droplet"} color={routinePeriod === "morning" ? c.accent : c.secondary} size={22} />
              <H2>{language === "en" ? "Routine ritual" : "Routine ritual"}</H2>
            </View>
            <Pill tone="secondary">{`Today ${percent}% • ${completed}/${routineSteps.length} done`}</Pill>
          </View>
          <ProgressBar value={percent} color={c.primary} />
          <ToggleGroup
            value={routinePeriod}
            options={[
              { label: t(language, "morning"), value: "morning" },
              { label: t(language, "evening"), value: "evening" }
            ]}
            onChange={setRoutinePeriod}
          />
          <RoutineSection title={routinePeriod === "morning" ? t(language, "morning") : t(language, "evening")} icon={null} steps={activeSteps} />
        </Card>

        {result.weekly.length > 0 ? (
          <Card>
            <View style={styles.sectionTitle}>
              <Feather name="calendar" color={c.primary} size={22} />
              <H2>{language === "en" ? "Weekly add-ons" : "Weekly add-ons"}</H2>
            </View>
            {result.weekly.map((step) => (
              <View key={step.id} style={styles.tipLine}>
                <Pill tone="accent">{step.frequency}</Pill>
                <Body>{step.action}</Body>
                <Body muted>{step.instruction[language]}</Body>
              </View>
            ))}
          </Card>
        ) : null}

        <Card>
          <H2>{result.waterTip.title[language]}</H2>
          {result.waterTip.tips[language].map((tip) => (
            <Body key={tip}>• {tip}</Body>
          ))}
          {tier === "premium" ? (
            <Pill tone="secondary">Weather + water adaptive</Pill>
          ) : (
            <Button label={t(language, "upgrade")} onPress={() => setTier("premium")} secondary />
          )}
        </Card>

        <Card>
          <H2>{language === "en" ? "Local diet guidance" : "Local diet guidance"}</H2>
          <View style={styles.dietBlock}>
            <Pill tone="secondary">{language === "en" ? "Do" : "गर्नुहोस्"}</Pill>
            {result.dietEatMore.slice(0, 3).map((food) => (
              <View key={food.food_en} style={styles.dietRow}>
                <Body>
                  {localized(language, food.food_en, food.food_ne)}
                </Body>
                <Body muted>{localized(language, food.reason_en ?? "", food.reason_ne)}</Body>
              </View>
            ))}
          </View>
          <View style={styles.dietBlock}>
            <Pill tone="danger">{language === "en" ? "Don't" : "नगर्नुहोस्"}</Pill>
            {result.dietAvoid.slice(0, 2).map((food) => (
              <View key={food.food_en} style={styles.dietRow}>
                <Body>{localized(language, food.food_en, food.food_ne)}</Body>
                <Body muted>{localized(language, food.reason_en ?? "", food.reason_ne)}</Body>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <H2>{language === "en" ? "Daily micro-tip" : "Daily micro-tip"}</H2>
          <Body>{result.dailyMicroTips[0]?.text[language]}</Body>
          <Pill tone="accent">{result.dailyMicroTips[0]?.tag}</Pill>
        </Card>

        {remedies.length > 0 ? (
          <Card variant="seasonal">
            <View style={styles.sectionTitle}>
              <Feather name="heart" color={c.secondary} size={22} />
              <H2>{language === "en" ? "Home remedies for this match" : "Home remedies for this match"}</H2>
            </View>
            <Body muted>
              {topMatch
                ? `Only showing remedies connected to ${localized(language, topMatch.condition.name_en, topMatch.condition.name_ne)}. Stop anything that stings or worsens irritation.`
                : "Only showing remedies that match your result."}
            </Body>
            {remedies.slice(0, 5).map((remedy) => (
              <View key={`${remedy.remedy}-${remedy.verdict}`} style={[styles.remedyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Pill tone={remedy.verdict === "harmful" ? "danger" : remedy.verdict === "safe_mild" ? "accent" : "secondary"}>
                  {remedy.verdict === "harmful" ? "Avoid / नगर्नुहोस्" : remedy.verdict === "safe_mild" ? "Mild / सावधानी" : "Safe / गर्न सकिन्छ"}
                </Pill>
                <Body>{remedy.nepali ? `${remedy.remedy} (${remedy.nepali})` : remedy.remedy}</Body>
                {remedy.ingredients ? <Body muted>Ingredients: {remedy.ingredients}</Body> : null}
                <Body muted>{remedy.method ?? remedy.reason ?? remedy.note ?? "Use gently and stop if irritation starts."}</Body>
                {remedy.frequency ? <Pill tone="primary">{remedy.frequency}</Pill> : null}
                {remedy.why_it_works ? <Body muted>{remedy.why_it_works}</Body> : null}
                {remedy.caution ? <Body muted>Caution: {remedy.caution}</Body> : null}
              </View>
            ))}
          </Card>
        ) : null}

        <Card>
          <H2>{language === "en" ? "Matched product picks" : "Matched product picks"}</H2>
          <Body muted>{language === "en" ? "Filtered by your skin type and selected budget." : "Filtered by your skin type and selected budget."}</Body>
          {productMatches.length > 0 ? productMatches.map((item) => (
              <View key={item.id} style={styles.productLine}>
                <Body>{item.name}</Body>
                <Pill tone={item.sponsored ? "accent" : "primary"}>{item.sponsored ? t(language, "sponsored") : item.price}</Pill>
              </View>
            )) : <Body muted>No exact product match yet. Try changing skin type or budget in Products.</Body>}
        </Card>
      </ScrollView>

      {showTopButton ? (
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          style={({ pressed }) => [
            styles.floatingButton,
            {
              backgroundColor: c.surface,
              borderColor: c.borderStrong,
              transform: [{ scale: pressed ? 0.96 : 1 }]
            }
          ]}
        >
          <Feather name="arrow-up" color={c.primary} size={22} />
        </Pressable>
      ) : null}
    </Screen>
  );

  function RoutineSection({ title, icon, steps }: { title: string; icon: ReactNode | null; steps: GeneratedStep[] }) {
    return (
      <View style={styles.routineGroup}>
        <View style={styles.sectionTitle}>
          {icon ? icon : null}
          <H2>{title}</H2>
        </View>
        {steps.map((step) => (
          <View key={step.id} style={styles.routineStep}>
            <Button label={`${completion[step.id] ? "Done: " : ""}${step.action}`} onPress={() => toggleCompletion(step.id)} secondary={!completion[step.id]} />
            <Body muted>{step.instruction[language]}</Body>
            {step.durationSeconds ? <Pill tone="primary">{step.durationSeconds}s</Pill> : null}
          </View>
        ))}
      </View>
    );
  }
}

function collectRemedies(conditions: Array<{ home_remedies_verdict?: { effective?: HomeRemedy[]; avoid?: HomeRemedy[] } }>) {
  const byName = new Map<string, HomeRemedy>();
  conditions.forEach((condition) => {
    condition.home_remedies_verdict?.effective?.forEach((remedy) => byName.set(remedy.remedy, remedy));
    condition.home_remedies_verdict?.avoid?.forEach((remedy) => byName.set(remedy.remedy, remedy));
  });
  return Array.from(byName.values());
}

function ScoreBubble({
  score,
  percent,
  completed,
  total,
  colors
}: {
  score: number;
  percent: number;
  completed: number;
  total: number;
  colors: (typeof palettes)["light"];
}) {
  const scoreColor = score >= 75 ? colors.secondary : score >= 50 ? colors.accent : colors.primary;

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/progress" as never)}
      accessibilityRole="button"
      accessibilityLabel={`Today score ${score} out of 100. ${completed} of ${total} routine steps done.`}
      style={({ pressed }) => [
        styles.scoreBubble,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <View style={[styles.scoreBubbleDot, { backgroundColor: scoreColor }]}>
        <Text style={[styles.scoreBubbleScore, { color: colors.deep }]}>{score}</Text>
      </View>
      <View style={styles.scoreBubbleCopy}>
        <Text style={[styles.scoreBubbleLabel, { color: colors.muted }]}>Today score</Text>
        <Text style={[styles.scoreBubbleValue, { color: colors.text }]}>{percent}% routine</Text>
        <Text style={[styles.scoreBubbleMeta, { color: colors.muted }]}>{completed}/{total} done</Text>
      </View>
    </Pressable>
  );
}

function HabitPreviewCard({
  tip,
  colors
}: {
  tip: { id: string; title: string; why: string; how: string; tags: string[] };
  colors: (typeof palettes)["light"];
}) {
  return (
    <View style={[styles.habitPreview, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Pill tone="accent">{tip.tags[0]}</Pill>
        <Feather name="check-circle" color={colors.secondary} size={18} />
      </View>
      <H2>{tip.title}</H2>
      <Body>{tip.why}</Body>
      <Body muted>{tip.how}</Body>
    </View>
  );
}

function EnvironmentalCard({
  environment,
  colors
}: {
  environment: ReturnType<typeof useEnvironmentalData>;
  colors: (typeof palettes)["light"];
}) {
  if (environment.loading) {
    return (
      <Card>
        <View style={styles.environmentHeader}>
          <View style={styles.sectionTitle}>
            <Feather name="cloud" color={colors.secondary} size={22} />
            <H2>Weather + AQI skin guide</H2>
          </View>
          <ActivityIndicator color={colors.primary} />
        </View>
        <Body muted>Checking local UV, humidity, wind, and air quality.</Body>
      </Card>
    );
  }

  if (!environment.data) {
    return (
      <Card>
        <View style={styles.sectionTitle}>
          <Feather name="alert-circle" color={colors.danger} size={22} />
          <H2>Weather + AQI skin guide</H2>
        </View>
        <Body muted>{environment.error ?? "Local environmental guidance is unavailable right now."}</Body>
      </Card>
    );
  }

  const guidance = getAqiGuidance(environment.data.aqi);
  const isPoor = environment.data.aqi > 100;

  return (
    <Card variant={isPoor ? "accent" : "soft"}>
      <View style={styles.environmentHeader}>
        <View style={styles.sectionTitle}>
          <Feather name="cloud" color={isPoor ? colors.danger : colors.secondary} size={22} />
          <H2>Weather + AQI skin guide</H2>
        </View>
        <Pill tone={guidance.tone}>AQI {environment.data.aqi} / {guidance.level}</Pill>
      </View>

      <Body>{guidance.message}</Body>
      <View style={styles.metricGrid}>
        <Metric label="Temp" value={`${Math.round(environment.data.temperature)}C`} colors={colors} />
        <Metric label="Rain" value={`${Math.round(environment.data.rainProbability)}%`} colors={colors} />
        <Metric label="UV" value={environment.data.uv.toFixed(1)} colors={colors} />
        <Metric label="Humidity" value={`${Math.round(environment.data.humidity)}%`} colors={colors} />
        <Metric label="Wind" value={`${Math.round(environment.data.wind)} km/h`} colors={colors} />
        <Metric label="PM2.5" value={`${environment.data.pm25.toFixed(1)}`} colors={colors} />
      </View>

      {isPoor ? (
        <View style={styles.ingredientBlock}>
          <Body muted>Look for Vitamin C or E, niacinamide, and ceramides tonight.</Body>
          <Body muted>These help neutralize free radicals, strengthen the barrier, and repair the skin seal against dust irritation.</Body>
        </View>
      ) : null}

      <Pill tone="primary">{environment.data.source === "gps" ? "Using your location" : "Using Kathmandu fallback"}</Pill>
    </Card>
  );
}

function WeatherActionCard({ action }: { action: WeatherAction }) {
  return (
    <SignalCard tone={action.tone} icon={action.icon} label={action.label} title={action.title}>
      {action.message}
    </SignalCard>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: (typeof palettes)["light"] }) {
  return (
    <View style={[styles.metricTile, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function QuickIconButton({
  icon,
  onPress,
  background,
  color,
  border
}: {
  icon: ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  background: string;
  color: string;
  border: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickButton, { backgroundColor: background, borderColor: border, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <Feather name={icon} color={color} size={18} />
    </Pressable>
  );
}

function QuickTextButton({
  label,
  onPress,
  background,
  color,
  border
}: {
  label: string;
  onPress: () => void;
  background: string;
  color: string;
  border: string;
  }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickTextButton, { backgroundColor: background, borderColor: border, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <Text style={{ color, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: 120, paddingTop: 122 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm, flexWrap: "wrap" },
  headerCopy: { flex: 1, minWidth: 220 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  quickActions: {
    position: "absolute",
    right: 44,
    top: spacing.md,
    zIndex: 40,
    alignItems: "flex-end",
    gap: spacing.xs
  },
  quickButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  quickButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  quickTextButton: {
    minWidth: 42,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: spacing.sm
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitleBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" },
  scoreHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" },
  scoreBubble: {
    minWidth: 154,
    maxWidth: 190,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 999,
    padding: spacing.xs,
    paddingRight: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start"
  },
  scoreBubbleDot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center"
  },
  scoreBubbleScore: { fontSize: 16, fontWeight: "900" },
  scoreBubbleCopy: { flex: 1, minWidth: 0 },
  scoreBubbleLabel: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  scoreBubbleValue: { fontSize: 14, fontWeight: "900" },
  scoreBubbleMeta: { fontSize: 11, fontWeight: "800" },
  environmentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  metricTile: { minWidth: 92, flex: 1, borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: 2 },
  metricLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  metricValue: { fontSize: 17, fontWeight: "900" },
  ingredientBlock: { gap: spacing.xs },
  concernCard: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  productLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  tipLine: { gap: spacing.xs },
  routineGroup: { gap: spacing.sm },
  routineStep: { gap: spacing.xs },
  habitPreview: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  dietBlock: { gap: spacing.xs },
  dietRow: { gap: 2 },
  remedyCard: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  floatingButton: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  }
});
