import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { palettes, spacing } from "./theme";
import { useApp } from "./AppContext";

const nativeDriver = Platform.OS !== "web";

export function Screen({ children }: PropsWithChildren) {
  const { themeMode } = useApp();
  return <View style={styles.screen}>{children}</View>;
}

export function AppAtmosphere({ children }: PropsWithChildren) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const cursor = useRef(new Animated.ValueXY({ x: -200, y: -200 })).current;
  const petals = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        id: index,
        left: `${(index * 17 + 8) % 92}%`,
        size: 18 + (index % 4) * 9,
        duration: 9200 + index * 850,
        delay: index * 420,
        tint: index % 3 === 0 ? c.primarySoft : index % 3 === 1 ? c.secondarySoft : c.accentSoft,
        opacity: themeMode === "dark" ? 0.16 : 0.3,
        value: new Animated.Value(0)
      })),
    [c.accentSoft, c.primarySoft, c.secondarySoft, themeMode]
  );

  useEffect(() => {
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
  }, [petals]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const handleMove = (event: PointerEvent) => {
      cursor.setValue({ x: event.clientX - 160, y: event.clientY - 160 });
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
          const translateY = petal.value.interpolate({ inputRange: [0, 1], outputRange: [0, -44] });
          const translateX = petal.value.interpolate({ inputRange: [0, 1], outputRange: [0, petal.id % 2 === 0 ? 18 : -18] });
          const rotate = petal.value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", petal.id % 2 === 0 ? "18deg" : "-18deg"] });
          return (
            <Animated.View
              key={petal.id}
              style={[
                styles.petal,
                {
                  left: petal.left as `${number}%`,
                  top: `${8 + ((petal.id * 13) % 80)}%` as `${number}%`,
                  width: petal.size,
                  height: petal.size * 1.35,
                  backgroundColor: petal.tint,
                  opacity: petal.opacity,
                  transform: [{ translateY }, { translateX }, { rotate }]
                }
              ]}
            />
          );
        })}
        {Platform.OS === "web" ? (
          <Animated.View
            style={[
              styles.cursorGlow,
              {
                backgroundColor: c.primarySoft,
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
    <View style={[styles.brandMark, compact && styles.brandMarkCompact, { backgroundColor: c.primarySoft, borderColor: c.borderStrong }]}>
      <View style={[styles.brandLeaf, { backgroundColor: c.primary }]} />
      <View style={[styles.brandLeaf, styles.brandLeafTwo, { backgroundColor: c.secondary }]} />
      <View style={[styles.brandDot, { backgroundColor: c.accent }]} />
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
          transform: [{ translateY: hovered ? -1 : pressed ? 1 : 0 }, { scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? c.text : "#FFFFFF" }]} numberOfLines={2}>{label}</Text>
    </Pressable>
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
  lightWash: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.26
  },
  lightWashOne: { top: -80, left: -70 },
  lightWashTwo: { top: 190, right: -100 },
  lightWashThree: { bottom: -90, left: "20%" },
  petal: {
    position: "absolute",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999
  },
  cursorGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.18
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  brandMarkCompact: {
    width: 42,
    height: 42,
    borderRadius: 21
  },
  brandLeaf: {
    width: 20,
    height: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    transform: [{ rotate: "-32deg" }]
  },
  brandLeafTwo: {
    position: "absolute",
    width: 16,
    height: 24,
    right: 13,
    top: 13,
    transform: [{ rotate: "36deg" }],
    opacity: 0.9
  },
  brandDot: {
    position: "absolute",
    bottom: 12,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
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
    minHeight: 46,
    borderRadius: 8,
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
