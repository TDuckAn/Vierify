import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  View
} from "react-native";

import { getApiUrl, trpc } from "../../../lib/trpc";

const POLYGONSCAN_BASE = "https://amoy.polygonscan.com/tx";

function getRestBase(): string {
  return getApiUrl().replace(/\/trpc$/, "");
}

type Batch = {
  id: string;
  name: string;
  gs1TraceId: string;
  quantity: string;
  uom: string;
  bcStatus: number;
  txHash?: string | null;
  docHash?: string | null;
  scanCount?: number | null;
};

type GenealogyParent = {
  parentBatch: {
    id: string;
    name: string;
    gs1TraceId: string;
    bcStatus: number;
  };
};

type QrData = {
  gs1TraceId: string;
  qrDataUrl: string;
  traceUrl: string;
};

function isConfirmed(batch: Batch): boolean {
  return batch.bcStatus === 1 && Boolean(batch.txHash);
}

function truncateHash(hash: string, chars = 16): string {
  return `${hash.slice(0, chars)}…${hash.slice(-6)}`;
}

// ── Blockchain badge ──────────────────────────────────────────────────────────

function BlockchainBadge({ batch }: { batch: Batch }) {
  const confirmed = isConfirmed(batch);
  return (
    <View
      className={`flex-row items-center gap-2 self-start rounded-full border px-4 py-1.5 ${
        confirmed
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <View
        className={`h-2 w-2 rounded-full ${
          confirmed ? "bg-emerald-500" : "bg-amber-400"
        }`}
      />
      <Text
        className={`text-sm font-bold ${
          confirmed ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {confirmed ? "Đã xác minh trên Polygon" : "Đang xử lý blockchain"}
      </Text>
    </View>
  );
}

// ── QR modal ─────────────────────────────────────────────────────────────────

function QrModal({
  visible,
  qrData,
  onClose
}: {
  visible: boolean;
  qrData: QrData | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-end bg-black/50">
        <View className="w-full rounded-t-3xl bg-white p-6 pb-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-950">Mã QR lô hàng</Text>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-2xl text-slate-400">×</Text>
            </Pressable>
          </View>

          {qrData ? (
            <>
              <View className="items-center py-4">
                <Image
                  source={{ uri: qrData.qrDataUrl }}
                  className="h-56 w-56"
                  resizeMode="contain"
                  accessibilityLabel="QR code"
                />
              </View>
              <Text className="mt-2 text-center font-mono text-xs text-slate-400">
                {qrData.gs1TraceId}
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-400" numberOfLines={2}>
                {qrData.traceUrl}
              </Text>
            </>
          ) : (
            <View className="items-center py-12">
              <ActivityIndicator color="#14B8A6" />
              <Text className="mt-3 text-sm text-slate-400">Đang tải mã QR…</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [parents, setParents] = useState<GenealogyParent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [batchResult, genealogy] = await Promise.all([
          trpc.batches.get.query({ id }),
          trpc.genealogy.get.query({ batchId: id })
        ]);

        setBatch({
          id: batchResult.id,
          name: batchResult.name,
          gs1TraceId: batchResult.gs1TraceId,
          quantity: batchResult.quantity,
          uom: batchResult.uom,
          bcStatus: batchResult.bcStatus,
          txHash: batchResult.txHash,
          docHash: batchResult.docHash,
          scanCount: batchResult.scanCount
        });

        setParents(
          genealogy.parents.map((p) => ({
            parentBatch: {
              id: p.parentBatch.id,
              name: p.parentBatch.name,
              gs1TraceId: p.parentBatch.gs1TraceId,
              bcStatus: p.parentBatch.bcStatus
            }
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải thông tin lô hàng.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [id]);

  async function handleOpenQr() {
    setQrModalVisible(true);
    if (qrData) return;

    setIsLoadingQr(true);
    try {
      const res = await fetch(`${getRestBase()}/batches/${id}/qr`);
      if (!res.ok) throw new Error("QR fetch failed");
      const data = (await res.json()) as QrData;
      setQrData(data);
    } catch {
      setQrData(null);
    } finally {
      setIsLoadingQr(false);
    }
  }

  async function handleShareTxHash() {
    if (!batch?.txHash) return;
    await Share.share({
      message: `Vierify tx hash: ${batch.txHash}`,
      title: "Mã giao dịch blockchain"
    });
  }

  async function handleOpenPolygonscan() {
    if (!batch?.txHash) return;
    await Linking.openURL(`${POLYGONSCAN_BASE}/${batch.txHash}`);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#14B8A6" />
        <Text className="mt-3 text-sm text-slate-400">Đang tải lô hàng…</Text>
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <Pressable onPress={() => router.back()} className="p-1">
            <Text className="text-2xl text-slate-400">‹</Text>
          </Pressable>
          <Text className="text-lg font-bold text-slate-950">Lô hàng</Text>
        </View>
        <View className="m-5 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <Text className="font-bold text-rose-900">Không tìm thấy lô hàng</Text>
          <Text className="mt-1 text-sm text-rose-700">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const confirmed = isConfirmed(batch);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <Pressable onPress={() => router.back()} className="p-1">
          <Text className="text-2xl text-slate-400">‹</Text>
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-slate-950" numberOfLines={1}>
          {batch.name}
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-5 pb-10">
        {/* Identity + badge */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
          <Text className="text-2xl font-extrabold text-slate-950">{batch.name}</Text>
          <Text className="font-mono text-xs text-slate-400">{batch.gs1TraceId}</Text>
          <BlockchainBadge batch={batch} />
        </View>

        {/* Stats */}
        <View className="grid grid-cols-3 flex-row gap-3">
          {[
            { label: "Khối lượng", value: `${batch.quantity} ${batch.uom}` },
            { label: "Lô cha", value: parents.length > 0 ? String(parents.length) : "—" },
            { label: "Lượt quét", value: batch.scanCount != null ? String(batch.scanCount) : "—" }
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 rounded-xl border border-slate-200 bg-white p-4"
            >
              <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {stat.label}
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-950" numberOfLines={2}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Blockchain proof */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
          <Text className="text-base font-bold text-slate-950">Bằng chứng blockchain</Text>

          {confirmed && batch.txHash ? (
            <>
              <View className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <Text className="text-xs font-medium text-slate-400">Mã giao dịch</Text>
                <Text className="mt-1 font-mono text-sm text-slate-700" numberOfLines={2}>
                  {truncateHash(batch.txHash)}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleShareTxHash}
                  className="flex-1 items-center rounded-full border border-slate-300 py-3 active:opacity-70"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-sm font-semibold text-slate-700">Chia sẻ</Text>
                </Pressable>
                <Pressable
                  onPress={handleOpenPolygonscan}
                  className="flex-1 items-center rounded-full bg-proof py-3 active:opacity-80"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-sm font-bold text-white">Polygonscan →</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 gap-2">
              <Text className="text-sm font-semibold text-amber-900">
                Đang chờ xác nhận
              </Text>
              <Text className="text-sm text-amber-700">
                Lô hàng đã được ghi nhận và đang chờ giao dịch Polygon xác nhận.
              </Text>
            </View>
          )}
        </View>

        {/* Document hash */}
        {batch.docHash && (
          <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
            <Text className="text-base font-bold text-slate-950">Tài liệu đính kèm</Text>
            <View className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <Text className="text-xs font-medium text-slate-400">SHA-256</Text>
              <Text className="mt-1 font-mono text-xs text-slate-600" numberOfLines={2}>
                {truncateHash(batch.docHash, 20)}
              </Text>
            </View>
          </View>
        )}

        {/* QR button */}
        <Pressable
          onPress={handleOpenQr}
          className="items-center rounded-full bg-chain py-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-base font-bold text-white">Xem mã QR lô hàng</Text>
        </Pressable>

        {/* Parent batches */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-3">
          <Text className="text-base font-bold text-slate-950">Lô hàng cha</Text>
          {parents.length === 0 ? (
            <Text className="text-sm text-slate-400">
              Chưa có lô hàng cha. Thêm liên kết qua API để theo dõi nguồn gốc đầy đủ.
            </Text>
          ) : (
            parents.map(({ parentBatch }) => (
              <Pressable
                key={parentBatch.id}
                onPress={() =>
                  router.push(`/(app)/(batches)/${parentBatch.id}`)
                }
                className="flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 active:opacity-70"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="min-w-0 flex-1">
                  <Text className="font-semibold text-slate-950" numberOfLines={1}>
                    {parentBatch.name}
                  </Text>
                  <Text className="mt-0.5 font-mono text-xs text-slate-400" numberOfLines={1}>
                    {parentBatch.gs1TraceId}
                  </Text>
                </View>
                <View
                  className={`ml-3 rounded-full border px-3 py-1 ${
                    parentBatch.bcStatus === 1
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      parentBatch.bcStatus === 1 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {parentBatch.bcStatus === 1 ? "Xác minh" : "Chờ"}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* QR Modal */}
      <QrModal
        visible={qrModalVisible}
        qrData={isLoadingQr ? null : qrData}
        onClose={() => setQrModalVisible(false)}
      />
    </SafeAreaView>
  );
}
