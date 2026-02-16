const STATUS_COLORS = {
  PLACED: '#3b82f6',
  CONFIRMED: '#6366f1',
  SHIPPED: '#f59e0b',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
  PENDING: '#f59e0b',
  PROCESSING: '#8b5cf6',
};

const CATEGORY_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6',
];

export function OrderStatusChart({ orders }) {
  const statusCounts = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Status Distribution</h3>
      <div className="space-y-3">
        {entries.map(([status, count]) => (
          <div key={status}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 font-medium">{status}</span>
              <span className="text-gray-500">{count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: STATUS_COLORS[status] || '#9ca3af',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueByCategory({ orders, products }) {
  const productMap = {};
  products.forEach((p) => {
    productMap[p.id] = p;
  });

  const categoryRevenue = {};
  orders.forEach((o) => {
    const amount = parseFloat(o.totalAmount || 0);
    const category = 'Orders';
    categoryRevenue[category] = (categoryRevenue[category] || 0) + amount;
  });

  // Group products by category for a product-category breakdown
  const catCount = {};
  products.forEach((p) => {
    const cat = p.category || 'Uncategorized';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });

  const entries = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
  const total = products.length || 1;

  // Build donut chart segments
  let offset = 0;
  const segments = entries.map(([cat, count], i) => {
    const pct = (count / total) * 100;
    const segment = { cat, count, pct, offset, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] };
    offset += pct;
    return segment;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Products by Category</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 36 36" className="w-28 h-28 shrink-0">
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
            />
          ))}
          <text x="18" y="18.5" textAnchor="middle" className="text-[6px] font-bold fill-gray-700">
            {total}
          </text>
          <text x="18" y="22" textAnchor="middle" className="text-[3px] fill-gray-400">
            items
          </text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {segments.map((seg) => (
            <div key={seg.cat} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-gray-600 flex-1">{seg.cat}</span>
              <span className="text-gray-500 font-medium">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RevenueTimeline({ orders }) {
  const daily = {};
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const day = o.createdAt.substring(0, 10);
    daily[day] = (daily[day] || 0) + parseFloat(o.totalAmount || 0);
  });

  const entries = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return null;

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Date</h3>
      <div className="flex items-end gap-1.5 h-32">
        {entries.map(([day, revenue]) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-500 font-medium">
              ${revenue.toFixed(0)}
            </span>
            <div
              className="w-full bg-indigo-500 rounded-t transition-all duration-500 min-h-[4px]"
              style={{ height: `${(revenue / max) * 100}%` }}
            />
            <span className="text-[9px] text-gray-400 truncate w-full text-center">
              {day.substring(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
