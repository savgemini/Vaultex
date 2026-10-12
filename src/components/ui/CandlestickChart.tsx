import { useMemo } from 'react';

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: Candle[];
  height?: number;
}

export function CandlestickChart({ data, height = 300 }: CandlestickChartProps) {
  const { candles, volumes, priceLines } = useMemo(() => {
    if (!data.length) return { candles: [], volumes: [], priceLines: [] };
    const w = 800;
    const h = height;
    const volH = 40;
    const padding = { top: 10, right: 50, bottom: volH + 10, left: 0 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom - volH;

    const prices = data.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const volMax = Math.max(...data.map(d => d.volume));
    const candleWidth = chartW / data.length;
    const bodyWidth = Math.max(candleWidth * 0.6, 2);

    const candles = data.map((d, i) => {
      const x = padding.left + i * candleWidth + candleWidth / 2;
      const yHigh = padding.top + chartH - ((d.high - min) / range) * chartH;
      const yLow = padding.top + chartH - ((d.low - min) / range) * chartH;
      const yOpen = padding.top + chartH - ((d.open - min) / range) * chartH;
      const yClose = padding.top + chartH - ((d.close - min) / range) * chartH;
      const isUp = d.close >= d.open;
      return { x, yHigh, yLow, yOpen, yClose, isUp, bodyWidth };
    });

    const volumes = data.map((d, i) => {
      const x = padding.left + i * candleWidth;
      const barH = (d.volume / volMax) * volH;
      return { x, y: h - padding.bottom - barH + volH, w: bodyWidth, h: barH, isUp: d.close >= d.open };
    });

    const priceLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      y: padding.top + f * chartH,
      value: max - f * range,
    }));

    return { candles, volumes, priceLines };
  }, [data, height]);

  if (!data.length) return <div style={{ height }} className="flex items-center justify-center text-surface-400 text-sm">No chart data</div>;

  return (
    <svg viewBox={`0 0 800 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {priceLines.map((line, i) => (
        <g key={i}>
          <line x1="0" y1={line.y} x2="750" y2={line.y} stroke="#F5F5F5" strokeWidth="1" />
          <text x="755" y={line.y + 4} fontSize="10" fill="#A3A3A3" fontFamily="monospace">
            ${line.value.toFixed(line.value > 100 ? 0 : 2)}
          </text>
        </g>
      ))}
      {candles.map((c, i) => (
        <g key={i}>
          <line x1={c.x} y1={c.yHigh} x2={c.x} y2={c.yLow} stroke={c.isUp ? '#16A34A' : '#DC2626'} strokeWidth="1" />
          <rect
            x={c.x - c.bodyWidth / 2}
            y={Math.min(c.yOpen, c.yClose)}
            width={c.bodyWidth}
            height={Math.abs(c.yClose - c.yOpen) || 1}
            fill={c.isUp ? '#16A34A' : '#DC2626'}
          />
        </g>
      ))}
      {volumes.map((v, i) => (
        <rect key={i} x={v.x} y={v.y} width={v.w} height={v.h} fill={v.isUp ? '#16A34A' : '#DC2626'} opacity="0.3" />
      ))}
    </svg>
  );
}
