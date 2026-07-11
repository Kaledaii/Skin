import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, Segment } from "@/shared/components";
import { t } from "@/shared/i18n";
import { premiumPlans } from "@/shared/monetization";
import { registerExpoPushToken, requestNotificationAccess } from "@/shared/services/notifications";
import { palettes, spacing } from "@/shared/theme";
import { AppReview, Language, ThemeMode } from "@/shared/types";

export default function Settings() {
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    tier,
    subscription,
    loadSubscription,
    profile,
    profiles,
    activeProfileId,
    switchProfile,
    addProfile,
    activateProfileAddOn,
    authUser,
    authStatus,
    recoveryPhone,
    syncNow,
    refreshAccountData,
    notificationPreferences,
    updateNotificationPreferences,
    submitReview
  } = useApp();
  const c = palettes[themeMode];
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [rating, setRating] = useState<AppReview["rating"] | 0>(0);
  const [experience, setExperience] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

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
          <H2>Account</H2>
          <Body muted>Your email account protects premium, quiz answers, profiles, progress, and payment history after reinstall.</Body>
          <Pill tone={authUser?.email ? "secondary" : "danger"}>{authUser?.email ? "Signed in" : "Email login required"}</Pill>
          <Body>Email: {authUser?.email ?? "Not signed in"}</Body>
          <Body muted>Recovery phone: {recoveryPhone || "Add it on the login screen or next payment."}</Body>
          <View style={styles.notificationGrid}>
            <Button label="Sync account now" onPress={async () => setAccountStatus(await syncNow())} secondary />
            <Button label="Refresh account data" onPress={async () => setAccountStatus(await refreshAccountData())} secondary />
          </View>
          <Body muted>Paid but premium missing? Contact support with your account email, payment phone, transaction ID, and screenshot.</Body>
          {accountStatus || authStatus ? <Body>{accountStatus ?? authStatus}</Body> : null}
        </Card>

        <Card>
          <H2>Profiles</H2>
          <Body muted>Each person gets separate quiz answers, recommendations, progress logs, and follow-up reviews.</Body>
          <Pill tone={profile.addOnStatus === "locked" ? "accent" : "secondary"}>{profile.addOnStatus === "locked" ? "Current profile locked" : `Current: ${profile.name || "New profile"}`}</Pill>
          <View style={styles.profileList}>
            {Object.values(profiles).map((item) => {
              const active = item.profileId === activeProfileId;
              const locked = item.addOnStatus === "locked";
              return (
                <View key={item.profileId} style={[styles.profileRow, { borderColor: active ? c.borderStrong : c.border, backgroundColor: active ? c.primarySoft : c.surfaceAlt }]}>
                  <View style={styles.profileCopy}>
                    <Body>{item.name || "New profile"}</Body>
                    <Body muted>{locked ? "Paid add-on required" : `${item.gender.replace(/_/g, " ")} - ${item.skinType}`}</Body>
                  </View>
                  <View style={styles.profileActions}>
                    <Button label={active ? "Active" : "Switch"} onPress={() => switchProfile(item.profileId ?? "primary")} secondary />
                    {locked ? <Button label="Activate add-on" onPress={() => {
                      activateProfileAddOn(item.profileId ?? "primary");
                      router.push("/onboarding" as never);
                    }} secondary /> : null}
                  </View>
                </View>
              );
            })}
          </View>
          <Button
            label="Add paid profile"
            onPress={() => {
              addProfile();
            }}
            secondary
          />
          <Body muted>New profiles start locked. Activate the paid add-on, then open onboarding to fill that person's quiz.</Body>
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
          <H2>Review</H2>
          <Body muted>Tell us how Prabha felt to use. Your feedback helps us improve the beta.</Body>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= rating;
              return (
                <Pressable
                  key={value}
                  onPress={() => setRating(value as AppReview["rating"])}
                  style={({ pressed }) => [
                    styles.starButton,
                    {
                      backgroundColor: active ? c.accentSoft : c.surfaceAlt,
                      borderColor: active ? c.accent : c.border,
                      transform: [{ scale: pressed ? 0.94 : 1 }]
                    }
                  ]}
                >
                  <Text style={[styles.starText, { color: active ? c.accent : c.muted }]}>★</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={experience}
            onChangeText={setExperience}
            multiline
            maxLength={1200}
            placeholder="Write your experience, confusion, favorite feature, or what should improve..."
            placeholderTextColor={c.muted}
            style={[styles.reviewInput, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
            textAlignVertical="top"
          />
          <Body muted>{experience.length}/1200 characters</Body>
          <Button
            label={submittingReview ? "Submitting review..." : "Submit review"}
            disabled={submittingReview}
            onPress={async () => {
              setSubmittingReview(true);
              try {
                const message = await submitReview({ rating: (rating || 0) as AppReview["rating"], experience });
                setReviewStatus(message);
                if (rating && experience.trim().length >= 8) setExperience("");
              } finally {
                setSubmittingReview(false);
              }
            }}
          />
          {reviewStatus ? <Body muted>{reviewStatus}</Body> : null}
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
  notificationGrid: { gap: spacing.xs },
  profileList: { gap: spacing.xs },
  profileRow: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  profileCopy: { gap: 2 },
  profileActions: { gap: spacing.xs },
  starRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  starButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  starText: { fontSize: 24, fontWeight: "900" },
  reviewInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22
  }
});
