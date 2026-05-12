import { ScrollView, StyleSheet, View } from "react-native";
import { Body, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { spacing } from "@/shared/theme";

const sections = [
  {
    label: "Privacy Policy",
    title: "What Prabha Collects",
    body: "Prabha may store your name, age range, skin type, location type, quiz answers, routine logs, check-ins, product preferences, subscription status, and optional progress photo metadata. Photos are optional and should not be uploaded to cloud storage until explicit photo consent and account controls are enabled."
  },
  {
    label: "Privacy Policy",
    title: "How Your Data Is Used",
    body: "Your data is used to create routine guidance, weather and lifestyle reminders, progress reports, product matching, and premium subscription access. Local demo mode keeps data on this device/browser. Firebase mode syncs account data when configured."
  },
  {
    label: "Data Rights",
    title: "Delete And Export",
    body: "Users must be able to delete local data, request cloud data deletion, and export their stored app data. Cloud deletion should remove profile, quiz, subscription mirror, check-ins, and progress photo metadata tied to the account."
  },
  {
    label: "Terms",
    title: "Not Medical Advice",
    body: "Prabha gives education and routine guidance, not diagnosis or treatment. Painful, infected, bleeding, spreading, scarring, or persistent skin concerns need a dermatologist or qualified clinician."
  },
  {
    label: "Terms",
    title: "Age And Consent",
    body: "Prabha is intended for users 13+. Younger users and users with severe symptoms should involve a guardian and seek medical care."
  },
  {
    label: "Refund Policy",
    title: "Subscriptions And Refunds",
    body: "Paid plans unlock premium routines, reports, Learn guides, Q&A archive, and product matching. Refunds, renewals, and cancellations must follow the payment provider rules for Khalti, eSewa, or the app store used at purchase time."
  }
];

export default function Legal() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <SectionLabel tone="accent">Launch-safe documents</SectionLabel>
          <H1>Privacy, Terms, And Safety</H1>
          <Body muted>Readable draft for beta. A Nepal lawyer should review this before public paid launch.</Body>
        </Card>
        {sections.map((section) => (
          <Card key={`${section.label}-${section.title}`}>
            <View style={styles.row}>
              <Pill tone="secondary">{section.label}</Pill>
            </View>
            <H2>{section.title}</H2>
            <Body>{section.body}</Body>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }
});
