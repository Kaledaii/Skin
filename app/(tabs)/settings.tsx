import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, Segment } from "@/shared/components";
import { t } from "@/shared/i18n";
import { premiumPlans } from "@/shared/monetization";
import { registerExpoPushToken, requestNotificationAccess } from "@/shared/services/notifications";
import { spacing } from "@/shared/theme";
import { Language, ThemeMode } from "@/shared/types";

export default function Settings() {
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    tier,
    subscription,
    loadSubscription,
    notificationPreferences,
    updateNotificationPreferences
  } = useApp();
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
          {subscription.expiresAt ? <Body muted>Premium ends on {new Date(subscription.expiresAt).toLocaleDateString()}.</Body> : null}
          <Button label="View premium plans" onPress={() => router.push("/paywall" as never)} secondary />
          <Button label="Refresh subscription" onPress={loadSubscription} secondary />
        </Card>

        <Card>
          <H2>Support / समस्या</H2>
          <Body muted>For payment review, app query, or any problem, contact us directly.</Body>
          <Pill tone="secondary">Phone: 9709185409</Pill>
          <Pill tone="accent">Email: mishant480@gmail.com</Pill>
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
  notificationGrid: { gap: spacing.xs }
});
