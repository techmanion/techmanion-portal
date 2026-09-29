import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Input, Select } from "../components/atoms";
import { EditableAvatar, FormDialog, FormField, FormSection, MoneyInput } from "../components/molecules";
import { FormPage } from "../components/organisms";
import { avatarSrc } from "../lib/api/client";
import { createEmployee, getEmployee, updateEmployee, uploadEmployeeAvatar } from "../lib/api/employees";
import { addDesignation, listDesignations } from "../lib/api/settings";
import { employeeTypeLabel, label } from "../lib/format";
import { COMPENSATION_TYPES, EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from "../lib/options";
import { useToast } from "../toast";
import type { Employee, EmployeePayload, NamedOption } from "../types";

const ADD_DESIGNATION_VALUE = "__add_designation__";

const emptyEmployee: EmployeePayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeType: "EMPLOYEE",
  status: "ACTIVE",
  compensationType: "FIXED",
  designationId: 0,
  joiningDate: new Date().toISOString().slice(0, 10),
  baseAmount: 0,
  currency: "PKR",
  commissionRate: null,
  commissionBasis: null,
};

export function EmployeeFormPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEdit = Boolean(employeeId);
  const [form, setForm] = useState<EmployeePayload>(emptyEmployee);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [designations, setDesignations] = useState<NamedOption[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addingDesignation, setAddingDesignation] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState("");
  const [savingDesignation, setSavingDesignation] = useState(false);
  const [designationError, setDesignationError] = useState("");
  const toast = useToast();

  function refreshDesignations() {
    return listDesignations().then(setDesignations);
  }

  useEffect(() => {
    refreshDesignations();
    if (employeeId) {
      getEmployee(employeeId).then((employee: Employee) => {
        setFullName(employee.fullName);
        setAvatarUrl(employee.avatarUrl ?? null);
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          employeeType: employee.employeeType,
          status: employee.status,
          compensationType: employee.compensationType,
          designationId: employee.designationId,
          joiningDate: employee.joiningDate,
        });
      });
    }
  }, [employeeId]);

  async function saveNewDesignation(event: React.FormEvent) {
    event.preventDefault();
    setSavingDesignation(true);
    setDesignationError("");
    try {
      const created = await addDesignation(newDesignationName.trim());
      await refreshDesignations();
      set("designationId", created.id);
      setAddingDesignation(false);
      setNewDesignationName("");
      toast.success("Designation added.");
    } catch (reason) {
      setDesignationError(reason instanceof Error ? reason.message : "Designation could not be added.");
    } finally {
      setSavingDesignation(false);
    }
  }

  async function uploadAvatar(file: File) {
    try {
      const updated = await uploadEmployeeAvatar(employeeId!, file);
      setAvatarUrl(updated.avatarUrl ?? null);
      toast.success("Photo updated.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Photo could not be uploaded.");
    }
  }

  const title = useMemo(() => (isEdit ? "Edit employee" : "Add employee"), [isEdit]);
  const cancelTo = isEdit ? `/employees/${employeeId}` : "/employees";

  function set<K extends keyof EmployeePayload>(key: K, value: EmployeePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      const payload = { ...form, firstName: firstName ?? "", lastName: rest.join(" ") };
      if (isEdit) {
        delete payload.baseAmount;
        delete payload.currency;
        delete payload.commissionRate;
        delete payload.commissionBasis;
        const saved = await updateEmployee(employeeId!, payload);
        navigate(`/employees/${saved.id}`);
        toast.success("Employee updated.");
      } else {
        const saved = await createEmployee(payload);
        navigate(`/employees/${saved.id}`);
        toast.success("Employee created.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Employee could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage
      breadcrumbTo={cancelTo}
      breadcrumbTrail={isEdit ? ["Employees", fullName || "Employee", "Edit"] : ["Employees", "Add employee"]}
      title={title}
      description="Contact, employment, and compensation details."
      onSubmit={submit}
      submitLabel="Save changes"
      submitting={submitting}
      cancelTo={cancelTo}
      error={error}
    >
      <FormSection heading="Contact details" bordered={false}>
        {isEdit && (
          <FormField label="Photo" className="md:col-span-2">
            <EditableAvatar src={avatarSrc(avatarUrl)} alt={fullName || "Employee"} size="lg" onUpload={uploadAvatar} />
          </FormField>
        )}
        <FormField label="Full name" className="md:col-span-2">
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Phone">
          <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} required />
        </FormField>
      </FormSection>

      <FormSection heading="Employment" accent="tertiary">
        <FormField label="Designation">
          <Select
            value={form.designationId || ""}
            onChange={(event) => {
              if (event.target.value === ADD_DESIGNATION_VALUE) {
                setDesignationError("");
                setNewDesignationName("");
                setAddingDesignation(true);
                return;
              }
              set("designationId", Number(event.target.value));
            }}
            required
          >
            <option value="" disabled hidden>
              Select designation
            </option>
            {designations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            {currentUser?.role === "EXECUTIVE" && (
              <option value={ADD_DESIGNATION_VALUE}>+ Add new designation</option>
            )}
          </Select>
        </FormField>
        <FormField label="Employment type">
          <Select
            value={form.employeeType}
            onChange={(event) => set("employeeType", event.target.value as EmployeePayload["employeeType"])}
          >
            {EMPLOYEE_TYPES.map((value) => (
              <option key={value} value={value}>
                {employeeTypeLabel(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select
            value={form.status}
            onChange={(event) => set("status", event.target.value as EmployeePayload["status"])}
          >
            {EMPLOYEE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Joining date">
          <Input
            type="date"
            value={form.joiningDate}
            onChange={(event) => set("joiningDate", event.target.value)}
            required
          />
        </FormField>
      </FormSection>

      {!isEdit && (
        <FormSection heading="Compensation">
          <FormField label="Compensation type">
            <Select
              value={form.compensationType}
              onChange={(event) => {
                const nextType = event.target.value as EmployeePayload["compensationType"];
                setForm((current) => ({
                  ...current,
                  compensationType: nextType,
                  ...(nextType === "COMMISSION" ? {} : { commissionRate: null, commissionBasis: null }),
                }));
              }}
            >
              {COMPENSATION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Monthly compensation"
            hint="Enter the amount in rupees; it is stored in minor units."
          >
            <MoneyInput value={form.baseAmount ?? 0} onChange={(value) => set("baseAmount", value)} required />
          </FormField>
          <FormField label="Currency">
            <Input
              value={form.currency ?? "PKR"}
              maxLength={3}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
              required
            />
          </FormField>
          {form.compensationType === "COMMISSION" && (
            <>
              <FormField label="Commission rate" hint="Percentage, e.g. 5 for 5%.">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.commissionRate ?? ""}
                  onChange={(event) => set("commissionRate", event.target.value === "" ? null : Number(event.target.value))}
                />
              </FormField>
              <FormField label="Commission basis" hint="e.g. % of closed deal value." className="md:col-span-2">
                <Input
                  value={form.commissionBasis ?? ""}
                  onChange={(event) => set("commissionBasis", event.target.value || null)}
                />
              </FormField>
            </>
          )}
        </FormSection>
      )}

      <FormDialog
        open={addingDesignation}
        title="Add designation"
        description="Create a designation for employee records."
        icon="badge"
        submitLabel="Add"
        submittingLabel="Adding…"
        submitting={savingDesignation}
        submitDisabled={!newDesignationName.trim()}
        error={designationError}
        onSubmit={saveNewDesignation}
        onClose={() => { setAddingDesignation(false); setNewDesignationName(""); setDesignationError(""); }}
      >
        <FormField label="Designation name">
          <Input
            value={newDesignationName}
            onChange={(event) => setNewDesignationName(event.target.value)}
            required
            autoFocus
          />
        </FormField>
      </FormDialog>
    </FormPage>
  );
}
