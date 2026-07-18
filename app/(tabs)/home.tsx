import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Celebration } from "@/shared/Celebration";
import { Body, BrandMark, Button, Card, DetailDisclosure, FloatingBadge, H1, H2, Pill, ProgressBar, Screen, SectionLabel, SignalCard, ToggleGroup } from "@/shared/components";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { t } from "@/shared/i18n";
import { contextualConditionDescription, generateRoutine, localized } from "@/shared/knowledge/engine";
import { dailyHabitTips } from "@/shared/knowledge/education";
import { buildPlanSections, buildTrustReasons, doctorWarning, getMatchConfidence } from "@/shared/knowledge/resultTrust";
import { calculateSkinHabitScore } from "@/shared/knowledge/tracking";
import { GeneratedStep, HomeRemedy } from "@/shared/knowledge/types";
import { buildWeatherActions, WeatherAction } from "@/shared/knowledge/weatherGuidance";
import { GlowCarousel, ImagePromoCard, marketingImages, PortraitGlowStrip } from "@/shared/marketingVisuals";
import { premiumPreviewLabel } from "@/shared/monetization";
import { launchProducts } from "@/shared/productCatalog";
import { getAqiGuidance, useEnvironmentalData } from "@/shared/services/environment";
import { scheduleCompletionPraise, scheduleDailyRoutineReminders, scheduleIncompleteStepReminder, scheduleWeatherAlerts } from "@/shared/services/notifications";
import { trackEvent } from "@/shared/services/analytics";
import { palettes, spacing } from "@/shared/theme";
import { visualCueForText } from "@/shared/visualCues";

export default function Home() {
  const { language, setLanguage, themeMode, setThemeMode, tier, profile, completion, toggleCompletion, todayCheckIn, notificationPreferences } = useApp();
  const c = palettes[themeMode];
  const scrollRef = useRef<ScrollView>(null);
  const [showTopButton, setShowTopButton] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [routinePeriod, setRoutinePeriod] = useState<"morning" | "evening">("morning");
  const [expandedConcernId, setExpandedConcernId] = useState<string | null>(null);
  const environment = useEnvironmentalData();
  const result = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const weatherActions = useMemo(() => (environment.data ? buildWeatherActions(environment.data) : []), [environment.data]);
  const visibleEvening = useMemo(() => result.evening, [result.evening]);
  const routineSteps = useMemo(() => [...result.morning, ...visibleEvening], [result.morning, visibleEvening]);
  const completed = routineSteps.filter((step) => todayCheckIn.completedStepIds.includes(step.id)).length;
  const percent = routineSteps.length ? Math.round((completed / routineSteps.length) * 100) : 0;
  const allVisibleStepsComplete = routineSteps.length > 0 && completed === routineSteps.length;
  const habitScore = useMemo(
    () => calculateSkinHabitScore({ completion, routineSteps, profile, checkIn: todayCheckIn, weatherActions }),
    [completion, profile, routineSteps, todayCheckIn, weatherActions]
  );
  const topMatch = result.matches[0];
  const activeSteps = routinePeriod === "morning" ? result.morning : visibleEvening;
  const remedies = useMemo(() => collectRemedies(topMatch ? [topMatch.condition] : []), [topMatch]);
  const topAction = result.morning[0]?.action ?? result.evening[0]?.action ?? "Start with a gentle cleanser";
  const productMatches = launchProducts
    .filter((item) => item.fit.includes(profile.skinType) && (tier === "premium" || item.budgetTier === profile.budgetTier))
    .slice(0, 3);
  const trustReasons = topMatch ? buildTrustReasons(topMatch, profile.quiz) : [];
  const planSections = useMemo(() => buildPlanSections(result, productMatches), [result, productMatches]);
  const glowPromos = useMemo(
    () => [
      { id: "glow-prabha", image: marketingImages.glowPrabha, eyebrow: "Glow with Prabha", title: "Simple routines for radiant skin ✨", body: "Your routine adapts to skin type, budget, water, makeup, and Nepal weather.", cta: "Explore Now", icon: "star" as const, emoji: "🌸" },
      { id: "bright-protected", image: marketingImages.brightProtected, eyebrow: "Stay Bright & Protected", title: "Sunscreen + weather care ☀️", body: "Daily UV, AQI, rain, sweat, and water tips without scary jargon.", cta: "Get Daily Tips", icon: "sun" as const, emoji: "🧴" },
      { id: "festive-ready", image: marketingImages.festiveReady, eyebrow: "Festive Ready Skin", title: "Dashain & Tihar glow prep 🪔", body: "A gentle plan for makeup, late nights, sweets, travel dust, and glow goals.", cta: "Get Glow Tips", icon: "zap" as const, emoji: "✨" }
    ],
    []
  );

  useEffect(() => {
    if (topMatch) {
      trackEvent("result_viewed", { condition: topMatch.condition.id, score: topMatch.score, tier });
    }
  }, [topMatch, tier]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
  }, []);

  useEffect(() => {
    if (!allVisibleStepsComplete) return;
    AsyncStorage.getItem(`prabha-celebrated-steps-${todayCheckIn.date}`).then((value) => {
      if (value) return;
      setShowCelebration(true);
      AsyncStorage.setItem(`prabha-celebrated-steps-${todayCheckIn.date}`, "yes");
      scheduleCompletionPraise(todayCheckIn.date, notificationPreferences).catch(() => undefined);
      setTimeout(() => setShowCelebration(false), reducedMotion ? 4200 : 3600);
    });
  }, [allVisibleStepsComplete, notificationPreferences, reducedMotion, todayCheckIn.date]);

  useEffect(() => {
    scheduleDailyRoutineReminders(todayCheckIn.date, notificationPreferences).catch(() => undefined);
  }, [notificationPreferences, todayCheckIn.date]);

  useEffect(() => {
    if (!environment.data) return;
    scheduleWeatherAlerts(todayCheckIn.date, environment.data, notificationPreferences).catch(() => undefined);
  }, [environment.data, notificationPreferences, todayCheckIn.date]);

  useEffect(() => {
    scheduleIncompleteStepReminder({ date: todayCheckIn.date, percent, completed, total: routineSteps.length }, notificationPreferences).catch(() => undefined);
  }, [completed, notificationPreferences, percent, routineSteps.length, todayCheckIn.date]);

  return (
    <ErrorBoundary screenName="Home">
      <Screen showQuickActions={false}>
        {showCelebration ? <Celebration reducedMotion={reducedMotion} colors={c} /> : null}
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

        <PortraitGlowStrip
          title="Your glow, your mood"
          subtitle="From college days to festivals, the plan should feel personal, pretty, and practical."
          images={[
            marketingImages.portraitCreamSmile,
            marketingImages.portraitBlueBangs,
            marketingImages.portraitGreenBindi,
            marketingImages.portraitGlowClose,
            marketingImages.portraitRedBokeh
          ]}
        />

        <GlowCarousel
          items={glowPromos}
          onItemPress={(item) => {
            if (item.id === "bright-protected") router.push("/(tabs)/tips" as never);
            else if (item.id === "festive-ready") router.push("/(tabs)/tips" as never);
          }}
        />

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

        <ImagePromoCard
          compact
          item={{
            id: "result-glow",
            image: marketingImages.cleanBeauty,
            eyebrow: "✨ Today's skin read",
            title: topMatch ? localized(language, topMatch.condition.name_en, topMatch.condition.name_ne) : "Your skin guidance is ready",
            body: `Top action: ${topAction}. Guidance only, not diagnosis.`,
            cta: "See plan",
            icon: "arrow-down",
            emoji: "🌸"
          }}
        />

        <Card>
          <H2>{language === "en" ? "Matched skin concern" : "Matched skin concern"}</H2>
          {topMatch ? (
            <>
              <View style={styles.row}>
                <Pill tone="secondary">Score {topMatch.score}</Pill>
                <Pill tone={topMatch.score >= 8 ? "secondary" : topMatch.score >= 5 ? "accent" : "primary"}>{getMatchConfidence(topMatch.score)}</Pill>
                <Pill>{topMatch.condition.severity}</Pill>
              </View>
              <H2>{localized(language, topMatch.condition.name_en, topMatch.condition.name_ne)}</H2>
              <DetailDisclosure title="Why this match?" collapsedLabel="See details" expandedLabel="Hide details" emoji="🔎">
                <Body muted>{contextualConditionDescription(topMatch.condition, profile.quiz, language)}</Body>
              </DetailDisclosure>
              <Body>{language === "en" ? "Recommended guidance only, not a medical diagnosis." : "यो recommended guidance मात्र हो, medical diagnosis होइन।"}</Body>
            </>
          ) : (
            <Body muted>{language === "en" ? "No strong condition match yet. Add more symptoms in onboarding." : "अहिले strong match छैन। onboarding मा थप symptoms छान्नुहोस्।"}</Body>
          )}
        </Card>

        {topMatch ? (
          <Card variant="seasonal">
            <View style={styles.sectionTitle}>
              <Feather name="shield" color={c.secondary} size={22} />
              <H2>Why we think this</H2>
            </View>
            <Body muted>Based on your quiz answers and daily context.</Body>
            <DetailDisclosure title="Transparent match reasons" collapsedLabel="Tap for details" expandedLabel="Hide reasons" emoji="🧠">
              {trustReasons.map((reason) => (
                <View key={reason} style={styles.reasonLine}>
                  <Feather name="check-circle" color={c.secondary} size={16} />
                  <Body>{reason}</Body>
                </View>
              ))}
            </DetailDisclosure>
          </Card>
        ) : null}

        {topMatch ? (
          <Card>
            <View style={styles.sectionTitleBetween}>
              <View style={styles.sectionTitle}>
                <Feather name="map" color={c.primary} size={22} />
                <H2>Your Plan</H2>
              </View>
              <Pill tone={tier === "premium" ? "secondary" : "accent"}>{premiumPreviewLabel(tier)}</Pill>
            </View>
            {planSections.map((section, index) => {
              const locked = tier !== "premium" && index >= 2;
              return (
                <View key={section.title} style={[styles.planTile, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
                  <Pill tone={locked ? "accent" : "primary"}>{locked ? "Premium depth" : `Step ${index + 1}`}</Pill>
                  <H2>{section.title}</H2>
                  {locked ? (
                    <Body muted>Unlock full personalized detail, local product alternatives, and weekly adjustment logic.</Body>
                  ) : (
                    <DetailDisclosure title={section.title} collapsedLabel="See full plan" expandedLabel="Hide plan" emoji="🗺️">
                      <Body muted>{section.body}</Body>
                    </DetailDisclosure>
                  )}
                  {locked ? <Button label="See premium value" onPress={() => router.push("/paywall" as never)} secondary /> : null}
                </View>
              );
            })}
          </Card>
        ) : null}

        <ImagePromoCard
          compact
          item={{
            id: "daily-glow-check",
            image: marketingImages.warmGlow,
            eyebrow: "When you're ready",
            title: "Start with the steps that matter",
            body: "Now that you know your skin read, follow a simple routine first and use tips, remedies, food, and add-ons as support.",
            cta: "Begin routine",
            icon: "check-circle",
            emoji: "✨"
          }}
        />

        <Card>
          <View style={styles.scoreHeader}>
            <View style={styles.sectionTitle}>
              <Feather name={routinePeriod === "morning" ? "sun" : "droplet"} color={routinePeriod === "morning" ? c.accent : c.secondary} size={22} />
              <H2>{language === "en" ? "Routine ritual" : "Routine ritual"}</H2>
            </View>
            <Pill tone="secondary">{`Today ${percent}% - ${completed}/${routineSteps.length} done`}</Pill>
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
          <Body muted>Core routine only: quick, doable, and not meant to feel like homework.</Body>
          <RoutineSection title={routinePeriod === "morning" ? t(language, "morning") : t(language, "evening")} icon={null} steps={activeSteps} />
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
                  {remedy.verdict === "harmful" ? "Avoid" : remedy.verdict === "safe_mild" ? "Mild" : "Safe"}
                </Pill>
                <Body>{remedy.nepali ? `${remedy.remedy} (${remedy.nepali})` : remedy.remedy}</Body>
                {remedy.frequency ? <Pill tone="primary">{remedy.frequency}</Pill> : null}
                <DetailDisclosure title="Remedy details" collapsedLabel="See more" expandedLabel="See less" emoji="🌿">
                  {remedy.ingredients ? <Body muted>Ingredients: {remedy.ingredients}</Body> : null}
                  <Body muted>{remedy.method ?? remedy.reason ?? remedy.note ?? "Use gently and stop if irritation starts."}</Body>
                  {remedy.why_it_works ? <Body muted>{remedy.why_it_works}</Body> : null}
                  {remedy.caution ? <Body muted>Caution: {remedy.caution}</Body> : null}
                </DetailDisclosure>
              </View>
            ))}
          </Card>
        ) : null}
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
                  {expanded ? (
                    <>
                      <Pill tone={match.score >= 8 ? "secondary" : match.score >= 5 ? "accent" : "primary"}>{getMatchConfidence(match.score)}</Pill>
                      <DetailDisclosure title="Concern detail" collapsedLabel="See more" expandedLabel="See less" emoji="🔎">
                        <Body muted>{contextualConditionDescription(match.condition, profile.quiz, language)}</Body>
                        <Body muted>Why: {buildTrustReasons(match, profile.quiz).slice(0, 3).join(" ")}</Body>
                      </DetailDisclosure>
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {topMatch ? (
          <Card>
            <View style={styles.sectionTitle}>
              <Feather name="alert-triangle" color={c.danger} size={22} />
              <H2>Doctor warning signs</H2>
            </View>
            <DetailDisclosure title="Safety notes" collapsedLabel="See warning signs" expandedLabel="Hide warning signs" emoji="⚕️">
              <Body>{doctorWarning(topMatch)}</Body>
              <Body muted>Guidance only, not diagnosis. Painful, spreading, infected, or scarring concerns deserve medical care.</Body>
            </DetailDisclosure>
          </Card>
        ) : null}

        {result.contextTips.length > 0 ? (
          <Card>
            <View style={styles.sectionTitle}>
              <Feather name="star" color={c.accent} size={22} />
              <H2>{language === "en" ? "Lifestyle notes for you" : "Lifestyle notes"}</H2>
            </View>
            <Body muted>Short signals from your routine, food, sleep, stress, and habits.</Body>
            {result.contextTips.map((tip) => (
              <SignalCard
                key={`${tip.category}-${tip.text.en}`}
                tone={tip.category === "smoking" || tip.category === "alcohol" ? "warning" : "tip"}
                icon={lifestyleNoteIcon(tip.category)}
                label={tip.category}
                title={`${lifestyleNoteEmoji(tip.category)} ${lifestyleNoteTitle(tip.category)}`}
              >
                {tip.text[language]}
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
            <Button label="View all" onPress={() => router.push("/(tabs)/tips" as never)} secondary />
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
                <DetailDisclosure collapsedLabel="How to use this add-on" expandedLabel="Hide add-on" emoji="🗓️">
                  <Body muted>{step.instruction[language]}</Body>
                </DetailDisclosure>
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
            <Button label={t(language, "upgrade")} onPress={() => router.push("/paywall" as never)} secondary />
          )}
        </Card>

        <Card>
          <H2>{language === "en" ? "Local diet guidance" : "Local diet guidance"}</H2>
          <View style={styles.dietBlock}>
            <Pill tone="secondary">{language === "en" ? "Do" : "गर्नुहोस्"}</Pill>
            {result.dietEatMore.slice(0, 3).map((food) => (
              <View key={food.food_en} style={styles.dietRow}>
                <Body>
                  {visualCueForText(food.food_en, food.food_ne)} {localized(language, food.food_en, food.food_ne)}
                </Body>
                <DetailDisclosure collapsedLabel="Why?" expandedLabel="Hide why" emoji="🥗">
                  <Body muted>{localized(language, food.reason_en ?? "", food.reason_ne)}</Body>
                </DetailDisclosure>
              </View>
            ))}
          </View>
          <View style={styles.dietBlock}>
            <Pill tone="danger">{language === "en" ? "Don't" : "नगर्नुहोस्"}</Pill>
            {result.dietAvoid.slice(0, 2).map((food) => (
              <View key={food.food_en} style={styles.dietRow}>
                <Body>{visualCueForText(food.food_en, food.food_ne)} {localized(language, food.food_en, food.food_ne)}</Body>
                <DetailDisclosure collapsedLabel="Why?" expandedLabel="Hide why" emoji="⚡">
                  <Body muted>{localized(language, food.reason_en ?? "", food.reason_ne)}</Body>
                </DetailDisclosure>
              </View>
            ))}
          </View>
        </Card>



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
    </ErrorBoundary>
  );

  function RoutineSection({ title, icon, steps }: { title: string; icon: ReactNode | null; steps: GeneratedStep[] }) {
    return (
      <View style={styles.routineGroup}>
        <View style={styles.sectionTitle}>
          {icon ? icon : null}
          <H2>{title}</H2>
        </View>
        {steps.map((step, index) => {
          const locked = tier !== "premium" && index >= 3;
          return (
            <View
              key={step.id}
              style={[
                styles.routineStep,
                {
                  borderColor: todayCheckIn.completedStepIds.includes(step.id) ? c.borderStrong : c.border,
                  backgroundColor: todayCheckIn.completedStepIds.includes(step.id) ? c.primarySoft : c.surfaceAlt
                },
                locked && { borderColor: c.border, backgroundColor: c.surfaceAlt }
              ]}
            >
              {locked ? (
                <>
                  <Pill tone="accent">Premium step</Pill>
                  <Body>{step.action}</Body>
                  <Body muted>Unlock optional add-ons, not a huge daily routine.</Body>
                  <Button label="Unlock full routine" onPress={() => router.push("/paywall" as never)} secondary />
                </>
              ) : (
                <>
                  <View style={styles.stepHintRow}>
                    <Feather name={todayCheckIn.completedStepIds.includes(step.id) ? "check-circle" : "circle"} color={todayCheckIn.completedStepIds.includes(step.id) ? c.secondary : c.muted} size={16} />
                    <Body muted>{todayCheckIn.completedStepIds.includes(step.id) ? "Completed" : "Tap when completed"}</Body>
                  </View>
                  <Button label={`${todayCheckIn.completedStepIds.includes(step.id) ? "Done: " : ""}${step.action}`} onPress={() => toggleCompletion(step.id)} secondary={!todayCheckIn.completedStepIds.includes(step.id)} />
                  <DetailDisclosure collapsedLabel="How to do it" expandedLabel="Hide how" emoji="✨">
                    <Body muted>{step.instruction[language]}</Body>
                  </DetailDisclosure>
                  {step.durationSeconds ? <Pill tone="primary">{step.durationSeconds}s</Pill> : null}
                </>
              )}
            </View>
          );
        })}
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
      <H2>{visualCueForText(tip.title, tip.why, tip.how)} {tip.title}</H2>
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

function lifestyleNoteIcon(category: string): ComponentProps<typeof Feather>["name"] {
  const value = category.toLowerCase();
  if (value.includes("sleep")) return "moon";
  if (value.includes("water") || value.includes("hydration")) return "droplet";
  if (value.includes("diet") || value.includes("food") || value.includes("junk")) return "coffee";
  if (value.includes("stress")) return "activity";
  if (value.includes("screen")) return "smartphone";
  if (value.includes("smoking") || value.includes("alcohol")) return "alert-triangle";
  return "heart";
}

function lifestyleNoteEmoji(category: string) {
  const value = category.toLowerCase();
  if (value.includes("sleep")) return "🌙";
  if (value.includes("water") || value.includes("hydration")) return "💧";
  if (value.includes("diet") || value.includes("food")) return "🥗";
  if (value.includes("junk")) return "🍟";
  if (value.includes("stress")) return "🧘";
  if (value.includes("screen")) return "📱";
  if (value.includes("smoking")) return "🚭";
  if (value.includes("alcohol")) return "⚠️";
  return "✨";
}

function lifestyleNoteTitle(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  reasonLine: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  planTile: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  productLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  tipLine: { gap: spacing.xs },
  routineGroup: { gap: spacing.sm },
  routineStep: { gap: spacing.xs, borderWidth: 1, borderRadius: 8, padding: spacing.sm },
  stepHintRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
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

