import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel, Segment } from "@/shared/components";
import { launchProducts } from "@/shared/productCatalog";
import { t } from "@/shared/i18n";
import { palettes, spacing } from "@/shared/theme";
import { BudgetTier, SkinType } from "@/shared/types";
import { budgetTiers, skinTypes } from "@/shared/AppContext";
import { trackEvent } from "@/shared/services/analytics";

export default function Products() {
  const { language, themeMode, profile, updateProfile, tier } = useApp();
  const c = palettes[themeMode];
  const filtered = launchProducts.filter((item) => item.fit.includes(profile.skinType) && (tier === "premium" || item.budgetTier === profile.budgetTier));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">{language === "en" ? "Matched local picks" : "Matched local picks"}</SectionLabel>
              <H1>{t(language, "products")}</H1>
              <Body muted>{language === "en" ? "Smart shopping assistant with local availability, fake-product warnings, and affiliate-ready store links." : "Skin type, budget ra local availability anusar product picks."}</Body>
            </View>
          </View>
        </Card>
        <Card>
          <H2>{language === "en" ? "Filters" : "Filter"}</H2>
          <Body muted>{language === "en" ? "Skin type" : "skin type"}</Body>
          <Segment value={profile.skinType} options={skinTypes} onChange={(skinType: SkinType) => updateProfile({ skinType })} />
          <Body muted>{language === "en" ? "Budget" : "Budget"}</Body>
          <Segment value={profile.budgetTier} options={budgetTiers} onChange={(budgetTier: BudgetTier) => updateProfile({ budgetTier })} />
        </Card>

        {filtered.map((item, index) => {
          const locked = tier !== "premium" && index >= 6;
          return (
          <Card key={item.id}>
            <View style={[styles.productAccent, { backgroundColor: c.primary }]} />
            <View style={styles.row}>
              <H2>{item.name}</H2>
              {item.sponsored ? <Pill tone="accent">{t(language, "sponsored")}</Pill> : null}
            </View>
            <Body muted>{item.category} - {item.price}</Body>
            <Body>{item.ingredientLabel[language]}</Body>
            <Body muted>{locked ? "Premium unlocks exact match reason, alternatives, and fake-product checks." : item.whyMatched?.[language] ?? item.whyMatched?.en}</Body>
            {tier === "premium" ? (
              <>
                <Body muted>Why not: {item.whyNot?.[language] ?? item.whyNot?.en}</Body>
                <Body muted>Safety: {item.safetyNote?.[language] ?? item.safetyNote?.en}</Body>
                <Body muted>Where: {(item.whereToBuy ?? ["Daraz", "pharmacy"]).join(", ")} | Fake risk: {item.fakeRisk ?? "medium"}</Body>
              </>
            ) : null}
            <View style={styles.row}>
              <Pill tone="primary">{item.category}</Pill>
              <Pill tone="secondary">Trust {item.trustScore}%</Pill>
              {item.sponsored ? <Pill tone="accent">Sponsored</Pill> : null}
              <Button
                label={locked ? "Unlock smart match" : "Daraz / Pharmacy"}
                onPress={() => {
                  trackEvent("product_clicked", { id: item.id, locked, sponsored: item.sponsored ?? false });
                  return locked ? router.push("/paywall" as never) : Linking.openURL(item.affiliateUrl);
                }}
                secondary
              />
            </View>
          </Card>
        );})}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  productAccent: { width: 46, height: 3, borderRadius: 99 }
});
