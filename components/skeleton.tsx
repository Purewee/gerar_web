export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

export function ProductSkeleton() {
  return (
    <div className="shrink-0 w-44 sm:w-48 md:w-56 lg:w-64">
      <div className="border border-gray-200 rounded-lg overflow-hidden h-full bg-white">
        {/* Image skeleton */}
        <div className="relative bg-gray-200 w-full" style={{ aspectRatio: '4/3' }}>
          <Skeleton className="w-full h-full" />
        </div>
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductSliderSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 lg:gap-6 pb-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="text-center space-y-3">
        <Skeleton className="w-16 h-16 mx-auto rounded-full" />
        <Skeleton className="h-5 w-24 mx-auto" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

export function AddressCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };
  
  return (
    <div
      className={`animate-spin rounded-full border-primary/20 border-t-primary ${sizeClasses[size]} ${className}`}
    />
  );
}
