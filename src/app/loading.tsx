export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative w-14 h-14">
        {/* Animated outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[#8B4513]/20 border-t-[#8B4513] animate-spin"></div>
        {/* Inner pulsing dot */}
        <div className="absolute inset-3 rounded-full bg-[#FACC15] animate-pulse"></div>
      </div>
      <p className="text-xs uppercase tracking-widest text-[#8B4513]/70 font-medium">
        Loading...
      </p>
    </div>
  );
}
