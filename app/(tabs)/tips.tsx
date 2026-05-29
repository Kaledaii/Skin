import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { tips } from "@/shared/data";
import { t } from "@/shared/i18n";
import { generateRoutine, localized } from "@/shared/knowledge/engine";
import { buildBudgetRoutine, buildSkinTwin, checkIngredient, premiumModes } from "@/shared/knowledge/sellingFeatures";
import { ImagePromoCard, marketingImages } from "@/shared/marketingVisuals";
import { launchProducts } from "@/shared/productCatalog";
import { palettes, spacing } from "@/shared/theme";

type FeedItem = {
  id: string;
  label: string;
  title: string;
  body: string;
  colorTone: "primary" | "secondary" | "accent";
  kind: "micro" | "tip";
};

export default function Tips() {
  const { language, themeMode, tier, profile, likedTipIds, toggleLikedTip } = useApp();
  const c = palettes[themeMode];
  const [ingredientText, setIngredientText] = useState("");
  const [activeModeId, setActiveModeId] = useState<string | null>(null);
  const result = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const budgetRoutine = useMemo(() => buildBudgetRoutine(profile, launchProducts), [profile]);
  const skinTwin = useMemo(() => buildSkinTwin(profile), [profile]);
  const ingredientResult = checkIngredient(ingredientText);

  const feedItems: FeedItem[] = [
    ...result.dailyMicroTips.map((tip) => ({
      id: tip.id,
      label: tip.tag,
      title: tip.text[language],
      body: "",
      colorTone: "accent" as const,
      kind: "micro" as const
    })),
    ...tips.map((tip) => ({
      id: tip.id,
      label: `${tip.duration}`,
      title: tip.title[language],
      body: tip.body[language],
      colorTone: "primary" as const,
      kind: "tip" as const
    }))
  ];

  const favoriteIds = Array.from(new Set(likedTipIds));
  const favoriteItems = feedItems.filter((item) => favoriteIds.includes(item.id));

  return (
    <ErrorBoundary screenName="Tips">
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
        <Card variant="hero">
          <View style={styles.heroRow}>
            <BrandMark compact />
            <View style={styles.flex}>
              <SectionLabel tone="accent">{language === "en" ? "Nepali-first micro care" : "Nepali-first micro care"}</SectionLabel>
              <H1>{t(language, "tips")}</H1>
              <Body muted>{language === "en" ? "Short skincare nudges you can like, save, and share." : "Like, save र share गर्न मिल्ने छोटा skincare nudges."}</Body>
            </View>
          </View>
        </Card>

        <ImagePromoCard
          item={{
            id: "spf-weather",
            image: marketingImages.sunscreenApplication,
            eyebrow: "☀️ UV  🌧️ Rain  🌫️ AQI",
            title: "Stay Bright & Protected",
            body: "SPF, sweat rinse, umbrella, mask, hydration, and night cleanse tips for Nepal days.",
            cta: "Get Daily Tips",
            icon: "sun",
            emoji: "🧴"
          }}
        />

        <Card variant="seasonal">
          <H2>Skin Twin</H2>
          <Body>{skinTwin}</Body>
          <Pill tone={tier === "premium" ? "secondary" : "accent"}>{tier === "premium" ? "Personalized" : "Premium preview"}</Pill>
        </Card>

        <Card>
          <H2>Budget Routine Builder</H2>
          <Pill tone="secondary">{budgetRoutine.label}</Pill>
          <Body muted>{budgetRoutine.note}</Body>
          {budgetRoutine.picks.map((product) => (
            <View key={product.id} style={[styles.modeCard, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <Body>{product.name}</Body>
              <Body muted>{product.category} - {product.price}</Body>
            </View>
          ))}
          {tier !== "premium" ? <ButtonLabel text="Unlock full budget alternatives" /> : null}
        </Card>

        <Card>
          <H2>Ingredient Checker</H2>
          <Body muted>Type lemon, retinol, niacinamide, fragrance, SPF, salicylic acid, etc. It checks live while you type.</Body>
          <TextInput
            value={ingredientText}
            onChangeText={setIngredientText}
            placeholder="Type ingredient or product claim"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <View style={[styles.resultBox, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
            <Pill tone={ingredientText.trim() ? (ingredientResult.toLowerCase().includes("avoid") ? "danger" : "secondary") : "accent"}>
              {ingredientText.trim() ? "Checker result" : "Waiting"}
            </Pill>
            <Body>{ingredientResult}</Body>
          </View>
          {tier !== "premium" ? <ButtonLabel text="Premium later: scan full product ingredient lists" /> : null}
        </Card>

        <Card>
          <H2>Personalized skin modes</H2>
          <Body muted>Tap a ready mode to preview a focused routine for real Nepali life moments.</Body>
          {premiumModes.map((mode, index) => {
            const locked = tier !== "premium" && index >= 2;
            const open = activeModeId === mode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => (locked ? router.push("/paywall" as never) : setActiveModeId(open ? null : mode.id))}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: open ? c.primarySoft : c.surfaceAlt,
                    borderColor: open ? c.borderStrong : c.border,
                    transform: [{ scale: pressed ? 0.99 : 1 }]
                  }
                ]}
              >
                <View style={styles.cardTopRow}>
                  <H2>{locked ? "Premium mode" : mode.title}</H2>
                  <Pill tone={locked ? "accent" : "secondary"}>{locked ? "locked" : "ready"}</Pill>
                </View>
                <Body muted>{locked ? "Unlock event, hostel, winter, festival, exam, and budget-specific routines." : mode.body}</Body>
                {open ? (
                  <View style={[styles.modeDetail, { borderColor: c.border, backgroundColor: c.surface }]}>
                    <Pill tone={tier === "premium" ? "secondary" : "primary"}>{tier === "premium" ? "Premium active" : "Personalized preview"}</Pill>
                    <Body>{mode.preview}</Body>
                    <Body muted>{tier === "premium" ? mode.unlockedAction : mode.action}</Body>
                    {tier === "premium" ? (
                      <View style={styles.modeSectionGrid}>
                        {mode.premiumSections.map((section) => (
                          <View key={section.title} style={[styles.modeSection, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
                            <Pill tone="primary">{section.title}</Pill>
                            <Body muted>{section.body}</Body>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </Card>

        {favoriteItems.length > 0 ? (
          <Card variant="accent">
            <H2>{language === "en" ? "Favorites" : "Favorites"}</H2>
            {favoriteItems.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                language={language}
                themeMode={themeMode}
                color={c}
                liked={likedTipIds.includes(item.id)}
                onLike={() => toggleLikedTip(item.id)}
                onShare={() => shareTip(item.title, item.body)}
                compact
              />
            ))}
          </Card>
        ) : null}

        <Card>
          <H2>{language === "en" ? "All tips" : "All tips"}</H2>
          {feedItems.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              language={language}
              themeMode={themeMode}
              color={c}
              liked={likedTipIds.includes(item.id)}
              onLike={() => toggleLikedTip(item.id)}
              onShare={() => shareTip(item.title, item.body)}
            />
          ))}
        </Card>
      </ScrollView>
    </Screen>
    </ErrorBoundary>
  );
}

function ButtonLabel({ text }: { text: string }) {
  return <Pill tone="accent">{text}</Pill>;
}

function FeedCard({
  item,
  color,
  liked,
  onLike,
  onShare,
  compact = false
}: {
  item: FeedItem;
  language: "en" | "ne";
  themeMode: "light" | "dark";
  color: (typeof palettes)["light"];
  liked: boolean;
  onLike: () => void;
  onShare: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.reel, compact && styles.compactReel]}>
      <View style={[styles.video, { backgroundColor: item.colorTone === "accent" ? color.primarySoft : color.surfaceAlt, borderColor: color.border }]}>
        <View style={styles.cardTopRow}>
          <Pill tone={item.colorTone}>{item.label}</Pill>
          <View style={styles.actions}>
            <ActionButton icon="heart" active={liked} activeColor={color.primary} inactiveColor={color.muted} onPress={onLike} />
            <ActionButton icon="share-2" active={false} activeColor={color.accent} inactiveColor={color.muted} onPress={onShare} />
          </View>
        </View>
        <H2>{item.title}</H2>
        {item.body ? <Body muted>{item.body}</Body> : null}
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  active,
  activeColor,
  inactiveColor,
  onPress
}: {
  icon: "heart" | "share-2";
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, { borderColor: active ? activeColor : "transparent", transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      <Feather name={icon} color={active ? activeColor : inactiveColor} size={18} />
    </Pressable>
  );
}

async function shareTip(title: string, body: string) {
  const message = `${title}\n${body}`;
  try {
    await Share.share({ message });
  } catch {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
    }
  }
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  reel: { minHeight: 260, justifyContent: "space-between" },
  compactReel: { minHeight: 220 },
  video: { flex: 1, borderRadius: 8, borderWidth: 1, padding: spacing.lg, justifyContent: "space-between", gap: spacing.sm },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.xs },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  modeCard: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  modeDetail: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  modeSectionGrid: { gap: spacing.xs, marginTop: spacing.xs },
  modeSection: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  resultBox: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 }
});
