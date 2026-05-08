import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { premiumFeatures, premiumPlans } from "@/shared/monetization";
import { trackEvent } from "@/shared/services/analytics";
import { spacing } from "@/shared/theme";

export default function Paywall() {
  const { language, activatePremium } = useApp();
  useEffect(() => {
    trackEvent("paywall_viewed", { screen: "paywall" });
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">Skin Nepal Premium</SectionLabel>
              <H1>{language === "en" ? "Make the app feel made for your skin" : "Tapai ko skin ko lagi baneko full plan"}</H1>
              <Body muted>Weather, water, food, budget, makeup, stress, and weekly progress in one caring plan.</Body>
            </View>
          </View>
        </Card>

        <Card>
          <H2>What unlocks</H2>
          {premiumFeatures.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Feather name="check-circle" size={18} color="#8BAF8E" />
              <Body>{feature}</Body>
            </View>
          ))}
        </Card>

        <Card variant="accent">
          <Pill tone="accent">Beta launch offer</Pill>
          <H2>{premiumPlans.beta.price} first month</H2>
          <Body muted>{premiumPlans.beta.note}</Body>
          <Button
            label="Activate beta premium"
            onPress={() => {
              trackEvent("premium_clicked", { plan: "beta", price: premiumPlans.beta.price });
              activatePremium("beta", "beta");
              router.replace("/(tabs)/home" as never);
            }}
          />
        </Card>

        <Card>
          <H2>Payment roadmap</H2>
          <Body>eSewa and Khalti verification will write paid subscription status before real launch.</Body>
          <View style={styles.planRow}>
            <Pill tone="primary">eSewa placeholder</Pill>
            <Pill tone="secondary">Khalti placeholder</Pill>
            <Pill tone="accent">Stripe later</Pill>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  planRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }
});
