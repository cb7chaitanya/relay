export default function RestoringSkeleton() {
  return (
    <div className="h-full bg-gray-50 px-4 py-6" aria-busy="true" aria-label="Loading conversation">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex justify-end">
          <div className="h-10 w-48 animate-pulse rounded-2xl bg-gray-200" />
        </div>
        <div className="flex justify-start">
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-gray-200" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-56 animate-pulse rounded-2xl bg-gray-200" />
        </div>
        <div className="flex justify-start">
          <div className="h-20 w-72 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
