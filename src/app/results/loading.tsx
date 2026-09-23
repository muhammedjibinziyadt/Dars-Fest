import { Trophy } from "lucide-react";

export default function ResultsLoading() {
  return (
    <main className="min-h-screen bg-[#fffcf5] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col items-center mb-8 space-y-3">
          <div className="flex items-center space-x-3 text-[#8B4513]">
            <Trophy className="w-8 h-8 opacity-40 animate-bounce" />
            <div className="h-9 w-60 bg-[#8B4513]/20 rounded-lg"></div>
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded-full"></div>
        </div>

        {/* Search & Filter Bar Skeleton */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-2xl mx-auto flex gap-3">
          <div className="h-10 bg-gray-100 rounded-xl flex-1"></div>
          <div className="h-10 w-28 bg-gray-100 rounded-xl"></div>
        </div>

        {/* Programs Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/3 bg-gray-100 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-[#8B4513]/10 rounded-full"></div>
              </div>

              {/* Winners podium skeleton */}
              <div className="space-y-2.5 pt-2">
                {[1, 2, 3].map((pos) => (
                  <div
                    key={pos}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-100"></div>
                      <div className="h-4 w-28 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
