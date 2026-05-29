import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [target, setTarget] = useState<"/onboarding" | "/(tabs)/home" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("skin-nepal-state")
      .then((raw) => {
        if (!raw) {
          setTarget("/onboarding");
          return;
        }
        const parsed = JSON.parse(raw) as { profile?: { name?: string; age?: string; consentAccepted?: boolean; quiz?: Record<string, unknown> } };
        const profile = parsed.profile;
        const quiz = profile?.quiz as {
          primaryConcerns?: string[];
          symptoms?: string[];
          lifestyle?: { diet?: string };
          environment?: { water_source?: string };
          currentRoutine?: { uses_sunscreen?: string };
          ageGroup?: string;
        } | undefined;
        const complete = Boolean(
          profile?.name?.trim() &&
            profile?.age?.trim() &&
            profile.consentAccepted &&
            quiz?.ageGroup &&
            ((quiz.primaryConcerns?.length ?? 0) > 0 || (quiz.symptoms?.length ?? 0) > 0) &&
            quiz.lifestyle?.diet &&
            quiz.environment?.water_source &&
            quiz.currentRoutine?.uses_sunscreen
        );
        setTarget(complete ? "/(tabs)/home" : "/onboarding");
      })
      .catch(() => setTarget("/onboarding"));
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={target} />;
}
