import { Feather } from "@expo/vector-icons";
import type { ComponentProps, PropsWithChildren } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { palettes, spacing } from "./theme";
import { useApp } from "./AppContext";

const nativeDriver = Platform.OS !== "web";
const brandIcon = require("../../assets/brand/prabha-icon-1024.png");
const brandLogo = require("../../assets/brand/prabha-logo-cream@small.png");

export function Screen({ children, showQuickActions = true }: PropsWithChildren<{ showQuickActions?: boolean }>) {
  const { themeMode } = useApp();
  return (
    <View style={[styles.screen, { backgroundColor: palettes[themeMode].bg }]}>
      {showQuickActions ? <GlobalQuickActions /> : null}
      {children}
    </View>
  );
}

function GlobalQuickActions() {
  const { language, setLanguage, themeMode, setThemeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={styles.globalQuickActions} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onPress={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
        style={({ pressed }) => [
          styles.globalQuickButton,
          { backgroundColor: c.surface, borderColor: c.borderStrong, transform: [{ scale: pressed ? 0.94 : 1 }] }
        ]}
      >
        <Feather name={themeMode === "dark" ? "sun" : "moon"} color={c.primary} size={16} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={language === "en" ? "Switch to Nepali" : "Switch to English"}
        onPress={() => setLanguage(language === "en" ? "ne" : "en")}
        style={({ pressed }) => [
          styles.globalQuickTextButton,
          { backgroundColor: c.surface, borderColor: c.borderStrong, transform: [{ scale: pressed ? 0.94 : 1 }] }
        ]}
      >
        <Text style={[styles.globalQuickText, { color: c.text }]}>{language === "en" ? "EN" : "NE"}</Text>
      </Pressable>
    </View>
  );
}

export function AppAtmosphere({ children }: PropsWithChildren) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const cursor = useRef(new Animated.ValueXY({ x: -200, y: -200 })).current;
  const [reducedMotion, setReducedMotion] = useState(false);
  const petals = useMemo(
    () =>
      Array.from({ length: Platform.OS === "web" ? 14 : 7 }, (_, index) => ({
        id: index,
        left: `${(index * 19 + 5) % 96}%`,
        size: 38 + (index % 5) * 17,
        duration: 18000 + index * 1150,
        delay: index * 520,
        tint: index % 4 === 0 ? c.primary : index % 4 === 1 ? c.blush : index % 4 === 2 ? c.secondary : c.accent,
        opacity: themeMode === "dark" ? 0.22 : 0.18,
        value: new Animated.Value(0)
      })),
    [c.accent, c.blush, c.primary, c.secondary, themeMode]
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    petals.forEach((petal) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(petal.delay),
          Animated.timing(petal.value, {
            toValue: 1,
            duration: petal.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver
          }),
          Animated.timing(petal.value, {
            toValue: 0,
            duration: petal.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver
          })
        ])
      ).start();
    });
  }, [petals, reducedMotion]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const handleMove = (event: PointerEvent) => {
      cursor.setValue({ x: event.clientX - 210, y: event.clientY - 210 });
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [cursor]);

  return (
    <View style={[styles.atmosphere, { backgroundColor: c.bg }]}>
      <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
        <View style={[styles.lightWash, styles.lightWashOne, { backgroundColor: c.primarySoft }]} />
        <View style={[styles.lightWash, styles.lightWashTwo, { backgroundColor: c.secondarySoft }]} />
        <View style={[styles.lightWash, styles.lightWashThree, { backgroundColor: c.accentSoft }]} />
        {petals.map((petal) => {
          const translateY = petal.value.interpolate({ inputRange: [0, 1], outputRange: [120, -560] });
          const translateX = petal.value.interpolate({ inputRange: [0, 1], outputRange: [0, petal.id % 2 === 0 ? 42 : -42] });
          const rotate = petal.value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", petal.id % 2 === 0 ? "360deg" : "-360deg"] });
          return (
            <Animated.View
              key={petal.id}
              style={[
                styles.petal,
                {
                  left: petal.left as `${number}%`,
                  top: `${18 + ((petal.id * 11) % 70)}%` as `${number}%`,
                  width: petal.size,
                  height: petal.size,
                  backgroundColor: petal.tint,
                  opacity: petal.opacity,
                  transform: [{ translateY }, { translateX }, { rotate }]
                }
              ]}
            />
          );
        })}
        {Platform.OS === "web" && !reducedMotion ? (
          <Animated.View
            style={[
              styles.cursorGlow,
              {
                backgroundColor: themeMode === "dark" ? c.primary : c.primarySoft,
                transform: cursor.getTranslateTransform()
              }
            ]}
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.brandMark, compact && styles.brandMarkCompact, { borderColor: c.borderStrong, shadowColor: c.primary }]}>
      <Image source={brandIcon} style={styles.brandIconImage} resizeMode="cover" />
    </View>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.brandLogoFrame, compact && styles.brandLogoFrameCompact, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Image source={brandLogo} style={styles.brandLogoImage} resizeMode="contain" />
    </View>
  );
}

export function SectionLabel({ children, tone = "primary" }: PropsWithChildren<{ tone?: "primary" | "secondary" | "accent" }>) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const color = tone === "secondary" ? c.secondary : tone === "accent" ? c.accent : c.primary;
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelLine, { backgroundColor: color }]} />
      <Text style={[styles.sectionLabel, { color }]}>{children}</Text>
    </View>
  );
}

export function SectionTitle({ label, title, body }: { label?: string; title: string; body?: string }) {
  return (
    <View style={styles.sectionTitleBlock}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <H2>{title}</H2>
      {body ? <Body muted>{body}</Body> : null}
    </View>
  );
}

export function Card({ children, style, variant = "soft" }: PropsWithChildren<{ style?: ViewStyle; variant?: "soft" | "hero" | "seasonal" | "accent" }>) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const [hovered, setHovered] = useState(false);
  const variantBg = variant === "hero" ? c.surfaceGlow : variant === "seasonal" ? c.secondarySoft : variant === "accent" ? c.primarySoft : c.surface;
  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: variantBg,
              borderColor: hovered || pressed ? c.borderStrong : c.border,
              shadowColor: c.primary,
              shadowOpacity: hovered ? 0.2 : 0.12,
              transform: [{ translateY: hovered ? -3 : pressed ? 1 : 0 }, { scale: pressed ? 0.992 : 1 }]
            },
            style
          ]}
        >
          <View style={[styles.cardGlow, styles.noPointerEvents, { backgroundColor: c.primarySoft }]} />
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}

export function H1({ children }: PropsWithChildren) {
  const { themeMode } = useApp();
  return <Text style={[styles.h1, { color: palettes[themeMode].text }]}>{children}</Text>;
}

export function H2({ children }: PropsWithChildren) {
  const { themeMode } = useApp();
  return <Text style={[styles.h2, { color: palettes[themeMode].text }]}>{children}</Text>;
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return <Text style={[styles.body, { color: muted ? c.muted : c.text }]}>{children}</Text>;
}

export function Pill({ children, tone = "primary" }: PropsWithChildren<{ tone?: "primary" | "secondary" | "accent" | "danger" }>) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const bg = tone === "primary" ? c.primarySoft : tone === "secondary" ? c.secondary : tone === "accent" ? c.accent : c.danger;
  const color = tone === "primary" ? c.primary : themeMode === "light" ? "#FFFFFF" : "#181514";
  return <Text style={[styles.pill, { backgroundColor: bg, color }]}>{children}</Text>;
}

export function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? (hovered ? c.primarySoft : c.surfaceAlt) : c.primary,
          borderColor: hovered ? c.borderStrong : c.border,
          shadowColor: c.primary,
          shadowOpacity: hovered || !secondary ? 0.24 : 0.12,
          transform: [{ translateY: hovered ? -1 : pressed ? 1 : 0 }, { scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? c.text : "#FFFFFF" }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

export function FloatingBadge({ label, tone = "primary" }: { label: string; tone?: "primary" | "secondary" | "accent" }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const dot = tone === "secondary" ? c.secondary : tone === "accent" ? c.accent : c.primary;
  return (
    <View style={[styles.floatingBadge, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.floatingBadgeDot, { backgroundColor: dot }]} />
      <Text style={[styles.floatingBadgeText, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

export function ToggleGroup<T extends string>({ value, options, onChange }: { value: T; options: Array<{ label: string; value: T }>; onChange: (value: T) => void }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.toggleGroup, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.toggleItem,
              {
                backgroundColor: active ? c.primary : "transparent",
                borderColor: active ? c.borderStrong : "transparent",
                transform: [{ scale: pressed ? 0.97 : 1 }]
              }
            ]}
          >
            <Text style={[styles.toggleText, { color: active ? "#FFFFFF" : c.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Segment<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (value: T) => void }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.segment, { backgroundColor: c.surfaceAlt }]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={({ pressed }) => [styles.segmentItem, { backgroundColor: active ? c.primary : "transparent", transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <Text style={{ color: active ? "#FFFFFF" : c.text, fontWeight: "700", textTransform: "capitalize" }}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: Math.max(0, Math.min(100, value)),
      duration: 650,
      useNativeDriver: false
    }).start();
  }, [animated, value]);

  const width = animated.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={[styles.progressTrack, { backgroundColor: c.surfaceAlt }]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color ?? c.secondary }]} />
    </View>
  );
}

type SignalTone = "warning" | "advice" | "tip" | "success" | "neutral";

export function SignalCard({
  tone = "neutral",
  icon,
  label,
  title,
  children,
  style
}: PropsWithChildren<{
  tone?: SignalTone;
  icon: ComponentProps<typeof Feather>["name"];
  label?: string;
  title: string;
  style?: ViewStyle;
}>) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const [hovered, setHovered] = useState(false);
  const toneColors = {
    warning: { main: c.danger, soft: themeMode === "dark" ? "#3A1A1D" : "#FFF0ED" },
    advice: { main: c.secondary, soft: c.secondarySoft },
    tip: { main: c.accent, soft: c.accentSoft },
    success: { main: c.secondary, soft: c.secondarySoft },
    neutral: { main: c.primary, soft: c.surfaceAlt }
  } satisfies Record<SignalTone, { main: string; soft: string }>;
  const active = toneColors[tone];
  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.signalCard,
            {
              backgroundColor: active.soft,
              borderColor: hovered || tone === "warning" ? active.main : c.border,
              shadowColor: active.main,
              shadowOpacity: hovered ? 0.18 : tone === "warning" ? 0.12 : 0.06,
              transform: [{ translateY: hovered ? -2 : pressed ? 1 : 0 }, { scale: pressed ? 0.99 : 1 }]
            },
            style
          ]}
        >
          <View style={[styles.signalEdge, styles.noPointerEvents, { backgroundColor: active.main, opacity: tone === "warning" ? 0.95 : 0.65 }]} />
          <View style={styles.signalHeader}>
            <View style={[styles.signalIcon, { backgroundColor: active.main }]}>
              <Feather name={icon} color={themeMode === "dark" && tone !== "warning" ? "#181514" : "#FFFFFF"} size={16} />
            </View>
            <View style={styles.signalTitleBlock}>
              {label ? <Text style={[styles.signalLabel, { color: active.main }]}>{label}</Text> : null}
              <Text style={[styles.signalTitle, { color: c.text }]}>{title}</Text>
            </View>
          </View>
          <Text style={[styles.signalBody, { color: tone === "warning" ? c.text : c.muted }]}>{children}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

export function WarningCard(props: Omit<Parameters<typeof SignalCard>[0], "tone">) {
  return <SignalCard {...props} tone="warning" />;
}

export function AdviceCard(props: Omit<Parameters<typeof SignalCard>[0], "tone">) {
  return <SignalCard {...props} tone="advice" />;
}

export function TipCard(props: Omit<Parameters<typeof SignalCard>[0], "tone">) {
  return <SignalCard {...props} tone="tip" />;
}

const styles = StyleSheet.create({
  atmosphere: {
    flex: 1,
    overflow: "hidden"
  },
  noPointerEvents: {
    pointerEvents: "none"
  },
  screen: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md
  },
  globalQuickActions: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 30,
    flexDirection: "row",
    gap: spacing.xs
  },
  globalQuickButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  globalQuickTextButton: {
    minWidth: 44,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  globalQuickText: {
    fontSize: 13,
    fontWeight: "900"
  },
  lightWash: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.2
  },
  lightWashOne: { top: -110, left: -100 },
  lightWashTwo: { top: 170, right: -130 },
  lightWashThree: { bottom: -130, left: "18%" },
  petal: {
    position: "absolute",
    borderRadius: 999
  },
  cursorGlow: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.22
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8
  },
  brandMarkCompact: {
    width: 42,
    height: 42,
    borderRadius: 21
  },
  brandIconImage: {
    width: "100%",
    height: "100%"
  },
  brandLogoFrame: {
    width: "100%",
    maxWidth: 360,
    minHeight: 128,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  brandLogoFrameCompact: {
    maxWidth: 240,
    minHeight: 86,
    borderRadius: 14
  },
  brandLogoImage: {
    width: "100%",
    height: 112
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    overflow: "hidden"
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.8
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "Cormorant Garamond, Georgia, serif", default: undefined })
  },
  h2: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "Cormorant Garamond, Georgia, serif", default: undefined })
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.select({ web: "DM Sans, Inter, system-ui, sans-serif", default: undefined })
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: "800"
  },
  button: {
    minHeight: 48,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800"
  },
  floatingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  floatingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  floatingBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Platform.select({ web: "DM Sans, Inter, system-ui, sans-serif", default: undefined })
  },
  segment: {
    borderRadius: 8,
    flexDirection: "row",
    padding: 4,
    gap: 4
  },
  segmentItem: {
    flex: 1,
    minHeight: 38,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  progressTrack: {
    height: 11,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: 11,
    borderRadius: 999
  },
  signalCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden"
  },
  signalEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4
  },
  signalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  signalIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  signalTitleBlock: {
    flex: 1,
    gap: 1
  },
  signalLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    fontFamily: Platform.select({ web: "DM Sans, Inter, system-ui, sans-serif", default: undefined })
  },
  signalTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "DM Sans, Inter, system-ui, sans-serif", default: undefined })
  },
  signalBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "DM Sans, Inter, system-ui, sans-serif", default: undefined })
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  sectionLabelLine: {
    width: 24,
    height: 2,
    borderRadius: 99
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  sectionTitleBlock: {
    gap: spacing.xs
  },
  toggleGroup: {
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    padding: 4,
    gap: 4
  },
  toggleItem: {
    flex: 1,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "900"
  }
});
