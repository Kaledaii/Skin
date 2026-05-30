import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Image, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel, Segment } from "@/shared/components";
import { premiumFeatures, premiumPlans } from "@/shared/monetization";
import { paymentQrImages } from "@/shared/paymentAssets";
import { trackEvent } from "@/shared/services/analytics";
import { palettes } from "@/shared/theme";
import { spacing } from "@/shared/theme";
import { PaymentProvider, SubscriptionPlanId } from "@/shared/types";

export default function Paywall() {
  const { language, themeMode, paymentState, paymentRequests, submitManualPayment, retryPendingPaymentSync, pickPaymentScreenshot, activatePremium } = useApp();
  const c = palettes[themeMode];
  const [plan, setPlan] = useState<Exclude<SubscriptionPlanId, "beta">>("monthly");
  const [provider, setProvider] = useState<PaymentProvider>("khalti");
  const [transactionId, setTransactionId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [qrLoadError, setQrLoadError] = useState(false);
  const adminMode = process.env.EXPO_PUBLIC_ADMIN_MODE === "true";
  const qrUri = provider === "esewa" ? process.env.EXPO_PUBLIC_ESEWA_QR_URL : process.env.EXPO_PUBLIC_KHALTI_QR_URL;
  const qrSource: ImageSourcePropType = qrUri ? { uri: qrUri } : paymentQrImages[provider];
  const qrLabel = provider === "esewa" ? "eSewa" : "Khalti";
  const qrTone = provider === "esewa" ? "#1FB20A" : "#D7193F";
  const pending = paymentRequests.find((item) => item.status === "pending_review");
  const latestReviewed = paymentRequests.find((item) => item.status === "approved" || item.status === "rejected");
  useEffect(() => {
    trackEvent("paywall_viewed", { screen: "paywall" });
  }, []);
  useEffect(() => {
    setQrLoadError(false);
  }, [provider, qrUri]);

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
          {pending ? (
            <View style={[styles.reviewStatus, { borderColor: c.borderStrong, backgroundColor: c.surface }]}>
              <Pill tone="accent">Pending review</Pill>
              <H2>{language === "en" ? "Payment under review" : "Payment review मा छ"}</H2>
              <Body muted>
                {language === "en"
                  ? "Thank you. We’ll verify your payment screenshot and transaction ID. Premium result will be updated within 24 hours."
                  : "तपाईंको payment review मा छ। 24 घण्टा भित्र premium status update हुन्छ।"}
              </Body>
              <Body muted>Request {pending.id} • {pending.provider} • Rs. {pending.amount}</Body>
              <Pill tone={pending.cloudSyncStatus === "synced" ? "secondary" : "danger"}>
                {pending.cloudSyncStatus === "synced" ? "Visible in admin" : "Local only"}
              </Pill>
              {pending.cloudSyncStatus !== "synced" ? (
                <>
                  <Body muted>{pending.cloudSyncError ?? "This request has not reached the admin panel yet."}</Body>
                  <Button label="Retry admin sync" onPress={async () => setMessage(await retryPendingPaymentSync())} secondary />
                </>
              ) : null}
            </View>
          ) : null}
          {!pending && latestReviewed ? (
            <View style={[styles.reviewStatus, { borderColor: c.borderStrong, backgroundColor: c.surface }]}>
              <Pill tone={latestReviewed.status === "approved" ? "secondary" : "danger"}>{latestReviewed.status === "approved" ? "Premium active" : "Rejected"}</Pill>
              <H2>{latestReviewed.status === "approved" ? "Payment approved" : "Payment needs correction"}</H2>
              <Body muted>
                {latestReviewed.status === "approved"
                  ? "Premium is active for this plan. You can refresh subscription from Settings if another device does not update instantly."
                  : latestReviewed.reviewNote ?? "Could not verify the payment screenshot/transaction. Please resubmit with the correct proof."}
              </Body>
            </View>
          ) : null}
          <Segment value={plan} options={["monthly", "yearly"] as Array<Exclude<SubscriptionPlanId, "beta">>} onChange={setPlan} />
          <Segment value={provider} options={["khalti", "esewa"] as PaymentProvider[]} onChange={setProvider} />
          <View style={[styles.qrBox, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
            <View style={styles.qrHeader}>
              <View style={[styles.providerDot, { backgroundColor: qrTone }]} />
              <View style={styles.flex}>
                <H2>{qrLabel} QR payment</H2>
                <Body muted>Official receiver: Ishant Kumar Mishra</Body>
              </View>
            </View>
            <View style={[styles.qrPanel, { borderColor: c.borderStrong }]}>
              {!qrLoadError ? (
                <Image source={qrSource} style={styles.qrImage} resizeMode="contain" onError={() => setQrLoadError(true)} />
              ) : (
                <View style={styles.manualPaymentCard}>
                  <BrandMark compact />
                  <Text style={styles.qrPlaceholderTitle}>Manual wallet payment</Text>
                  <View style={styles.manualRows}>
                    <View style={styles.manualRow}>
                      <Text style={styles.manualLabel}>Provider</Text>
                      <Text style={styles.manualValue}>{qrLabel}</Text>
                    </View>
                    <View style={styles.manualRow}>
                      <Text style={styles.manualLabel}>Receiver</Text>
                      <Text style={styles.manualValue}>Ishant Kumar Mishra</Text>
                    </View>
                    <View style={styles.manualRow}>
                      <Text style={styles.manualLabel}>Wallet number</Text>
                      <Text style={styles.manualValue}>9709185409</Text>
                    </View>
                    <View style={styles.manualRow}>
                      <Text style={styles.manualLabel}>Amount</Text>
                      <Text style={styles.manualValue}>{premiumPlans[plan].price}</Text>
                    </View>
                  </View>
                  <Text style={styles.qrPlaceholderText}>Pay manually, then upload the screenshot and transaction ID below.</Text>
                </View>
              )}
            </View>
            <Body>{premiumPlans[plan].price} to Ishant Kumar Mishra</Body>
            <Pill tone="secondary">Wallet number: 9709185409</Pill>
            <Body muted>{!qrLoadError ? `Scan this ${qrLabel} QR, pay ${premiumPlans[plan].price}, then upload the payment screenshot below.` : `The official QR image file is not in the project yet. Users can still pay manually to this wallet number and submit proof.`}</Body>
          </View>
          <TextInput
            value={payerName}
            onChangeText={setPayerName}
            placeholder="Payer name"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <TextInput
            value={payerPhone}
            onChangeText={setPayerPhone}
            placeholder="Payer phone"
            keyboardType="phone-pad"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <TextInput
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder="eSewa/Khalti transaction ID"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          {screenshotUri ? <Image source={{ uri: screenshotUri }} style={styles.screenshot} resizeMode="cover" /> : null}
          <Button
            label={screenshotUri ? "Payment screenshot selected" : "Upload payment screenshot"}
            onPress={async () => {
              const uri = await pickPaymentScreenshot();
              if (uri) setScreenshotUri(uri);
            }}
            secondary
          />
          <Button
            label={pending ? "Already under review" : paymentState === "pending" ? "Submitting..." : "Submit for review"}
            onPress={async () => {
              if (pending) {
                setMessage("You already have a payment under review. Result will be updated within 24 hours.");
                setReviewModalOpen(true);
                return;
              }
              trackEvent("payment_started", { plan, provider });
              const result = await submitManualPayment({ provider, plan, transactionId, payerName, payerPhone, screenshotUri: screenshotUri ?? "" });
              setMessage(result.message);
              if (result.ok) setReviewModalOpen(true);
              trackEvent(result.ok ? "payment_succeeded" : "payment_failed", { plan, provider, state: result.request?.status ?? "failed" });
            }}
          />
          <Body muted>Status: {pending ? "pending review" : paymentState}. {pending ? `Request ${pending.id}` : "No pending request yet."}</Body>
          {message ? <Body>{message}</Body> : null}
        </Card>

        {adminMode ? <Card>
          <H2>Developer beta access</H2>
          <Body>Use only for testing locked premium screens without payment. Real users should submit QR payment for review.</Body>
          <View style={styles.planRow}>
            <Pill tone="primary">Admin mode enabled</Pill>
            <Pill tone="secondary">Khalti + eSewa first</Pill>
            <Pill tone="accent">Manual review beta</Pill>
          </View>
          <Button label="Developer unlock beta premium" onPress={() => activatePremium("beta", "beta")} secondary />
        </Card> : null}
      </ScrollView>
      <Modal visible={reviewModalOpen} transparent animationType="fade" onRequestClose={() => setReviewModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.surface, borderColor: c.borderStrong }]}>
            <View style={[styles.modalIcon, { backgroundColor: c.primarySoft }]}>
              <Feather name="clock" color={c.primary} size={24} />
            </View>
            <H2>{language === "en" ? "Payment under review" : "Payment review मा छ"}</H2>
            <Body muted>
              {language === "en"
                ? "Thank you. We’ll verify your payment screenshot and transaction ID. Premium result will be updated within 24 hours."
                : "तपाईंको payment review मा छ। 24 घण्टा भित्र premium status update हुन्छ।"}
            </Body>
            {pending ? <Text style={[styles.modalMeta, { color: c.muted }]}>Request {pending.id} • {pending.provider} • Rs. {pending.amount}</Text> : null}
            <Pressable onPress={() => setReviewModalOpen(false)} style={({ pressed }) => [styles.modalButton, { backgroundColor: c.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  planRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  qrBox: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.sm, alignItems: "stretch" },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  providerDot: { width: 14, height: 14, borderRadius: 7 },
  reviewStatus: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.xs },
  qrPanel: {
    width: "100%",
    maxWidth: 390,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: spacing.md,
    shadowColor: "#2E1719",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 3
  },
  qrImage: { width: "100%", height: 320, borderRadius: 10 },
  manualPaymentCard: { minHeight: 300, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.md },
  manualRows: { width: "100%", gap: 8, marginVertical: spacing.xs },
  manualRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#F0D7D7", paddingVertical: 8 },
  manualLabel: { color: "#876E6B", fontSize: 12, fontWeight: "800" },
  manualValue: { color: "#2E1719", fontSize: 13, fontWeight: "900", textAlign: "right", flexShrink: 1 },
  qrPlaceholderTitle: { color: "#2E1719", fontSize: 20, fontWeight: "900", textAlign: "center" },
  qrPlaceholderText: { color: "#876E6B", fontSize: 13, fontWeight: "700", lineHeight: 19, textAlign: "center" },
  screenshot: { width: "100%", height: 180, borderRadius: 8 },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(18, 13, 14, 0.52)", alignItems: "center", justifyContent: "center", padding: spacing.md },
  modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 18, padding: spacing.lg, gap: spacing.sm, alignItems: "center" },
  modalIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  modalMeta: { textAlign: "center", fontSize: 13, fontWeight: "800" },
  modalButton: { minHeight: 46, borderRadius: 24, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, marginTop: spacing.xs },
  modalButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 }
});
