import { Feather } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { budgetTiers, genders, skinTypes, useApp } from "@/shared/AppContext";
import { Body, Button, Card, H2, Pill, ProgressBar, Screen } from "@/shared/components";
import { t } from "@/shared/i18n";
import { humanize, knowledgeBase } from "@/shared/knowledge/engine";
import { MarketingHero, marketingImages, PortraitGlowStrip } from "@/shared/marketingVisuals";
import { palettes, spacing } from "@/shared/theme";
import { BudgetTier, Gender, Language, SkinType } from "@/shared/types";

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
  "burning_sensation",
  "dark_spots_post_acne",
  "dark_spots_sun",
  "melasma_patches",
  "dull_grey_skin",
  "uneven_skin_tone",
  "under_eye_dark",
  "under_eye_puffy",
  "rough_bumpy_texture",
  "large_visible_pores",
  "itchy_patches",
  "itchy_uniform_bumps",
  "sweat_rash_heat_bumps",
  "wrinkles"
];

export default function Onboarding() {
  const { language, setLanguage, themeMode, authReady, authRequired, profile, updateProfile, updateQuiz, toggleQuizArray, pickSelfieFromCamera, pickSelfieFromLibrary } = useApp();
  const c = palettes[themeMode];
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const profileY = useRef(0);
  const symptoms = knowledgeBase.quiz_fields.symptoms.filter((symptom) => symptomsToShow.includes(symptom));
  const answeredCount =
    Number(Boolean(profile.name)) +
    Number(Boolean(profile.age)) +
    Number(Boolean(profile.gender)) +
    Number(profile.quiz.primaryConcerns.length > 0) +
    Number(profile.quiz.symptoms.length > 0) +
    Number(Boolean(profile.quiz.lifestyle.diet)) +
    Number(Boolean(profile.quiz.lifestyle.junk_food_frequency)) +
    Number(Boolean(profile.quiz.environment.water_source)) +
    Number(Boolean(profile.quiz.currentRoutine.uses_sunscreen));
  const quizPercent = Math.round((answeredCount / 9) * 100);

  if (authReady && authRequired) return <Redirect href={"/auth" as never} />;

  return (
    <Screen>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <MarketingHero
          image={marketingImages.glowJourney}
          eyebrow={t(language, "appName")}
          title="Your Glow, Your Journey"
          body="Personalized care for every Nepali skin tone."
          cta="Start quiz - tap here"
          onPress={() => scrollRef.current?.scrollTo({ y: Math.max(profileY.current - 16, 0), animated: true })}
          tall
        />
        <View style={styles.languageRow}>
          <Pressable
            onPress={() => setLanguage("en")}
            style={[styles.languageButton, { borderColor: language === "en" ? c.borderStrong : c.border, backgroundColor: language === "en" ? c.primary : c.surfaceAlt }]}
          >
            <Text style={[styles.languageText, { color: language === "en" ? "#FFFFFF" : c.text }]}>EN</Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage("ne")}
            style={[styles.languageButton, { borderColor: language === "ne" ? c.borderStrong : c.border, backgroundColor: language === "ne" ? c.primary : c.surfaceAlt }]}
          >
            <Text style={[styles.languageText, { color: language === "ne" ? "#FFFFFF" : c.text }]}>ने</Text>
          </Pressable>
        </View>
        <PortraitGlowStrip
          title="Confidence in Every Shade"
          subtitle="Bright, festive, calm, outdoorsy, minimal - Prabha adapts to the girl using it."
          images={[
            marketingImages.portraitSoftSmile,
            marketingImages.portraitRedSareeClose,
            marketingImages.portraitYellowOutdoor,
            marketingImages.portraitWhiteBangs,
            marketingImages.portraitFestiveBraid
          ]}
        />
        <Card variant="hero" style={styles.heroCard}>
          <View style={styles.progressHeader}>
            <Pill tone="secondary">{language === "en" ? "Quiz progress" : "Quiz progress"}</Pill>
            <Text style={[styles.percent, { color: c.primary }]}>{quizPercent}%</Text>
          </View>
          <View style={styles.wrap}>
            <Pill tone="primary">8 sections</Pill>
            <Pill tone="accent">Confidence in Every Shade</Pill>
            <Pill tone="secondary">Science Meets Tradition</Pill>
            <Pill tone="primary">Made for Nepal weather</Pill>
            <Pill tone={profile.quiz.primaryConcerns.length || profile.quiz.symptoms.length ? "secondary" : "accent"}>Concern required</Pill>
            <Pill tone={profile.consentAccepted ? "secondary" : "accent"}>Consent required</Pill>
          </View>
          <ProgressBar value={quizPercent} color={c.primary} />
        </Card>

        <Card onLayout={(event) => { profileY.current = event.nativeEvent.layout.y; }}>
          <SectionHeader title={language === "en" ? "Profile" : "Profile"} subtitle={language === "en" ? "Basic details and fit" : "Basic details and fit"} />
          <SectionBody>
            {profile.addOnStatus === "locked" ? (
              <View style={[styles.lockedProfile, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
                <Pill tone="accent">Extra profile locked</Pill>
                <Body muted>Activate this paid profile add-on in Settings before completing a separate quiz and routine.</Body>
              </View>
            ) : null}
            <TextInput value={profile.name} onChangeText={(name) => updateProfile({ name })} placeholder="Name" placeholderTextColor={c.muted} style={[styles.input, { borderColor: c.border, color: c.text }]} />
            <TextInput value={profile.age} onChangeText={(age) => updateProfile({ age })} keyboardType="number-pad" placeholder="Age" placeholderTextColor={c.muted} style={[styles.input, { borderColor: c.border, color: c.text }]} />
            <TextInput value={profile.location} onChangeText={(location) => updateProfile({ location })} placeholder="Location" placeholderTextColor={c.muted} style={[styles.input, { borderColor: c.border, color: c.text }]} />
            <DropdownField label="Gender" value={profile.gender} options={genders} onChange={(gender) => updateProfile({ gender: gender as Gender })} />
            <DropdownField label="Skin type" value={profile.skinType} options={skinTypes} onChange={(skinType) => updateProfile({ skinType: skinType as SkinType })} />
            <DropdownField label="Budget" value={profile.budgetTier} options={budgetTiers} onChange={(budgetTier) => updateProfile({ budgetTier: budgetTier as BudgetTier })} />
          </SectionBody>
        </Card>

        {profile.gender === "female" ? (
          <Card>
            <SectionHeader title="Cycle & skin" subtitle="Optional but useful for period-linked skin changes." />
            <SectionBody>
              <DropdownField label="Where are you in your cycle?" value={profile.quiz.cycle.periodTiming} options={["before_period", "during_period", "after_period", "mid_cycle", "not_sure", "prefer_not_to_say"]} onChange={(value) => updateQuiz("cycle", "periodTiming", value)} />
              <DropdownField label="Are periods regular?" value={profile.quiz.cycle.periodsRegular} options={["regular", "irregular", "not_sure", "prefer_not_to_say"]} onChange={(value) => updateQuiz("cycle", "periodsRegular", value)} />
              <DropdownField label="Breakouts around period" value={profile.quiz.cycle.cycleBreakouts} options={["none", "mild", "moderate", "severe"]} onChange={(value) => updateQuiz("cycle", "cycleBreakouts", value)} />
              <DropdownField label="Skin change during cycle" value={profile.quiz.cycle.cycleSkinChange} options={["no_change", "oilier", "drier", "sensitive", "duller"]} onChange={(value) => updateQuiz("cycle", "cycleSkinChange", value)} />
              <DropdownField label="Painful/deep acne" value={profile.quiz.cycle.painfulDeepAcne} options={["no", "sometimes", "yes"]} onChange={(value) => updateQuiz("cycle", "painfulDeepAcne", value)} />
              <Body muted>Guidance only. Irregular periods with painful deep acne should be discussed with a qualified clinician.</Body>
            </SectionBody>
          </Card>
        ) : null}

        <Card>
          <SectionHeader title={language === "en" ? "Symptoms" : "Symptoms"} subtitle={language === "en" ? "Multiple options can be selected." : "Multiple options select garna milcha."} />
          <SectionBody>
            <MultiSelectBox
              label={language === "en" ? "Primary concerns" : "Primary concerns"}
              values={knowledgeBase.quiz_fields.primary_concerns}
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
            <DropdownField label="Water intake (litres/L per day)" value={profile.quiz.lifestyle.water_intake_liters} options={knowledgeBase.quiz_fields.lifestyle.water_intake_liters} onChange={(value) => updateQuiz("lifestyle", "water_intake_liters", value)} />
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
            <DropdownField label="Smoking" value={profile.quiz.lifestyle.smoking} options={["yes", "no", "occasional"]} onChange={(value) => updateQuiz("lifestyle", "smoking", value)} />
            <DropdownField label="Alcohol" value={profile.quiz.lifestyle.alcohol} options={["yes", "no", "occasional"]} onChange={(value) => updateQuiz("lifestyle", "alcohol", value)} />
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
          <View style={styles.selfieActions}>
            <Button label={profile.selfieUri ? "Retake photo" : "Take photo"} onPress={pickSelfieFromCamera} secondary />
            <Button label={profile.selfieUri ? "Choose another" : "Choose from gallery"} onPress={pickSelfieFromLibrary} secondary />
          </View>
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

        <Card>
          <View style={styles.iconRow}>
            <Feather name="lock" color={c.primary} size={22} />
            <H2>{language === "en" ? "Privacy consent" : "Privacy consent"}</H2>
          </View>
          <Body muted>
            {language === "en"
              ? "I agree that Prabha can save my quiz answers, routine logs, and optional photo reference for personalized guidance. I understand this is not medical diagnosis."
              : "Prabha le quiz answers, routine logs, ra optional photo reference guidance ko lagi save garna sakcha. Yo medical diagnosis hoina."}
          </Body>
          <Pressable
            onPress={() => updateProfile({ consentAccepted: !profile.consentAccepted })}
            style={({ pressed }) => [
              styles.consentRow,
              {
                borderColor: profile.consentAccepted ? c.borderStrong : c.border,
                backgroundColor: profile.consentAccepted ? c.secondarySoft : c.surfaceAlt,
                transform: [{ scale: pressed ? 0.99 : 1 }]
              }
            ]}
          >
            <Feather name={profile.consentAccepted ? "check-circle" : "circle"} color={profile.consentAccepted ? c.secondary : c.muted} size={20} />
            <Body>{profile.consentAccepted ? "Consent accepted" : "Tap to accept privacy consent"}</Body>
          </Pressable>
        </Card>

        {validationMessage ? (
          <Card variant="accent">
            <H2>Almost there</H2>
            <Body>{validationMessage}</Body>
          </Card>
        ) : null}

        <Button label={profile.consentAccepted ? t(language, "start") : "Accept consent to continue"} onPress={() => {
          // Comprehensive validation before allowing app entry
          if (profile.addOnStatus === "locked") {
            setValidationMessage(language === "en" ? "This extra profile is locked. Activate its paid add-on in Settings first." : "Yo extra profile locked cha. Settings ma paid add-on activate garnu hos.");
            return;
          }
          if (!profile.name || !profile.name.trim()) {
            setValidationMessage(language === "en" ? "Please enter your name." : "Aafno naam enter garnu hos.");
            return;
          }
          if (!profile.age || !profile.age.trim()) {
            setValidationMessage(language === "en" ? "Please enter your age." : "Aafno umar enter garnu hos.");
            return;
          }
          if (!profile.gender) {
            setValidationMessage(language === "en" ? "Please select gender." : "Gender select garnu hos.");
            return;
          }
          if (!profile.quiz.ageGroup) {
            setValidationMessage(language === "en" ? "Please select your age group." : "Age group select garnu hos.");
            return;
          }
          if (!profile.quiz.primaryConcerns.length && !profile.quiz.symptoms.length) {
            setValidationMessage(language === "en" ? "Please select at least one symptom or primary concern so Prabha can personalize your plan." : "Personalized plan ko lagi at least one symptom wa primary concern channuhos.");
            return;
          }
          if (!profile.quiz.lifestyle.diet) {
            setValidationMessage(language === "en" ? "Please select your diet pattern." : "Diet pattern select garnu hos.");
            return;
          }
          if (!profile.quiz.environment.water_source) {
            setValidationMessage(language === "en" ? "Please select your water source." : "Water source select garnu hos.");
            return;
          }
          if (!profile.quiz.currentRoutine.uses_sunscreen) {
            setValidationMessage(language === "en" ? "Please answer the sunscreen question to continue." : "Sunscreen question answer garnu hos.");
            return;
          }
          if (!profile.consentAccepted) {
            setValidationMessage(language === "en" ? "Please accept privacy consent to continue." : "Privacy consent accept garnu hos.");
            return;
          }
          setValidationMessage(null);
          updateProfile({ planStartedAt: profile.planStartedAt ?? new Date().toISOString() });
          router.replace("/(tabs)/home");
        }} />
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
  languageRow: { flexDirection: "row", alignSelf: "flex-end", gap: spacing.xs },
  languageButton: { minWidth: 46, minHeight: 36, borderWidth: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  languageText: { fontSize: 14, fontWeight: "900" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  percent: { fontSize: 20, fontWeight: "900" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  sectionBody: { gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  lockedProfile: { borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
  iconRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  selfieActions: { gap: spacing.xs },
  consentRow: { borderWidth: 1, borderRadius: 12, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fieldCard: { borderWidth: 1, borderRadius: 10, padding: spacing.sm, gap: spacing.sm, overflow: "hidden" },
  fieldTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  fieldValue: { fontSize: 15, fontWeight: "800", textTransform: "capitalize" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  optionChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 36, justifyContent: "center" },
  optionText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" }
});
