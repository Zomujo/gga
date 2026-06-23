"use client";

interface MetricItem {
  label: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  color: "blue" | "green" | "purple" | "red";
  footerLabel?: string;
}

interface MetricsGridProps {
  metrics: MetricItem[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-[#d7c8ab] bg-[#fbfaf7] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
            <div
              className={`rounded-full p-3 ${
                metric.color === "blue"
                  ? "bg-blue-100"
                  : metric.color === "green"
                  ? "bg-green-100"
                  : metric.color === "purple"
                  ? "bg-purple-100"
                  : "bg-red-100"
              }`}
            >
              <div
                className={`h-6 w-6 ${
                  metric.color === "blue"
                    ? "bg-blue-600"
                    : metric.color === "green"
                    ? "bg-green-600"
                    : metric.color === "purple"
                    ? "bg-purple-600"
                    : "bg-red-600"
                } rounded`}
              ></div>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm font-semibold ${
                metric.color === "blue"
                  ? "text-blue-700"
                  : metric.color === "green"
                  ? "text-green-700"
                  : metric.color === "purple"
                  ? "text-purple-700"
                  : metric.color === "red"
                  ? "text-red-700"
                  : "text-gray-600"
              }`}
            >
              {metric.change}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {metric.footerLabel ?? "vs last week"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
