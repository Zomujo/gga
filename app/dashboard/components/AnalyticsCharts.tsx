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
  getCasesByLocation,
  getCasesByCategory,
  getCasesByStatus,
  getCasesTrend,
  getLocationPerformance,
  getResponseTimeDistribution,
  getResolutionTimeByCategory,
  getDistrictOfficerPerformance,
  getWeeklyActivityPattern,
  getEscalationAnalytics,
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
  locationId?: string;
}

export function AnalyticsCharts({ token, locationId }: AnalyticsChartsProps) {
  const [casesByLocation, setCasesByLocation] = useState<any[]>([]);
  const [casesByCategory, setCasesByCategory] = useState<any[]>([]);
  const [casesByStatus, setCasesByStatus] = useState<any[]>([]);
  const [casesTrend, setCasesTrend] = useState<any[]>([]);
  const [locationPerformance, setLocationPerformance] = useState<any[]>([]);
  const [responseTimeDistribution, setResponseTimeDistribution] = useState<any[]>([]);
  const [resolutionTimeByCategory, setResolutionTimeByCategory] = useState<any[]>([]);
  const [officerPerformance, setOfficerPerformance] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [escalationAnalytics, setEscalationAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const escalationByCategory = Array.isArray(escalationAnalytics?.byCategory)
    ? escalationAnalytics.byCategory
    : [];
  const topEscalatedCategory = escalationByCategory[0];
  const formatPercent = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0%";
    return `${Math.round(value * 10) / 10}%`;
  };

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        // Only pass district if it's not empty
        const locationFilter = locationId && locationId !== "" ? locationId : undefined;
        
        const [
          location, 
          category, 
          status, 
          trend, 
          performance,
          responseTime,
          resolutionTime,
          officers,
          weeklyPattern,
          escalations,
        ] = await Promise.all([
          getCasesByLocation(token),
          getCasesByCategory(token, locationFilter),
          getCasesByStatus(token, locationFilter),
          getCasesTrend(token, locationFilter),
          getLocationPerformance(token),
          getResponseTimeDistribution(token, locationFilter),
          getResolutionTimeByCategory(token, locationFilter),
          getDistrictOfficerPerformance(token),
          getWeeklyActivityPattern(token, locationFilter),
          getEscalationAnalytics(token, locationFilter),
        ]);

        setCasesByLocation(location);
        setCasesByCategory(category);
        setCasesByStatus(status);
        setCasesTrend(trend);
        setLocationPerformance(performance);
        setResponseTimeDistribution(responseTime);
        setResolutionTimeByCategory(resolutionTime);
        setOfficerPerformance(officers);
        setWeeklyActivity(weeklyPattern);
        setEscalationAnalytics(escalations);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [token, locationId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-12">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
            <div className="absolute inset-2 animate-ping rounded-full bg-emerald-400 opacity-20"></div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-900">Loading Analytics</p>
          <p className="mt-2 text-sm text-gray-600">Preparing your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cases by Location - Only show when no location filter */}
      {(!locationId || locationId === "") && (
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Cases by Location
              </h3>
              <p className="mt-1 text-sm text-gray-500">Distribution across all locations</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={casesByLocation} barGap={8}>
              <defs>
                <linearGradient id="barPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.yellow} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.yellow} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barInProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barRejected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis 
                dataKey="location" 
                stroke="#9ca3af" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar dataKey="pending" stackId="a" fill="url(#barPending)" name="Pending" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inProgress" stackId="a" fill="url(#barInProgress)" name="In Progress" radius={[0, 0, 0, 0]} />
              <Bar dataKey="resolved" stackId="a" fill="url(#barResolved)" name="Resolved" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rejected" stackId="a" fill="url(#barRejected)" name="Rejected" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trend Over Time */}
      <div className="group rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Case Trends
            </h3>
            <p className="mt-1 text-sm text-gray-500">Submission and resolution patterns over the last 30 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={casesTrend}>
            <defs>
              <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                padding: "12px 16px",
              }}
              cursor={{ stroke: COLORS.blue, strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="submitted"
              stroke={COLORS.blue}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSubmitted)"
              name="Submitted"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke={COLORS.emerald}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorResolved)"
              name="Resolved"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two column grid for Category and Status */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Cases by Category */}
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Cases by Category
            </h3>
            <p className="mt-1 text-sm text-gray-500">Most reported issue types</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={casesByCategory} layout="vertical" barSize={32}>
              <defs>
                <linearGradient id="categoryBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                dataKey="category" 
                type="category" 
                width={160} 
                stroke="#9ca3af"
                tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
              />
              <Bar 
                dataKey="count" 
                fill="url(#categoryBar)" 
                name="Cases"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Status */}
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Status Distribution
            </h3>
            <p className="mt-1 text-sm text-gray-500">Current case status breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <defs>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <linearGradient key={status} id={`gradient-${status}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={casesByStatus}
                cx="50%"
                cy="50%"
                labelLine={{
                  stroke: '#9ca3af',
                  strokeWidth: 1,
                }}
                label={(entry: any) => `${entry.status} ${formatPercent(entry.percentage)}`}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
                paddingAngle={2}
              >
                {casesByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${entry.status})`}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Performance Comparison - Only show when no location filter */}
      {(!locationId || locationId === "") && (
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Location Performance Comparison
              </h3>
              <p className="mt-1 text-sm text-gray-500">Key metrics across all locations</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={locationPerformance} barGap={12}>
              <defs>
                <linearGradient id="perfResolution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="perfResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="perfActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis 
                dataKey="location" 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="resolutionRate" 
                fill="url(#perfResolution)" 
                name="Resolution Rate (%)"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="avgResponseHours" 
                fill="url(#perfResponse)" 
                name="Avg Response (hours)"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="activeCases" 
                fill="url(#perfActive)" 
                name="Active Cases"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Response Time Distribution */}
      <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Response Time Distribution
          </h3>
          <p className="mt-1 text-sm text-gray-500">How quickly cases receive initial responses</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={responseTimeDistribution}>
            <defs>
              <linearGradient id="responseBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.9} />
                <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis 
              dataKey="bucket" 
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                padding: "12px 16px",
              }}
              cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
            />
            <Bar 
              dataKey="count" 
              fill="url(#responseBar)" 
              name="Cases"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two column grid for Resolution Time and Weekly Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Resolution Time by Category */}
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Resolution Time by Category
            </h3>
            <p className="mt-1 text-sm text-gray-500">Average days to resolve by issue type</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={resolutionTimeByCategory} layout="vertical" barSize={28}>
              <defs>
                <linearGradient id="resolutionBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Days', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
              />
              <YAxis 
                dataKey="category" 
                type="category" 
                width={160} 
                stroke="#9ca3af"
                tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
                cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }}
                formatter={(value: any) => [`${value} days`, 'Avg Time']}
              />
              <Bar 
                dataKey="avgDays" 
                fill="url(#resolutionBar)" 
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity Pattern */}
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Weekly Activity Pattern
            </h3>
            <p className="mt-1 text-sm text-gray-500">Case submissions and resolutions by day</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={weeklyActivity}>
              <defs>
                <linearGradient id="lineSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="lineResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
                cursor={{ stroke: COLORS.blue, strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="submitted" 
                stroke={COLORS.blue} 
                strokeWidth={3}
                dot={{ fill: COLORS.blue, r: 5 }}
                activeDot={{ r: 7 }}
                name="Submitted"
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke={COLORS.emerald} 
                strokeWidth={3}
                dot={{ fill: COLORS.emerald, r: 5 }}
                activeDot={{ r: 7 }}
                name="Resolved"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Officer Performance - Only show if no district filter */}
      {(!locationId || locationId === "") && officerPerformance.length > 0 && (
        <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              District Officer Performance
            </h3>
            <p className="mt-1 text-sm text-gray-500">Individual officer metrics and workload</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={officerPerformance}>
              <defs>
                <linearGradient id="navResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="navTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                  padding: "12px 16px",
                }}
                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="totalCases" 
                fill="url(#navTotal)" 
                name="Total Cases"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="resolved" 
                fill="url(#navResolved)" 
                name="Resolved"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Escalation Analytics */}
      {escalationAnalytics && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Escalation Stats Cards */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-orange-200 opacity-30"></div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">Escalated Cases</p>
            <p className="mt-4 text-5xl font-bold text-orange-600">
              {escalationAnalytics.totalEscalated}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-white">
                <div 
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: formatPercent(escalationAnalytics.escalationRate) }}
                ></div>
              </div>
              <p className="text-sm font-semibold text-gray-700">{formatPercent(escalationAnalytics.escalationRate)}</p>
            </div>
            <p className="mt-2 text-xs text-gray-600">of all cases</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-purple-200 opacity-30"></div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">Avg Days Before Escalation</p>
            <p className="mt-4 text-5xl font-bold text-purple-600">
              {escalationAnalytics.avgDaysBeforeEscalation}
            </p>
            <p className="mt-4 text-sm text-gray-600">Average time from case creation to escalation</p>
          </div>

          {/* Top Escalated Category */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-pink-200 opacity-30"></div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">Most Escalated</p>
              <p className="mt-4 text-2xl font-bold text-gray-900">
                {topEscalatedCategory?.category || "N/A"}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-4xl font-bold text-pink-600">
                  {formatPercent(topEscalatedCategory?.percentage)}
                </p>
                <p className="text-sm text-gray-600">of escalations</p>
              </div>
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Key Insights
          </h3>
          <p className="mt-1 text-sm text-gray-600">Highlights from your data</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {casesByCategory.length > 0 && (
            <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-100 opacity-50"></div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Top Issue</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {casesByCategory[0]?.category}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-emerald-600">
                  {casesByCategory[0]?.count}
                </p>
                <p className="text-sm text-gray-500">cases reported</p>
              </div>
            </div>
          )}

          {locationPerformance.length > 0 && (
            <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-100 opacity-50"></div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Top Performer</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {[...locationPerformance].sort((a, b) => b.resolutionRate - a.resolutionRate)[0]?.location}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-600">
                  {formatPercent([...locationPerformance].sort((a, b) => b.resolutionRate - a.resolutionRate)[0]?.resolutionRate)}
                </p>
                <p className="text-sm text-gray-500">resolution rate</p>
              </div>
            </div>
          )}

          {casesByStatus.length > 0 && (
            <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-purple-100 opacity-50"></div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Primary Status</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {[...casesByStatus].sort((a, b) => b.count - a.count)[0]?.status}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-purple-600">
                  {formatPercent([...casesByStatus].sort((a, b) => b.count - a.count)[0]?.percentage)}
                </p>
                <p className="text-sm text-gray-500">of all cases</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
