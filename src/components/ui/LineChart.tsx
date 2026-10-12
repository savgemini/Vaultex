import { useMemo } from 'react';

interface LineChartProps {
  data: { time: string; price: number }[];
  height?: number;
  color?: string;
  showAxis?: boolean;
  showGrid?: boolean;
  axisFormatter?: (value: number) => string;
}

export function LineChart({ data, height = 200, color = '#0F766E', showAxis = true, showGrid = true, axisFormatter = value => `$${value.toFixed(value > 100 ? 0 : 2)}` }: LineChartProps) {
  const { path, areaPath, min, max, width } = useMemo(() => {
    if (!data.length) return { path: '', areaPath: '', min: 0, max: 0, width: 0 };
    const w = 800;
    const h = height;
    const padding = { top: 10, right: 0, bottom: showAxis ? 20 : 0, left: showAxis ? 50 : 0 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const xStep = chartW / Math.max(data.length - 1, 1);

    const points = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartH - ((d.price - min) / range) * chartH,
    }));

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const areaPath = `${path} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + chartH} L ${points[0].x.toFixed(2)} ${padding.top + chartH} Z`;

    return { path, areaPath, min, max, width: w };
  }, [data, height, showAxis]);

  if (!data.length) return <div style={{ height }} className="flex items-center justify-center text-surface-400 text-sm">No chart data</div>;

  const gradientId = `gradient-${color.replace('#', '')}`;
  const h = height;
  const padding = { top: 10, right: 0, bottom: showAxis ? 20 : 0, left: showAxis ? 50 : 0 };

  return (
    <svg viewBox={`0 0 ${width} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showGrid && [0, 0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line
            x1={padding.left} y1={padding.top + f * (h - padding.top - padding.bottom)}
            x2={width - padding.right} y2={padding.top + f * (h - padding.top - padding.bottom)}
            stroke="#F5F5F5" strokeWidth="1"
          />
          {showAxis && (
            <text x={4} y={padding.top + f * (h - padding.top - padding.bottom) + 4} fontSize="10" fill="#A3A3A3" fontFamily="monospace">
              {axisFormatter(max - (max - min) * f)}
            </text>
          )}
        </g>
      ))}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
}

export function Sparkline({ data, height = 32, color = '#0F766E' }: SparklineProps) {
  const path = useMemo(() => {
    if (!data.length) return '';
    const w = 100;
    const h = height;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = w / Math.max(data.length - 1, 1);
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(2)} ${(h - ((v - min) / range) * h).toFixed(2)}`).join(' ');
  }, [data, height]);

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
