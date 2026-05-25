import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, Segment } from "@/shared/components";
import { t } from "@/shared/i18n";
import { knowledgeBase } from "@/shared/knowledge/engine";
import { premiumPlans } from "@/shared/monetization";
import { palettes, spacing } from "@/shared/theme";
import { Language, ThemeMode } from "@/shared/types";
import { firebaseReady } from "@/shared/services/firebase";
import { syncUserSnapshot } from "@/shared/services/firebaseSync";
import { registerExpoPushToken, requestNotificationAccess } from "@/shared/services/notifications";

export default function Settings() {
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    tier,
    setTier,
    subscription,
    profile,
    dailyCheckIns,
    paymentRequests,
    refreshPaymentRequests,
    approvePaymentRequest,
    rejectPaymentRequest,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    loadSubscription,
    exportData,
    deleteCloudData,
    resetData,
    notificationPreferences,
    updateNotificationPreferences
  } = useApp();
  const c = palettes[themeMode];
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const adminMode = process.env.EXPO_PUBLIC_ADMIN_MODE === "true";
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <H1>{t(language, "settings")}</H1>
        <Card>
          <H2>{t(language, "language")}</H2>
          <Segment value={language} options={["en", "ne"] as Language[]} onChange={setLanguage} />
        </Card>
        <Card>
          <H2>{t(language, "theme")}</H2>
          <Segment value={themeMode} options={["light", "dark"] as ThemeMode[]} onChange={setThemeMode} />
        </Card>
        <Card>
          <H2>Smart notifications</H2>
          <Body muted>Routine nudges, weather skin alerts, and completion praise for phone users. Web skips local phone notifications.</Body>
          {notificationStatus ? <Body muted>{notificationStatus}</Body> : null}
          <View style={styles.notificationGrid}>
            <Button
              label={`Routine reminders: ${notificationPreferences.routineReminders ? "On" : "Off"}`}
              onPress={() => updateNotificationPreferences({ routineReminders: !notificationPreferences.routineReminders })}
              secondary
            />
            <Button
              label={`Weather alerts: ${notificationPreferences.weatherAlerts ? "On" : "Off"}`}
              onPress={() => updateNotificationPreferences({ weatherAlerts: !notificationPreferences.weatherAlerts })}
              secondary
            />
            <Button
              label={`Completion praise: ${notificationPreferences.completionPraise ? "On" : "Off"}`}
              onPress={() => updateNotificationPreferences({ completionPraise: !notificationPreferences.completionPraise })}
              secondary
            />
            <Button
              label={`Quiet hours: ${notificationPreferences.quietHoursEnabled ? "On" : "Off"}`}
              onPress={() => updateNotificationPreferences({ quietHoursEnabled: !notificationPreferences.quietHoursEnabled })}
              secondary
            />
          </View>
          <Button
            label="Enable phone notifications"
            onPress={async () => {
              const access = await requestNotificationAccess();
              const token = await registerExpoPushToken();
              setNotificationStatus(access.granted ? `Enabled. Push token: ${token.ok ? token.mode : "not synced yet"}.` : `Not enabled: ${access.reason}.`);
            }}
          />
        </Card>
        <Card>
          <H2>{language === "en" ? "Subscription" : "Subscription"}</H2>
          {adminMode ? <Segment value={tier} options={["free", "premium"]} onChange={setTier} /> : null}
          <Pill tone={tier === "premium" ? "secondary" : "accent"}>{subscription.status} via {subscription.source}</Pill>
          <Body muted>{language === "en" ? `${premiumPlans.monthly.price}/month or ${premiumPlans.yearly.price}/year. QR payment goes to pending review first; premium unlocks after admin confirmation.` : "QR payment pending review ma jancha; admin confirm bhayepachi premium unlock huncha."}</Body>
          <Button label="View premium plans" onPress={() => router.push("/paywall" as never)} secondary />
          <Button label="Refresh subscription" onPress={loadSubscription} secondary />
        </Card>
        <Card>
          <H2>Account recovery</H2>
          <Body muted>Email/password lets paid users recover subscription after refresh, reinstall, or another device. Google sign-in works on web after Firebase is configured.</Body>
          {authStatus ? <Body muted>{authStatus}</Body> : null}
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
          <View style={[styles.passwordWrap, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              placeholderTextColor={c.muted}
              style={[styles.passwordInput, { color: c.text }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              onPress={() => setShowPassword((value) => !value)}
              style={styles.eyeButton}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} color={c.muted} size={20} />
            </Pressable>
          </View>
          <Button label="Create email account" onPress={async () => {
            try {
              if (!email.trim() || password.length < 6) {
                setAuthStatus("Enter a valid email and at least 6 characters password.");
                return;
              }
              const result = await signUpWithEmail(email, password);
              if (result.ok) await syncUserSnapshot({ profile, subscription, dailyCheckIns, paymentRequests });
              setAuthStatus(result.message);
            } catch (error) {
              setAuthStatus(error instanceof Error ? error.message : "Could not create account.");
            }
          }} secondary />
          <Button label="Sign in" onPress={async () => {
            try {
              if (!email.trim() || !password) {
                setAuthStatus("Enter email and password first.");
                return;
              }
              const result = await signInWithEmail(email, password);
              await loadSubscription();
              setAuthStatus(result.message);
            } catch (error) {
              setAuthStatus(error instanceof Error ? error.message : "Could not sign in.");
            }
          }} secondary />
          <Button label="Sign in with Google" onPress={async () => {
            try {
              const result = await signInWithGoogle();
              if (result.ok) {
                await syncUserSnapshot({ profile, subscription, dailyCheckIns, paymentRequests });
                await loadSubscription();
              }
              setAuthStatus(result.message);
            } catch (error) {
              setAuthStatus(error instanceof Error ? error.message : "Google sign-in could not open. Check Firebase web config and authorized domain.");
            }
          }} secondary />
        </Card>
        {adminMode ? (
          <Card>
            <H2>Admin payment review</H2>
            <Body muted>Visible only when EXPO_PUBLIC_ADMIN_MODE=true. Use the full hidden admin panel for real review.</Body>
            {adminStatus ? <Body muted>{adminStatus}</Body> : null}
            <Button label="Open compact admin panel" onPress={() => router.push("/admin" as never)} />
            <Button label="Refresh pending payments" onPress={async () => {
              await refreshPaymentRequests();
              setAdminStatus("Pending payment list refreshed.");
            }} secondary />
            {paymentRequests.filter((request) => request.status === "pending_review").map((request) => (
              <View key={request.id} style={[styles.adminRequest, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
                <Pill tone="accent">{request.provider} - {request.plan} - Rs. {request.amount}</Pill>
                <Body>{request.payerName} / {request.payerPhone}</Body>
                <Body muted>Txn: {request.transactionId}</Body>
                <Body muted>Screenshot: {request.screenshotDownloadUrl ?? request.screenshotUri}</Body>
                <Button label="Approve premium" onPress={async () => setAdminStatus(await approvePaymentRequest(request.id, "Manual QR payment confirmed"))} />
                <Button label="Reject" onPress={async () => setAdminStatus(await rejectPaymentRequest(request.id, "Could not verify payment screenshot/transaction"))} secondary />
              </View>
            ))}
          </Card>
        ) : null}
        <Card>
          <H2>{language === "en" ? "Firebase status" : "Firebase status"}</H2>
          <Pill tone={firebaseReady ? "secondary" : "accent"}>{firebaseReady ? "Configured" : "Local demo mode"}</Pill>
          <Body muted>
            {firebaseReady
              ? "Developer check: confirms profile, premium status, and daily logs can be sent to Firebase."
              : "Firebase not configured means EXPO_PUBLIC_FIREBASE_* keys are missing, so sign-in, cloud sync, payment screenshot upload, admin review, and Google login cannot work yet. The app still saves locally on this device for testing."}
          </Body>
          {syncStatus ? <Body muted>{syncStatus}</Body> : null}
          <Button
            label="Developer sync test"
            onPress={async () => {
              const result = await syncUserSnapshot({ profile, subscription, dailyCheckIns });
              setSyncStatus(result.ok ? `Ready: ${result.mode}` : `Not connected yet: ${result.mode}`);
            }}
            secondary
          />
          <Body muted>{language === "en" ? "Auth, Firestore, Storage, Messaging, and Remote Config are isolated behind the Firebase service." : "Auth, Firestore, Storage, Messaging र Remote Config Firebase service पछाडि छन्।"}</Body>
        </Card>
        <Card>
          <H2>{language === "en" ? "Knowledge base" : "Knowledge base"}</H2>
          <Pill tone="secondary">v{knowledgeBase.meta.version}</Pill>
          <Body>{language === "en" ? `${knowledgeBase.conditions.length} conditions loaded. Metadata target: ${knowledgeBase.meta.total_conditions}.` : `${knowledgeBase.conditions.length} conditions loaded। Metadata target: ${knowledgeBase.meta.total_conditions}।`}</Body>
          <Body muted>{knowledgeBase.meta.description}</Body>
        </Card>
        <Card>
          <H2>{language === "en" ? "Privacy" : "Privacy"}</H2>
          <Body>{t(language, "disclaimer")}</Body>
          <Button label="Privacy + launch safety" onPress={() => router.push("/legal" as never)} secondary />
          {privacyStatus ? <Body muted>{privacyStatus}</Body> : null}
          <Button
            label="Export my app data"
            onPress={() => {
              const data = exportData();
              setExportPreview(data.slice(0, 1800));
              setPrivacyStatus("Data export generated below. Full export is available inside app state for backend download wiring.");
            }}
            secondary
          />
          <Button
            label="Delete cloud data"
            onPress={async () => setPrivacyStatus(await deleteCloudData())}
            secondary
          />
          <Button label={t(language, "deleteData")} onPress={resetData} secondary />
          {exportPreview ? (
            <TextInput value={exportPreview} editable={false} multiline style={[styles.exportBox, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  passwordWrap: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingLeft: spacing.md, paddingRight: spacing.xs, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, minHeight: 44, fontSize: 15 },
  eyeButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  notificationGrid: { gap: spacing.xs },
  adminRequest: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  exportBox: { minHeight: 120, borderWidth: 1, borderRadius: 8, padding: spacing.sm, fontSize: 12 }
});
