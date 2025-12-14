'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';

// Wrapper to prevent Recharts width/height -1 warnings during initial render
const SafeResponsiveContainer = ({
  children,
  ...props
}: React.ComponentProps<typeof ResponsiveContainer>) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!ready) {
    return <div style={{ width: '100%', height: '100%', minHeight: 100 }} />;
  }

  return (
    <ResponsiveContainer {...props} debounce={100}>
      {children}
    </ResponsiveContainer>
  );
};

interface HistoryPoint {
  created_at: string;
  cpu_percent: number | null;
  ram_used: number | null;
  file_size: number | null;
  packets_sent: number | null;
  packets_received: number | null;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

interface HistoryChartDatum {
  ts: string;
  cpu: number;
  ram: number;
  sent: number;
  received: number;
}

interface HistoryResponse {
  points?: HistoryPoint[];
}

interface TimeRangeOption {
  key: TimeRange;
  label: string;
  hours: number;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: '1h', label: '1h', hours: 1 },
  { key: '6h', label: '6h', hours: 6 },
  { key: '24h', label: '24h', hours: 24 },
  { key: '7d', label: '7d', hours: 168 },
  { key: '30d', label: '30d', hours: 720 },
];

export default function HistoryChart({ ip }: { ip: string }) {
  const [data, setData] = useState<HistoryChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [visibleMetrics, setVisibleMetrics] = useState({
    cpu: true,
    ram: true,
    sent: false,
    received: false,
  });
  const { theme, mounted: themeMounted } = useTheme();
  const isLight = themeMounted ? theme === 'light' : false;

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const selectedOption = TIME_RANGE_OPTIONS.find((opt) => opt.key === timeRange);
        const hours = selectedOption?.hours || 24;

        const res = await fetch(`/api/pnodes/${ip}/history?hours=${hours}`);
        const json: unknown = await res.json();

        if (
          typeof json === 'object' &&
          json !== null
        ) {
          const { points } = json as HistoryResponse;
          if (!Array.isArray(points)) {
            setData([]);
            return;
          }

          const formatted = points.map((p) => ({
            ts: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cpu: p.cpu_percent != null ? Number.parseFloat(p.cpu_percent.toFixed(1)) : 0,
            ram: p.ram_used != null ? Math.round(p.ram_used / 1_000_000_000) : 0,
            sent: p.packets_sent ?? 0,
            received: p.packets_received ?? 0,
          }));

          setData(formatted);
        }
      } catch (e) {
        console.error('Failed to fetch history:', e);
      } finally {
        setLoading(false);
      }
    };

    if (ip) {
      fetchHistory();
    }
  }, [ip, timeRange]);

  if (loading) {
    return (
      <div
        className="h-[300px] flex items-center justify-center text-sm theme-transition"
        style={{ color: 'var(--text-soft)' }}
      >
        Loading historical data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="h-[300px] flex items-center justify-center text-sm theme-transition"
        style={{ color: 'var(--text-soft)' }}
      >
        No historical data available yet. Data collection starts on next api fetch.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Time Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-soft)' }}>
            Time Range:
          </span>
          <div className="flex gap-1">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setTimeRange(option.key)}
                className={clsx(
                  'px-3 py-1 text-xs rounded-md transition-colors theme-transition font-medium',
                  timeRange === option.key
                    ? 'text-black'
                    : isLight
                      ? 'text-text-soft'
                      : 'text-text-soft'
                )}
                style={{
                  background:
                    timeRange === option.key
                      ? 'var(--accent-aqua)'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.05)'
                        : 'rgba(255, 255, 255, 0.06)',
                  color:
                    timeRange === option.key
                      ? 'var(--text-main)'
                      : 'var(--text-soft)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-soft)' }}>
            Metrics:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setVisibleMetrics(prev => ({ ...prev, cpu: !prev.cpu }))}
              className={clsx(
                'px-3 py-1 text-xs rounded-md transition-colors theme-transition font-medium',
                visibleMetrics.cpu ? 'text-white' : 'text-text-soft'
              )}
              style={{
                background: visibleMetrics.cpu
                  ? 'var(--kpi-excellent)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.06)',
              }}
            >
              CPU
            </button>
            <button
              onClick={() => setVisibleMetrics(prev => ({ ...prev, ram: !prev.ram }))}
              className={clsx(
                'px-3 py-1 text-xs rounded-md transition-colors theme-transition font-medium',
                visibleMetrics.ram ? 'text-white' : 'text-text-soft'
              )}
              style={{
                background: visibleMetrics.ram
                  ? 'var(--kpi-good)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.06)',
              }}
            >
              RAM
            </button>
            <button
              onClick={() => setVisibleMetrics(prev => ({ ...prev, sent: !prev.sent }))}
              className={clsx(
                'px-3 py-1 text-xs rounded-md transition-colors theme-transition font-medium',
                visibleMetrics.sent ? 'text-white' : 'text-text-soft'
              )}
              style={{
                background: visibleMetrics.sent
                  ? 'var(--kpi-warning)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.06)',
              }}
            >
              Sent
            </button>
            <button
              onClick={() => setVisibleMetrics(prev => ({ ...prev, received: !prev.received }))}
              className={clsx(
                'px-3 py-1 text-xs rounded-md transition-colors theme-transition font-medium',
                visibleMetrics.received ? 'text-white' : 'text-text-soft'
              )}
              style={{
                background: visibleMetrics.received
                  ? 'var(--kpi-critical)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.06)',
              }}
            >
              Received
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: '400px' }}>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="ts" stroke="var(--text-soft)" fontSize={12} tick={{ fill: 'var(--text-soft)' }} />
            <YAxis yAxisId="left" stroke="var(--text-soft)" fontSize={12} tick={{ fill: 'var(--text-soft)' }} />
            <YAxis yAxisId="right" orientation="right" stroke="var(--text-soft)" fontSize={12} tick={{ fill: 'var(--text-soft)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-app)',
              }}
              labelStyle={{ color: 'var(--text-main)' }}
            />
            <Legend />
            {visibleMetrics.cpu && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cpu"
                stroke="var(--kpi-excellent)"
                dot={false}
                isAnimationActive={false}
                name="CPU %"
                strokeWidth={2}
              />
            )}
            {visibleMetrics.ram && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ram"
                stroke="var(--kpi-good)"
                dot={false}
                isAnimationActive={false}
                name="RAM (GB)"
                strokeWidth={2}
              />
            )}
            {visibleMetrics.sent && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sent"
                stroke="var(--kpi-warning)"
                dot={false}
                isAnimationActive={false}
                name="Packets Sent"
                strokeWidth={2}
              />
            )}
            {visibleMetrics.received && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="received"
                stroke="var(--kpi-critical)"
                dot={false}
                isAnimationActive={false}
                name="Packets Received"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </SafeResponsiveContainer>
      </div>
    </div>
  );
}
