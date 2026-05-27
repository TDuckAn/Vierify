import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import { trpc } from "../../../lib/trpc";
import {
  enqueueBatchCreate,
  shouldQueueBatchCreate,
  type OfflineBatchCreateInput
} from "../../../lib/offline-queue";

const UOM_OPTIONS = ["kg", "g", "tấn", "lít", "ml", "thùng", "hộp", "túi", "cái", "bó"];
const GS1_REGEX = /^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$/;

type Node = { id: string; name: string };

export default function NewBatchScreen() {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [uom, setUom] = useState("kg");
  const [gs1TraceId, setGs1TraceId] = useState("");
  const [nodeId, setNodeId] = useState<string | null>(null);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [offlineNotice, setOfflineNotice] = useState<string | undefined>();
  const [gs1Error, setGs1Error] = useState<string | undefined>();

  useEffect(() => {
    async function loadNodes() {
      try {
        const result = await trpc.nodes.list.query({ kybStatus: "approved", limit: 50 });
        const mapped = result.map((n) => ({ id: n.id, name: n.name }));
        setNodes(mapped);
        if (mapped.length > 0) setNodeId(mapped[0].id);
      } catch {
        // user sees validation error on submit
      } finally {
        setIsLoadingNodes(false);
      }
    }
    void loadNodes();
  }, []);

  function validateGs1(value: string) {
    if (!value) { setGs1Error(undefined); return; }
    setGs1Error(
      GS1_REGEX.test(value) ? undefined : "Phải theo định dạng: 01[14 số]10[1-20 ký tự]"
    );
  }

  async function handleSubmit() {
    const qty = parseFloat(quantity);

    if (!name.trim()) { setError("Vui lòng nhập tên lô hàng."); return; }
    if (!quantity || isNaN(qty) || qty <= 0) { setError("Số lượng phải là số dương."); return; }
    if (!GS1_REGEX.test(gs1TraceId)) { setError("Mã GS1 không hợp lệ."); return; }
    if (!nodeId) { setError("Không tìm thấy đơn vị cung ứng đã được duyệt KYB."); return; }

    setError(undefined);
    setOfflineNotice(undefined);
    setIsSubmitting(true);

    const payload: OfflineBatchCreateInput = {
      name: name.trim(),
      quantity: qty,
      uom,
      gs1TraceId,
      nodeId
    };

    try {
      const batch = await trpc.batches.create.mutate(payload);
      router.replace(`/(app)/(batches)/${batch.id}`);
    } catch (e) {
      if (shouldQueueBatchCreate(e)) {
        await enqueueBatchCreate(payload);
        setOfflineNotice(
          "Không có kết nối. Lô hàng đã được lưu offline và sẽ tự đồng bộ khi kết nối trở lại."
        );
        setTimeout(() => router.replace("/(app)/(batches)"), 900);
      } else {
        setError(e instanceof Error ? e.message : "Không thể tạo lô hàng. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <Pressable onPress={() => router.back()} className="p-1">
          <Text className="text-2xl text-slate-400">‹</Text>
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-slate-950">Tạo lô hàng mới</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-5 pb-10" keyboardShouldPersistTaps="handled">
        {/* Error banner */}
        {error && (
          <View className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <Text className="text-sm font-semibold text-rose-700">{error}</Text>
          </View>
        )}

        {offlineNotice && (
          <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Text className="text-sm font-semibold text-amber-800">{offlineNotice}</Text>
          </View>
        )}

        {/* Node selector */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
          <Text className="text-base font-bold text-slate-950">Đơn vị cung ứng</Text>
          {isLoadingNodes ? (
            <ActivityIndicator color="#14B8A6" />
          ) : nodes.length === 0 ? (
            <View className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <Text className="text-sm font-semibold text-amber-900">KYB chưa được duyệt</Text>
              <Text className="mt-1 text-sm text-amber-700">
                Đơn vị của bạn cần được phê duyệt KYB trước khi tạo lô hàng.
              </Text>
            </View>
          ) : (
            nodes.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => setNodeId(n.id)}
                className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
                  nodeId === n.id ? "border-chain bg-chain/10" : "border-slate-100 bg-slate-50"
                }`}
              >
                <View
                  className={`h-4 w-4 rounded-full border-2 ${
                    nodeId === n.id ? "border-chain bg-chain" : "border-slate-300"
                  }`}
                />
                <Text
                  className={`font-semibold ${
                    nodeId === n.id ? "text-chain" : "text-slate-700"
                  }`}
                >
                  {n.name}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Batch info */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-4">
          <Text className="text-base font-bold text-slate-950">Thông tin lô hàng</Text>

          <View className="gap-1.5">
            <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Tên lô hàng *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="VD: Cà phê Arabica lô 2024-01"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Số lượng *
              </Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="250"
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="gap-1.5" style={{ width: 80 }}>
              <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
                ĐVT *
              </Text>
              <View className="h-12 items-center justify-center rounded-xl border border-chain bg-chain/10">
                <Text className="font-bold text-chain">{uom}</Text>
              </View>
            </View>
          </View>

          {/* UOM chips */}
          <View className="flex-row flex-wrap gap-2">
            {UOM_OPTIONS.map((u) => (
              <Pressable
                key={u}
                onPress={() => setUom(u)}
                className={`rounded-full border px-3 py-1.5 ${
                  uom === u ? "border-chain bg-chain" : "border-slate-200 bg-slate-50"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${uom === u ? "text-white" : "text-slate-600"}`}
                >
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* GPS location — read-only display, auto-detect placeholder */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
          <Text className="text-base font-bold text-slate-950">Vị trí GPS</Text>
          <View className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Text className="text-chain">📍</Text>
            <Text className="flex-1 text-sm text-slate-400">
              Tự động phát hiện khi tạo lô hàng
            </Text>
          </View>
          <Text className="text-xs text-slate-400">
            Toạ độ GPS sẽ được ghi nhận tự động từ thiết bị khi bạn nhấn Tạo lô hàng.
          </Text>
        </View>

        {/* GS1 Trace ID */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
          <Text className="text-base font-bold text-slate-950">Mã truy xuất GS1</Text>
          <TextInput
            value={gs1TraceId}
            onChangeText={(v) => { setGs1TraceId(v); validateGs1(v); }}
            placeholder="01012345678901231OBATCH001"
            placeholderTextColor="#94a3b8"
            className={`rounded-xl border bg-slate-50 px-4 py-3 font-mono text-sm text-slate-950 ${
              gs1Error ? "border-rose-300" : "border-slate-200"
            }`}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          {gs1Error ? (
            <Text className="text-xs text-rose-600">{gs1Error}</Text>
          ) : (
            <Text className="text-xs text-slate-400">
              Định dạng: 01[14 số]10[1-20 ký tự A-Z 0-9 ./-]
            </Text>
          )}
        </View>

        {/* Parent batch linking */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-950">Kết nối lô hàng cha</Text>
              <Text className="mt-1 text-xs text-slate-400">
                Liên kết để xây dựng sơ đồ nguồn gốc đầy đủ
              </Text>
            </View>
            <Pressable
              className="rounded-full border border-chain/30 bg-chain/10 px-4 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-sm font-bold text-chain">+ Thêm</Text>
            </Pressable>
          </View>
          <Text className="mt-3 text-xs text-slate-400">
            Tính năng liên kết lô cha sẽ có sau khi tạo lô hàng thành công.
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || nodes.length === 0}
          className="items-center rounded-full bg-chain py-4"
          style={({ pressed }) => ({
            opacity: pressed || isSubmitting || nodes.length === 0 ? 0.7 : 1
          })}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Tạo lô hàng</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
