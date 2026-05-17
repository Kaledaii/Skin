import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { questions } from "@/shared/data";
import { t } from "@/shared/i18n";
import { learnQAs } from "@/shared/knowledge/education";
import { submitExpertQuestion } from "@/shared/services/firebaseSync";
import { palettes, spacing } from "@/shared/theme";

export default function Community() {
  const { language, themeMode, tier, profile } = useApp();
  const c = palettes[themeMode];
  const locked = tier !== "premium";
  const [query, setQuery] = useState("");
  const [expertQuestion, setExpertQuestion] = useState("");
  const [expertStatus, setExpertStatus] = useState<string | null>(null);
  const filteredQAs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return learnQAs;
    return learnQAs.filter((qa) => `${qa.question_en} ${qa.question_ne} ${qa.answer_en} ${qa.answer_ne} ${qa.tags.join(" ")}`.toLowerCase().includes(needle));
  }, [query]);
  return (
    <ErrorBoundary screenName="Community">
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">{language === "en" ? "Q&A" : "Q&A"}</SectionLabel>
              <H1>{t(language, "community")}</H1>
              <Body muted>{language === "en" ? "Nepal-context doubts in simple spoken style, plus premium expert signals later." : "Simple spoken-style answers, premium expert signals pachi."}</Body>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.titleRow}>
            <H2>{language === "en" ? "Q&A: Nepal context" : "Q&A: Nepal context"}</H2>
            <Pill tone="secondary">{language === "en" ? "Simple English" : "Spoken Nepali"}</Pill>
          </View>
          <Body muted>{language === "en" ? "Clear answers without heavy medical words. Switch to NE for spoken Nepali style." : "Common skincare doubt ko free simple answers. EN ma simple English version cha."}</Body>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search acne, sunscreen, hostel, makeup..."
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          {filteredQAs.map((qa, index) => {
            const gated = locked && index >= 12;
            return (
            <View key={qa.id} style={[styles.qaBlock, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <H2>{gated ? "Premium Q&A archive" : language === "ne" ? qa.question_ne : qa.question_en}</H2>
              <Body>{gated ? "Unlock 50+ Nepal-context Q&As covering periods, makeup, hostel life, sunscreen, water, food, festivals, and product shopping." : language === "ne" ? qa.answer_ne : qa.answer_en}</Body>
              <View style={styles.voteRow}>
                {(gated ? ["premium"] : qa.tags).map((tag) => (
                  <Pill key={tag} tone="primary">{tag}</Pill>
                ))}
                {gated ? <Button label="Unlock Q&A" onPress={() => router.push("/paywall" as never)} secondary /> : null}
              </View>
            </View>
          );})}
        </Card>

        {locked ? (
          <Card>
            <Pill>{t(language, "premium")}</Pill>
            <H2>{language === "en" ? "Ask-an-expert is premium" : "Ask-an-expert premium ho"}</H2>
            <Body muted>{language === "en" ? "Premium users can send a private question for admin/expert review." : "Premium users le private question review ko lagi pathauna sakchhan."}</Body>
            <Button label={t(language, "upgrade")} onPress={() => router.push("/paywall" as never)} />
          </Card>
        ) : (
          <>
            <Card>
              <Pill tone="secondary">Premium</Pill>
              <H2>Ask a private question</H2>
              <Body muted>Write one clear skincare question. This creates a review request, not instant diagnosis.</Body>
              <TextInput
                value={expertQuestion}
                onChangeText={setExpertQuestion}
                placeholder="Example: Can I use salicylic acid with my current acne routine?"
                placeholderTextColor={c.muted}
                multiline
                style={[styles.input, styles.textArea, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
              />
              {expertStatus ? <Body muted>{expertStatus}</Body> : null}
              <Button label="Submit question" onPress={async () => {
                const result = await submitExpertQuestion(expertQuestion, profile.name);
                setExpertStatus(result.message);
                if (result.ok) setExpertQuestion("");
              }} />
            </Card>
            {questions.map((question) => (
              <Card key={question.id}>
                {question.verified ? <Pill tone="secondary">{t(language, "verified")}</Pill> : null}
                <H2>{question.title[language]}</H2>
                <Body>{question.answer[language]}</Body>
                <View style={styles.voteRow}>
                  <Pill tone="primary">Helpful 24</Pill>
                  <Pill tone="accent">Clinic-safe</Pill>
                </View>
              </Card>
            ))}
          </>
        )}

        <Card>
          <H2>{language === "en" ? "Clinic escalation" : "Clinic escalation"}</H2>
          <Body>{t(language, "disclaimer")}</Body>
        </Card>
      </ScrollView>
    </Screen>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  voteRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15 },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  qaBlock: { gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderRadius: 8, marginTop: spacing.sm }
});
