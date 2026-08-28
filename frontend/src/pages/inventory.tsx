import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Input, Loading, Select, Textarea } from "../components/atoms";
import {
  EmptyState,
  FilterSelect,
  FormDialog,
  FormField,
  SearchInput,
} from "../components/molecules";
import {
  FilterToolbar,
  InventoryItemGrid,
  InventoryShelfPanel,
  InventoryTable,
  PageHeader,
} from "../components/organisms";
import { useClearSearchParams, useSearchParamState } from "../hooks/useSearchParamState";
import {
  getInventoryOverview,
  listInventoryItems,
  receiveInventoryItems,
} from "../lib/api/inventory";
import { label } from "../lib/format";
import { formatAssetRange } from "../lib/inventory";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_CONDITIONS,
  INVENTORY_STATUSES,
} from "../lib/options";
import { useToast } from "../toast";
import type {
  InventoryCategory,
  InventoryCondition,
  InventoryItem,
  InventoryOverview,
  InventoryReceivePayload,
} from "../types";

const tabs = ["Shelf", "Items"] as const;
type InventoryTab = (typeof tabs)[number];

function resolveTab(value: string): InventoryTab {
  return tabs.find((tab) => tab.toLowerCase() === value) ?? "Shelf";
}

const emptyReceive: InventoryReceivePayload = {
  name: "",
  category: "MOUSE",
  condition: "NEW",
  quantity: 1,
  location: "Stockroom",
  serialNumber: null,
  notes: null,
  purchasedOn: null,
  warrantyUntil: null,
};

export function InventoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tabParam, setTabParam] = useSearchParamState("tab", "shelf");
  const activeTab = resolveTab(tabParam);
  const [search, setSearch] = useSearchParamState("search");
  const [category, setCategory] = useSearchParamState("category");
  const [status, setStatus] = useSearchParamState("status");
  const [condition, setCondition] = useSearchParamState("condition");
  const [view, setView] = useSearchParamState("view", "grid");
  const [receiveParam, setReceiveParam] = useSearchParamState("receive");
  const clearSearchParams = useClearSearchParams();

  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveForm, setReceiveForm] = useState<InventoryReceivePayload>(emptyReceive);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveError, setReceiveError] = useState("");

  useEffect(() => {
    if (receiveParam === "1") {
      setReceiveOpen(true);
      setReceiveParam("");
    }
  }, [receiveParam, setReceiveParam]);

  function loadOverview() {
    return getInventoryOverview().then(setOverview);
  }

  function loadItems() {
    return listInventoryItems({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
      condition: condition || undefined,
    }).then(setItems);
  }

  useEffect(() => {
    getInventoryOverview().then(setOverview).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const request = activeTab === "Shelf" ? loadOverview() : loadItems();
    request
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional URL-driven reload
  }, [activeTab, search, category, status, condition]);

  const hasActiveFilters = Boolean(search || category || status || condition);

  function openReceive() {
    setReceiveForm(emptyReceive);
    setReceiveError("");
    setReceiveOpen(true);
  }

  async function submitReceive(event: FormEvent) {
    event.preventDefault();
    setReceiveSubmitting(true);
    setReceiveError("");
    try {
      const payload: InventoryReceivePayload = {
        ...receiveForm,
        location: receiveForm.location?.trim() || null,
        serialNumber:
          receiveForm.quantity === 1 ? receiveForm.serialNumber?.trim() || null : null,
        notes: receiveForm.notes?.trim() || null,
        purchasedOn: receiveForm.purchasedOn || null,
        warrantyUntil: receiveForm.warrantyUntil || null,
      };
      const created = await receiveInventoryItems(payload);
      setReceiveOpen(false);
      toast.success(
        `Received ${created.length}× ${payload.name} · ${formatAssetRange(created)}`,
      );
      setTabParam("items");
      await Promise.all([loadOverview(), loadItems()]);
    } catch (reason) {
      setReceiveError(reason instanceof Error ? reason.message : "Could not receive stock.");
    } finally {
      setReceiveSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1450px] px-6 py-7">
      <PageHeader
        className="mb-8 px-1"
        title="Inventory"
        description="Stockroom for office gear — laptops, peripherals, furniture, and more."
        meta={
          overview ? (
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
              {overview.total} items
            </span>
          ) : undefined
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openReceive}>
              <Icon className="text-[18px]">package_2</Icon>
              Receive stock
            </Button>
            <Link
              to="/inventory/new"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-container-high px-4 text-sm font-medium text-on-surface transition hover:bg-surface-container-highest"
            >
              <Icon className="text-[18px]">add</Icon>
              Add item
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-outline-variant/40">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTabParam(tab.toLowerCase())}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loading />
        </div>
      ) : activeTab === "Shelf" && overview ? (
        <InventoryShelfPanel
          overview={overview}
          onCategoryClick={(value) => {
            setCategory(value);
            setTabParam("items");
          }}
          onAttentionClick={(itemId) => navigate(`/inventory/items/${itemId}`)}
        />
      ) : activeTab === "Items" ? (
        <section className="surface-panel overflow-hidden">
          <div className="bg-surface-container-high/30 px-6 py-4">
            <FilterToolbar>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search name, tag, serial, location…"
                className="lg:max-w-[360px]"
              />
              <FilterSelect
                value={category}
                onChange={setCategory}
                labelText="Category"
                placeholder="Filter by category"
              >
                {INVENTORY_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={status}
                onChange={setStatus}
                labelText="Status"
                placeholder="Filter by status"
              >
                {INVENTORY_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={condition}
                onChange={setCondition}
                labelText="Condition"
                placeholder="Filter by condition"
              >
                {INVENTORY_CONDITIONS.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </FilterSelect>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex rounded-full bg-surface-container-highest p-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`grid size-8 place-items-center rounded-full transition ${
                      view !== "table"
                        ? "bg-surface-bright text-primary"
                        : "text-on-surface-variant"
                    }`}
                    aria-label="Grid view"
                  >
                    <Icon className="text-[18px]">grid_view</Icon>
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={`grid size-8 place-items-center rounded-full transition ${
                      view === "table"
                        ? "bg-surface-bright text-primary"
                        : "text-on-surface-variant"
                    }`}
                    aria-label="Table view"
                  >
                    <Icon className="text-[18px]">table_rows</Icon>
                  </button>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      clearSearchParams(["search", "category", "status", "condition"])
                    }
                  >
                    <Icon className="text-[16px]">filter_alt_off</Icon>
                    Clear filters
                  </Button>
                )}
              </div>
            </FilterToolbar>
          </div>

          {!items.length ? (
            <EmptyState>
              {hasActiveFilters
                ? "No items match these filters."
                : "Stockroom is empty. Receive stock to start tracking gear."}
            </EmptyState>
          ) : view === "table" ? (
            <InventoryTable
              items={items}
              onRowClick={(item) => navigate(`/inventory/items/${item.id}`)}
            />
          ) : (
            <InventoryItemGrid
              items={items}
              onItemClick={(item) => navigate(`/inventory/items/${item.id}`)}
            />
          )}

          {items.length > 0 && (
            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-highest/20 px-6 py-3.5 text-sm text-on-surface-variant">
              <span>
                Showing {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </footer>
          )}
        </section>
      ) : null}

      <FormDialog
        open={receiveOpen}
        title="Receive stock"
        description="Add one or many identical units to the stockroom in one step."
        icon="package_2"
        submitLabel="Receive"
        submittingLabel="Receiving…"
        submitting={receiveSubmitting}
        error={receiveError}
        width="lg"
        onClose={() => !receiveSubmitting && setReceiveOpen(false)}
        onSubmit={submitReceive}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" className="md:col-span-2">
            <Input
              required
              value={receiveForm.name}
              onChange={(event) =>
                setReceiveForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Wireless mouse"
            />
          </FormField>
          <FormField label="Category">
            <Select
              value={receiveForm.category}
              onChange={(event) =>
                setReceiveForm((current) => ({
                  ...current,
                  category: event.target.value as InventoryCategory,
                }))
              }
            >
              {INVENTORY_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Condition">
            <Select
              value={receiveForm.condition}
              onChange={(event) =>
                setReceiveForm((current) => ({
                  ...current,
                  condition: event.target.value as InventoryCondition,
                }))
              }
            >
              {INVENTORY_CONDITIONS.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Quantity" hint="1–50 units">
            <Input
              type="number"
              min={1}
              max={50}
              required
              value={receiveForm.quantity}
              onChange={(event) =>
                setReceiveForm((current) => ({
                  ...current,
                  quantity: Number(event.target.value) || 1,
                }))
              }
            />
          </FormField>
          <FormField label="Location">
            <Input
              value={receiveForm.location ?? ""}
              onChange={(event) =>
                setReceiveForm((current) => ({ ...current, location: event.target.value }))
              }
              placeholder="Stockroom"
            />
          </FormField>
          {receiveForm.quantity === 1 && (
            <FormField label="Serial number" className="md:col-span-2">
              <Input
                value={receiveForm.serialNumber ?? ""}
                onChange={(event) =>
                  setReceiveForm((current) => ({
                    ...current,
                    serialNumber: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </FormField>
          )}
          <FormField label="Purchased on">
            <Input
              type="date"
              value={receiveForm.purchasedOn ?? ""}
              onChange={(event) =>
                setReceiveForm((current) => ({
                  ...current,
                  purchasedOn: event.target.value || null,
                }))
              }
            />
          </FormField>
          <FormField label="Warranty until">
            <Input
              type="date"
              value={receiveForm.warrantyUntil ?? ""}
              onChange={(event) =>
                setReceiveForm((current) => ({
                  ...current,
                  warrantyUntil: event.target.value || null,
                }))
              }
            />
          </FormField>
          <FormField label="Notes" className="md:col-span-2">
            <Textarea
              rows={3}
              value={receiveForm.notes ?? ""}
              onChange={(event) =>
                setReceiveForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </FormField>
        </div>
      </FormDialog>
    </div>
  );
}
