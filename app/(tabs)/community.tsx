import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { questions } from "@/shared/data";
import { t } from "@/shared/i18n";
import { learnQAs } from "@/shared/knowledge/education";
import { spacing } from "@/shared/theme";

export default function Community() {
  const { language, tier, setTier } = useApp();
  const locked = tier !== "premium";
  return (
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
          <H2>{language === "en" ? "Q&A: Nepal context" : "Q&A: Nepal context"}</H2>
          <Body muted>{language === "en" ? "Free readable answers for common skincare doubts." : "Common skincare doubt ko free simple answers."}</Body>
          {learnQAs.map((qa, index) => {
            const gated = locked && index >= 12;
            return (
            <View key={qa.id} style={styles.qaBlock}>
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
            <Body muted>{language === "en" ? "Premium can later include anonymous questions, expert validation badges, and clinic referral entry points." : "Premium ma anonymous questions, expert badges ra clinic referral entry points aauna sakcha."}</Body>
            <Button label={t(language, "upgrade")} onPress={() => setTier("premium")} />
          </Card>
        ) : questions.map((question) => (
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

        <Card>
          <H2>{language === "en" ? "Clinic escalation" : "Clinic escalation"}</H2>
          <Body>{t(language, "disclaimer")}</Body>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  voteRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  qaBlock: { gap: spacing.xs, paddingVertical: spacing.sm }
});
