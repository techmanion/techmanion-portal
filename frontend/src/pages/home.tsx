import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Loading } from "../components/atoms";
import {
  ActivityFeed,
  PageHeader,
  QuickActionsPanel,
  UpcomingItemsPanel,
} from "../components/organisms";
import { getHomeData } from "../lib/api/home";
import type { HomeData } from "../types";

export function HomePage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getHomeData()
      .then(setData)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title={`Hi, ${firstName}`}
        description="Here's what's happening across your organization."
      />

      <QuickActionsPanel />

      {error && <div className="mb-6 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      {!data && !error ? (
        <div className="grid min-h-64 place-items-center">
          <Loading />
        </div>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingItemsPanel
            title="Needs Attention"
            accent="tertiary"
            items={data.needsAttention}
            empty="Nothing needs your attention right now."
          />
          <UpcomingItemsPanel title="Upcoming" items={data.upcoming} empty="No upcoming events." />
          <div className="lg:col-span-2">
            <ActivityFeed activities={data.recentActivity} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
