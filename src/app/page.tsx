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

export const metadata = {
  title: "Maerika 2K26 - കലായുഗ ഭാവുകം",
  description: "പുതിയൊരു കാലത്തിന്റേയും മാറ്റത്തിന്റേയും തുടക്കത്തിൽ നൽകുന്ന നല്ല പ്രതീക്ഷകൾ. കലയുടെയും സംസ്കാരത്തിന്റെയും രംഗത്ത് പുതിയൊരു വസന്തമോ അല്ലെങ്കിൽ ക്രിയാത്മകമായ മാറ്റമോ ഉണ്ടാകണമെന്ന ആശ.",
};

export default async function HomePage() {
  const { teams, live } = await getHomeData();

  return <HomeRealtime teams={teams} liveScores={live} />;
}
