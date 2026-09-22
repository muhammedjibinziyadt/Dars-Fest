import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#3b0764,_#020617_55%)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-slate-800/50 p-6 border border-white/10">
            <WifiOff className="h-16 w-16 text-amber-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="text-white/70">
            It looks like you've lost your internet connection. Please check your network settings and try again.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Link href="/" className="w-full">
            <Button
              variant="secondary"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/50">
            Some features may be available offline if you've visited them before.
          </p>
        </div>
      </div>
    </div>
  );
}

