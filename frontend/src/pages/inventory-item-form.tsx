import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, Textarea } from "../components/atoms";
import { FormField, FormSection } from "../components/molecules";
import { FormPage } from "../components/organisms";
import {
  createInventoryItem,
  getInventoryItem,
  updateInventoryItem,
} from "../lib/api/inventory";
import { label } from "../lib/format";
import { INVENTORY_CATEGORIES, INVENTORY_CONDITIONS } from "../lib/options";
import { useToast } from "../toast";
import type {
  InventoryCategory,
  InventoryCondition,
  InventoryItemPayload,
} from "../types";

const emptyItem: InventoryItemPayload = {
  name: "",
  category: "OTHER",
  condition: "GOOD",
  serialNumber: null,
  location: "Stockroom",
  notes: null,
  purchasedOn: null,
  warrantyUntil: null,
  status: "AVAILABLE",
};

export function InventoryItemFormPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(itemId);
  const [form, setForm] = useState<InventoryItemPayload>(emptyItem);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assetTag, setAssetTag] = useState("");

  useEffect(() => {
    if (!itemId) return;
    getInventoryItem(itemId)
      .then((item) => {
        setAssetTag(item.assetTag);
        setForm({
          name: item.name,
          category: item.category,
          condition: item.condition,
          serialNumber: item.serialNumber,
          location: item.location,
          notes: item.notes,
          purchasedOn: item.purchasedOn?.slice(0, 10) ?? null,
          warrantyUntil: item.warrantyUntil?.slice(0, 10) ?? null,
        });
      })
      .catch((reason: Error) => setError(reason.message));
  }, [itemId]);

  const title = useMemo(() => (isEdit ? "Edit item" : "Add item"), [isEdit]);
  const cancelTo = isEdit ? `/inventory/items/${itemId}` : "/inventory?tab=items";

  function set<K extends keyof InventoryItemPayload>(key: K, value: InventoryItemPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload: InventoryItemPayload = {
        ...form,
        serialNumber: form.serialNumber?.trim() || null,
        location: form.location?.trim() || null,
        notes: form.notes?.trim() || null,
        purchasedOn: form.purchasedOn || null,
        warrantyUntil: form.warrantyUntil || null,
      };
      if (isEdit) {
        await updateInventoryItem(itemId!, payload);
        toast.success("Item updated.");
        navigate(cancelTo);
      } else {
        const saved = await createInventoryItem({ ...payload, status: "AVAILABLE" });
        toast.success(`Added ${saved.assetTag}.`);
        navigate(`/inventory/items/${saved.id}`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Item could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={
        isEdit
          ? ["Inventory", assetTag || "Item", "Edit"]
          : ["Inventory", "New item"]
      }
      title={title}
      description={
        isEdit
          ? "Update identity and placement details. Status changes use quick actions on the item page."
          : "Add a single unit to the stockroom. Prefer Receive stock when adding many identical items."
      }
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Add item"}
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Identity" bordered={false}>
        <FormField label="Name" className="md:col-span-2">
          <Input
            required
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="MacBook Pro 14"
          />
        </FormField>
        <FormField label="Category">
          <Select
            value={form.category}
            onChange={(event) => set("category", event.target.value as InventoryCategory)}
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
            value={form.condition}
            onChange={(event) => set("condition", event.target.value as InventoryCondition)}
          >
            {INVENTORY_CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
      </FormSection>

      <FormSection heading="Specs">
        <FormField label="Serial number" className="md:col-span-2">
          <Input
            value={form.serialNumber ?? ""}
            onChange={(event) => set("serialNumber", event.target.value)}
            placeholder="Optional"
          />
        </FormField>
        <FormField label="Purchased on">
          <Input
            type="date"
            value={form.purchasedOn ?? ""}
            onChange={(event) => set("purchasedOn", event.target.value || null)}
          />
        </FormField>
        <FormField label="Warranty until">
          <Input
            type="date"
            value={form.warrantyUntil ?? ""}
            onChange={(event) => set("warrantyUntil", event.target.value || null)}
          />
        </FormField>
      </FormSection>

      <FormSection heading="Placement">
        <FormField label="Location" className="md:col-span-2">
          <Input
            value={form.location ?? ""}
            onChange={(event) => set("location", event.target.value)}
            placeholder="Stockroom, Desk 4, Conference room…"
          />
        </FormField>
      </FormSection>

      <FormSection heading="Notes">
        <FormField label="Notes" className="md:col-span-2">
          <Textarea
            rows={4}
            value={form.notes ?? ""}
            onChange={(event) => set("notes", event.target.value)}
          />
        </FormField>
      </FormSection>
    </FormPage>
  );
}
