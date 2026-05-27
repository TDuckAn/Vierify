import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";

type ScanState = "idle" | "scanning" | "success" | "error";

export default function ScanScreen() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedUrl, setScannedUrl] = useState<string | undefined>();

  function simulateScan() {
    setScanState("scanning");

    setTimeout(() => {
      const mockUrl = "https://vierify.vercel.app/trace/GS1-DEMO-0001";
      setScannedUrl(mockUrl);
      setScanState("success");
    }, 1200);
  }

  function openTrace() {
    if (scannedUrl) {
      // In production: use expo-web-browser to open the trace URL in-app
      setScanState("idle");
      setScannedUrl(undefined);
    }
  }

  function resetScan() {
    setScanState("idle");
    setScannedUrl(undefined);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <Text className="text-2xl font-extrabold text-white">Quét mã QR</Text>
        <Pressable
          onPress={() => router.push("/(app)/(batches)")}
          className="rounded-full bg-white/10 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">Lô hàng</Text>
        </Pressable>
      </View>

      {/* Camera area */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Scanner frame */}
        <View
          className={`h-72 w-72 items-center justify-center rounded-3xl border-2 transition-all ${
            scanState === "success"
              ? "border-emerald-400"
              : scanState === "error"
                ? "border-rose-400"
                : "border-chain/60"
          } bg-white/5`}
        >
          {/* Corner decorations */}
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <View
              key={corner}
              className={`absolute h-8 w-8 border-chain ${
                corner === "tl"
                  ? "left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl"
                  : corner === "tr"
                    ? "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl"
                    : corner === "bl"
                      ? "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl"
                      : "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"
              }`}
            />
          ))}

          {scanState === "idle" && (
            <Text className="text-6xl opacity-30">📷</Text>
          )}
          {scanState === "scanning" && (
            <View className="items-center gap-3">
              <Text className="text-5xl">🔍</Text>
              <Text className="text-sm font-medium text-chain">Đang quét…</Text>
            </View>
          )}
          {scanState === "success" && (
            <View className="items-center gap-3">
              <Text className="text-6xl">✅</Text>
              <Text className="text-sm font-bold text-emerald-400">Quét thành công!</Text>
            </View>
          )}
        </View>

        {/* Instructions / result */}
        {scanState === "idle" && (
          <Text className="mt-8 text-center text-base text-slate-400">
            Hướng camera vào mã QR trên bao bì sản phẩm để xem thông tin truy xuất nguồn gốc
          </Text>
        )}

        {scanState === "success" && scannedUrl && (
          <View className="mt-8 w-full gap-3">
            <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Text className="text-xs font-medium text-slate-400">Đường dẫn đã quét</Text>
              <Text className="mt-1 text-sm font-mono text-chain" numberOfLines={2}>
                {scannedUrl}
              </Text>
            </View>
            <Pressable
              onPress={openTrace}
              className="rounded-full bg-chain py-4 items-center active:opacity-80"
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
        <View className="pb-8 px-8">
          <Pressable
            onPress={simulateScan}
            className="rounded-full bg-chain py-5 items-center active:opacity-80"
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
