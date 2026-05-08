import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/shared/AppContext";
import { Body, BrandMark, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { tips } from "@/shared/data";
import { t } from "@/shared/i18n";
import { generateRoutine, localized } from "@/shared/knowledge/engine";
import { buildBudgetRoutine, buildSkinTwin, checkIngredient, premiumModes } from "@/shared/knowledge/sellingFeatures";
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
  const { language, themeMode, tier, profile, likedTipIds, savedTipIds, toggleLikedTip, toggleSavedTip } = useApp();
  const c = palettes[themeMode];
  const [ingredientText, setIngredientText] = useState("");
  const result = useMemo(() => generateRoutine(profile.quiz), [profile.quiz]);
  const budgetRoutine = useMemo(() => buildBudgetRoutine(profile, launchProducts), [profile]);
  const skinTwin = useMemo(() => buildSkinTwin(profile), [profile]);

  const feedItems: FeedItem[] = [
    ...result.dailyMicroTips.map((tip) => ({
      id: tip.id,
      label: tip.tag,
      title: tip.text[language],
      body: language === "en" ? "Quick routine nudge for today." : "आजको quick skincare nudge।",
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

  const favoriteIds = Array.from(new Set([...likedTipIds, ...savedTipIds]));
  const favoriteItems = feedItems.filter((item) => favoriteIds.includes(item.id));
  const remainingItems = feedItems.filter((item) => !favoriteIds.includes(item.id));

  return (
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
          <Body muted>Type lemon, retinol, niacinamide, fragrance, SPF, salicylic acid, etc.</Body>
          <TextInput
            value={ingredientText}
            onChangeText={setIngredientText}
            placeholder="Type ingredient or product claim"
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <Body>{checkIngredient(ingredientText)}</Body>
          {tier !== "premium" ? <ButtonLabel text="Premium later: scan full product ingredient lists" /> : null}
        </Card>

        <Card>
          <H2>Modes that sell</H2>
          <Body muted>Special routines for real Nepali life moments.</Body>
          {premiumModes.map((mode, index) => {
            const locked = tier !== "premium" && index >= 2;
            return (
              <Pressable key={mode.id} onPress={() => locked ? router.push("/paywall" as never) : undefined} style={[styles.modeCard, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                <View style={styles.cardTopRow}>
                  <H2>{locked ? "Premium mode" : mode.title}</H2>
                  <Pill tone={locked ? "accent" : "secondary"}>{locked ? "locked" : "ready"}</Pill>
                </View>
                <Body muted>{locked ? "Unlock event, hostel, winter, festival, exam, and budget-specific routines." : mode.body}</Body>
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
                saved={savedTipIds.includes(item.id)}
                onLike={() => toggleLikedTip(item.id)}
                onSave={() => toggleSavedTip(item.id)}
                onShare={() => shareTip(item.title, item.body)}
                compact
              />
            ))}
          </Card>
        ) : null}

        <Card>
          <H2>{language === "en" ? "All tips" : "All tips"}</H2>
          {remainingItems.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              language={language}
              themeMode={themeMode}
              color={c}
              liked={likedTipIds.includes(item.id)}
              saved={savedTipIds.includes(item.id)}
              onLike={() => toggleLikedTip(item.id)}
              onSave={() => toggleSavedTip(item.id)}
              onShare={() => shareTip(item.title, item.body)}
            />
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ButtonLabel({ text }: { text: string }) {
  return <Pill tone="accent">{text}</Pill>;
}

function FeedCard({
  item,
  color,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
  compact = false
}: {
  item: FeedItem;
  language: "en" | "ne";
  themeMode: "light" | "dark";
  color: (typeof palettes)["light"];
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
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
            <ActionButton icon="bookmark" active={saved} activeColor={color.secondary} inactiveColor={color.muted} onPress={onSave} />
            <ActionButton icon="share-2" active={false} activeColor={color.accent} inactiveColor={color.muted} onPress={onShare} />
          </View>
        </View>
        <H2>{item.title}</H2>
        <Body muted>{item.body}</Body>
        <View style={styles.badgeRow}>
          <Pill tone={liked || saved ? "secondary" : "primary"}>{liked || saved ? "Saved" : "Tap heart to save"}</Pill>
          {item.kind === "micro" ? <Pill tone="accent">micro tip</Pill> : null}
        </View>
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
  icon: "heart" | "bookmark" | "share-2";
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
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 }
});
