import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { budgetTiers, skinTypes, useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, ProgressBar, Screen, SectionLabel } from "@/shared/components";
import { t } from "@/shared/i18n";
import { humanize, knowledgeBase } from "@/shared/knowledge/engine";
import { palettes, spacing } from "@/shared/theme";
import { BudgetTier, Language, SkinType } from "@/shared/types";

const symptomsToShow = [
  "pimples_forehead",
  "pimples_cheeks",
  "pimples_jawline",
  "cysts_painful",
  "blackheads",
  "whiteheads",
  "dry_patches",
  "flaking",
  "tightness_after_wash",
  "shiny_tzone",
  "redness_after_products",
  "dark_spots_post_acne",
  "dull_grey_skin",
  "under_eye_dark",
  "rough_bumpy_texture"
];

export default function Onboarding() {
  const { language, setLanguage, themeMode, profile, updateProfile, updateQuiz, toggleQuizArray, pickSelfie } = useApp();
  const c = palettes[themeMode];
  const symptoms = knowledgeBase.quiz_fields.symptoms.filter((symptom) => symptomsToShow.includes(symptom));
  const answeredCount =
    Number(Boolean(profile.name)) +
    Number(Boolean(profile.age)) +
    Number(profile.quiz.primaryConcerns.length > 0) +
    Number(profile.quiz.symptoms.length > 0) +
    Number(Boolean(profile.quiz.lifestyle.diet)) +
    Number(Boolean(profile.quiz.lifestyle.junk_food_frequency)) +
    Number(Boolean(profile.quiz.environment.water_source)) +
    Number(Boolean(profile.quiz.currentRoutine.uses_sunscreen));
  const quizPercent = Math.round((answeredCount / 8) * 100);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <BrandMark />
            <View style={styles.flex}>
          <SectionLabel tone="accent">{t(language, "appName")}</SectionLabel>
          <H1>{t(language, "tagline")}</H1>
          <Body muted>{language === "en" ? "A calmer, box-based quiz for Nepal skin concerns, with dropdowns instead of a wall of text." : "नेपालको लागि box-based quiz, dropdowns र कम text भएको flow।"}</Body>
            </View>
          </View>
          <View style={styles.progressHeader}>
            <Pill tone="secondary">{language === "en" ? "Quiz progress" : "Quiz progress"}</Pill>
            <Text style={[styles.percent, { color: c.primary }]}>{quizPercent}%</Text>
          </View>
          <ProgressBar value={quizPercent} color={c.primary} />
        </Card>

        <Card>
          <SectionHeader title={language === "en" ? "Profile" : "Profile"} subtitle={language === "en" ? "Basic details and fit" : "Basic details and fit"} />
          <SectionBody>
            <TextInput value={profile.name} onChangeText={(name) => updateProfile({ name })} placeholder="Name" placeholderTextColor={c.muted} style={[styles.input, { borderColor: c.border, color: c.text }]} />
            <TextInput value={profile.age} onChangeText={(age) => updateProfile({ age })} keyboardType="number-pad" placeholder="Age" placeholderTextColor={c.muted} style={[styles.input, { borderColor: c.border, color: c.text }]} />
            <TextInput value={profile.location} onChangeText={(location) => updateProfile({ location })} placeholder="Location" placeholderTextColor={c.muted} style={[styles.input, { borderColor: c.border, color: c.text }]} />
            <DropdownField label="Skin type" value={profile.skinType} options={skinTypes} onChange={(skinType) => updateProfile({ skinType: skinType as SkinType })} />
            <DropdownField label="Budget" value={profile.budgetTier} options={budgetTiers} onChange={(budgetTier) => updateProfile({ budgetTier: budgetTier as BudgetTier })} />
          </SectionBody>
        </Card>

        <Card>
          <SectionHeader title={language === "en" ? "Symptoms" : "Symptoms"} subtitle={language === "en" ? "Choose all that apply" : "Choose all that apply"} />
          <SectionBody>
            <MultiSelectBox
              label={language === "en" ? "Primary concerns" : "Primary concerns"}
              values={knowledgeBase.quiz_fields.primary_concerns.slice(0, 8)}
              selected={profile.quiz.primaryConcerns}
              onToggle={(value) => toggleQuizArray("primaryConcerns", value)}
            />
            <MultiSelectBox
              label={language === "en" ? "Skin symptoms" : "Skin symptoms"}
              values={symptoms}
              selected={profile.quiz.symptoms}
              onToggle={(value) => toggleQuizArray("symptoms", value)}
            />
          </SectionBody>
        </Card>

        <Card>
          <SectionHeader title={language === "en" ? "Diet" : "Diet"} subtitle={language === "en" ? "Food pattern and hydration" : "Food pattern and hydration"} />
          <SectionBody>
            <DropdownField label="Diet pattern" value={profile.quiz.lifestyle.diet} options={knowledgeBase.quiz_fields.lifestyle.diet} onChange={(value) => updateQuiz("lifestyle", "diet", value)} />
            <DropdownField label="Water intake" value={profile.quiz.lifestyle.water_intake_liters} options={knowledgeBase.quiz_fields.lifestyle.water_intake_liters} onChange={(value) => updateQuiz("lifestyle", "water_intake_liters", value)} />
            <DropdownField
              label="Junk food"
              value={profile.quiz.lifestyle.junk_food_frequency ?? "low"}
              options={["none", "low", "medium", "high"]}
              onChange={(value) => updateQuiz("lifestyle", "junk_food_frequency", value)}
            />
          </SectionBody>
        </Card>

        <Card>
          <SectionHeader title={language === "en" ? "Lifestyle" : "Lifestyle"} subtitle={language === "en" ? "Sleep, stress, habits" : "Sleep, stress, habits"} />
          <SectionBody>
            <DropdownField label="Sleep" value={profile.quiz.lifestyle.sleep_hours} options={knowledgeBase.quiz_fields.lifestyle.sleep_hours} onChange={(value) => updateQuiz("lifestyle", "sleep_hours", value)} />
            <DropdownField label="Stress" value={profile.quiz.lifestyle.stress_level} options={knowledgeBase.quiz_fields.lifestyle.stress_level} onChange={(value) => updateQuiz("lifestyle", "stress_level", value)} />
            <DropdownField label="Exercise" value={profile.quiz.lifestyle.exercise} options={knowledgeBase.quiz_fields.lifestyle.exercise} onChange={(value) => updateQuiz("lifestyle", "exercise", value)} />
            <DropdownField label="Smoking" value={profile.quiz.lifestyle.smoking} options={knowledgeBase.quiz_fields.lifestyle.smoking} onChange={(value) => updateQuiz("lifestyle", "smoking", value)} />
            <DropdownField label="Alcohol" value={profile.quiz.lifestyle.alcohol} options={knowledgeBase.quiz_fields.lifestyle.alcohol} onChange={(value) => updateQuiz("lifestyle", "alcohol", value)} />
            <DropdownField label="Screen time" value={profile.quiz.lifestyle.screen_time_hours} options={knowledgeBase.quiz_fields.lifestyle.screen_time_hours} onChange={(value) => updateQuiz("lifestyle", "screen_time_hours", value)} />
          </SectionBody>
        </Card>

        <Card>
          <SectionHeader title={language === "en" ? "Environment" : "Environment"} subtitle={language === "en" ? "Place, water and season" : "Place, water and season"} />
          <SectionBody>
            <DropdownField label="Age group" value={profile.quiz.ageGroup} options={knowledgeBase.quiz_fields.age_group} onChange={(value) => updateProfile({ quiz: { ...profile.quiz, ageGroup: value } })} />
            <DropdownField label="Location type" value={profile.quiz.environment.location_type} options={knowledgeBase.quiz_fields.environment.location_type} onChange={(value) => updateQuiz("environment", "location_type", value)} />
            <DropdownField label="Water source" value={profile.quiz.environment.water_source} options={knowledgeBase.quiz_fields.environment.water_source} onChange={(value) => updateQuiz("environment", "water_source", value)} />
            <DropdownField label="Current season" value={profile.quiz.environment.current_season} options={knowledgeBase.quiz_fields.environment.current_season} onChange={(value) => updateQuiz("environment", "current_season", value)} />
            <DropdownField label="Pollution exposure" value={profile.quiz.environment.pollution_exposure} options={knowledgeBase.quiz_fields.environment.pollution_exposure} onChange={(value) => updateQuiz("environment", "pollution_exposure", value)} />
          </SectionBody>
        </Card>

        <Card>
          <SectionHeader title={language === "en" ? "Current routine" : "Current routine"} subtitle={language === "en" ? "What they already do" : "What they already do"} />
          <SectionBody>
            <DropdownField label="Sunscreen" value={profile.quiz.currentRoutine.uses_sunscreen} options={knowledgeBase.quiz_fields.current_routine.uses_sunscreen} onChange={(value) => updateQuiz("currentRoutine", "uses_sunscreen", value)} />
            <DropdownField label="Cleanses twice" value={profile.quiz.currentRoutine.cleanses_twice} options={knowledgeBase.quiz_fields.current_routine.cleanses_twice} onChange={(value) => updateQuiz("currentRoutine", "cleanses_twice", value)} />
            <DropdownField label="Moisturizes" value={profile.quiz.currentRoutine.moisturizes} options={knowledgeBase.quiz_fields.current_routine.moisturizes} onChange={(value) => updateQuiz("currentRoutine", "moisturizes", value)} />
            <DropdownField label="Makeup daily" value={profile.quiz.currentRoutine.uses_makeup_daily} options={knowledgeBase.quiz_fields.current_routine.uses_makeup_daily} onChange={(value) => updateQuiz("currentRoutine", "uses_makeup_daily", value)} />
            <DropdownField label="Removes makeup" value={profile.quiz.currentRoutine.removes_makeup_before_bed} options={knowledgeBase.quiz_fields.current_routine.removes_makeup_before_bed} onChange={(value) => updateQuiz("currentRoutine", "removes_makeup_before_bed", value)} />
          </SectionBody>
        </Card>

        <Card>
          <View style={styles.iconRow}>
            <Feather name="camera" color={c.primary} size={22} />
            <H2>{language === "en" ? "Selfie progress" : "Selfie progress"}</H2>
          </View>
          <Body muted>{language === "en" ? "Optional. No AI analysis in v1; photos are for your own weekly timeline." : "Optional. v1 मा AI analysis छैन; photo weekly timeline का लागि मात्र।"}</Body>
          <Button label={profile.selfieUri ? "Selfie selected" : "Upload selfie"} onPress={pickSelfie} secondary />
        </Card>

        <Card>
          <View style={styles.iconRow}>
            <Feather name="shield" color={c.secondary} size={22} />
            <H2>{language === "en" ? "Safety check" : "Safety check"}</H2>
          </View>
          <Body>{t(language, "disclaimer")}</Body>
          <View style={styles.wrap}>
            {["painful acne", "bleeding", "infection", "worsening irritation"].map((symptom) => (
              <Pill key={symptom} tone="danger">
                {symptom}
              </Pill>
            ))}
          </View>
        </Card>

        <Button label={t(language, "start")} onPress={() => router.replace("/(tabs)/home")} />
      </ScrollView>
    </Screen>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flex}>
        <H2>{title}</H2>
        <Body muted>{subtitle}</Body>
      </View>
      <Feather name="chevron-right" color={c.muted} size={18} />
    </View>
  );
}

function SectionBody({ children }: { children: ReactNode }) {
  return <View style={styles.sectionBody}>{children}</View>;
}

function DropdownField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const [open, setOpen] = useState(false);
  const display = humanize(value || "select");
  return (
    <View style={[styles.fieldCard, { borderColor: open ? c.borderStrong : c.border, backgroundColor: c.surfaceAlt }]}>
      <Pressable onPress={() => setOpen((current) => !current)} style={({ pressed }) => [styles.fieldTop, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
        <View style={styles.flex}>
          <Body muted>{label}</Body>
          <Text style={[styles.fieldValue, { color: c.text }]} numberOfLines={1}>
            {display}
          </Text>
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} color={c.muted} size={18} />
      </Pressable>
      {open ? (
        <View style={styles.optionGrid}>
          {options.map((option) => {
            const active = option === value;
            return (
              <Pressable
                key={option}
                onPress={() => onChange(option)}
                style={({ pressed }) => [
                  styles.optionChip,
                  {
                    backgroundColor: active ? c.primary : c.surface,
                    borderColor: active ? c.borderStrong : c.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <Text style={[styles.optionText, { color: active ? "#FFFFFF" : c.text }]}>{humanize(option)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function MultiSelectBox({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.fieldCard, { borderColor: open ? c.borderStrong : c.border, backgroundColor: c.surfaceAlt }]}>
      <Pressable onPress={() => setOpen((current) => !current)} style={({ pressed }) => [styles.fieldTop, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
        <View style={styles.flex}>
          <Body muted>{label}</Body>
          <Text style={[styles.fieldValue, { color: c.text }]}>{selected.length} selected</Text>
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} color={c.muted} size={18} />
      </Pressable>
      {open ? (
        <View style={styles.optionGrid}>
          {values.map((value) => {
            const active = selected.includes(value);
            return (
              <Pressable
                key={value}
                onPress={() => onToggle(value)}
                style={({ pressed }) => [
                  styles.optionChip,
                  {
                    backgroundColor: active ? c.secondary : c.surface,
                    borderColor: active ? c.borderStrong : c.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <Text style={[styles.optionText, { color: active ? "#FFFFFF" : c.text }]}>{humanize(value)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroCard: { gap: spacing.md },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  percent: { fontSize: 20, fontWeight: "900" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  sectionBody: { gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  iconRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  fieldCard: { borderWidth: 1, borderRadius: 10, padding: spacing.sm, gap: spacing.sm, overflow: "hidden" },
  fieldTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  fieldValue: { fontSize: 15, fontWeight: "800", textTransform: "capitalize" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  optionChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 36, justifyContent: "center" },
  optionText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" }
});
