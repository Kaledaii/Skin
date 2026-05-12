import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ComponentProps } from "react";
import { AccessibilityInfo, Animated, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, ProgressBar, Screen, SectionLabel, SignalCard, ToggleGroup } from "@/shared/components";
import { routineLogs } from "@/shared/data";
import { t } from "@/shared/i18n";
import { generateRoutine } from "@/shared/knowledge/engine";
import { buildLifestyleSignals } from "@/shared/knowledge/lifestyleSignals";
import { calculateSkinHabitScore } from "@/shared/knowledge/tracking";
import { buildWeeklySkinReport } from "@/shared/knowledge/weeklyReport";
import { buildWeatherActions } from "@/shared/knowledge/weatherGuidance";
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
  const { language, themeMode, tier, setTier, profile, completion, todayCheckIn, updateTodayCheckIn, pickSelfie } = useApp();
  const c = palettes[themeMode];
  const premiumLocked = tier !== "premium";
  const environment = useEnvironmentalData();
  const [activeScoreInfo, setActiveScoreInfo] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const routine = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const weatherActions = useMemo(() => (environment.data ? buildWeatherActions(environment.data) : []), [environment.data]);
  const habitScore = calculateSkinHabitScore({ completion, routineSteps: [...routine.morning, ...routine.evening], profile, checkIn: todayCheckIn, weatherActions });
  const lifestyleSignals = useMemo(() => buildLifestyleSignals(profile, todayCheckIn), [profile, todayCheckIn]);
  const weeklyReport = useMemo(() => buildWeeklySkinReport(profile, todayCheckIn, habitScore), [profile, todayCheckIn, habitScore]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (habitScore.score < 100) return;
    AsyncStorage.getItem(`prabha-celebrated-${today}`).then((value) => {
      if (value) return;
      setShowCelebration(true);
      AsyncStorage.setItem(`prabha-celebrated-${today}`, "yes");
      setTimeout(() => setShowCelebration(false), reducedMotion ? 4200 : 3600);
    });
  }, [habitScore.score, reducedMotion]);

  return (
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
          <H2>Why this score?</H2>
          {habitScore.reasons.map((reason) => (
            <Body key={reason}>• {reason}</Body>
          ))}
        </Card>

        <Card variant="seasonal">
          <View style={styles.heroRow}>
            <Feather name="file-text" color={c.primary} size={22} />
            <View style={styles.flex}>
              <H2>Weekly Skin Report</H2>
              <Body muted>{premiumLocked ? "Premium preview: unlock the full weekly insight and next-week focus." : weeklyReport.summary}</Body>
            </View>
          </View>
          <View style={styles.reportGrid}>
            <ReportTile label="Best habit" value={weeklyReport.bestHabit} locked={false} />
            <ReportTile label="Weakest habit" value={weeklyReport.weakestHabit} locked={premiumLocked} />
            <ReportTile label="Likely trigger" value={weeklyReport.likelyTrigger} locked={premiumLocked} />
            <ReportTile label="Why it changed" value={weeklyReport.whyChanged} locked={premiumLocked} />
            <ReportTile label="Next week focus" value={weeklyReport.nextWeekFocus} locked={premiumLocked} />
            <ReportTile label="Routine/product adjustment" value={weeklyReport.productAdjustment} locked={premiumLocked} />
            <ReportTile label="Suggested mode" value={weeklyReport.modeSuggestion} locked={premiumLocked} />
          </View>
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

        <Card>
          <H2>Today's check-in</H2>
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
          {lifestyleSignals.map((signal) => (
            <SignalCard key={signal.id} tone={signal.tone} icon={signal.icon} label={signal.label} title={signal.title}>
              {signal.body}
            </SignalCard>
          ))}
        </Card>

        <Card>
          <H2>Weather readiness</H2>
          <Body muted>{environment.loading ? "Checking today's weather..." : "Mark the weather actions you are prepared for today."}</Body>
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
        </Card>

        <Card>
          <H2>{language === "en" ? "Weekly photo log" : "Weekly photo log"}</H2>
          {profile.selfieUri ? <Image source={{ uri: profile.selfieUri }} style={styles.selfie} /> : <Body muted>{language === "en" ? "No selfie added yet." : "Selfie add gareko chhaina."}</Body>}
          <Button label={language === "en" ? "Add weekly selfie" : "weekly selfie thapnuhos"} onPress={pickSelfie} secondary />
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
          {premiumLocked ? (
            <>
              <Pill>{t(language, "premium")}</Pill>
              <Body muted>{language === "en" ? "Graphs unlock with premium." : "Graphs premium ma unlock huncha."}</Body>
              <Button label={t(language, "upgrade")} onPress={() => setTier("premium")} />
            </>
          ) : (
            <LineChart
              data={{
                labels: routineLogs.map((item) => item.date),
                datasets: [
                  { data: routineLogs.map((item) => item.hydration), color: () => c.secondary },
                  { data: routineLogs.map((item) => item.sleep), color: () => c.primary }
                ],
                legend: ["Hydration", "Sleep"]
              }}
              width={330}
              height={220}
              yAxisSuffix="/10"
              chartConfig={{
                backgroundColor: c.surface,
                backgroundGradientFrom: c.surface,
                backgroundGradientTo: c.surface,
                decimalPlaces: 0,
                color: () => c.text,
                labelColor: () => c.muted
              }}
              bezier
              style={styles.chart}
            />
          )}
        </Card>
      </ScrollView>
    </Screen>
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

function Celebration({ reducedMotion, colors }: { reducedMotion: boolean; colors: (typeof palettes)["light"] }) {
  const values = useRef(Array.from({ length: 18 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.stagger(
      26,
      values.map((value) =>
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 900, useNativeDriver: true })
        ])
      )
    ).start();
  }, [reducedMotion, values]);

  return (
    <View style={styles.celebrationOverlay} pointerEvents="none">
      <View style={[styles.celebrationCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
        <Text style={[styles.celebrationTitle, { color: colors.text }]}>100/100 today</Text>
        <Text style={[styles.celebrationText, { color: colors.muted }]}>Perfect habit score. Keep it gentle, not obsessive.</Text>
      </View>
      {!reducedMotion
        ? values.map((value, index) => {
            const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [0, -190 - (index % 5) * 18] });
            const translateX = value.interpolate({ inputRange: [0, 1], outputRange: [0, (index % 2 === 0 ? 1 : -1) * (34 + index * 6)] });
            const opacity = value.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 0] });
            return <Animated.View key={index} style={[styles.confettiPiece, { backgroundColor: index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accent, opacity, transform: [{ translateX }, { translateY }, { rotate: `${index * 21}deg` }] }]} />;
          })
        : null}
    </View>
  );
}

async function shareReport(summary: string, score: number) {
  await Share.share({ message: `Prabha weekly skin report\nScore: ${score}/100\n${summary}\nGuidance only, not diagnosis.` });
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
  reportGrid: { gap: spacing.xs },
  reportTile: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  checkRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  checkPill: { minHeight: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.xs },
  checkText: { fontSize: 13, fontWeight: "800" },
  weatherAction: { gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  selfie: { width: "100%", height: 240, borderRadius: 8 },
  timelineRow: { flexDirection: "row", gap: spacing.xs },
  timelineSlot: { flex: 1, minHeight: 92, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", gap: spacing.xs, overflow: "hidden" },
  timelineImage: { width: "100%", height: 66 },
  chart: { borderRadius: 8, alignSelf: "center" },
  celebrationOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, alignItems: "center", justifyContent: "center" },
  celebrationCard: { borderWidth: 1, borderRadius: 16, padding: spacing.lg, alignItems: "center", gap: spacing.xs, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  celebrationTitle: { fontSize: 26, fontWeight: "900" },
  celebrationText: { fontSize: 14, fontWeight: "700" },
  confettiPiece: { position: "absolute", width: 12, height: 18, borderRadius: 3 }
});
