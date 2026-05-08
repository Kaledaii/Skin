import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useMemo } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, ProgressBar, Screen, SectionLabel, SignalCard, ToggleGroup } from "@/shared/components";
import { routineLogs } from "@/shared/data";
import { t } from "@/shared/i18n";
import { generateRoutine } from "@/shared/knowledge/engine";
import { buildLifestyleSignals } from "@/shared/knowledge/lifestyleSignals";
import { calculateSkinHabitScore } from "@/shared/knowledge/tracking";
import { buildWeatherActions } from "@/shared/knowledge/weatherGuidance";
import { useEnvironmentalData } from "@/shared/services/environment";
import { palettes, spacing } from "@/shared/theme";

export default function Progress() {
  const { language, themeMode, tier, setTier, profile, completion, todayCheckIn, updateTodayCheckIn, pickSelfie } = useApp();
  const c = palettes[themeMode];
  const premiumLocked = tier !== "premium";
  const environment = useEnvironmentalData();
  const routine = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const weatherActions = useMemo(() => (environment.data ? buildWeatherActions(environment.data) : []), [environment.data]);
  const habitScore = calculateSkinHabitScore({ completion, routineSteps: [...routine.morning, ...routine.evening], profile, checkIn: todayCheckIn, weatherActions });
  const lifestyleSignals = useMemo(() => buildLifestyleSignals(profile, todayCheckIn), [profile, todayCheckIn]);

  return (
    <Screen>
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

  function ScoreTile({ label, value, total }: { label: string; value: number; total: number }) {
    return (
      <View style={[styles.scoreTile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <Text style={[styles.scoreValue, { color: c.text }]}>{value}/{total}</Text>
        <Text style={[styles.scoreLabel, { color: c.muted }]}>{label}</Text>
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

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  scoreTile: { minWidth: 96, flex: 1, borderWidth: 1, borderRadius: 12, padding: spacing.sm, gap: 2 },
  scoreValue: { fontSize: 17, fontWeight: "900" },
  scoreLabel: { fontSize: 12, fontWeight: "800" },
  checkRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  checkPill: { minHeight: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.xs },
  checkText: { fontSize: 13, fontWeight: "800" },
  weatherAction: { gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  selfie: { width: "100%", height: 240, borderRadius: 8 },
  chart: { borderRadius: 8, alignSelf: "center" }
});
