"use client";

import { useState, useEffect, useCallback } from "react";
import { workersApi } from "@/lib/api";
import type { HealthRecord } from "@/types/health";
import type { HealthStats } from "@/types/health";

interface UseWorkerHistoryReturn {
  records: HealthRecord[];
  stats: HealthStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

const PAGE_SIZE = 10;

export function useWorkerHistory(
  token: string | null,
  workerId: string | null
): UseWorkerHistoryReturn {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number, append = false) => {
      if (!token || !workerId) return;
      setLoading(true);
      setError(null);
      try {
        const [historyRes, statsRes] = await Promise.all([
          workersApi.getHistory(token, workerId, { page: pageNum, pageSize: PAGE_SIZE }),
          pageNum === 1 ? workersApi.getStats(token, workerId) : Promise.resolve(null),
        ]);

        setTotal(historyRes.total);
        setRecords((prev) => (append ? [...prev, ...historyRes.records] : historyRes.records));

        if (statsRes) {
          setStats(statsRes.stats);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    },
    [token, workerId]
  );

  useEffect(() => {
    setPage(1);
    setRecords([]);
    fetchPage(1, false);
  }, [workerId, token]);

  const loadMore = useCallback(() => {
    if (loading || records.length >= total) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true);
  }, [loading, records.length, total, page, fetchPage]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchPage(1, false);
  }, [fetchPage]);

  return {
    records,
    stats,
    loading,
    error,
    hasMore: records.length < total,
    loadMore,
    refresh,
  };
}