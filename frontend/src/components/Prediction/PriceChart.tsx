'use client'

import type { Market, PricePoint } from '@/data/markets'

interface PriceChartProps {
  market: Market
  height?: number
}

const PAD_LEFT = 36
const PAD_BOTTOM = 18
const PAD_TOP = 8
const PAD_RIGHT = 8
const VIEW_W = 400
const VIEW_H = 96

function toX(i: number, total: number): number {
  const drawW = VIEW_W - PAD_LEFT - PAD_RIGHT
  return PAD_LEFT + (i / (total - 1)) * drawW
}

function toY(price: number): number {
  const drawH = VIEW_H - PAD_TOP - PAD_BOTTOM
  return PAD_TOP + (1 - price / 100) * drawH
}

function buildPath(points: PricePoint[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i, points.length).toFixed(1)},${toY(p.yesPrice).toFixed(1)}`)
    .join(' ')
}

function buildAreaPath(points: PricePoint[]): string {
  const line = buildPath(points)
  const lastX = toX(points.length - 1, points.length).toFixed(1)
  const baseY = (VIEW_H - PAD_BOTTOM).toFixed(1)
  const firstX = PAD_LEFT.toFixed(1)
  return `${line} L${lastX},${baseY} L${firstX},${baseY} Z`
}

export function PriceChart({ market, height = 96 }: PriceChartProps) {
  const { priceHistory, yesPrice, status, id } = market
  if (!priceHistory.length) return null

  const gradId = `chart-grad-${id}`
  const isResolved = status === 'RESOLVED_YES' || status === 'RESOLVED_NO'
  const lineColor = status === 'RESOLVED_YES'
    ? '#86efac'   // green-300
    : status === 'RESOLVED_NO'
    ? '#fca5a5'   // red-300
    : '#7dd3fc'   // sky-300

  const lastPt = priceHistory[priceHistory.length - 1]
  const lastX = toX(priceHistory.length - 1, priceHistory.length)
  const lastY = toY(lastPt.yesPrice)
  const refY = toY(yesPrice)
  const gridPrices = [0, 25, 50, 75, 100]

  // X-axis labels: show every 6h
  const labelIndices = priceHistory
    .map((_, i) => i)
    .filter(i => i % 6 === 0 || i === priceHistory.length - 1)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {gridPrices.map(p => (
        <line
          key={p}
          x1={PAD_LEFT}
          x2={VIEW_W - PAD_RIGHT}
          y1={toY(p)}
          y2={toY(p)}
          stroke={p === 50 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}
          strokeWidth={p === 50 ? 1 : 0.5}
          strokeDasharray={p === 50 ? '3 3' : undefined}
        />
      ))}

      {/* Y-axis labels */}
      {gridPrices.filter(p => p > 0 && p < 100).map(p => (
        <text
          key={p}
          x={PAD_LEFT - 3}
          y={toY(p) + 3}
          textAnchor="end"
          fontSize={6}
          fill="rgba(255,255,255,0.30)"
          fontFamily="monospace"
        >
          {p}¢
        </text>
      ))}

      {/* X-axis labels */}
      {labelIndices.map(i => {
        const ts = priceHistory[i].timestamp
        const h = new Date(ts).getUTCHours().toString().padStart(2, '0')
        return (
          <text
            key={i}
            x={toX(i, priceHistory.length)}
            y={VIEW_H - 2}
            textAnchor="middle"
            fontSize={5.5}
            fill="rgba(255,255,255,0.25)"
            fontFamily="monospace"
          >
            {h}:00
          </text>
        )
      })}

      {/* Area fill */}
      <path d={buildAreaPath(priceHistory)} fill={`url(#${gradId})`} />

      {/* Price line */}
      <path
        d={buildPath(priceHistory)}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dashed reference line at current yesPrice */}
      {!isResolved && (
        <line
          x1={PAD_LEFT}
          x2={VIEW_W - PAD_RIGHT}
          y1={refY}
          y2={refY}
          stroke={lineColor}
          strokeWidth={0.5}
          strokeDasharray="4 4"
          opacity={0.4}
        />
      )}

      {/* Current price dot (pulsing via CSS) */}
      {!isResolved && (
        <>
          {/* outer pulse ring */}
          <circle cx={lastX} cy={lastY} r={5} fill={lineColor} opacity={0.15}>
            <animate attributeName="r" values="4;7;4" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0;0.15" dur="1.5s" repeatCount="indefinite" />
          </circle>
          {/* inner solid dot */}
          <circle cx={lastX} cy={lastY} r={2.5} fill={lineColor} />
        </>
      )}
    </svg>
  )
}
