import "../global.css";

import { Stack } from "expo-router";

import { OfflineQueueBootstrap } from "../lib/offline-queue-bootstrap";

export default function RootLayout() {
  return (
    <>
      <OfflineQueueBootstrap />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
