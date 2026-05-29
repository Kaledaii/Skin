import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, Segment } from "@/shared/components";
import { t } from "@/shared/i18n";
import { premiumPlans } from "@/shared/monetization";
import { syncUserSnapshot } from "@/shared/services/firebaseSync";
import { registerExpoPushToken, requestNotificationAccess } from "@/shared/services/notifications";
import { palettes, spacing } from "@/shared/theme";
import { Language, ThemeMode } from "@/shared/types";

export default function Settings() {
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    tier,
    subscription,
    profile,
    dailyCheckIns,
    paymentRequests,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    loadSubscription,
    notificationPreferences,
    updateNotificationPreferences
  } = useApp();
  const c = palettes[themeMode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

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
          <Body muted>Routine reminders, weather skin alerts, and completion praise.</Body>
          {notificationStatus ? <Body muted>{notificationStatus}</Body> : null}
          <View style={styles.notificationGrid}>
            <Button label={`Routine reminders: ${notificationPreferences.routineReminders ? "On" : "Off"}`} onPress={() => updateNotificationPreferences({ routineReminders: !notificationPreferences.routineReminders })} secondary />
            <Button label={`Weather alerts: ${notificationPreferences.weatherAlerts ? "On" : "Off"}`} onPress={() => updateNotificationPreferences({ weatherAlerts: !notificationPreferences.weatherAlerts })} secondary />
            <Button label={`Completion praise: ${notificationPreferences.completionPraise ? "On" : "Off"}`} onPress={() => updateNotificationPreferences({ completionPraise: !notificationPreferences.completionPraise })} secondary />
            <Button label={`Quiet hours: ${notificationPreferences.quietHoursEnabled ? "On" : "Off"}`} onPress={() => updateNotificationPreferences({ quietHoursEnabled: !notificationPreferences.quietHoursEnabled })} secondary />
          </View>
          <Button
            label="Enable phone notifications"
            onPress={async () => {
              const access = await requestNotificationAccess();
              const token = await registerExpoPushToken();
              setNotificationStatus(access.granted ? `Enabled${token.ok ? "." : ", but push sync is not ready yet."}` : `Not enabled: ${access.reason}.`);
            }}
          />
        </Card>

        <Card>
          <H2>Subscription</H2>
          <Pill tone={tier === "premium" ? "secondary" : "accent"}>{subscription.status}</Pill>
          <Body muted>{`${premiumPlans.monthly.price}/month or ${premiumPlans.yearly.price}/year.`}</Body>
          <Button label="View premium plans" onPress={() => router.push("/paywall" as never)} secondary />
          <Button label="Refresh subscription" onPress={loadSubscription} secondary />
        </Card>

        <Card>
          <H2>Account recovery</H2>
          <Body muted>Email/password helps recover premium after refresh, reinstall, or another device.</Body>
          {authStatus ? <Body muted>{authStatus}</Body> : null}
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
          <View style={[styles.passwordWrap, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!showPassword} placeholderTextColor={c.muted} style={[styles.passwordInput, { color: c.text }]} />
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
              <Feather name={showPassword ? "eye-off" : "eye"} color={c.muted} size={20} />
            </Pressable>
          </View>
          <Button
            label="Create email account"
            onPress={async () => {
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
            }}
            secondary
          />
          <Button
            label="Sign in"
            onPress={async () => {
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
            }}
            secondary
          />
          <Button
            label="Sign in with Google"
            onPress={async () => {
              try {
                const result = await signInWithGoogle();
                if (result.ok) {
                  await syncUserSnapshot({ profile, subscription, dailyCheckIns, paymentRequests });
                  await loadSubscription();
                }
                setAuthStatus(result.message);
              } catch (error) {
                setAuthStatus(error instanceof Error ? error.message : "Google sign-in could not open.");
              }
            }}
            secondary
          />
        </Card>

        <Card>
          <H2>Privacy</H2>
          <Body>{t(language, "disclaimer")}</Body>
          <Button label="Privacy + launch safety" onPress={() => router.push("/legal" as never)} secondary />
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
  notificationGrid: { gap: spacing.xs }
});
