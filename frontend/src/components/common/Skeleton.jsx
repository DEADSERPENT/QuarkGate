export function SkeletonBlock({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
          <SkeletonBlock className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <SkeletonBlock className="h-3 w-20 mb-2" />
            <SkeletonBlock className="h-7 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <SkeletonBlock className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <SkeletonBlock className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-start mb-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-5 w-16" />
          </div>
          <SkeletonBlock className="h-3 w-full mb-2" />
          <SkeletonBlock className="h-3 w-3/4 mb-3" />
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-5 w-20 rounded" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetailCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <SkeletonBlock className="h-3 w-16 mb-2" />
            <SkeletonBlock className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
