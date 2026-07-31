import { useState } from "react";
import { Button, Icon, Input, Select } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState, FormDialog, FormField } from "../molecules";
import { label } from "../../lib/format";
import { DOCUMENT_KINDS } from "../../lib/options";
import type { EmployeeDocument } from "../../types";

export function DocumentsPanel({
  documents,
  onUpload,
  onDownload,
}: {
  documents: EmployeeDocument[];
  onUpload: (formData: FormData) => Promise<void>;
  onDownload: (document: EmployeeDocument) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onUpload(new FormData(event.currentTarget));
      setDialogOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document could not be uploaded.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="surface-panel mt-8 max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeading>Employee Documents</SectionHeading>
        <Button size="sm" onClick={() => { setError(""); setDialogOpen(true); }}><Icon className="text-[16px]">upload</Icon>Upload document</Button>
      </div>
      {documents.length ? (
        <ul className="divide-y divide-outline-variant/30">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-surface-container-highest">
                  <Icon className="text-[18px]">description</Icon>
                </span>
                <div>
                  <strong className="block text-sm">{document.fileName}</strong>
                  <span className="text-xs text-on-surface-variant">
                    {label(document.kind)} · {Math.ceil(document.sizeBytes / 1024)} KB
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onDownload(document)}>
                <Icon className="text-[16px]">download</Icon>Download
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No documents uploaded.</EmptyState>
      )}
      <FormDialog
        open={dialogOpen}
        title="Upload document"
        description="Add a document to this employee record."
        icon="upload_file"
        submitLabel="Upload"
        submittingLabel="Uploading…"
        submitting={submitting}
        error={error}
        onSubmit={submit}
        onClose={() => { setDialogOpen(false); setError(""); }}
      >
        <FormField label="Document type">
          <Select name="kind" defaultValue="CV">
            {DOCUMENT_KINDS.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="File">
          <Input name="file" type="file" required />
        </FormField>
      </FormDialog>
    </div>
  );
}
