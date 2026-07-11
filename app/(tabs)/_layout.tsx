import { Tabs, router, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/shared/AppContext";
import { t } from "@/shared/i18n";
import { palettes, spacing } from "@/shared/theme";
import { QuizReview } from "@/shared/types";

const swipeTabs = ["home", "progress", "products", "tips", "learn", "community", "settings"] as const;

export default function TabsLayout() {
  const { language, themeMode, profile, dueQuizReviewDay, submitQuizReview } = useApp();
  const pathname = usePathname();
  const c = palettes[themeMode];
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const horizontal = Math.abs(gesture.dx);
          const vertical = Math.abs(gesture.dy);
          return horizontal > 55 && horizontal > vertical * 1.7;
        },
        onPanResponderRelease: (_, gesture) => {
          const horizontal = Math.abs(gesture.dx);
          const vertical = Math.abs(gesture.dy);
          if (horizontal < 90 || horizontal < vertical * 1.5 || Math.abs(gesture.vx) < 0.25) return;

          const active = swipeTabs.findIndex((tab) => pathname.includes(`/${tab}`));
          if (active < 0) return;

          const nextIndex = gesture.dx < 0 ? active + 1 : active - 1;
          const nextTab = swipeTabs[nextIndex];
          if (!nextTab) return;

          router.replace(`/(tabs)/${nextTab}` as never);
        }
      }),
    [pathname]
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.muted,
          sceneStyle: { backgroundColor: c.bg },
          tabBarStyle: {
            backgroundColor: c.surface,
            borderTopColor: c.border,
            borderTopWidth: 1,
            height: 58 + bottomInset,
            paddingTop: 7,
            paddingBottom: bottomInset
          },
          tabBarIconStyle: { height: 24, marginTop: 1 },
          tabBarItemStyle: { minHeight: 48 },
          tabBarLabelStyle: { fontWeight: "800", fontSize: 10, lineHeight: 12, paddingBottom: 1 },
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerShadowVisible: false
        }}
      >
        <Tabs.Screen name="home" options={{ title: t(language, "dashboard"), tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
        <Tabs.Screen name="progress" options={{ title: t(language, "progress"), tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" color={color} size={size} /> }} />
        <Tabs.Screen name="products" options={{ title: t(language, "products"), tabBarIcon: ({ color, size }) => <Feather name="package" color={color} size={size} /> }} />
        <Tabs.Screen name="tips" options={{ title: t(language, "tips"), tabBarIcon: ({ color, size }) => <Feather name="zap" color={color} size={size} /> }} />
        <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: ({ color, size }) => <Feather name="book-open" color={color} size={size} /> }} />
        <Tabs.Screen name="community" options={{ title: t(language, "community"), tabBarIcon: ({ color, size }) => <Feather name="help-circle" color={color} size={size} /> }} />
        <Tabs.Screen name="settings" options={{ title: t(language, "settings"), tabBarIcon: ({ color, size }) => <Feather name="settings" color={color} size={size} /> }} />
      </Tabs>
      <FollowUpModal
        visible={Boolean(dueQuizReviewDay)}
        day={dueQuizReviewDay ?? 15}
        hasAcne={profile.quiz.primaryConcerns.includes("acne") || profile.quiz.symptoms.some((item) => item.includes("pimple") || item.includes("acne") || item.includes("cysts"))}
        colors={c}
        onSubmit={submitQuizReview}
      />
    </View>
  );
}

function FollowUpModal({
  visible,
  day,
  hasAcne,
  colors,
  onSubmit
}: {
  visible: boolean;
  day: 15 | 30;
  hasAcne: boolean;
  colors: (typeof palettes)["light"];
  onSubmit: (review: Omit<QuizReview, "id" | "createdAt">) => void;
}) {
  const [acneChange, setAcneChange] = useState<QuizReview["acneChange"]>("not_applicable");
  const [productsWorked, setProductsWorked] = useState<QuizReview["productsWorked"]>("partly");
  const [remediesWorked, setRemediesWorked] = useState<QuizReview["remediesWorked"]>("partly");
  const [dietFollowed, setDietFollowed] = useState<QuizReview["dietFollowed"]>("partly");
  const [routineFollowed, setRoutineFollowed] = useState<QuizReview["routineFollowed"]>("partly");
  const [sideEffects, setSideEffects] = useState<QuizReview["sideEffects"]>("none");
  const [rating, setRating] = useState<QuizReview["rating"]>(4);
  const [feedback, setFeedback] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <View style={styles.modalHeader}>
            <Feather name="refresh-cw" color={colors.primary} size={22} />
            <View style={styles.flex}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Day {day} skin re-check</Text>
              <Text style={[styles.modalBody, { color: colors.muted }]}>Tell Prabha what changed so your routine can adjust.</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {hasAcne ? (
              <ChoiceRow label="Acne change" value={acneChange ?? "not_applicable"} options={["much_better", "slightly_better", "same", "worse"]} onChange={(value) => setAcneChange(value as QuizReview["acneChange"])} colors={colors} />
            ) : null}
            <ChoiceRow label="Products worked" value={productsWorked} options={["yes", "partly", "no", "not_used"]} onChange={(value) => setProductsWorked(value as QuizReview["productsWorked"])} colors={colors} />
            <ChoiceRow label="Remedies worked" value={remediesWorked} options={["yes", "partly", "no", "not_used"]} onChange={(value) => setRemediesWorked(value as QuizReview["remediesWorked"])} colors={colors} />
            <ChoiceRow label="Diet followed" value={dietFollowed} options={["yes", "partly", "no"]} onChange={(value) => setDietFollowed(value as QuizReview["dietFollowed"])} colors={colors} />
            <ChoiceRow label="Routine followed" value={routineFollowed} options={["yes", "partly", "no"]} onChange={(value) => setRoutineFollowed(value as QuizReview["routineFollowed"])} colors={colors} />
            <ChoiceRow label="Side effects" value={sideEffects} options={["none", "dryness", "burning", "more_breakouts", "other"]} onChange={(value) => setSideEffects(value as QuizReview["sideEffects"])} colors={colors} />
            <ChoiceRow label="Rating" value={String(rating)} options={["1", "2", "3", "4", "5"]} onChange={(value) => setRating(Number(value) as QuizReview["rating"])} colors={colors} />
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Any suggestion or what confused you?"
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.feedbackInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
          </ScrollView>
          <Pressable
            onPress={() => onSubmit({ day, acneChange: hasAcne ? acneChange : "not_applicable", productsWorked, remediesWorked, dietFollowed, routineFollowed, sideEffects, rating, feedback })}
            style={({ pressed }) => [styles.submitButton, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Text style={styles.submitText}>Update my routine</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ChoiceRow({ label, value, options, onChange, colors }: { label: string; value: string; options: string[]; onChange: (value: string) => void; colors: (typeof palettes)["light"] }) {
  return (
    <View style={styles.choiceBlock}>
      <Text style={[styles.choiceLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.choiceChip,
                {
                  backgroundColor: active ? colors.secondary : colors.surfaceAlt,
                  borderColor: active ? colors.secondary : colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                }
              ]}
            >
              <Text style={[styles.choiceText, { color: active ? "#FFFFFF" : colors.text }]}>{option.replace(/_/g, " ")}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.md },
  modalCard: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.sm, maxHeight: "92%" },
  modalScroll: { gap: spacing.sm },
  modalHeader: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  modalTitle: { fontSize: 20, fontWeight: "900" },
  modalBody: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  choiceBlock: { gap: spacing.xs },
  choiceLabel: { fontSize: 13, fontWeight: "900" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  choiceChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 34, justifyContent: "center" },
  choiceText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  feedbackInput: { borderWidth: 1, borderRadius: 8, minHeight: 76, padding: spacing.sm, fontSize: 14, textAlignVertical: "top" },
  submitButton: { minHeight: 46, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }
});
