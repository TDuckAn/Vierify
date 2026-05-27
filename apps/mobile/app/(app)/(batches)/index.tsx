import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View
} from "react-native";

import { trpc } from "../../../lib/trpc";
import {
  flushBatchCreateQueue,
  listQueuedBatchCreates,
  type QueuedBatchCreate
} from "../../../lib/offline-queue";

type HistoryBatch = {
  bcStatus: number;
  createdAt?: Date | string;
  gs1TraceId: string;
  id: string;
  isOfflineQueued?: boolean;
  lastError?: string;
  name: string;
  quantity: string;
  txHash?: string | null;
  uom: string;
};

function isConfirmed(batch: HistoryBatch): boolean {
  return batch.bcStatus === 1 && Boolean(batch.txHash);
}

function formatDate(value: Date | string | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function BatchCard({ batch, onPress }: { batch: HistoryBatch; onPress: () => void }) {
  const confirmed = isConfirmed(batch);
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-slate-200 bg-white p-4 active:opacity-80"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            className="text-base font-bold text-slate-950"
            numberOfLines={1}
          >
            {batch.name}
          </Text>
          <Text className="mt-0.5 font-mono text-xs text-slate-400" numberOfLines={1}>
            {batch.gs1TraceId}
          </Text>
        </View>
        <View
          className={`shrink-0 rounded-full border px-3 py-1 ${
            batch.isOfflineQueued
              ? "border-blue-200 bg-blue-50"
              : confirmed
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              batch.isOfflineQueued
                ? "text-blue-700"
                : confirmed
                  ? "text-emerald-700"
                  : "text-amber-700"
            }`}
          >
            {batch.isOfflineQueued ? "Chờ đồng bộ" : confirmed ? "Đã xác minh" : "Đang xử lý"}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-sm text-slate-600">
          {batch.quantity} {batch.uom}
        </Text>
        <Text className="text-xs text-slate-400">{formatDate(batch.createdAt)}</Text>
      </View>

      {batch.isOfflineQueued ? (
        <Text className="mt-2 text-xs text-blue-600">
          Đã lưu trên thiết bị. Ứng dụng sẽ tự đồng bộ khi có mạng.
        </Text>
      ) : batch.txHash ? (
        <Text className="mt-2 font-mono text-xs text-slate-400" numberOfLines={1}>
          {batch.txHash.slice(0, 20)}…
        </Text>
      ) : (
        <Text className="mt-2 text-xs text-amber-600">
          Đang chờ xác nhận Polygon…
        </Text>
      )}
    </Pressable>
  );
}

function mapQueuedBatch(row: QueuedBatchCreate): HistoryBatch {
  return {
    bcStatus: 0,
    createdAt: row.createdAt,
    gs1TraceId: row.payload.gs1TraceId,
    id: `offline:${row.id}`,
    isOfflineQueued: true,
    lastError: row.lastError,
    name: row.payload.name,
    quantity: String(row.payload.quantity),
    txHash: null,
    uom: row.payload.uom
  };
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-20">
      <Text className="text-5xl">📦</Text>
      <Text className="text-center text-lg font-bold text-slate-950">
        Chưa có lô hàng nào
      </Text>
      <Text className="text-center text-sm text-slate-500">
        Tạo lô hàng đầu tiên của bạn để bắt đầu truy xuất nguồn gốc.
      </Text>
      <Pressable
        className="mt-2 rounded-full bg-chain px-6 py-3 active:opacity-80"
        onPress={() => router.push("/(app)/(scan)")}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="font-bold text-white">Quét mã ngay</Text>
      </Pressable>
    </View>
  );
}

export default function BatchesScreen() {
  const [batches, setBatches] = useState<HistoryBatch[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadBatches(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(undefined);

    try {
      if (isRefresh) {
        await flushBatchCreateQueue();
      }

      const result = await trpc.batches.list.query({ limit: 50 });
      const queued = await listQueuedBatchCreates();
      setBatches(
        [
          ...queued.map(mapQueuedBatch),
          ...result.map((b) => ({
            bcStatus: b.bcStatus,
            createdAt: b.createdAt,
            gs1TraceId: b.gs1TraceId,
            id: b.id,
            name: b.name,
            quantity: b.quantity,
            txHash: b.txHash,
            uom: b.uom
          }))
        ]
      );
    } catch (e) {
      const queued = await listQueuedBatchCreates();

      if (queued.length > 0) {
        setBatches(queued.map(mapQueuedBatch));
      } else {
        setError(e instanceof Error ? e.message : "Không thể tải danh sách lô hàng.");
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadBatches();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            MerchantApp
          </Text>
          <Text className="mt-0.5 text-2xl font-extrabold text-slate-950">
            Lô hàng của tôi
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(app)/(batches)/new")}
          className="h-10 w-10 items-center justify-center rounded-full bg-chain active:opacity-80"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          accessibilityLabel="Tạo lô hàng mới"
        >
          <Text className="text-lg text-white">+</Text>
        </Pressable>
      </View>

      {/* Loading */}
      {isLoading && (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#14B8A6" />
          <Text className="text-sm text-slate-400">Đang tải lô hàng…</Text>
        </View>
      )}

      {/* Error */}
      {!isLoading && error && (
        <View className="m-5 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <Text className="font-bold text-rose-900">Không thể tải dữ liệu</Text>
          <Text className="mt-1 text-sm text-rose-700">{error}</Text>
          <Pressable
            onPress={() => loadBatches()}
            className="mt-3 self-start rounded-full border border-rose-300 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-rose-700">Thử lại</Text>
          </Pressable>
        </View>
      )}

      {/* List */}
      {!isLoading && !error && (
        <FlatList
          data={batches}
          keyExtractor={(b) => b.id}
          contentContainerClassName="gap-3 p-5"
          ListEmptyComponent={EmptyState}
          renderItem={({ item }) => (
            <BatchCard
              batch={item}
              onPress={() => {
                if (!item.isOfflineQueued) {
                  router.push(`/(app)/(batches)/${item.id}`);
                }
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBatches(true)}
              tintColor="#14B8A6"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
