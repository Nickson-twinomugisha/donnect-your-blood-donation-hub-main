import { Skeleton } from "@/components/ui/skeleton";

/** Fullscreen loading fallback used by React.lazy Suspense boundaries */
export default function PageLoader() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
