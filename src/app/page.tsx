import { getLiveScores, getTeams } from "@/lib/data";
import { HomeRealtime } from "@/components/home-realtime";

export const revalidate = 60;

async function getHomeData() {
  try {
    const fetchPromise = Promise.all([getTeams(), getLiveScores()]);
    const timeoutPromise = new Promise<[any[], any[]]>((resolve) =>
      setTimeout(() => resolve([[], []]), 3500)
    );

    const [teams, live] = await Promise.race([fetchPromise, timeoutPromise]);

    const scoreMap = new Map(live.map((item) => [item.team_id, item.total_points]));
    const sorted = [...teams].sort(
      (a, b) =>
        (scoreMap.get(b.id) ?? b.total_points) -
        (scoreMap.get(a.id) ?? a.total_points),
    );

    return { teams: sorted, live: scoreMap };
  } catch (error) {
    console.error("Error loading home data:", error);
    return { teams: [], live: new Map() };
  }
}

export default async function HomePage() {
  const { teams, live } = await getHomeData();

  return <HomeRealtime teams={teams} liveScores={live} />;
}
