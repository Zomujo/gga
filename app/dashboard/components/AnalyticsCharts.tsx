"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  getCasesByAssembly,
  getCasesByCategory,
  getCasesByStatus,
  getCasesTrend,
  getAssemblyPerformance,
} from "@/lib/api";

const COLORS = {
  emerald: "#10b981",
  teal: "#14b8a6",
  blue: "#3b82f6",
  purple: "#a855f7",
  orange: "#f97316",
  red: "#ef4444",
  yellow: "#eab308",
  pink: "#ec4899",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: COLORS.yellow,
  "In Progress": COLORS.blue,
  Resolved: COLORS.emerald,
  Rejected: COLORS.red,
  Escalated: COLORS.purple,
};

interface AnalyticsChartsProps {
  token: string;
  district?: string;
}

export function AnalyticsCharts({ token, district }: AnalyticsChartsProps) {
  const [casesByAssembly, setCasesByAssembly] = useState<any[]>([]);
  const [casesByCategory, setCasesByCategory] = useState<any[]>([]);
  const [casesByStatus, setCasesByStatus] = useState<any[]>([]);
  const [casesTrend, setCasesTrend] = useState<any[]>([]);
  const [assemblyPerformance, setAssemblyPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        // Only pass district if it's not empty
        const districtFilter = district && district !== "" ? district : undefined;
        
        const [assembly, category, status, trend, performance] = await Promise.all([
          getCasesByAssembly(token),
          getCasesByCategory(token, districtFilter),
          getCasesByStatus(token, districtFilter),
          getCasesTrend(token, districtFilter),
          getAssemblyPerformance(token),
        ]);

        setCasesByAssembly(assembly);
        setCasesByCategory(category);
        setCasesByStatus(status);
        setCasesTrend(trend);
        setAssemblyPerformance(performance);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [token, district]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cases by Assembly - Only show if no district filter or "All Assemblies" */}
      {(!district || district === "") && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Cases by Assembly
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={casesByAssembly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="assembly" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill={COLORS.yellow} name="Pending" />
              <Bar dataKey="inProgress" stackId="a" fill={COLORS.blue} name="In Progress" />
              <Bar dataKey="resolved" stackId="a" fill={COLORS.emerald} name="Resolved" />
              <Bar dataKey="rejected" stackId="a" fill={COLORS.red} name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trend Over Time */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Case Trends (Last 30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={casesTrend}>
            <defs>
              <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="submitted"
              stroke={COLORS.blue}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSubmitted)"
              name="Submitted"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke={COLORS.emerald}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResolved)"
              name="Resolved"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two column grid for Category and Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cases by Category */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Cases by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={casesByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="category" type="category" width={150} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill={COLORS.emerald} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={casesByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {casesByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || COLORS.blue}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assembly Performance Comparison - Only show if no district filter or "All Assemblies" */}
      {(!district || district === "") && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Assembly Performance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assemblyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="assembly" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="resolutionRate" fill={COLORS.emerald} name="Resolution Rate (%)" />
              <Bar dataKey="avgResponseHours" fill={COLORS.teal} name="Avg Response (hours)" />
              <Bar dataKey="activeCases" fill={COLORS.blue} name="Active Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Key Insights */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Key Insights
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {casesByCategory.length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Top Issue Category</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {casesByCategory[0]?.category}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {casesByCategory[0]?.count} cases reported
              </p>
            </div>
          )}

          {assemblyPerformance.length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Best Performing Assembly</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {[...assemblyPerformance].sort((a, b) => b.resolutionRate - a.resolutionRate)[0]?.assembly}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {[...assemblyPerformance].sort((a, b) => b.resolutionRate - a.resolutionRate)[0]?.resolutionRate}% resolution rate
              </p>
            </div>
          )}

          {casesByStatus.length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Most Common Status</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {[...casesByStatus].sort((a, b) => b.count - a.count)[0]?.status}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {[...casesByStatus].sort((a, b) => b.count - a.count)[0]?.percentage}% of all cases
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
