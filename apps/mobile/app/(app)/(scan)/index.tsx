import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

type ScanState = "idle" | "scanning" | "success";

const FRAME_SIZE = 220;

export default function ScanScreen() {
  const [state, setState] = useState<ScanState>("idle");

  // Sweep line animation
  const sweepY = useSharedValue(0);
  const sweepOpacity = useSharedValue(0);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweepY.value }],
    opacity: sweepOpacity.value
  }));

  // Frame corner scale pulse on success
  const frameScale = useSharedValue(1);
  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: frameScale.value }]
  }));

  useEffect(() => {
    if (state === "scanning") {
      sweepOpacity.value = withTiming(1, { duration: 200 });
      sweepY.value = withRepeat(
        withSequence(
          withTiming(FRAME_SIZE - 4, { duration: 1600 }),
          withTiming(0, { duration: 1600 })
        ),
        -1,
        false
      );
    } else {
      sweepOpacity.value = withTiming(0, { duration: 200 });
      sweepY.value = 0;
    }

    if (state === "success") {
      frameScale.value = withSequence(
        withSpring(1.06, { damping: 5 }),
        withSpring(1, { damping: 8 })
      );
    }
  }, [state, sweepY, sweepOpacity, frameScale]);

  function handleScan() {
    if (state === "idle") {
      setState("scanning");
      // Simulate scan success after 1.9s (replace with real expo-camera scan)
      setTimeout(() => {
        setState("success");
      }, 1900);
    } else if (state === "success") {
      setState("idle");
    }
  }

  const frameColor = state === "success" ? "#10B981" : "#14B8A6";
  const btnLabel =
    state === "idle" ? "Bắt đầu quét" :
    state === "scanning" ? "Đang quét..." :
    "Quét lại";

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Title */}
        <Text style={s.title}>Quét mã QR</Text>
        <Text style={s.subtitle}>Lô hàng</Text>

        {/* Status hint */}
        <Text style={s.hint}>
          {state === "idle" && "Hướng camera vào mã QR trên bao bì sản phẩm để xem thông tin truy xuất nguồn gốc"}
          {state === "scanning" && "Đang nhận diện mã QR..."}
          {state === "success" && "Đã quét thành công!"}
        </Text>

        {/* Viewfinder */}
        <Animated.View style={[s.frame, { borderColor: frameColor }, frameStyle]}>
          {/* Corner brackets */}
          {[
            { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
            { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
            { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
            { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }
          ].map((cornerStyle, i) => (
            <View
              key={i}
              style={[s.corner, cornerStyle, { borderColor: frameColor }]}
            />
          ))}

          {/* Sweep line */}
          <Animated.View style={[s.sweep, sweepStyle]} />

          {/* Success overlay */}
          {state === "success" && (
            <View style={s.successOverlay}>
              <Text style={s.successCheck}>✓</Text>
            </View>
          )}

          {/* Camera placeholder */}
          {state === "idle" && (
            <View style={s.cameraPlaceholder}>
              <Text style={s.cameraIcon}>📷</Text>
            </View>
          )}
        </Animated.View>

        {/* Success label */}
        {state === "success" && (
          <View style={s.successInfo}>
            <Text style={s.successName}>Xoài Cát Hòa Lộc – Đợt 3</Text>
            <Text style={s.successGs1}>VN.GS1.8936012345.2026.03.001</Text>
          </View>
        )}

        {/* Action button */}
        <Pressable
          style={({ pressed }) => [
            s.btn,
            state === "scanning" && s.btnScanning,
            state === "success" && s.btnSuccess,
            pressed && s.btnPressed
          ]}
          onPress={handleScan}
          disabled={state === "scanning"}
        >
          <Text style={s.btnText}>{btnLabel}</Text>
        </Pressable>

        <Text style={s.note}>
          Expo Camera sẽ được tích hợp trong bản phát hành tiếp theo
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32
  },
  title: { fontSize: 20, fontWeight: "700", color: "#fff", alignSelf: "flex-start" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)", alignSelf: "flex-start", marginTop: 2, marginBottom: 8 },
  hint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    position: "relative"
  },
  corner: {
    position: "absolute",
    width: 22,
    height: 22
  },
  sweep: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "transparent",
    borderTopWidth: 2,
    borderTopColor: "#14B8A6"
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16,185,129,0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  successCheck: { fontSize: 64, color: "#10B981" },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  cameraIcon: { fontSize: 48, opacity: 0.3 },
  successInfo: { alignItems: "center", gap: 4 },
  successName: { fontSize: 15, fontWeight: "700", color: "#10B981" },
  successGs1: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" },
  btn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#14B8A6",
    alignItems: "center",
    justifyContent: "center"
  },
  btnScanning: { backgroundColor: "rgba(20,184,166,0.55)" },
  btnSuccess: { backgroundColor: "#10B981" },
  btnPressed: { opacity: 0.85 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  note: { fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }
});
