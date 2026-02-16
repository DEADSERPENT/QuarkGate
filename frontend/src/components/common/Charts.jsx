import { useState } from 'react';

const STATUS_COLORS = {
  PLACED: { bar: '#3b82f6', bg: '#eff6ff' },
  CONFIRMED: { bar: '#6366f1', bg: '#eef2ff' },
  SHIPPED: { bar: '#f59e0b', bg: '#fffbeb' },
  DELIVERED: { bar: '#22c55e', bg: '#f0fdf4' },
  CANCELLED: { bar: '#ef4444', bg: '#fef2f2' },
  PENDING: { bar: '#f59e0b', bg: '#fffbeb' },
  PROCESSING: { bar: '#8b5cf6', bg: '#f5f3ff' },
};

const CATEGORY_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6',
];

// ──────────────────────────────────────────────
//  Order Status Distribution — Horizontal bars
// ──────────────────────────────────────────────
export function OrderStatusChart({ orders }) {
  const statusCounts = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const total = orders.length || 1;
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-800">Order Status Distribution</h3>
        <span className="text-xs text-gray-400 font-medium">{orders.length} total</span>
      </div>
      <div className="space-y-4">
        {entries.map(([status, count]) => {
          const colors = STATUS_COLORS[status] || { bar: '#9ca3af', bg: '#f3f4f6' };
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={status} className="group">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bar }} />
                  <span className="text-xs text-gray-600 font-medium">{status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{pct}%</span>
                  <span className="text-xs font-semibold text-gray-700 bg-gray-50 rounded-full px-2 py-0.5 min-w-[28px] text-center">
                    {count}
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: `linear-gradient(90deg, ${colors.bar}, ${colors.bar}dd)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
//  Products by Category — Donut chart
// ──────────────────────────────────────────────
export function RevenueByCategory({ orders, products }) {
  const catCount = {};
  products.forEach((p) => {
    const cat = p.category || 'Uncategorized';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });

  const entries = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
  const total = products.length || 1;

  let offset = 0;
  const segments = entries.map(([cat, count], i) => {
    const pct = (count / total) * 100;
    const segment = {
      cat, count, pct, offset,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    };
    offset += pct;
    return segment;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-800">Products by Category</h3>
        <span className="text-xs text-gray-400 font-medium">{total} items</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 36 36" className="w-28 h-28">
            {/* Background ring */}
            <circle r="15.915" cx="18" cy="18" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" />
            {segments.map((seg) => (
              <circle
                key={seg.cat}
                r="15.915"
                cx="18"
                cy="18"
                fill="transparent"
                stroke={seg.color}
                strokeWidth="3.5"
                strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                strokeDashoffset={`${-seg.offset}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))}
            <text x="18" y="17" textAnchor="middle" className="text-[7px] font-bold fill-gray-800">
              {total}
            </text>
            <text x="18" y="21.5" textAnchor="middle" className="text-[3.5px] fill-gray-400 font-medium">
              products
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.cat} className="flex items-center gap-2.5 text-xs group">
              <div className="w-3 h-3 rounded shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: seg.color }} />
              <span className="text-gray-600 flex-1 truncate">{seg.cat}</span>
              <span className="text-gray-800 font-semibold">{seg.count}</span>
              <span className="text-gray-400 text-[10px] w-8 text-right">{seg.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
//  Revenue Timeline — Vertical bar chart
// ──────────────────────────────────────────────
export function RevenueTimeline({ orders }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const daily = {};
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const day = o.createdAt.substring(0, 10);
    daily[day] = (daily[day] || 0) + parseFloat(o.totalAmount || 0);
  });

  const entries = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return null;

  const values = entries.map(([, v]) => v);
  const max = Math.max(...values, 1);
  const totalRevenue = values.reduce((s, v) => s + v, 0);
  const avgRevenue = totalRevenue / values.length;

  // Generate Y-axis ticks
  const yTicks = [];
  const step = max > 10000 ? 5000 : max > 5000 ? 2000 : max > 1000 ? 500 : 100;
  for (let t = 0; t <= max; t += step) {
    yTicks.push(t);
  }
  if (yTicks[yTicks.length - 1] < max) {
    yTicks.push(Math.ceil(max / step) * step);
  }
  const chartMax = yTicks[yTicks.length - 1] || max;

  const formatCurrency = (val) => {
    if (val >= 10000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toFixed(0)}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Revenue by Date</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] text-gray-400">Daily</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[1.5px] bg-amber-400 rounded" />
            <span className="text-[10px] text-gray-400">Avg</span>
          </div>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
        <span className="text-xs text-gray-400">total &middot; avg {formatCurrency(avgRevenue)}/day</span>
      </div>

      {/* Chart area */}
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 pb-6 shrink-0" style={{ height: 200 }}>
          {[...yTicks].reverse().map((t, i) => (
            <span key={i} className="text-[9px] text-gray-300 font-medium text-right w-8 leading-none">
              {formatCurrency(t)}
            </span>
          ))}
        </div>

        {/* Bars area - scrollable */}
        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ height: 200, minWidth: Math.max(entries.length * 40, 300) }}>
            {/* Grid lines */}
            {yTicks.map((t, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                style={{ bottom: `${(t / chartMax) * 100}%` }}
              />
            ))}
            {/* Average line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-amber-300 z-10"
              style={{ bottom: `${(avgRevenue / chartMax) * 100}%` }}
            />

            {/* Bars */}
            <div className="relative flex items-end h-full gap-1 px-1">
              {entries.map(([day, revenue], i) => {
                const barHeight = Math.max((revenue / chartMax) * 100, 2);
                const isHovered = hoveredIdx === i;

                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center justify-end relative"
                    style={{ height: '100%', minWidth: 28 }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 bg-gray-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                        <div className="font-semibold">₹{revenue.toFixed(0)}</div>
                        <div className="text-gray-300 text-[9px]">{day}</div>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-900 rotate-45" />
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      className="w-full rounded-t-md transition-all duration-300 cursor-pointer relative overflow-hidden"
                      style={{
                        height: `${barHeight}%`,
                        minHeight: 4,
                        maxWidth: 32,
                        background: isHovered
                          ? 'linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)'
                          : 'linear-gradient(180deg, #a5b4fc 0%, #6366f1 100%)',
                        boxShadow: isHovered ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                        transform: isHovered ? 'scaleX(1.15)' : 'scaleX(1)',
                      }}
                    >
                      {/* Shine effect */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                        }}
                      />
                    </div>

                    {/* X-axis label */}
                    <span className={`text-[9px] mt-1.5 truncate w-full text-center transition-colors ${isHovered ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
                      {day.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
