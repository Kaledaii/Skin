import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "@/shared/AppContext";
import { AppAtmosphere } from "@/shared/components";
import { palettes } from "@/shared/theme";

function RootStack() {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <AppAtmosphere>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.bg }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: "Onboarding" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="learn/[id]" options={{ title: "Learn" }} />
        </Stack>
      </AppAtmosphere>
    </>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <RootStack />
    </AppProvider>
  );
}
