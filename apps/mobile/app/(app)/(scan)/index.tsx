import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, Text, Vibration, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

type ScanState = "idle" | "scanning" | "success" | "error";

export default function ScanScreen() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedUrl, setScannedUrl] = useState<string | undefined>();

  // Sweep line
  const sweepY = useSharedValue(0);
  const sweepOpacity = useSharedValue(0);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweepY.value }],
    opacity: sweepOpacity.value
  }));

  // Scanner frame scale pulse on success
  const frameScale = useSharedValue(1);
  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: frameScale.value }]
  }));

  // Success icon pop-in
  const successScale = useSharedValue(0);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }]
  }));

  useEffect(() => {
    if (scanState === "scanning") {
      sweepY.value = 0;
      successScale.value = 0;
      sweepOpacity.value = withTiming(0.9, { duration: 200 });
      sweepY.value = withSequence(
        withTiming(248, { duration: 700 }),
        withTiming(0, { duration: 700 })
      );
    } else if (scanState === "success") {
      sweepOpacity.value = withTiming(0, { duration: 100 });
      frameScale.value = withSequence(
        withSpring(1.06, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 14, stiffness: 180 })
      );
      successScale.value = withSpring(1, { damping: 8, stiffness: 220 });
      Vibration.vibrate([0, 80, 40, 80]);
    } else {
      sweepOpacity.value = withTiming(0, { duration: 150 });
      successScale.value = 0;
      frameScale.value = withTiming(1, { duration: 150 });
    }
  }, [scanState]);

  function simulateScan() {
    setScanState("scanning");
    setTimeout(() => {
      const mockUrl = "https://vierify.vercel.app/trace/GS1-DEMO-0001";
      setScannedUrl(mockUrl);
      setScanState("success");
    }, 1400);
  }

  function openTrace() {
    if (scannedUrl) {
      // TODO: open with expo-web-browser in production
      setScanState("idle");
      setScannedUrl(undefined);
    }
  }

  function resetScan() {
    setScanState("idle");
    setScannedUrl(undefined);
  }

  const borderColor =
    scanState === "success"
      ? "#34d399"
      : scanState === "error"
        ? "#fb7185"
        : "#14B8A680";

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Text className="text-2xl font-extrabold text-white">Quét mã QR</Text>
        <Pressable
          onPress={() => router.push("/(app)/(batches)")}
          className="rounded-full bg-white/10 px-4 py-2 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-white">Lô hàng</Text>
        </Pressable>
      </View>

      {/* Camera area */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Scanner frame with scale animation */}
        <Animated.View
          style={[
            {
              width: 288,
              height: 288,
              borderRadius: 24,
              borderWidth: 2,
              borderColor,
              backgroundColor: "rgba(255,255,255,0.03)",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative"
            },
            frameStyle
          ]}
        >
          {/* Corner decorations */}
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <View
              key={corner}
              style={{
                position: "absolute",
                width: 32,
                height: 32,
                borderColor: "#14B8A6",
                ...(corner === "tl" && {
                  top: 0, left: 0,
                  borderTopWidth: 4, borderLeftWidth: 4,
                  borderTopLeftRadius: 16
                }),
                ...(corner === "tr" && {
                  top: 0, right: 0,
                  borderTopWidth: 4, borderRightWidth: 4,
                  borderTopRightRadius: 16
                }),
                ...(corner === "bl" && {
                  bottom: 0, left: 0,
                  borderBottomWidth: 4, borderLeftWidth: 4,
                  borderBottomLeftRadius: 16
                }),
                ...(corner === "br" && {
                  bottom: 0, right: 0,
                  borderBottomWidth: 4, borderRightWidth: 4,
                  borderBottomRightRadius: 16
                })
              }}
            />
          ))}

          {/* Sweep line — only visible during scanning */}
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 2
              },
              sweepStyle
            ]}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#14B8A6",
                opacity: 0.85,
                shadowColor: "#14B8A6",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6
              }}
            />
          </Animated.View>

          {scanState === "idle" && (
            <Text style={{ fontSize: 56, opacity: 0.3 }}>📷</Text>
          )}

          {scanState === "scanning" && (
            <View className="items-center gap-3">
              <Text style={{ fontSize: 44 }}>🔍</Text>
              <Text className="text-sm font-medium text-chain">Đang quét…</Text>
            </View>
          )}

          {scanState === "success" && (
            <Animated.View style={[{ alignItems: "center", gap: 8 }, successStyle]}>
              <Text style={{ fontSize: 56 }}>✅</Text>
              <Text className="text-sm font-bold text-emerald-400">Quét thành công!</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Instructions */}
        {scanState === "idle" && (
          <Text className="mt-8 text-center text-base text-slate-400">
            Hướng camera vào mã QR trên bao bì sản phẩm để xem thông tin truy xuất nguồn gốc
          </Text>
        )}

        {/* Success result */}
        {scanState === "success" && scannedUrl && (
          <View className="mt-8 w-full gap-3">
            <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Text className="text-xs font-medium text-slate-400">Đường dẫn đã quét</Text>
              <Text className="mt-1 font-mono text-sm text-chain" numberOfLines={2}>
                {scannedUrl}
              </Text>
            </View>
            <Pressable
              onPress={openTrace}
              className="items-center rounded-full bg-chain py-4 active:opacity-80"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="font-bold text-white">Xem hành trình sản phẩm →</Text>
            </Pressable>
            <Pressable onPress={resetScan} className="items-center py-3">
              <Text className="text-sm text-slate-400">Quét lại</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Scan button */}
      {(scanState === "idle" || scanState === "error") && (
        <View className="px-8 pb-8">
          <Pressable
            onPress={simulateScan}
            className="items-center rounded-full bg-chain py-5 active:opacity-80"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text className="text-base font-bold text-white">Bắt đầu quét</Text>
          </Pressable>
          <Text className="mt-4 text-center text-xs text-slate-500">
            Expo Camera sẽ được tích hợp trong bản phát hành tiếp theo
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
