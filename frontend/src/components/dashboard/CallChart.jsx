import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CallChart = ({ data = [] }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] w-full h-[360px] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-brand-textPrimary tracking-tight">
            IVR Calling Output
          </h3>
          <p className="text-xs text-brand-textSecondary">
            Daily tracking of successful vs failed automated calls
          </p>
        </div>
      </div>

      <div className="flex-1 w-full text-xs font-medium">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-brand-textSecondary text-sm">
            No call data available for the requested period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                dy={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c0c22',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  paddingBottom: '20px',
                }}
              />
              <Area
                name="Successful Calls"
                type="monotone"
                dataKey="successful"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSuccess)"
              />
              <Area
                name="Failed Calls"
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFailed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CallChart;
