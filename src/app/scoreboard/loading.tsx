import { Medal } from "lucide-react";

export default function ScoreboardLoading() {
  return (
    <main className="min-h-screen bg-[#fffcf5]">
      <div className="container mx-auto px-4 py-12 md:px-12 animate-pulse">
        {/* Title skeleton */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="flex items-center justify-center space-x-3 text-[#8B4513]">
            <Medal className="w-8 h-8 opacity-40 animate-spin" />
            <div className="h-9 w-64 bg-[#8B4513]/20 rounded-lg"></div>
            <Medal className="w-8 h-8 opacity-40 animate-spin" />
          </div>
          <div className="h-4 w-40 bg-gray-200 rounded-full"></div>
        </div>

        {/* Mobile View Skeleton */}
        <div className="md:hidden space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-300"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-12 bg-gray-100 rounded ml-auto"></div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-lg w-full"></div>
            ))}
          </div>
        </div>

        {/* Desktop View Skeleton */}
        <div className="hidden md:block overflow-hidden rounded-lg bg-white border border-gray-200 shadow-md">
          <div className="bg-[#8B4513] px-6 py-4 flex justify-between items-center">
            <div className="h-5 w-40 bg-white/30 rounded"></div>
            <div className="flex gap-16">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-24 bg-white/30 rounded"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-100 p-2">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="px-6 py-4 flex justify-between items-center">
                <div className="h-5 w-48 bg-gray-200 rounded"></div>
                <div className="flex gap-20">
                  {[1, 2, 3].map((col) => (
                    <div key={col} className="h-5 w-16 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
