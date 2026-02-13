/**
 * Work Order List Skeleton
 *
 * Loading state shown while work orders are being fetched
 * Shows animated skeleton cards for better perceived performance
 */

export function WorkOrderListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Section 1 - Skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Section 2 - Skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
      </div>

      {/* Location */}
      <div className="flex items-center mb-2">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>

      {/* Date */}
      <div className="flex items-center mb-3">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
