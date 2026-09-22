import { ParticipantSearch } from "@/components/participant-search";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Search, QrCode, Users, Trophy, Sparkles } from "lucide-react";

export default function ParticipantSearchPage() {
  return (
    <div className="min-h-screen bg-[#fffcf5] dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative bg-[#fffcf5] dark:bg-gray-900 pb-20 pt-10 md:pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 dark:opacity-5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Find Participants & Results</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
              Participant <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Lookup</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Search for any festival participant by name or chest number to view their profile, results, and performance stats.
            </p>
          </div>

          <div className="mt-12">
            <ParticipantSearch />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Search</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Instantly find participants by typing their name or chest number. Our smart search handles partial matches effortlessly.
            </CardDescription>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Scan</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Use the built-in QR scanner to instantly pull up a participant's profile from their ID badge. No typing required.
            </CardDescription>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Trophy className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Stats</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              View real-time point totals, grade breakdowns, and performance history for every participant in the fest.
            </CardDescription>
          </Card>
        </div>
      </div>
    </div>
  );
}
