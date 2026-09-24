export default function TopScorersLoading() {
  return (
    <main className="min-h-screen bg-[#fffcf5] py-8 sm:py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="text-center space-y-3">
          <div className="h-6 w-44 bg-amber-200/50 rounded-full mx-auto" />
          <div className="h-10 w-72 sm:w-96 bg-amber-900/10 rounded-xl mx-auto" />
          <div className="h-4 w-60 sm:w-80 bg-stone-300/60 rounded-md mx-auto" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-11 w-64 bg-stone-200/70 rounded-2xl" />
          <div className="h-11 w-72 bg-stone-200/70 rounded-2xl" />
        </div>

        {/* Podium Skeleton (Top 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* 2nd Place */}
          <div className="h-80 bg-white/70 border border-stone-200/70 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm" />
          {/* 1st Place */}
          <div className="h-96 bg-white/90 border-2 border-amber-300/60 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 shadow-md md:-translate-y-4" />
          {/* 3rd Place */}
          <div className="h-80 bg-white/70 border border-stone-200/70 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-white/60 border border-stone-200/50 rounded-2xl"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
