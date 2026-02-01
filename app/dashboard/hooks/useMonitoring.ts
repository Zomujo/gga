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

interface UseMonitoringOptions {
  token: string | null;
  currentUser: ApiUser | null;
}

export function useMonitoring({ token, currentUser }: UseMonitoringOptions) {
  const [monitoringStats, setMonitoringStats] = useState<ComplaintStatsWithTrends | null>(null);
  const [overdueComplaints, setOverdueComplaints] = useState<ApiComplaint[]>(
    []
  );
  const [navigatorUpdates, setNavigatorUpdates] = useState<NavigatorUpdate[]>(
    []
  );
  const [navigators, setNavigators] = useState<ApiUser[]>([]);

  const monitoringMetrics = useMemo(
    () => [
      {
        label: "Active Cases",
        value: monitoringStats?.activeCases ?? 0,
        change: monitoringStats?.activeCasesChange 
          ? (monitoringStats.activeCasesChange > 0 ? `+${monitoringStats.activeCasesChange}` : `${monitoringStats.activeCasesChange}`)
          : "0",
        trend: (monitoringStats?.activeCasesChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
        color: "blue" as const,
      },
      {
        label: "Avg Response",
        value: `${monitoringStats?.avgResponseHours ?? 0}h`,
        change: monitoringStats?.avgResponseHoursChange
          ? (monitoringStats.avgResponseHoursChange > 0 ? `+${monitoringStats.avgResponseHoursChange}h` : `${monitoringStats.avgResponseHoursChange}h`)
          : "0h",
        trend: (monitoringStats?.avgResponseHoursChange ?? 0) < 0 ? ("up" as const) : ("down" as const),
        color: "green" as const,
      },
      {
        label: "Resolution Rate",
        value: `${monitoringStats?.resolutionRate ?? 0}%`,
        change: monitoringStats?.resolutionRateChange
          ? (monitoringStats.resolutionRateChange > 0 ? `+${monitoringStats.resolutionRateChange}%` : `${monitoringStats.resolutionRateChange}%`)
          : "0%",
        trend: (monitoringStats?.resolutionRateChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
        color: "purple" as const,
      },
      {
        label: "Overdue Cases",
        value: monitoringStats?.overdueCases ?? 0,
        change: monitoringStats?.overdueCasesChange
          ? (monitoringStats.overdueCasesChange > 0 ? `+${monitoringStats.overdueCasesChange}` : `${monitoringStats.overdueCasesChange}`)
          : "0",
        trend: (monitoringStats?.overdueCasesChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
        color: "red" as const,
      },
    ],
    [monitoringStats]
  );

  const refreshStats = useCallback(
    async (district?: string) => {
      if (!token) return;
      try {
        const stats = await getComplaintStats(token, { district });
        setMonitoringStats(stats);
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    },
    [token]
  );

  const refreshNavigatorUpdates = useCallback(
    async (district?: string) => {
      if (!token) return;
      try {
        const updates = await getNavigatorUpdates(token, {
          district,
          page: 1,
          pageSize: 10,
        });
        setNavigatorUpdates(updates);
      } catch (error) {
        console.error("Failed to load navigator updates:", error);
      }
    },
    [token]
  );

  const refreshOverdueComplaints = useCallback(async () => {
    if (!token) return;
    try {
      const complaints = await getOverdueComplaints(token);
      setOverdueComplaints(complaints);
    } catch (error) {
      console.error("Failed to load overdue complaints:", error);
    }
  }, [token]);

  const fetchNavigators = useCallback(async () => {
    if (!token || currentUser?.role !== "admin") return;
    try {
      const response = await getNavigators(token);
      setNavigators(response.rows || []);
    } catch (error) {
      console.error("Failed to load navigators:", error);
    }
  }, [token, currentUser?.role]);

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
