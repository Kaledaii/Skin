import { ScrollView, StyleSheet } from "react-native";
import { Body, Card, H1, H2, Pill, Screen } from "@/shared/components";
import { spacing } from "@/shared/theme";

const sections = [
  {
    title: "Medical disclaimer",
    body: "Skin Nepal gives education and routine guidance, not diagnosis. Severe, painful, infected, spreading, scarring, or persistent symptoms need a dermatologist."
  },
  {
    title: "Privacy promise",
    body: "Photos, quiz answers, check-ins, lifestyle habits, and notes are sensitive. They stay private by default and should never be shared publicly without explicit consent."
  },
  {
    title: "Data rights",
    body: "Users must be able to delete local app data and, before launch, cloud data tied to their account. Build export/delete account before public paid launch."
  },
  {
    title: "Payments",
    body: "Real eSewa/Khalti/Stripe payments must verify subscription status server-side before unlocking paid content in production."
  },
  {
    title: "Age",
    body: "The app should be 13+ and encourage guardian/doctor support for younger users with severe symptoms."
  }
];

export default function Legal() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <H1>Privacy + safety</H1>
        <Pill tone="accent">Launch checklist</Pill>
        {sections.map((section) => (
          <Card key={section.title}>
            <H2>{section.title}</H2>
            <Body>{section.body}</Body>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl }
});
