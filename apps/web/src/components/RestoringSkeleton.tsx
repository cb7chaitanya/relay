export default function RestoringSkeleton() {
  return (
    <div
      className="h-full px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-label="Loading conversation"
    >
      <div className="mx-auto max-w-[720px] space-y-5">
        <div className="flex justify-end">
          <div className="h-11 w-44 animate-pulse rounded-[20px] rounded-br-md bg-gray-100" />
        </div>
        <div className="flex justify-start">
          <div className="h-[72px] w-72 animate-pulse rounded-[20px] rounded-bl-md bg-gray-100" />
        </div>
        <div className="flex justify-end">
          <div className="h-11 w-52 animate-pulse rounded-[20px] rounded-br-md bg-gray-100" />
        </div>
        <div className="flex justify-start">
          <div className="h-[88px] w-80 animate-pulse rounded-[20px] rounded-bl-md bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
