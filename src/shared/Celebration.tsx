import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { palettes, spacing } from "./theme";

export function Celebration({ reducedMotion, colors }: { reducedMotion: boolean; colors: (typeof palettes)["light"] }) {
  const values = useRef(Array.from({ length: 28 }, () => new Animated.Value(0))).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    if (reducedMotion) return;
    Animated.stagger(
      18,
      values.map((value) =>
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 980, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 760, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        ])
      )
    ).start();
  }, [pop, reducedMotion, values]);

  return (
    <View style={styles.celebrationOverlay} pointerEvents="none">
      <Animated.View style={[styles.celebrationCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong, transform: [{ scale: pop }] }]}>
        <Text style={[styles.celebrationTitle, { color: colors.text }]}>Routine complete</Text>
        <Text style={[styles.celebrationText, { color: colors.muted }]}>All steps done today. Keep it gentle, not obsessive.</Text>
      </Animated.View>
      {!reducedMotion
        ? values.map((value, index) => {
            const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [0, -210 - (index % 6) * 20] });
            const translateX = value.interpolate({ inputRange: [0, 1], outputRange: [0, (index % 2 === 0 ? 1 : -1) * (34 + index * 5)] });
            const opacity = value.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    top: "54%",
                    left: "50%",
                    backgroundColor: index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accent,
                    opacity,
                    transform: [{ translateX }, { translateY }, { rotate: `${index * 23}deg` }]
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
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 13, 14, 0.22)"
  },
  celebrationCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  celebrationTitle: { fontSize: 26, fontWeight: "900" },
  celebrationText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  confettiPiece: { position: "absolute", width: 12, height: 18, borderRadius: 3 }
});
