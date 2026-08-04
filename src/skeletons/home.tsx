import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-6 py-24">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
