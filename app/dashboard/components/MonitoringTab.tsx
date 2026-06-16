"use client";

import type { ApiComplaint, NavigatorUpdate } from "@/lib/api";
import { MetricsGrid } from "./MetricsGrid";
import { AlertsSection } from "./AlertsSection";
import { NavigatorUpdates } from "./NavigatorUpdates";
import { AnalyticsCharts } from "./AnalyticsCharts";

interface MetricItem {
  label: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  color: "blue" | "green" | "purple" | "red";
}

interface MonitoringTabProps {
  token: string;
  monitoringMetrics: MetricItem[];
  overdueComplaints: ApiComplaint[];
  navigatorUpdates: NavigatorUpdate[];
  adminDistrict?: string;
  showTownFilter?: boolean;
  adminTown?: string;
  onAdminTownChange?: (town: string) => void;
  townOptions?: { value: string; label: string }[];
}

export function MonitoringTab({
  token,
  monitoringMetrics,
  overdueComplaints,
  navigatorUpdates,
  adminDistrict,
  showTownFilter = false,
  adminTown,
  onAdminTownChange,
  townOptions = [],
}: MonitoringTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        {showTownFilter && (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Town</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={adminTown || ""}
              onChange={(e) => onAdminTownChange?.(e.target.value)}
              disabled={!townOptions.length}
            >
              <option value="">All Towns</option>
              {townOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={monitoringMetrics} />

      {/* Analytics Charts */}
      <AnalyticsCharts token={token} locationId={adminTown || adminDistrict} />

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AlertsSection overdueComplaints={overdueComplaints} />
        <NavigatorUpdates navigatorUpdates={navigatorUpdates} />
      </div>
    </div>
  );
}
