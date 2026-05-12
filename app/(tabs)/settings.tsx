import { ScrollView, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, Segment } from "@/shared/components";
import { t } from "@/shared/i18n";
import { knowledgeBase } from "@/shared/knowledge/engine";
import { premiumPlans } from "@/shared/monetization";
import { palettes, spacing } from "@/shared/theme";
import { Language, SubscriptionTier, ThemeMode } from "@/shared/types";
import { firebaseReady } from "@/shared/services/firebase";
import { syncUserSnapshot } from "@/shared/services/firebaseSync";

export default function Settings() {
  const { language, setLanguage, themeMode, setThemeMode, tier, setTier, subscription, profile, dailyCheckIns, exportData, deleteCloudData, resetData } = useApp();
  const c = palettes[themeMode];
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
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
          <H2>{language === "en" ? "Subscription" : "Subscription"}</H2>
          <Segment value={tier} options={["free", "premium"] as SubscriptionTier[]} onChange={setTier} />
          <Pill tone={tier === "premium" ? "secondary" : "accent"}>{subscription.status} via {subscription.source}</Pill>
          <Body muted>{language === "en" ? `${premiumPlans.monthly.price}/month or ${premiumPlans.yearly.price}/year target. Khalti/eSewa confirmation will write paid status before production unlock.` : "Khalti/eSewa confirm bhayepachi premium unlock huncha."}</Body>
          <Button label="View premium plans" onPress={() => router.push("/paywall" as never)} secondary />
        </Card>
        <Card>
          <H2>{language === "en" ? "Firebase status" : "Firebase status"}</H2>
          <Pill tone={firebaseReady ? "secondary" : "accent"}>{firebaseReady ? "Configured" : "Local demo mode"}</Pill>
          <Body muted>
            {firebaseReady
              ? "Developer check: confirms profile, premium status, and daily logs can be sent to Firebase."
              : "Developer check only. Local demo mode means your data is saved on this device, not uploaded online yet."}
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
  exportBox: { minHeight: 120, borderWidth: 1, borderRadius: 8, padding: spacing.sm, fontSize: 12 }
});
