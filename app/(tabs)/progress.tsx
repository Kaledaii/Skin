import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ComponentProps } from "react";
import { AccessibilityInfo, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Celebration } from "@/shared/Celebration";
import { Body, BrandMark, Button, Card, DetailDisclosure, H1, H2, Pill, ProgressBar, Screen, SectionLabel, SignalCard, ToggleGroup } from "@/shared/components";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { t } from "@/shared/i18n";
import { generateRoutine } from "@/shared/knowledge/engine";
import { buildLifestyleSignals } from "@/shared/knowledge/lifestyleSignals";
import { calculateSkinHabitScore } from "@/shared/knowledge/tracking";
import { buildWeeklySkinReport } from "@/shared/knowledge/weeklyReport";
import { buildWeatherActions } from "@/shared/knowledge/weatherGuidance";
import { ImagePromoCard, marketingImages } from "@/shared/marketingVisuals";
import { useEnvironmentalData } from "@/shared/services/environment";
import { palettes, spacing } from "@/shared/theme";
import { DailyCheckIn } from "@/shared/types";

const scoreExplanations = {
  Routine: "Up to 30 points from completed routine steps.",
  Care: "Up to 20 points from SPF and makeup removal.",
  Lifestyle: "Up to 20 points from stress, movement, junk food, screen time, smoking, and alcohol.",
  Weather: "Up to 10 points from today's UV, AQI, rain, humidity, and weather actions.",
  "Food/water/sleep": "Up to 15 points from today's water and sleep.",
  Logs: "Up to 5 points from selfie, skin note, and mood note."
} satisfies Record<string, string>;

export default function Progress() {
  const { language, themeMode, tier, profile, completion, todayCheckIn, updateTodayCheckIn, pickSelfieFromCamera, pickSelfieFromLibrary } = useApp();
  const c = palettes[themeMode];
  const premiumLocked = tier !== "premium";
  const environment = useEnvironmentalData();
  const [activeScoreInfo, setActiveScoreInfo] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const routine = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const weatherActions = useMemo(() => (environment.data ? buildWeatherActions(environment.data) : []), [environment.data]);
  const routineSteps = useMemo(() => [...routine.morning, ...routine.evening], [routine.evening, routine.morning]);
  const completedSteps = routineSteps.filter((step) => todayCheckIn.completedStepIds.includes(step.id)).length;
  const allVisibleStepsComplete = routineSteps.length > 0 && completedSteps === routineSteps.length;
  const habitScore = calculateSkinHabitScore({ completion, routineSteps, profile, checkIn: todayCheckIn, weatherActions });
  const lifestyleSignals = useMemo(() => buildLifestyleSignals(profile, todayCheckIn), [profile, todayCheckIn]);
  const weeklyReport = useMemo(() => buildWeeklySkinReport(profile, todayCheckIn, habitScore), [profile, todayCheckIn, habitScore]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
  }, []);

  useEffect(() => {
    if (!allVisibleStepsComplete) return;
    AsyncStorage.getItem(`prabha-celebrated-steps-${todayCheckIn.date}`).then((value) => {
      if (value) return;
      setShowCelebration(true);
      AsyncStorage.setItem(`prabha-celebrated-steps-${todayCheckIn.date}`, "yes");
      setTimeout(() => setShowCelebration(false), reducedMotion ? 4200 : 3600);
    });
  }, [allVisibleStepsComplete, reducedMotion, todayCheckIn.date]);

  return (
    <ErrorBoundary screenName="Progress">
      <Screen>
        {showCelebration ? <Celebration reducedMotion={reducedMotion} colors={c} /> : null}
        <ScrollView contentContainerStyle={styles.content}>
        <H1>{t(language, "progress")}</H1>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">Skin Habit Score</SectionLabel>
              <H2>{habitScore.score}/100 today</H2>
              <Body muted>Gentle score from routine, skin care basics, lifestyle, weather readiness, food/water/sleep, and logs.</Body>
            </View>
          </View>
          <ProgressBar value={habitScore.score} color={habitScore.score >= 75 ? c.secondary : c.primary} />
          <View style={styles.scoreGrid}>
            <ScoreTile label="Routine" value={habitScore.parts.routine} total={30} />
            <ScoreTile label="Care" value={habitScore.parts.care} total={20} />
            <ScoreTile label="Lifestyle" value={habitScore.parts.lifestyle} total={20} />
            <ScoreTile label="Weather" value={habitScore.parts.weather} total={10} />
            <ScoreTile label="Food/water/sleep" value={habitScore.parts.wellness} total={15} />
            <ScoreTile label="Logs" value={habitScore.parts.logs} total={5} />
          </View>
        </Card>

        <Card>
          <H2>Glow journey</H2>
          <View style={styles.milestoneRow}>
            <Milestone label="Day 1" detail="Skin check done" active />
            <Milestone label="Day 7" detail="Tiny wins" active={completedSteps > 0 || Boolean(todayCheckIn.skinNote || todayCheckIn.moodNote)} />
            <Milestone label="Day 15" detail="Glow check" active={false} />
            <Milestone label="Day 30" detail="Routine refresh" active={false} />
          </View>
          <H2>Why this score?</H2>
          <DetailDisclosure title="Score reasons" collapsedLabel="See reasons" expandedLabel="Hide reasons" emoji="📈">
          {habitScore.reasons.map((reason) => (
            <Body key={reason}>• {reason}</Body>
          ))}
          </DetailDisclosure>
        </Card>

        <Card variant="seasonal">
          <View style={styles.heroRow}>
            <Feather name="file-text" color={c.primary} size={22} />
            <View style={styles.flex}>
              <H2>{premiumLocked ? "📊 Weekly Insights (Premium)" : "📊 Your Weekly Skin Report"}</H2>
              <DetailDisclosure collapsedLabel={premiumLocked ? "Preview report" : "See weekly summary"} expandedLabel="Hide report" emoji="📝">
                <Body muted>{premiumLocked ? "Unlock premium to see your best habits, weak spots, likely triggers, and personalized next-week focus." : weeklyReport.summary}</Body>
              </DetailDisclosure>
            </View>
          </View>
          {premiumLocked ? (
            <View style={styles.previewGrid}>
              <Pill tone="primary">Best habit</Pill>
              <Body>Unlock to see which habit is helping most this week.</Body>
              <Pill tone="accent">Unlock premium for 6 more insights →</Pill>
            </View>
          ) : (
            <View style={styles.reportGrid}>
              <ReportTile label="Best habit" value={weeklyReport.bestHabit} locked={false} />
              <ReportTile label="Weakest habit" value={weeklyReport.weakestHabit} locked={false} />
              <ReportTile label="Likely trigger" value={weeklyReport.likelyTrigger} locked={false} />
              <ReportTile label="Why it changed" value={weeklyReport.whyChanged} locked={false} />
              <ReportTile label="Next week focus" value={weeklyReport.nextWeekFocus} locked={false} />
              <ReportTile label="Routine/product adjustment" value={weeklyReport.productAdjustment} locked={false} />
              <ReportTile label="Suggested mode" value={weeklyReport.modeSuggestion} locked={false} />
            </View>
          )}
          {!premiumLocked ? (
            <View style={styles.reportTile}>
              <Pill tone="secondary">7-day focus</Pill>
              {weeklyReport.sevenDayPlan.map((item) => (
                <Body key={item} muted>- {item}</Body>
              ))}
            </View>
          ) : null}
          {premiumLocked ? <Button label="Unlock weekly report" onPress={() => router.push("/paywall" as never)} /> : null}
          {!premiumLocked ? <Button label="Share progress report" onPress={() => shareReport(weeklyReport.summary, habitScore.score)} secondary /> : null}
        </Card>

        <ImagePromoCard
          item={{
            id: "track-your-glow",
            image: marketingImages.trackGlow,
            eyebrow: "Track Your Glow 📈",
            title: "Monitor your skin's progress",
            body: "Small daily habits become visible over weeks. Compare kindly, not obsessively.",
            cta: "Log Your Progress",
            icon: "activity",
            emoji: "✨"
          }}
        />

        <Card>
          <H2>Today's glow check</H2>
          <View style={styles.checkRow}>
            <CheckPill label="SPF done" icon="sun" active={todayCheckIn.sunscreen} onPress={() => updateTodayCheckIn({ sunscreen: !todayCheckIn.sunscreen })} />
            <CheckPill label="Makeup removed" icon="check-circle" active={todayCheckIn.makeupRemoved} onPress={() => updateTodayCheckIn({ makeupRemoved: !todayCheckIn.makeupRemoved })} />
            <CheckPill label="Smoked today" icon="alert-triangle" active={todayCheckIn.smoked} danger onPress={() => updateTodayCheckIn({ smoked: !todayCheckIn.smoked })} />
            <CheckPill label="Alcohol today" icon="x-circle" active={todayCheckIn.alcohol} danger onPress={() => updateTodayCheckIn({ alcohol: !todayCheckIn.alcohol })} />
          </View>
          <H2>Water</H2>
          <ToggleGroup
            value={todayCheckIn.water}
            options={[
              { label: "<1L", value: "less_than_1" },
              { label: "1-2L", value: "1_to_2" },
              { label: "2L+", value: "more_than_2" }
            ]}
            onChange={(water) => updateTodayCheckIn({ water })}
          />
          <H2>Sleep</H2>
          <ToggleGroup
            value={todayCheckIn.sleep}
            options={[
              { label: "<5h", value: "less_than_5" },
              { label: "5-6h", value: "5_to_6" },
              { label: "6-8h", value: "6_to_8" },
              { label: "8h+", value: "more_than_8" }
            ]}
            onChange={(sleep) => updateTodayCheckIn({ sleep })}
          />
          <H2>Stress today</H2>
          <ToggleGroup
            value={todayCheckIn.stressToday ?? profile.quiz.lifestyle.stress_level}
            options={[
              { label: "Low", value: "low" },
              { label: "Moderate", value: "moderate" },
              { label: "High", value: "high" }
            ]}
            onChange={(stressToday) => updateTodayCheckIn({ stressToday: stressToday as DailyCheckIn["stressToday"] })}
          />
          <H2>Screen time today</H2>
          <ToggleGroup
            value={todayCheckIn.screenTimeToday ?? profile.quiz.lifestyle.screen_time_hours}
            options={[
              { label: "<3h", value: "less_than_3" },
              { label: "3-6h", value: "3_to_6" },
              { label: "6h+", value: "more_than_6" }
            ]}
            onChange={(screenTimeToday) => updateTodayCheckIn({ screenTimeToday: screenTimeToday as DailyCheckIn["screenTimeToday"] })}
          />
          <H2>Movement today</H2>
          <ToggleGroup
            value={todayCheckIn.movementToday ?? profile.quiz.lifestyle.exercise}
            options={[
              { label: "None", value: "none" },
              { label: "Some", value: "occasional" },
              { label: "Regular", value: "regular" }
            ]}
            onChange={(movementToday) => updateTodayCheckIn({ movementToday: movementToday as DailyCheckIn["movementToday"] })}
          />
          <TextInput
            value={todayCheckIn.skinNote ?? ""}
            onChangeText={(skinNote) => updateTodayCheckIn({ skinNote })}
            placeholder="Skin note: oily, dry, puffy, glowing..."
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <TextInput
            value={todayCheckIn.moodNote ?? ""}
            onChangeText={(moodNote) => updateTodayCheckIn({ moodNote })}
            placeholder="Mood/stress note"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
        </Card>

        <Card>
          <H2>Your Lifestyle Signals</H2>
          <Body muted>Quiz answers and today check-in both count, but today's toggles do not overwrite your profile.</Body>
          <DetailDisclosure collapsedLabel="See lifestyle signals" expandedLabel="Hide signals" emoji="🧭">
            {lifestyleSignals.map((signal) => (
              <SignalCard key={signal.id} tone={signal.tone} icon={signal.icon} label={signal.label} title={signal.title}>
                {signal.body}
              </SignalCard>
            ))}
          </DetailDisclosure>
        </Card>

        <Card>
          <H2>Weather readiness</H2>
          <Body muted>{environment.loading ? "Checking today's weather..." : "Mark the weather actions you are prepared for today."}</Body>
          <DetailDisclosure collapsedLabel="See weather actions" expandedLabel="Hide weather actions" emoji="🌦️">
          {weatherActions.map((action) => {
            const ids = todayCheckIn.weatherActionIds ?? [];
            const active = ids.includes(action.id) || (action.autoSatisfiedBy === "sunscreen" && todayCheckIn.sunscreen);
            return (
              <View key={action.id} style={styles.weatherAction}>
                <SignalCard tone={active ? "success" : action.tone} icon={action.icon} label={action.label} title={action.title}>
                  {action.message}
                </SignalCard>
                {action.id !== "weather-steady" ? (
                  <CheckPill
                    label={active ? "Prepared" : "Mark prepared"}
                    icon={active ? "check-circle" : "shield"}
                    active={active}
                    onPress={() => {
                      const next = active ? ids.filter((id) => id !== action.id) : [...ids, action.id];
                      updateTodayCheckIn({ weatherActionIds: next });
                    }}
                  />
                ) : null}
              </View>
            );
          })}
          </DetailDisclosure>
        </Card>

        <Card>
          <H2>{language === "en" ? "Weekly photo log" : "Weekly photo log"}</H2>
          {profile.selfieUri ? <Image source={{ uri: profile.selfieUri }} style={styles.selfie} /> : <Body muted>{language === "en" ? "No selfie added yet." : "Selfie add gareko chhaina."}</Body>}
          <View style={styles.photoActions}>
            <Button label={language === "en" ? "Take photo" : "Photo khichnuhos"} onPress={pickSelfieFromCamera} secondary />
            <Button label={language === "en" ? "Choose from gallery" : "Gallery bata channuhos"} onPress={pickSelfieFromLibrary} secondary />
          </View>
        </Card>

        <Card>
          <H2>Photo timeline preview</H2>
          <Body muted>Weekly photos stay private and help you compare lighting, marks, dryness, and glow over time.</Body>
          <View style={styles.timelineRow}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[styles.timelineSlot, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
                {index === 0 && profile.selfieUri ? <Image source={{ uri: profile.selfieUri }} style={styles.timelineImage} /> : <Feather name="camera" color={c.muted} size={20} />}
                <Text style={[styles.scoreLabel, { color: c.muted }]}>Week {index + 1}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <H2>{language === "en" ? "Consistency" : "Consistency"}</H2>
          <Body>{`You completed ${habitScore.parts.routine}/30 routine points today. Keep it kind and consistent.`}</Body>
          <View style={styles.habitCardGrid}>
            <ProgressHabitCard icon="check-circle" label="Routine" value={`${completedSteps}/${routineSteps.length}`} detail={`${habitScore.parts.routine}/30 routine points`} colors={c} />
            <ProgressHabitCard icon="sun" label="Sunscreen" value={todayCheckIn.sunscreen ? "Done" : "Not yet"} detail="Dark marks need daily protection." colors={c} />
            <ProgressHabitCard icon="droplet" label="Water" value={humanWater(todayCheckIn.water)} detail="Hydration supports recovery." colors={c} />
            <ProgressHabitCard icon="moon" label="Sleep" value={humanSleep(todayCheckIn.sleep)} detail="Skin repairs better with rest." colors={c} />
            <ProgressHabitCard icon="edit-3" label="Check-in" value={todayCheckIn.skinNote || todayCheckIn.moodNote ? "Logged" : "Add note"} detail="Notes make weekly patterns clearer." colors={c} />
            <ProgressHabitCard icon="camera" label="Photo log" value={profile.selfieUri || todayCheckIn.selfieUri ? "Added" : "Optional"} detail="Compare weekly, not daily." colors={c} />
          </View>
          {premiumLocked ? <Button label={t(language, "upgrade")} onPress={() => router.push("/paywall" as never)} secondary /> : null}
        </Card>
      </ScrollView>
    </Screen>
    </ErrorBoundary>
  );

  function ScoreTile({ label, value, total }: { label: keyof typeof scoreExplanations; value: number; total: number }) {
    const active = activeScoreInfo === label;
    return (
      <Pressable
        onPress={() => setActiveScoreInfo(active ? null : label)}
        onHoverIn={() => setActiveScoreInfo(label)}
        onHoverOut={() => setActiveScoreInfo((current) => (current === label ? null : current))}
        style={({ pressed }) => [
          styles.scoreTile,
          {
            backgroundColor: c.surfaceAlt,
            borderColor: active ? c.borderStrong : c.border,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
      >
        <Text style={[styles.scoreValue, { color: c.text }]}>{value}/{total}</Text>
        <Text style={[styles.scoreLabel, { color: c.muted }]}>{label}</Text>
        {active ? (
          <View style={[styles.scoreTooltip, { backgroundColor: themeMode === "dark" ? c.surfaceAlt : c.deep, borderColor: c.borderStrong }]}>
            <Text style={[styles.scoreTooltipText, { color: themeMode === "dark" ? c.text : "#FFFFFF" }]}>{scoreExplanations[label]}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  function ReportTile({ label, value, locked }: { label: string; value: string; locked: boolean }) {
    return (
      <View style={[styles.reportTile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <Pill tone={locked ? "accent" : "secondary"}>{locked ? "Premium" : label}</Pill>
        <Body muted>{locked ? "Unlock to see personalized weekly detail." : value}</Body>
      </View>
    );
  }

  function CheckPill({ label, icon, active, danger = false, onPress }: { label: string; icon: ComponentProps<typeof Feather>["name"]; active: boolean; danger?: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.checkPill,
          {
            backgroundColor: active ? (danger ? c.danger : c.secondary) : c.surfaceAlt,
            borderColor: active ? (danger ? c.danger : c.secondary) : c.border,
            transform: [{ scale: pressed ? 0.97 : 1 }]
          }
        ]}
      >
        <Feather name={icon} color={active ? "#FFFFFF" : danger ? c.danger : c.text} size={15} />
        <Text style={[styles.checkText, { color: active ? "#FFFFFF" : c.text }]}>{label}</Text>
      </Pressable>
    );
  }
}

async function shareReport(summary: string, score: number) {
  await Share.share({ message: `Prabha weekly skin report\nScore: ${score}/100\n${summary}\nGuidance only, not diagnosis.` });
}

function ProgressHabitCard({
  icon,
  label,
  value,
  detail,
  colors
}: {
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  detail: string;
  colors: (typeof palettes)["light"];
}) {
  return (
    <View style={[styles.habitProgressCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={styles.habitProgressHeader}>
        <Feather name={icon} color={colors.primary} size={18} />
        <Text style={[styles.habitProgressLabel, { color: colors.muted }]}>{label}</Text>
      </View>
      <Text style={[styles.habitProgressValue, { color: colors.text }]}>{value}</Text>
      <Body muted>{detail}</Body>
    </View>
  );
}

function Milestone({ label, detail, active }: { label: string; detail: string; active: boolean }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.milestone, { backgroundColor: active ? c.primarySoft : c.surfaceAlt, borderColor: active ? c.borderStrong : c.border }]}>
      <Pill tone={active ? "secondary" : "primary"}>{active ? "Done" : "Next"}</Pill>
      <Text style={[styles.milestoneLabel, { color: c.text }]}>{label}</Text>
      <Text style={[styles.milestoneDetail, { color: c.muted }]}>{detail}</Text>
    </View>
  );
}

function humanWater(value: DailyCheckIn["water"]) {
  if (value === "less_than_1") return "<1L";
  if (value === "more_than_2") return "2L+";
  return "1-2L";
}

function humanSleep(value: DailyCheckIn["sleep"]) {
  if (value === "less_than_5") return "<5h";
  if (value === "5_to_6") return "5-6h";
  if (value === "more_than_8") return "8h+";
  return "6-8h";
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  scoreTile: { minWidth: 96, flex: 1, borderWidth: 1, borderRadius: 12, padding: spacing.sm, gap: 2, position: "relative", zIndex: 1 },
  scoreValue: { fontSize: 17, fontWeight: "900" },
  scoreLabel: { fontSize: 12, fontWeight: "800" },
  scoreTooltip: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.xs,
    marginBottom: 6,
    zIndex: 30,
    elevation: 6
  },
  scoreTooltipText: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  previewGrid: { gap: spacing.xs },
  reportGrid: { gap: spacing.xs },
  reportTile: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  milestoneRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  milestone: { flex: 1, minWidth: 132, borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  milestoneLabel: { fontSize: 16, fontWeight: "900" },
  milestoneDetail: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  checkRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  checkPill: { minHeight: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.xs },
  checkText: { fontSize: 13, fontWeight: "800" },
  weatherAction: { gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  selfie: { width: "100%", height: 240, borderRadius: 8 },
  photoActions: { gap: spacing.xs },
  timelineRow: { flexDirection: "row", gap: spacing.xs },
  timelineSlot: { flex: 1, minHeight: 92, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", gap: spacing.xs, overflow: "hidden" },
  timelineImage: { width: "100%", height: 66 },
  habitCardGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  habitProgressCard: { flex: 1, minWidth: 142, borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  habitProgressHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  habitProgressLabel: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  habitProgressValue: { fontSize: 18, fontWeight: "900" }
});
