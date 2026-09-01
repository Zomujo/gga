"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getComplaintStats,
  getNavigatorUpdates,
  getNavigators,
  getOverdueComplaints,
  type ApiComplaint,
  type ApiUser,
  type NavigatorUpdate,
  type ComplaintStatsWithTrends,
} from "@/lib/api";
import { loadSessionCache, saveSessionCache } from "@/lib/storage";

interface UseMonitoringOptions {
  token: string | null;
  currentUser: ApiUser | null;
}

export function useMonitoring({ token, currentUser }: UseMonitoringOptions) {
  const isAdminLike =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const [monitoringStats, setMonitoringStats] = useState<ComplaintStatsWithTrends | null>(null);
  const [overdueComplaints, setOverdueComplaints] = useState<ApiComplaint[]>(
    []
  );
  const [navigatorUpdates, setNavigatorUpdates] = useState<NavigatorUpdate[]>(
    []
  );
  const [navigators, setNavigators] = useState<ApiUser[]>([]);

  const cacheScope = currentUser?.id ?? "anonymous";

  const formatMetricNumber = (value?: number, decimals = 2) => {
    const numeric = value ?? 0;
    return Number.isInteger(numeric)
      ? String(numeric)
      : numeric.toFixed(decimals);
  };

  const monitoringMetrics = useMemo(
    () => [
      {
        label: "Reports Created",
        value: monitoringStats?.activeCases ?? 0,
        change: monitoringStats?.activeCasesChange 
          ? (monitoringStats.activeCasesChange > 0 ? `+${monitoringStats.activeCasesChange}` : `${monitoringStats.activeCasesChange}`)
          : "0",
        trend: (monitoringStats?.activeCasesChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
        color: "blue" as const,
        footerLabel: "last 7 days vs prior 7 days",
      },
      {
        label: "Avg Response Time",
        value: `${formatMetricNumber(monitoringStats?.avgResponseHours)}h`,
        change: monitoringStats?.avgResponseHoursChange
          ? (
              monitoringStats.avgResponseHoursChange > 0
                ? `+${formatMetricNumber(monitoringStats.avgResponseHoursChange)}h`
                : `${formatMetricNumber(monitoringStats.avgResponseHoursChange)}h`
            )
          : "0h",
        trend: (monitoringStats?.avgResponseHoursChange ?? 0) < 0 ? ("up" as const) : ("down" as const),
        color: "green" as const,
        footerLabel: "responses in the last 7 days",
      },
      {
        label: "Resolution Rate",
        value: `${formatMetricNumber(monitoringStats?.resolutionRate)}%`,
        change: monitoringStats?.resolutionRateChange
          ? (
              monitoringStats.resolutionRateChange > 0
                ? `+${formatMetricNumber(monitoringStats.resolutionRateChange)}%`
                : `${formatMetricNumber(monitoringStats.resolutionRateChange)}%`
            )
          : "0%",
        trend: (monitoringStats?.resolutionRateChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
        color: "purple" as const,
        footerLabel: "reports created in the last 7 days",
      },
      {
        label: "Open Cases Over 7 Days",
        value: monitoringStats?.overdueCases ?? 0,
        change: "Received or in progress",
        trend: "down" as const,
        color: "red" as const,
        footerLabel: "current total, not a weekly comparison",
      },
    ],
    [monitoringStats]
  );

  const refreshStats = useCallback(
    async (district?: string, force = false) => {
      if (!token) return;
      const cacheKey = `monitoring:stats:${cacheScope}:${district ?? "all"}`;
      const cached = loadSessionCache<ComplaintStatsWithTrends>(cacheKey);
      if (cached) {
        setMonitoringStats(cached);
        if (!force) return;
      }
      try {
        const stats = await getComplaintStats(token, { district });
        setMonitoringStats(stats);
        saveSessionCache(cacheKey, stats);
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    },
    [token, cacheScope]
  );

  const refreshNavigatorUpdates = useCallback(
    async (district?: string, force = false) => {
      if (!token) return;
      const cacheKey = `monitoring:updates:${cacheScope}:${district ?? "all"}`;
      const cached = loadSessionCache<NavigatorUpdate[]>(cacheKey);
      if (cached) {
        setNavigatorUpdates(cached);
        if (!force) return;
      }
      try {
        const updates = await getNavigatorUpdates(token, {
          district,
          page: 1,
          pageSize: 10,
        });
        setNavigatorUpdates(updates);
        saveSessionCache(cacheKey, updates);
      } catch (error) {
        console.error("Failed to load navigator updates:", error);
      }
    },
    [token, cacheScope]
  );

  const refreshOverdueComplaints = useCallback(async (district?: string, force = false) => {
    if (!token) return;
    const cacheKey = `monitoring:overdue:${cacheScope}:${district ?? "all"}`;
    const cached = loadSessionCache<ApiComplaint[]>(cacheKey);
    if (cached) {
      setOverdueComplaints(cached);
      if (!force) return;
    }
    try {
      const complaints = await getOverdueComplaints(token, district);
      setOverdueComplaints(complaints);
      saveSessionCache(cacheKey, complaints);
    } catch (error) {
      console.error("Failed to load overdue complaints:", error);
    }
  }, [token, cacheScope]);

  const fetchNavigators = useCallback(async () => {
    if (!token || !isAdminLike) return;
    try {
      const response = await getNavigators(token);
      setNavigators(response.rows || []);
    } catch (error) {
      console.error("Failed to load navigators:", error);
    }
  }, [token, isAdminLike]);

  return {
    // State
    monitoringStats,
    monitoringMetrics,
    overdueComplaints,
    navigatorUpdates,
    navigators,
    // Actions
    refreshStats,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    fetchNavigators,
  };
}
