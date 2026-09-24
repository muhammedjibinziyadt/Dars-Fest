import type { Metadata } from "next";
import { getTopScorersData } from "@/lib/top-scorer-service";
import { TopScorersRealtime } from "@/components/top-scorers-realtime";

export const metadata: Metadata = {
  title: "Top Scorers & Champions | Maerika 2K26 Dars Fest",
  description:
    "Check live top scorers and champion students in individual, group, and overall categories for Maerika 2K26 Dars Fest.",
};

export const revalidate = 15;

export default async function TopScorersPage() {
  const data = await getTopScorersData();

  return (
    <main className="min-h-screen bg-[#fffcf5] py-8 sm:py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <TopScorersRealtime data={data} showTitle={true} />
      </div>
    </main>
  );
}
