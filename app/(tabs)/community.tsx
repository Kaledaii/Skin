import { ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { questions } from "@/shared/data";
import { t } from "@/shared/i18n";
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
              <SectionLabel tone="accent">{language === "en" ? "Trust layer" : "Trust layer"}</SectionLabel>
              <H1>{t(language, "community")}</H1>
              <Body muted>{language === "en" ? "Anonymous questions with visible expert signals." : "Expert signal सहित anonymous questions."}</Body>
            </View>
          </View>
        </Card>
        {locked ? (
          <Card>
            <Pill>{t(language, "premium")}</Pill>
            <H2>{language === "en" ? "Anonymous Q&A is premium" : "Anonymous Q&A premium हो"}</H2>
            <Body muted>{language === "en" ? "Premium includes community questions, expert validation badges, and clinic referral entry points." : "Premium मा community questions, expert badges र clinic referral entry points छन्।"}</Body>
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
  voteRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }
});
