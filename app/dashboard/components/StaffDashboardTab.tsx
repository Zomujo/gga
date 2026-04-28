"use client";

import { useMemo } from "react";
import type { ApiComplaint, ApiUser } from "@/lib/api";
import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { MetricsGrid } from "./MetricsGrid";

interface StaffDashboardTabProps {
  complaints: ApiComplaint[];
  currentUser: ApiUser;
}

type MetricColor = "blue" | "green" | "purple" | "red";

function toHours(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 36e5;
}

function toDays(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 864e5;
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

function formatDays(value: number) {
  return `${value.toFixed(1)}d`;
}

const CHART_COLORS = ["#059669", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"];

export function StaffDashboardTab({ complaints, currentUser }: StaffDashboardTabProps) {
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const myCases = useMemo(
    () => complaints.filter((c) => c.assignedToId === currentUser.id),
    [complaints, currentUser.id]
  );

  const metrics = useMemo(() => {
    const active = myCases.filter(
      (c) => c.status === "pending" || c.status === "in_progress" || c.status === "escalated"
    );
    const resolved = myCases.filter((c) => c.status === "resolved");
    const overdue = myCases.filter((c) => {
      if (c.status === "resolved" || c.status === "rejected") return false;
      if (c.expectedResolutionDate) {
        return new Date(c.expectedResolutionDate).getTime() < new Date(nowIso).getTime();
      }
      return toDays(c.createdAt, nowIso) > 7;
    });

    const responseTimes = myCases
      .filter((c) => c.respondedAt)
      .map((c) => toHours(c.createdAt, c.respondedAt!))
      .filter((n) => n >= 0);

    const resolutionTimes = resolved
      .map((c) => toDays(c.createdAt, c.updatedAt))
      .filter((n) => n >= 0);

    const resolutionRate = pct(resolved.length, myCases.length);

    return [
      {
        label: "My Active Cases",
        value: active.length,
        change: `${myCases.length} total assigned`,
        trend: "up" as const,
        color: "blue" as MetricColor,
        footerLabel: "current snapshot",
      },
      {
        label: "Avg First Response",
        value: formatHours(avg(responseTimes)),
        change: `${responseTimes.length} cases with response`,
        trend: "up" as const,
        color: "green" as MetricColor,
        footerLabel: "based on assigned cases",
      },
      {
        label: "Resolution Rate",
        value: `${resolutionRate.toFixed(1)}%`,
        change: `${resolved.length}/${myCases.length || 0} resolved`,
        trend: "up" as const,
        color: "purple" as MetricColor,
        footerLabel: "based on assigned cases",
      },
      {
        label: "Overdue Cases",
        value: overdue.length,
        change: `${formatDays(avg(resolutionTimes))} avg resolution`,
        trend: overdue.length > 0 ? ("down" as const) : ("up" as const),
        color: "red" as MetricColor,
        footerLabel: "open cases past ETA",
      },
    ];
  }, [myCases, nowIso]);

  const statusBreakdown = useMemo(() => {
    const groups = [
      { label: "Pending", key: "pending" },
      { label: "In Progress", key: "in_progress" },
      { label: "Resolved", key: "resolved" },
      { label: "Escalated", key: "escalated" },
      { label: "Rejected", key: "rejected" },
    ] as const;

    return groups.map((group) => ({
      label: group.label,
      count: myCases.filter((c) => c.status === group.key).length,
    }));
  }, [myCases]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    myCases.forEach((c) => {
      const key = c.category
        .split("_")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [myCases]);

  const weeklyFlow = useMemo(() => {
    const buckets = [
      { day: "Mon", assigned: 0, resolved: 0 },
      { day: "Tue", assigned: 0, resolved: 0 },
      { day: "Wed", assigned: 0, resolved: 0 },
      { day: "Thu", assigned: 0, resolved: 0 },
      { day: "Fri", assigned: 0, resolved: 0 },
      { day: "Sat", assigned: 0, resolved: 0 },
      { day: "Sun", assigned: 0, resolved: 0 },
    ];
    const dayIndex = (value: string) => {
      const jsDay = new Date(value).getDay();
      return jsDay === 0 ? 6 : jsDay - 1;
    };

    myCases.forEach((c) => {
      if (c.respondedAt) {
        buckets[dayIndex(c.respondedAt)].assigned += 1;
      }
      if (c.status === "resolved") {
        buckets[dayIndex(c.updatedAt)].resolved += 1;
      }
    });

    return buckets;
  }, [myCases]);

  const recentItems = useMemo(
    () => [...myCases].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6),
    [myCases]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">My Performance Dashboard</h2>
        <p className="text-gray-600">Live analytics calculated from your assigned cases.</p>
      </div>

      <MetricsGrid metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Weekly Case Flow</h3>
          <p className="mt-1 text-sm text-gray-500">Assigned vs resolved by weekday</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Top Case Categories</h3>
          <p className="mt-1 text-sm text-gray-500">Distribution of your assigned portfolio</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  labelLine={false}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {categoryBreakdown.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Status Breakdown</h3>
          <div className="mt-4 space-y-3">
            {statusBreakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Recently Updated Cases</h3>
          <div className="mt-4 space-y-3">
            {recentItems.length === 0 ? (
              <p className="text-sm text-gray-500">No assigned cases yet.</p>
            ) : (
              recentItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{item.code}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{item.status.replace("_", " ")}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.description || "No description provided."}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
