import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { palettes, spacing } from "./theme";

export function Celebration({ reducedMotion, colors }: { reducedMotion: boolean; colors: (typeof palettes)["light"] }) {
  const values = useRef(Array.from({ length: 22 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.stagger(
      22,
      values.map((value) =>
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 820, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 820, useNativeDriver: true })
        ])
      )
    ).start();
  }, [reducedMotion, values]);

  return (
    <View style={styles.celebrationOverlay} pointerEvents="none">
      <View style={[styles.celebrationCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
        <Text style={[styles.celebrationTitle, { color: colors.text }]}>🎉 100/100 today</Text>
        <Text style={[styles.celebrationText, { color: colors.muted }]}>Perfect habit score. Keep it gentle, not obsessive.</Text>
      </View>
      {!reducedMotion
        ? values.map((value, index) => {
            const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [0, -190 - (index % 5) * 18] });
            const translateX = value.interpolate({ inputRange: [0, 1], outputRange: [0, (index % 2 === 0 ? 1 : -1) * (34 + index * 6)] });
            const opacity = value.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 0] });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    top: "50%",
                    left: "50%",
                    backgroundColor: index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accent,
                    opacity,
                    transform: [{ translateX }, { translateY }, { rotate: `${index * 21}deg` }]
                  }
                ]}
              />
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  celebrationOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90, alignItems: "center", justifyContent: "center" },
  celebrationCard: { borderWidth: 1, borderRadius: 16, padding: spacing.lg, alignItems: "center", gap: spacing.xs, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  celebrationTitle: { fontSize: 26, fontWeight: "900" },
  celebrationText: { fontSize: 14, fontWeight: "700" },
  confettiPiece: { position: "absolute", width: 12, height: 18, borderRadius: 3 }
});
