import { Tabs, router, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { PanResponder, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { t } from "@/shared/i18n";
import { palettes } from "@/shared/theme";

const swipeTabs = ["home", "progress", "products", "tips", "learn", "community", "settings"] as const;

export default function TabsLayout() {
  const { language, themeMode } = useApp();
  const pathname = usePathname();
  const c = palettes[themeMode];
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
            height: 64,
            paddingTop: 7,
            paddingBottom: 7
          },
          tabBarLabelStyle: { fontWeight: "800", fontSize: 11 },
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
    </View>
  );
}
