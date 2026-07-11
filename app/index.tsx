import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useApp } from "@/shared/AppContext";

export default function Index() {
  const { authReady, authRequired, profile } = useApp();

  if (!authReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (authRequired) return <Redirect href={"/auth" as never} />;

  return <Redirect href={isProfileComplete(profile) ? "/(tabs)/home" : "/onboarding"} />;
}

function isProfileComplete(profile: ReturnType<typeof useApp>["profile"]) {
  const quiz = profile.quiz;
  return Boolean(
    profile.name?.trim() &&
      profile.age?.trim() &&
      profile.consentAccepted &&
      quiz.ageGroup &&
      (quiz.primaryConcerns.length > 0 || quiz.symptoms.length > 0) &&
      quiz.lifestyle.diet &&
      quiz.environment.water_source &&
      quiz.currentRoutine.uses_sunscreen
  );
}
