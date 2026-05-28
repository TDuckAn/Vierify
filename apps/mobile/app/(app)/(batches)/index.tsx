import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  flushBatchCreateQueue,
  listQueuedBatchCreates,
  type QueuedBatchCreate
} from "../../../lib/offline-queue";
import { trpc } from "../../../lib/trpc";

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

function isConfirmed(b: HistoryBatch) {
  return b.bcStatus === 1 && Boolean(b.txHash);
}

function formatDate(v: Date | string | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

function mapQueued(row: QueuedBatchCreate): HistoryBatch {
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

function BatchCard({ batch, onPress }: { batch: HistoryBatch; onPress: () => void }) {
  const confirmed = isConfirmed(batch);
  const badgeBg   = batch.isOfflineQueued ? "#EFF6FF" : confirmed ? "#ECFDF5" : "#FFFBEB";
  const badgeBdr  = batch.isOfflineQueued ? "#BFDBFE" : confirmed ? "#A7F3D0" : "#FDE68A";
  const badgeText = batch.isOfflineQueued ? "#1D4ED8" : confirmed ? "#065F46" : "#92400E";
  const badgeLabel= batch.isOfflineQueued ? "Chờ đồng bộ" : confirmed ? "Đã xác minh" : "Đang xử lý";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
    >
      <View style={s.cardTop}>
        <View style={s.cardInfo}>
          <Text style={s.cardName} numberOfLines={1}>{batch.name}</Text>
          <Text style={s.cardGs1} numberOfLines={1}>{batch.gs1TraceId}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: badgeBg, borderColor: badgeBdr }]}>
          <Text style={[s.badgeText, { color: badgeText }]}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={s.cardBottom}>
        <Text style={s.cardQty}>{batch.quantity} {batch.uom}</Text>
        <Text style={s.cardDate}>{formatDate(batch.createdAt)}</Text>
      </View>

      {batch.isOfflineQueued ? (
        <Text style={s.cardNote}>Đã lưu trên thiết bị. Ứng dụng sẽ tự đồng bộ khi có mạng.</Text>
      ) : batch.txHash ? (
        <Text style={s.cardHash} numberOfLines={1}>{batch.txHash.slice(0, 22)}…</Text>
      ) : (
        <Text style={s.cardPending}>Đang chờ xác nhận Polygon…</Text>
      )}
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>📦</Text>
      <Text style={s.emptyTitle}>Chưa có lô hàng nào</Text>
      <Text style={s.emptySub}>Tạo lô hàng đầu tiên của bạn để bắt đầu truy xuất nguồn gốc.</Text>
      <Pressable
        style={({ pressed }) => [s.emptyBtn, pressed && s.emptyBtnPressed]}
        onPress={() => router.push("/(app)/(batches)/new")}
      >
        <Text style={s.emptyBtnText}>Tạo lô hàng đầu tiên</Text>
      </Pressable>
    </View>
  );
}

export default function BatchesScreen() {
  const [batches, setBatches] = useState<HistoryBatch[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(undefined);

    try {
      if (isRefresh) await flushBatchCreateQueue();
      const [result, queued] = await Promise.all([
        trpc.batches.list.query({ limit: 50 }),
        listQueuedBatchCreates()
      ]);
      setBatches([
        ...queued.map(mapQueued),
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
      ]);
    } catch (e) {
      const queued = await listQueuedBatchCreates();
      if (queued.length > 0) {
        setBatches(queued.map(mapQueued));
      } else {
        setError(e instanceof Error ? e.message : "Không thể tải danh sách lô hàng.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Lô hàng của tôi</Text>
        <Pressable
          style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}
          onPress={() => router.push("/(app)/(batches)/new")}
          accessibilityLabel="Tạo lô hàng mới"
        >
          <Text style={s.addBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Loading skeletons */}
      {loading && (
        <View style={s.center}>
          {[0,1,2].map(i => (
            <View key={i} style={s.skeleton} />
          ))}
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={s.errWrap}>
          <Text style={s.errTitle}>Không thể tải dữ liệu</Text>
          <Text style={s.errMsg}>{error}</Text>
          <Pressable
            style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.7 }]}
            onPress={() => void load()}
          >
            <Text style={s.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={batches}
          keyExtractor={(b) => b.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={EmptyState}
          renderItem={({ item }) => (
            <BatchCard
              batch={item}
              onPress={() => {
                if (!item.isOfflineQueued) router.push(`/(app)/(batches)/${item.id}`);
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor="#14B8A6"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  heading: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#14B8A6",
    alignItems: "center",
    justifyContent: "center"
  },
  addBtnPressed: { backgroundColor: "#0F766E" },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "600", lineHeight: 26 },
  center: { padding: 16, gap: 10 },
  skeleton: {
    height: 88,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    opacity: 0.6
  },
  errWrap: {
    margin: 16,
    padding: 18,
    backgroundColor: "#FFF1F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECDD3"
  },
  errTitle: { fontWeight: "700", fontSize: 15, color: "#BE123C" },
  errMsg: { fontSize: 13, color: "#BE123C", marginTop: 4 },
  retryBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  retryText: { fontSize: 13, fontWeight: "600", color: "#BE123C" },
  listContent: { padding: 14, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  cardPressed: { backgroundColor: "#F8FAFC" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardGs1: { fontSize: 11, color: "#94A3B8", fontFamily: "monospace", marginTop: 2 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  cardQty: { fontSize: 13, color: "#475569" },
  cardDate: { fontSize: 12, color: "#94A3B8" },
  cardNote: { fontSize: 11, color: "#2563EB", marginTop: 6 },
  cardHash: { fontSize: 11, color: "#94A3B8", fontFamily: "monospace", marginTop: 6 },
  cardPending: { fontSize: 11, color: "#D97706", marginTop: 6 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12, marginTop: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", textAlign: "center" },
  emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 21 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: "#14B8A6",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  emptyBtnPressed: { backgroundColor: "#0F766E" },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 }
});
