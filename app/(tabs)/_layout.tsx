import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/shared/AppContext";
import { t } from "@/shared/i18n";
import { palettes } from "@/shared/theme";

export default function TabsLayout() {
  const { language, themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text
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
  );
}
