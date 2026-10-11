"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CallActivityItem = {
  date: string;
  calls: number;
};

type CallsAreaChartProps = {
  data: CallActivityItem[];
};

// Real Call Activity Chart
export function CallsAreaChart({ data }: CallsAreaChartProps) {
  const chartData = data.map((item) => ({
    day: new Date(`${item.date}T00:00:00Z`).toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        timeZone: "UTC",
      }
    ),
    calls: item.calls,
  }));

  return (
    <div
      className="h-56 w-full"
      aria-label="Weekly calls chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 8,
            right: 4,
            left: -22,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="callsFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#6157e8"
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor="#6157e8"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#edf0f5"
          />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#8a91a1",
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#8a91a1",
            }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: "#e5e8ef",
              fontSize: 12,
            }}
          />

          <Area
            type="monotone"
            dataKey="calls"
            stroke="#6157e8"
            strokeWidth={2.5}
            fill="url(#callsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Existing Lead Status Bar Chart
export function SimpleBarChart() {
  const data = [
    { name: "New", value: 88 },
    { name: "Contacted", value: 64 },
    { name: "Interested", value: 42 },
    { name: "Converted", value: 23 },
  ];

  return (
    <div
      className="h-56 w-full"
      aria-label="Lead status chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 8,
            right: 4,
            left: -22,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#edf0f5"
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#8a91a1",
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#8a91a1",
            }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: "#e5e8ef",
              fontSize: 12,
            }}
          />

          <Bar
            dataKey="value"
            fill="#6157e8"
            radius={[7, 7, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}