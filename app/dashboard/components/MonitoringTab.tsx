"use client";

import type { ApiComplaint, NavigatorUpdate } from "@/lib/api";
import { MetricsGrid } from "./MetricsGrid";
import { AlertsSection } from "./AlertsSection";
import { NavigatorUpdates } from "./NavigatorUpdates";
import { AnalyticsCharts } from "./AnalyticsCharts";

interface LocationOption {
  value: string;
  label: string;
}

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
  isAdmin?: boolean;
  adminDistrict?: string;
  onAdminDistrictChange?: (district: string) => void;
  locationOptions?: LocationOption[];
}

export function MonitoringTab({
  token,
  monitoringMetrics,
  overdueComplaints,
  navigatorUpdates,
  isAdmin,
  adminDistrict,
  onAdminDistrictChange,
  locationOptions = [],
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

        {isAdmin && onAdminDistrictChange && (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Location Filter</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={adminDistrict || ""}
              onChange={(e) => onAdminDistrictChange(e.target.value)}
            >
              <option value="">All Locations</option>
              {locationOptions.map((opt) => (
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
      <AnalyticsCharts token={token} locationId={adminDistrict} />

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AlertsSection overdueComplaints={overdueComplaints} />
        <NavigatorUpdates navigatorUpdates={navigatorUpdates} />
      </div>
    </div>
  );
}
