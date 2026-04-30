import { Image, ScrollView, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, ProgressBar, Screen, SectionLabel } from "@/shared/components";
import { routineLogs } from "@/shared/data";
import { t } from "@/shared/i18n";
import { palettes, spacing } from "@/shared/theme";

export default function Progress() {
  const { language, themeMode, tier, setTier, profile, pickSelfie } = useApp();
  const c = palettes[themeMode];
  const premiumLocked = tier !== "premium";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <H1>{t(language, "progress")}</H1>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">Skin Health Score</SectionLabel>
              <H2>{language === "en" ? "80/100 this week" : "80/100 this week"}</H2>
              <Body muted>{language === "en" ? "Consistency, sleep, hydration, and photo logs in one gentle view." : "Consistency, sleep, hydration र photo logs एउटै view मा."}</Body>
            </View>
          </View>
          <ProgressBar value={80} color={c.primary} />
        </Card>
        <Card>
          <H2>{language === "en" ? "Weekly photo log" : "Weekly photo log"}</H2>
          {profile.selfieUri ? <Image source={{ uri: profile.selfieUri }} style={styles.selfie} /> : <Body muted>{language === "en" ? "No selfie added yet." : "अहिलेसम्म selfie छैन।"}</Body>}
          <Button label={language === "en" ? "Add weekly selfie" : "weekly selfie थप्नुहोस्"} onPress={pickSelfie} secondary />
        </Card>

        <Card>
          <H2>{language === "en" ? "Consistency" : "Consistency"}</H2>
          <Body>{language === "en" ? "You followed 80% of your routine this week. Keep it kind and consistent." : "यो हप्ता routine 80% follow भयो। विस्तारै consistent रहनुहोस्।"}</Body>
          {premiumLocked ? (
            <>
              <Pill>{t(language, "premium")}</Pill>
              <Body muted>{language === "en" ? "Graphs unlock with premium." : "Graphs premium मा unlock हुन्छ।"}</Body>
              <Button label={t(language, "upgrade")} onPress={() => setTier("premium")} />
            </>
          ) : (
            <LineChart
              data={{
                labels: routineLogs.map((item) => item.date),
                datasets: [
                  { data: routineLogs.map((item) => item.hydration), color: () => c.secondary },
                  { data: routineLogs.map((item) => item.sleep), color: () => c.primary }
                ],
                legend: ["Hydration", "Sleep"]
              }}
              width={330}
              height={220}
              yAxisSuffix="/10"
              chartConfig={{
                backgroundColor: c.surface,
                backgroundGradientFrom: c.surface,
                backgroundGradientTo: c.surface,
                decimalPlaces: 0,
                color: () => c.text,
                labelColor: () => c.muted
              }}
              bezier
              style={styles.chart}
            />
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  selfie: { width: "100%", height: 240, borderRadius: 8 },
  chart: { borderRadius: 8, alignSelf: "center" }
});
