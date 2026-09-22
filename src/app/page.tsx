import { getLiveScores, getTeams } from "@/lib/data";
import { HomeRealtime } from "@/components/home-realtime";

async function getHomeData() {
  const [teams, live] = await Promise.all([
    getTeams(),
    getLiveScores(),
  ]);

  const scoreMap = new Map(live.map((item) => [item.team_id, item.total_points]));
  const sorted = [...teams].sort(
    (a, b) =>
      (scoreMap.get(b.id) ?? b.total_points) -
      (scoreMap.get(a.id) ?? a.total_points),
  );

  return { teams: sorted, live: scoreMap };
}

export default async function HomePage() {
  const { teams, live } = await getHomeData();

  return <HomeRealtime teams={teams} liveScores={live} />;
}
