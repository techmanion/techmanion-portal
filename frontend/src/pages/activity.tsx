import { useEffect, useState } from "react";
import { Button, Icon, Input, Loading } from "../components/atoms";
import { FilterSelect } from "../components/molecules";
import { ActivityTable, FilterToolbar, PageHeader } from "../components/organisms";
import { useClearSearchParams, useSearchParamState, useSearchParamsUpdater } from "../hooks/useSearchParamState";
import { listActivity } from "../lib/api/activity";
import { listUsers } from "../lib/api/users";
import { label } from "../lib/format";
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } from "../lib/options";
import type { Activity, User } from "../types";

const PAGE_SIZE = 25;

export function ActivityPage() {
  const [entityType] = useSearchParamState("module");
  const [action] = useSearchParamState("action");
  const [userId] = useSearchParamState("user");
  const [dateFrom] = useSearchParamState("from");
  const [dateTo] = useSearchParamState("to");
  const [pageParam, setPageParam] = useSearchParamState("page", "1");
  const page = Number(pageParam) || 1;
  const clearSearchParams = useClearSearchParams();
  const updateSearchParams = useSearchParamsUpdater();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listUsers().then(setUsers).catch(() => undefined);
  }, []);

  useEffect(() => {
    function load() {
      setLoading(true);
      setError("");
      listActivity({
        entityType: entityType || undefined,
        action: action || undefined,
        userId: userId ? Number(userId) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((result) => {
          setActivities(result.items);
          setTotal(result.total);
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }
    load();
  }, [entityType, action, userId, dateFrom, dateTo, page]);

  const hasActiveFilters = Boolean(entityType || action || userId || dateFrom || dateTo);
  function clearFilters() {
    clearSearchParams(["module", "action", "user", "from", "to", "page"]);
  }
  function setFilter(key: string, value: string) {
    updateSearchParams({ [key]: value, page: "1" });
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Activity"
        description="An immutable log of important actions taken across the portal."
      />

      <section className="surface-panel overflow-hidden">
        <div className="bg-surface-container-high/30 px-6 py-4">
          <FilterToolbar>
            <FilterSelect
              value={entityType}
              onChange={(value) => setFilter("module", value)}
              labelText="Module"
              placeholder="Filter by module"
            >
              {ACTIVITY_ENTITY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={action}
              onChange={(value) => setFilter("action", value)}
              labelText="Action"
              placeholder="Filter by action"
            >
              {ACTIVITY_ACTIONS.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </FilterSelect>
            {users.length > 0 && (
              <FilterSelect
                value={userId}
                onChange={(value) => setFilter("user", value)}
                labelText="User"
                placeholder="Filter by user"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </FilterSelect>
            )}
            <label className="flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm text-on-surface-variant">
              From
              <Input
                aria-label="From date"
                type="date"
                value={dateFrom}
                onChange={(event) => setFilter("from", event.target.value)}
                className="!h-7 !w-32 !border-0 !bg-transparent !p-0 text-on-surface"
              />
            </label>
            <label className="flex h-9 items-center gap-2 rounded-full bg-surface-container-highest px-4 text-sm text-on-surface-variant">
              To
              <Input
                aria-label="To date"
                type="date"
                value={dateTo}
                onChange={(event) => setFilter("to", event.target.value)}
                className="!h-7 !w-32 !border-0 !bg-transparent !p-0 text-on-surface"
              />
            </label>
            <div className="ml-auto flex items-center gap-1.5">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Icon className="text-[16px]">filter_alt_off</Icon>
                  Clear filters
                </Button>
              )}
            </div>
          </FilterToolbar>
        </div>

        {loading ? (
          <div className="grid min-h-40 place-items-center">
            <Loading />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-error">{error}</div>
        ) : (
          <ActivityTable activities={activities} />
        )}

        {!loading && !error && (
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
            <span>
              Showing {activities.length ? (page - 1) * PAGE_SIZE + 1 : 0}
              {"–"}
              {(page - 1) * PAGE_SIZE + activities.length} of {total} entries
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPageParam(String(page - 1))}
              >
                <Icon className="text-[16px]">chevron_left</Icon>
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPageParam(String(page + 1))}
              >
                Next
                <Icon className="text-[16px]">chevron_right</Icon>
              </Button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
