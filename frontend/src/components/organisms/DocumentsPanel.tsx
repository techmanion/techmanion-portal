import { Button, Icon, Input, Select } from "../atoms";
import { SectionHeading } from "../atoms/Typography";
import { EmptyState, FormField } from "../molecules";
import { label } from "../../lib/format";
import { DOCUMENT_KINDS } from "../../lib/options";
import type { EmployeeDocument } from "../../types";

export function DocumentsPanel({
  documents,
  onUpload,
  onDownload,
}: {
  documents: EmployeeDocument[];
  onUpload: (event: React.FormEvent<HTMLFormElement>) => void;
  onDownload: (document: EmployeeDocument) => void;
}) {
  return (
    <div className="surface-panel mt-8 max-w-5xl p-6">
      <SectionHeading className="mb-6">Employee Documents</SectionHeading>
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
      <form
        className="mt-6 grid items-end gap-4 border-t border-outline-variant/30 pt-6 md:grid-cols-[180px_1fr_auto]"
        onSubmit={onUpload}
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
        <Button type="submit">
          <Icon className="text-[16px]">upload</Icon>Upload
        </Button>
      </form>
    </div>
  );
}
