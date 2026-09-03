import { HouseMembersSkeleton } from "@/components/houses/HouseMembers";

/** Skeleton mirroring the house page: hero band, facts grid, members grid. */
export default function HouseLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading house…
      </p>

      <div aria-hidden className="bg-gradient-to-br from-night-800 to-night-950">
        <div className="container-page py-12 sm:py-16">
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="h-[154px] w-32 shrink-0 animate-pulse rounded-[40%_40%_50%_50%] bg-white/10" />
            <div className="w-full max-w-2xl space-y-3">
              <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-12 w-72 max-w-full animate-pulse rounded bg-white/10" />
              <div className="h-7 w-96 max-w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-56 animate-pulse rounded bg-white/10" />
              <div className="h-16 w-full animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="container-page py-12">
        <div className="h-9 w-52 animate-pulse rounded bg-white/10" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="h-3 w-16 rounded bg-white/10" />
              <div className="mt-3 h-5 w-32 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="container-page pb-16">
        <div aria-hidden className="h-9 w-40 animate-pulse rounded bg-white/10" />
        <HouseMembersSkeleton />
      </div>
    </div>
  );
}
