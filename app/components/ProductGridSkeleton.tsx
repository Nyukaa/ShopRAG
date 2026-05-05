// app/components/ProductGridSkeleton.tsx
export function ProductGridSkeleton() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-[#E8E0D8] overflow-hidden bg-white dark:bg-zinc-900"
        >
          <div className="h-52 bg-[#F0EBE3] dark:bg-zinc-800 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-2.5 w-16 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 w-full bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-5 w-16 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
