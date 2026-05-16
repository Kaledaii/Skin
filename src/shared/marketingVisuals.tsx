import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useApp } from "./AppContext";
import { palettes, spacing } from "./theme";

export const marketingImages = {
  campaignComposite: require("../../assets/marketing/campaign-composite.png"),
  glowJourney: require("../../assets/marketing/glow-journey.png"),
  glowPrabha: require("../../assets/marketing/glow-prabha.png"),
  trackGlow: require("../../assets/marketing/track-glow.png"),
  brightProtected: require("../../assets/marketing/bright-protected.png"),
  festiveReady: require("../../assets/marketing/festive-ready.png"),
  skinProgress: require("../../assets/marketing/skin-progress-before-after.png"),
  warmGlow: require("../../assets/marketing/warm-glow-closeup.png"),
  cleanBeauty: require("../../assets/marketing/clean-beauty-portrait.png"),
  glassSkin: require("../../assets/marketing/glass-skin-portrait.png"),
  productFlatlay: require("../../assets/marketing/product-flatlay.png"),
  sunscreenApplication: require("../../assets/marketing/sunscreen-application.png"),
  portraitSoftSmile: require("../../assets/marketing/portrait-soft-smile.png"),
  portraitRedSareeClose: require("../../assets/marketing/portrait-red-saree-close.png"),
  portraitYellowOutdoor: require("../../assets/marketing/portrait-yellow-outdoor.png"),
  portraitWhiteBangs: require("../../assets/marketing/portrait-white-bangs.png"),
  portraitFestiveBraid: require("../../assets/marketing/portrait-festive-braid.png"),
  portraitCreamSmile: require("../../assets/marketing/portrait-cream-smile.png"),
  portraitBlueBangs: require("../../assets/marketing/portrait-blue-bangs.png"),
  portraitGreenBindi: require("../../assets/marketing/portrait-green-bindi.png"),
  portraitGlowClose: require("../../assets/marketing/portrait-glow-close.png"),
  portraitRedBokeh: require("../../assets/marketing/portrait-red-bokeh.png")
} satisfies Record<string, ImageSourcePropType>;

type PromoItem = {
  id: string;
  image: ImageSourcePropType;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  icon?: ComponentProps<typeof Feather>["name"];
  emoji?: string;
};

export function MarketingHero({
  image,
  eyebrow,
  title,
  body,
  cta,
  onPress,
  tall = false,
  style
}: {
  image: ImageSourcePropType;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  onPress?: () => void;
  tall?: boolean;
  style?: ViewStyle;
}) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const opacity = useFadeIn();
  return (
    <Animated.View style={[{ opacity }, style]}>
      <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
        <ImageBackground source={image} resizeMode="cover" imageStyle={styles.heroImage} style={[styles.hero, tall && styles.heroTall]}>
          <View style={[styles.heroShade, { backgroundColor: themeMode === "dark" ? "rgba(20, 10, 14, 0.58)" : "rgba(255, 244, 239, 0.42)" }]} />
          <View style={styles.sparkleOne} />
          <View style={styles.sparkleTwo} />
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: c.accent }]}>{eyebrow}</Text>
            <Text style={[styles.heroTitle, { color: themeMode === "dark" ? "#FFF8F5" : c.text }]}>{title}</Text>
            <Text style={[styles.heroBody, { color: themeMode === "dark" ? "#F6D7D1" : c.deep }]}>{body}</Text>
            {cta ? (
              <View style={[styles.ctaPill, { backgroundColor: c.primary }]}>
                <Text style={styles.ctaText}>{cta}</Text>
              </View>
            ) : null}
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

export function ImagePromoCard({ item, onPress, compact = false, style }: { item: PromoItem; onPress?: () => void; compact?: boolean; style?: ViewStyle }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const opacity = useFadeIn();
  return (
    <Animated.View style={[styles.promoWrap, compact && styles.promoCompact, { opacity }, style]}>
      <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.promoPressable, { transform: [{ scale: pressed ? 0.975 : 1 }] }]}>
        <ImageBackground source={item.image} resizeMode="cover" imageStyle={styles.promoImage} style={styles.promoImageBox}>
          <View style={[styles.promoShade, { backgroundColor: themeMode === "dark" ? "rgba(23, 10, 14, 0.42)" : "rgba(255, 255, 255, 0.18)" }]} />
          <View style={styles.promoCopy}>
            <View style={styles.promoLabelRow}>
              <Text style={[styles.promoEmoji, { color: c.primary }]}>{item.emoji ?? "✨"}</Text>
              <Text style={[styles.promoEyebrow, { color: c.accent }]}>{item.eyebrow}</Text>
            </View>
            <Text style={[styles.promoTitle, { color: themeMode === "dark" ? "#FFF8F5" : c.text }]}>{item.title}</Text>
            <Text style={[styles.promoBody, { color: themeMode === "dark" ? "#F4DAD4" : c.deep }]}>{item.body}</Text>
            {item.cta ? (
              <View style={[styles.smallCta, { backgroundColor: c.surface }]}>
                {item.icon ? <Feather name={item.icon} color={c.primary} size={14} /> : null}
                <Text style={[styles.smallCtaText, { color: c.text }]}>{item.cta}</Text>
              </View>
            ) : null}
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

export function GlowCarousel({ items, onItemPress }: { items: PromoItem[]; onItemPress?: (item: PromoItem) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const active = items[activeIndex] ?? items[0];
  const dots = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
  }, []);

  useEffect(() => {
    if (reducedMotion || items.length <= 1) return;
    const timer = setInterval(() => setActiveIndex((current) => (current + 1) % items.length), 5600);
    return () => clearInterval(timer);
  }, [items.length, reducedMotion]);

  if (!active) return null;
  return (
    <View style={styles.carousel}>
      <ImagePromoCard item={active} onPress={() => onItemPress?.(active)} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dotRow}>
        {dots.map((id, index) => (
          <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Show glow card ${index + 1}`} onPress={() => setActiveIndex(index)} style={styles.dotTap}>
            <View style={[styles.dot, index === activeIndex && styles.dotActive]} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function VisualStrip({ children }: { children: ReactNode }) {
  return <View style={styles.visualStrip}>{children}</View>;
}

export function PortraitGlowStrip({
  title = "Confidence in Every Shade",
  subtitle = "Real glow goals, gentle routine energy.",
  images
}: {
  title?: string;
  subtitle?: string;
  images: ImageSourcePropType[];
}) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const opacity = useFadeIn();
  return (
    <Animated.View style={[styles.portraitPanel, { backgroundColor: c.surfaceGlow, borderColor: c.border, opacity }]}>
      <View style={styles.portraitHeader}>
        <Text style={[styles.portraitTitle, { color: c.text }]}>✨ {title}</Text>
        <Text style={[styles.portraitSubtitle, { color: c.muted }]}>{subtitle}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portraitRow}>
        {images.map((image, index) => (
          <ImageBackground key={index} source={image} resizeMode="cover" imageStyle={styles.portraitImage} style={[styles.portraitTile, { borderColor: c.borderStrong }]}>
            <View style={styles.portraitGlow} />
          </ImageBackground>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function useFadeIn() {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 520, useNativeDriver: true }).start();
  }, [opacity]);
  return opacity;
}

const styles = StyleSheet.create({
  hero: { minHeight: 230, borderRadius: 14, overflow: "hidden", justifyContent: "center" },
  heroTall: { minHeight: 300 },
  heroImage: { borderRadius: 14 },
  heroShade: { ...StyleSheet.absoluteFillObject },
  heroCopy: { width: "62%", minWidth: 250, padding: spacing.lg, gap: spacing.xs },
  eyebrow: { fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  heroTitle: { fontSize: 33, lineHeight: 38, fontWeight: "900", fontFamily: "Georgia" },
  heroBody: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  ctaPill: { alignSelf: "flex-start", minHeight: 42, borderRadius: 999, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", marginTop: spacing.xs },
  ctaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  sparkleOne: { position: "absolute", top: 22, right: 38, width: 72, height: 72, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.34)" },
  sparkleTwo: { position: "absolute", bottom: 36, left: 34, width: 34, height: 34, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.42)" },
  promoWrap: { minHeight: 212, borderRadius: 14, overflow: "hidden" },
  promoCompact: { minHeight: 170 },
  promoPressable: { flex: 1 },
  promoImageBox: { minHeight: 212, justifyContent: "flex-end" },
  promoImage: { borderRadius: 14 },
  promoShade: { ...StyleSheet.absoluteFillObject },
  promoCopy: { padding: spacing.md, gap: 4 },
  promoLabelRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  promoEmoji: { fontSize: 18, fontWeight: "900" },
  promoEyebrow: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  promoTitle: { fontSize: 24, lineHeight: 29, fontWeight: "900", fontFamily: "Georgia" },
  promoBody: { fontSize: 14, lineHeight: 19, fontWeight: "700" },
  smallCta: { alignSelf: "flex-start", minHeight: 32, borderRadius: 999, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs },
  smallCtaText: { fontSize: 12, fontWeight: "900" },
  carousel: { gap: spacing.xs },
  dotRow: { alignSelf: "center", gap: spacing.xs, paddingVertical: spacing.xs },
  dotTap: { padding: 4 },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: "rgba(210, 112, 133, 0.32)" },
  dotActive: { width: 24, backgroundColor: "#D95B79" },
  visualStrip: { gap: spacing.md },
  portraitPanel: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.sm, overflow: "hidden" },
  portraitHeader: { gap: 2 },
  portraitTitle: { fontSize: 19, fontWeight: "900", fontFamily: "Georgia" },
  portraitSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  portraitRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  portraitTile: { width: 92, height: 122, borderWidth: 1, borderRadius: 18, overflow: "hidden", justifyContent: "flex-end" },
  portraitImage: { borderRadius: 18 },
  portraitGlow: { height: 36, backgroundColor: "rgba(255,255,255,0.16)" }
});
