import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <Text
      style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}
      accessibilityLabel={label}
    >
      {emoji}
    </Text>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#14B8A6",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen
        name="(batches)"
        options={{
          title: "Lô hàng",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" label="Lô hàng" focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="(scan)"
        options={{
          title: "Quét mã",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📷" label="Quét mã" focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Hồ sơ" focused={focused} />
          )
        }}
      />
    </Tabs>
  );
}
