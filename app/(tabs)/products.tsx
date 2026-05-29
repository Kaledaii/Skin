import { useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Button, Card, H1, H2, Pill, Screen, SectionLabel, Segment } from "@/shared/components";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { launchProducts } from "@/shared/productCatalog";
import { t } from "@/shared/i18n";
import { palettes, spacing } from "@/shared/theme";
import { BudgetTier, SkinType } from "@/shared/types";
import { budgetTiers, skinTypes } from "@/shared/AppContext";
import { trackEvent } from "@/shared/services/analytics";
import { ImagePromoCard, marketingImages, productVisualForCategory } from "@/shared/marketingVisuals";

type ProductSort = "recommended" | "priceLow" | "priceHigh" | "trustHigh" | "sponsoredLast";

export default function Products() {
  const { language, themeMode, profile, updateProfile, tier, savedProductIds, toggleSavedProduct } = useApp();
  const c = palettes[themeMode];
  const [sortBy, setSortBy] = useState<ProductSort>("recommended");
  const filtered = launchProducts.filter((item) => item.fit.includes(profile.skinType) && (tier === "premium" || item.budgetTier === profile.budgetTier));
  const categories = useMemo(() => Array.from(new Set(filtered.map((item) => item.category))), [filtered]);
  const [selectedCategory, setSelectedCategory] = useState("Cleanser");
  const activeCategory = categories.includes(selectedCategory) ? selectedCategory : categories[0] ?? "Cleanser";
  const visibleProducts = useMemo(
    () => sortProducts(filtered.filter((item) => item.category === activeCategory), sortBy),
    [activeCategory, filtered, sortBy]
  );
  const cartProducts = launchProducts.filter((item) => savedProductIds.includes(item.id));

  return (
    <ErrorBoundary screenName="Products">
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

        <ImagePromoCard
          item={{
            id: "product-flatlay",
            image: marketingImages.productFlatlay,
            eyebrow: "🧴 Prabha product picks",
            title: "Beauty-store browsing, smarter",
            body: "Compare budget, trust, fake-product risk, and your added-to-cart shortlist before buying.",
            cta: "Build cart 🛒",
            icon: "shopping-bag",
            emoji: "✨"
          }}
        />
        <Card>
          <H2>{language === "en" ? "Filters" : "Filter"}</H2>
          <Body muted>{language === "en" ? "Skin type" : "skin type"}</Body>
          <Segment value={profile.skinType} options={skinTypes} onChange={(skinType: SkinType) => updateProfile({ skinType })} />
          <Body muted>{language === "en" ? "Budget" : "Budget"}</Body>
          <Segment value={profile.budgetTier} options={budgetTiers} onChange={(budgetTier: BudgetTier) => updateProfile({ budgetTier })} />
        </Card>

        <Card variant="seasonal">
          <View style={styles.sectionHeader}>
            <View style={styles.flex}>
              <SectionLabel tone="accent">Added to cart</SectionLabel>
              <H2>{cartProducts.length ? `${cartProducts.length} product${cartProducts.length === 1 ? "" : "s"} saved` : "No products added yet"}</H2>
              <Body muted>{cartProducts.length ? "Use this as a shopping shortlist. Buy only after checking seller, expiry, seal, and patch test." : "Tap the cart button on products you want to compare before buying."}</Body>
            </View>
            <Pill tone={cartProducts.length ? "secondary" : "primary"}>🛒 cart</Pill>
          </View>
          <ScrollView nestedScrollEnabled style={styles.cartScroll} contentContainerStyle={styles.cartScrollContent}>
            {cartProducts.map((item) => (
              <View key={item.id} style={[styles.cartRow, { borderColor: c.border }]}>
                <Pressable onPress={() => Linking.openURL(item.affiliateUrl)} style={styles.cartCopy}>
                  <Body>{item.name}</Body>
                  <Body muted>{item.category} - {item.price}</Body>
                </Pressable>
                <Button label="Remove" onPress={() => toggleSavedProduct(item.id)} secondary />
              </View>
            ))}
          </ScrollView>
        </Card>

        <Card>
          <Pill tone="primary">Shopping trust</Pill>
          <Body muted>Store links can be affiliate links later, and sponsored picks are labeled as Ad. Always check seller rating, spelling, batch, seal, expiry, and stop if a product burns.</Body>
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <View style={styles.flex}>
              <SectionLabel tone="secondary">Product sections</SectionLabel>
              <H2>{activeCategory}</H2>
              <Body muted>{visibleProducts.length} matched picks. Switch section instead of scrolling one huge list.</Body>
            </View>
            <Pill tone="accent">{filtered.length} total</Pill>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((category) => {
              const active = category === activeCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: active ? c.primary : c.surfaceAlt,
                      borderColor: active ? c.primary : c.border,
                      transform: [{ scale: pressed ? 0.97 : 1 }]
                    }
                  ]}
                >
                  <Text style={[styles.categoryText, { color: active ? "#FFFFFF" : c.text }]}>{category}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.filterBlock}>
            <Body muted>Sort by</Body>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {sortOptions.map((option) => {
                const active = option.value === sortBy;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSortBy(option.value)}
                    style={({ pressed }) => [
                      styles.sortChip,
                      {
                        backgroundColor: active ? c.secondary : c.surfaceAlt,
                        borderColor: active ? c.secondary : c.border,
                        transform: [{ scale: pressed ? 0.97 : 1 }]
                      }
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: active ? "#FFFFFF" : c.text }]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Card>

        {visibleProducts.map((item, index) => {
          const locked = tier !== "premium" && index >= 10;
          const saved = savedProductIds.includes(item.id);
          const productImage = item.imageUrl ? { uri: item.imageUrl } : productVisualForCategory(item.visualCategory ?? item.category);
          return (
          <Card key={item.id}>
            <View style={[styles.productAccent, { backgroundColor: c.primary }]} />
            <View style={[styles.productImagePanel, { backgroundColor: c.surfaceGlow, borderColor: c.border }]}>
              <Image source={productImage} style={styles.productImage} resizeMode="contain" />
              <View style={styles.productImageBadges}>
                <Pill tone="secondary">Trust {item.trustScore}%</Pill>
                <Pill tone={item.fakeRisk === "high" ? "danger" : item.fakeRisk === "low" ? "secondary" : "accent"}>Fake risk {item.fakeRisk ?? "medium"}</Pill>
              </View>
            </View>
            <View style={styles.row}>
              <H2>{item.name}</H2>
              {item.sponsored ? <Pill tone="accent">Ad</Pill> : null}
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
              <Pill tone={item.fakeRisk === "high" ? "danger" : item.fakeRisk === "low" ? "secondary" : "accent"}>Fake risk {item.fakeRisk ?? "medium"}</Pill>
              <Button
                label={saved ? "Open product" : "Add to cart"}
                onPress={() => {
                  if (saved) {
                    trackEvent("product_clicked", { id: item.id, locked, sponsored: item.sponsored ?? false, source: "cart_button" });
                    return Linking.openURL(item.affiliateUrl);
                  }
                  return toggleSavedProduct(item.id);
                }}
                secondary
              />
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
    </ErrorBoundary>
  );
}

const sortOptions: Array<{ label: string; value: ProductSort }> = [
  { label: "Recommended", value: "recommended" },
  { label: "Price low", value: "priceLow" },
  { label: "Price high", value: "priceHigh" },
  { label: "Trust high", value: "trustHigh" },
  { label: "Ads last", value: "sponsoredLast" }
];

function sortProducts<T extends { priceMin?: number; trustScore: number; sponsored?: boolean }>(products: T[], sortBy: ProductSort) {
  const sorted = [...products];
  if (sortBy === "priceLow") return sorted.sort((a, b) => (a.priceMin ?? 999999) - (b.priceMin ?? 999999));
  if (sortBy === "priceHigh") return sorted.sort((a, b) => (b.priceMin ?? 0) - (a.priceMin ?? 0));
  if (sortBy === "trustHigh") return sorted.sort((a, b) => b.trustScore - a.trustScore);
  if (sortBy === "sponsoredLast") return sorted.sort((a, b) => Number(a.sponsored ?? false) - Number(b.sponsored ?? false));
  return sorted.sort((a, b) => Number(a.sponsored ?? false) - Number(b.sponsored ?? false) || b.trustScore - a.trustScore);
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  categoryRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  categoryChip: { minHeight: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  sortChip: { minHeight: 34, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  categoryText: { fontSize: 13, fontWeight: "800" },
  filterBlock: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  cartScroll: { maxHeight: 220 },
  cartScrollContent: { gap: spacing.xs },
  cartRow: { borderTopWidth: 1, paddingTop: spacing.sm, gap: spacing.sm, flexDirection: "row", alignItems: "center" },
  cartCopy: { flex: 1, minWidth: 0, gap: 2 },
  productAccent: { width: 46, height: 3, borderRadius: 99 },
  productImagePanel: { minHeight: 190, borderWidth: 1, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center", padding: spacing.sm },
  productImage: { width: "100%", height: 150 },
  productImageBadges: { position: "absolute", left: spacing.sm, right: spacing.sm, bottom: spacing.sm, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }
});
