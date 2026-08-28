import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Icon, Input, Loading, Textarea } from "../components/atoms";
import { StatusChip } from "../components/atoms/Badge";
import { SectionHeading } from "../components/atoms/Typography";
import {
  Breadcrumb,
  ConfirmDialog,
  EmptyState,
  FormDialog,
  FormField,
} from "../components/molecules";
import {
  applyInventoryAction,
  deleteInventoryItem,
  getInventoryItem,
} from "../lib/api/inventory";
import { formatDate, label } from "../lib/format";
import {
  availableInventoryActions,
  inventoryActionIcon,
  inventoryActionLabel,
} from "../lib/inventory";
import { INVENTORY_CATEGORY_ICONS } from "../lib/options";
import { useToast } from "../toast";
import type { InventoryAction, InventoryItem } from "../types";

function relativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function InventoryItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [actionType, setActionType] = useState<InventoryAction | null>(null);
  const [actionLocation, setActionLocation] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  function load() {
    return getInventoryItem(itemId!)
      .then(setItem)
      .catch((reason: Error) => setError(reason.message));
  }

  useEffect(() => {
    load();
  }, [itemId]);

  function openAction(action: InventoryAction) {
    if (!item) return;
    setActionType(action);
    setActionLocation(action === "PLACE" ? item.location || "" : item.location || "Stockroom");
    setActionNote("");
    setActionError("");
  }

  async function submitAction(event: FormEvent) {
    event.preventDefault();
    if (!item || !actionType) return;
    setActionSubmitting(true);
    setActionError("");
    try {
      const updated = await applyInventoryAction(item.id, {
        action: actionType,
        location: actionLocation.trim() || null,
        note: actionNote.trim() || null,
      });
      setItem(updated);
      setActionType(null);
      toast.success(`${inventoryActionLabel(actionType)} · ${item.assetTag}`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function removeItem() {
    setConfirmDelete(false);
    try {
      await deleteInventoryItem(itemId!);
      toast.success("Item deleted.");
      navigate("/inventory?tab=items");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete item.");
    }
  }

  if (!item && !error) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loading />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="p-6">
        <EmptyState>{error}</EmptyState>
      </div>
    );
  }

  const actions = availableInventoryActions(item.status);

  return (
    <div className="mx-auto max-w-4xl px-6 py-7">
      <Breadcrumb to="/inventory" trail={["Inventory", item.assetTag]} />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-[20px] bg-surface-container-highest text-on-surface">
            <Icon className="text-[28px]">{INVENTORY_CATEGORY_ICONS[item.category]}</Icon>
          </span>
          <div>
            <h1 className="text-title font-semibold tracking-tight">{item.name}</h1>
            <p className="mt-1.5 font-mono text-sm text-on-surface-variant">{item.assetTag}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip value={item.status} />
              <StatusChip value={item.condition} />
              <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                {label(item.category)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              type="button"
              variant={action === "RETIRE" ? "danger" : "secondary"}
              size="sm"
              onClick={() => openAction(action)}
            >
              <Icon className="text-[16px]">{inventoryActionIcon(action)}</Icon>
              {inventoryActionLabel(action)}
            </Button>
          ))}
          <Link
            to={`/inventory/items/${item.id}/edit`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-container-highest px-3.5 text-xs font-medium text-on-surface ring-1 ring-outline-variant/40 transition hover:bg-surface-bright"
          >
            <Icon className="text-[16px]">edit</Icon>
            Edit
          </Link>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
            <Icon className="text-[16px]">delete</Icon>
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="space-y-6">
        <section className="surface-panel p-6">
          <SectionHeading className="mb-5">Overview</SectionHeading>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Location
              </dt>
              <dd className="mt-1.5 text-sm text-on-surface">{item.location || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Serial number
              </dt>
              <dd className="mt-1.5 text-sm text-on-surface">{item.serialNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Purchased on
              </dt>
              <dd className="mt-1.5 text-sm text-on-surface">{formatDate(item.purchasedOn ?? undefined)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Warranty until
              </dt>
              <dd className="mt-1.5 text-sm text-on-surface">
                {formatDate(item.warrantyUntil ?? undefined)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Notes
              </dt>
              <dd className="mt-1.5 whitespace-pre-wrap text-sm text-on-surface">
                {item.notes || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="surface-panel p-6">
          <SectionHeading className="mb-5">Lifecycle</SectionHeading>
          {item.events.length ? (
            <ol className="relative space-y-0 border-l border-outline-variant/40 pl-6">
              {item.events.map((event) => (
                <li key={event.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[1.55rem] top-1 size-2.5 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm font-semibold text-on-surface">
                      {label(event.eventType)}
                    </strong>
                    <span className="text-xs text-on-surface-variant">
                      {relativeTime(event.createdAt)}
                    </span>
                  </div>
                  {(event.fromStatus || event.toStatus) && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {[event.fromStatus, event.toStatus]
                        .filter(Boolean)
                        .map((value) => label(value!))
                        .join(" → ")}
                    </p>
                  )}
                  {event.location && (
                    <p className="mt-1 text-sm text-on-surface">{event.location}</p>
                  )}
                  {event.note && (
                    <p className="mt-1 text-sm text-on-surface-variant">{event.note}</p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState>No lifecycle events yet.</EmptyState>
          )}
        </section>
      </div>

      <FormDialog
        open={actionType !== null}
        title={actionType ? inventoryActionLabel(actionType) : "Action"}
        description={`${item.name} · ${item.assetTag}`}
        icon="sync_alt"
        submitLabel="Confirm"
        submitting={actionSubmitting}
        error={actionError}
        onClose={() => {
          if (!actionSubmitting) setActionType(null);
        }}
        onSubmit={submitAction}
      >
        {(actionType === "PLACE" || actionType === "RETURN" || actionType === "REPAIR") && (
          <FormField
            label="Location"
            hint={actionType === "PLACE" ? "Where is this item going?" : undefined}
          >
            <Input
              required={actionType === "PLACE"}
              value={actionLocation}
              onChange={(event) => setActionLocation(event.target.value)}
              placeholder={actionType === "PLACE" ? "Desk 4 / Conference room" : "Stockroom"}
            />
          </FormField>
        )}
        <FormField label="Note">
          <Textarea
            rows={3}
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this item?"
        description={`${item.name} (${item.assetTag}) will be permanently removed from the stockroom.`}
        confirmLabel="Delete item"
        onConfirm={removeItem}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
