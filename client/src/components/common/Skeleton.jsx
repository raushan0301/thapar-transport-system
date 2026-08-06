import React from 'react';

// Base shimmer block. Pass width/height via className (Tailwind) or style.
export const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton-shimmer rounded-md ${className}`} style={style} />
);

// Row of stat-card skeletons matching the dashboard KPI cards.
export const SkeletonStatCards = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <Skeleton className="w-12 h-12 rounded-xl mb-4" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

// Vertical list of row skeletons, e.g. "Recent Requests" panel.
export const SkeletonList = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
    <Skeleton className="h-6 w-40 mb-6" />
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full ml-4" />
        </div>
      ))}
    </div>
  </div>
);

// Table skeleton for list pages (My Requests, Pending Approvals, Audit Logs, etc).
export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex gap-6">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-6 py-4 border-b border-gray-100 flex gap-6 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" style={{ animationDelay: `${(r * cols + c) * 30}ms` }} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Detail-page skeleton: header block + a grid of labeled field skeletons.
export const SkeletonDetail = ({ fields = 8 }) => (
  <div>
    <Skeleton className="h-9 w-64 mb-3" />
    <Skeleton className="h-6 w-32 mb-8 rounded-full" />
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
