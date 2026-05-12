import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Linking, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel, Segment } from "@/shared/components";
import { premiumFeatures, premiumPlans } from "@/shared/monetization";
import { trackEvent } from "@/shared/services/analytics";
import { palettes } from "@/shared/theme";
import { spacing } from "@/shared/theme";
import { PaymentProvider, SubscriptionPlanId } from "@/shared/types";

export default function Paywall() {
  const { language, themeMode, paymentState, lastCheckout, startCheckout, confirmPayment, activatePremium } = useApp();
  const c = palettes[themeMode];
  const [plan, setPlan] = useState<SubscriptionPlanId>("beta");
  const [provider, setProvider] = useState<PaymentProvider>("khalti");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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
              <SectionLabel tone="accent">Prabha Premium</SectionLabel>
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
          <Pill tone="accent">Web/PWA paid beta</Pill>
          <H2>{premiumPlans[plan].price} - {premiumPlans[plan].label}</H2>
          <Body muted>{premiumPlans[plan].note}</Body>
          <Segment value={plan} options={["beta", "monthly", "yearly"] as SubscriptionPlanId[]} onChange={setPlan} />
          <Segment value={provider} options={["khalti", "esewa"] as PaymentProvider[]} onChange={setProvider} />
          <Button
            label={`Start ${provider} checkout`}
            onPress={async () => {
              trackEvent("payment_started", { plan, provider });
              const session = await startCheckout(plan, provider);
              setMessage(session.sandbox ? "Sandbox checkout created. Use transaction ID SANDBOX-123 to test premium unlock." : "Production checkout created. Complete payment in provider flow.");
              if (!session.sandbox) Linking.openURL(session.redirectUrl);
            }}
          />
          <TextInput
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder="Sandbox transaction ID: SANDBOX-123"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <Button
            label={paymentState === "verifying" ? "Verifying..." : "Verify payment"}
            onPress={async () => {
              const result = await confirmPayment(transactionId);
              setMessage(result.message);
              trackEvent(result.ok ? "payment_succeeded" : "payment_failed", { plan, provider, state: result.state });
              if (result.ok) router.replace("/(tabs)/home" as never);
            }}
            secondary
          />
          <Body muted>Status: {paymentState}. {lastCheckout ? `Checkout ${lastCheckout.id}` : "No checkout yet."}</Body>
          {message ? <Body>{message}</Body> : null}
        </Card>

        <Card>
          <H2>Developer beta access</H2>
          <Body>Use only for testing locked premium screens without payment. Production must use Khalti/eSewa verification.</Body>
          <View style={styles.planRow}>
            <Pill tone="primary">Sandbox IDs start with SANDBOX</Pill>
            <Pill tone="secondary">Khalti + eSewa first</Pill>
            <Pill tone="accent">Stripe later</Pill>
          </View>
          <Button label="Developer unlock beta premium" onPress={() => activatePremium("beta", "beta")} secondary />
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
  planRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 }
});
