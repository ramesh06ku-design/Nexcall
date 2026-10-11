"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";
import {
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import {
  mappedLeadRows,
  parseLeadFile,
  type CsvLeadField,
  type CsvMapping,
  type LeadFileKind,
  type ParsedCsv,
} from "@/lib/csv/leads";
import type { LeadStatus, Telecaller } from "@/types";
import { leadStatusLabels } from "./lead-status-badge";

type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  skippedRows: {
    rowNumber: number;
    reason: string;
  }[];
  failedRows: {
    rowNumber: number;
    reason: string;
  }[];
};

const fields: [CsvLeadField, string, boolean][] = [
  ["name", "Name", true],
  ["phone", "Phone", true],
  ["requirement", "Requirement", true],
  ["email", "Email", false],
  ["company", "Company", false],
  ["source", "Source", false],
  ["status", "Status", false],
  ["notes", "Notes", false],
];

const selectClass =
  "mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/10";

export function CsvLeadImport({
  telecallers,
  onCancel,
  onImported,
}: {
  telecallers: Telecaller[];
  onCancel: () => void;
  onImported: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileKind, setFileKind] = useState<LeadFileKind | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<CsvMapping | null>(null);
  const [message, setMessage] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [defaultStatus, setDefaultStatus] =
    useState<LeadStatus>("new");
  const [assignedTo, setAssignedTo] = useState("");

  async function processFile(file?: File) {
    setResult(null);
    setMessage("");

    if (!file) return;

    const extension = file.name.toLowerCase().split(".").pop();

    if (
      !["csv", "xlsx", "docx"].includes(extension ?? "") ||
      !validMime(extension!, file.type)
    ) {
      setMessage("Please choose a supported lead file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("This file is larger than the 10 MB limit.");
      return;
    }

    setParsing(true);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const value = await parseLeadFile(file);

      setFileKind(value.kind);
      setParsed(value.parsed);
      setMapping(value.parsed.mapping);

      if (!value.parsed.rows.length)
        setMessage("No leads found in this file.");
      else if (value.parsed.rows.length > 500) {
        setMessage("This file contains more than the maximum 500 rows.");
        setParsed(null);
        setMapping(null);
      } else if (value.parsed.errors.length)
        setMessage(value.parsed.errors[0]);
    else if (
      !value.parsed.mapping.name ||
      !value.parsed.mapping.phone ||
      !value.parsed.mapping.requirement
    ) {
  setMessage(
    "Map the required Name, Phone and Requirement columns below."
  );
}
    } catch (reason) {
      setParsed(null);
      setMapping(null);
      setFileKind(null);
      setMessage(
        reason instanceof Error
          ? reason.message
          : "We could not read this lead file.",
      );
    } finally {
      setParsing(false);
    }
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    await processFile(event.target.files?.[0]);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files?.[0]);
  }

  function clear() {
    setFileName("");
    setFileKind(null);
    setFileSize(0);
    setParsed(null);
    setMapping(null);
    setMessage("");
    setResult(null);

    if (input.current) input.current.value = "";
  }

  const rows =
    parsed && mapping ? mappedLeadRows(parsed, mapping) : [];

  const rowErrors = rows.flatMap((row) => [
    ...(!row.name ? [`Row ${row.rowNumber}: Name is missing.`] : []),
    ...(!row.phone ? [`Row ${row.rowNumber}: Phone is missing.`] : []),
    ...(!row.requirement ? [`Row ${row.rowNumber}: Requirement is missing.`] : []),
  ]);

  const structurallyInvalid = new Set([
    ...rowErrors.map((error) =>
      Number(error.match(/Row (\d+)/)?.[1]),
    ),
    ...(parsed?.errors.map((error) =>
      Number(error.match(/Row (\d+)/)?.[1]),
    ) ?? []),
  ]);

  const validCount = rows.length - structurallyInvalid.size;

  const canImport = Boolean(
  projectName.trim().length >= 2 &&
    parsed &&
    mapping?.name &&
    mapping.phone &&
    mapping.requirement &&
    rows.length &&
    validCount > 0 &&
    !parsing &&
    !importing,
);

  async function submit() {
    if (!canImport) return;

    setImporting(true);
    setResult(null);

    try {
      const response = await apiRequest<ImportResult>(
        "/agency/leads/import",
        {
          method: "POST",
          body: JSON.stringify({
          projectName: projectName.trim(),
          rows,
          defaultStatus,
          assignedTo: assignedTo || null,
          }),
        },
      );

      if (!response.data)
        throw new Error("The server returned no import result.");

      setResult(response.data);

      toast.success(
        `${response.data.imported} lead${
          response.data.imported === 1 ? "" : "s"
        } imported.`,
      );

      await onImported();
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "Lead import failed.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-5 space-y-5">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition hover:border-primary hover:bg-primary-soft/30 ${
          dragging
            ? "border-primary bg-primary-soft/40"
            : "bg-muted/25"
        }`}
      >
        <FileSpreadsheet className="mx-auto size-9 text-primary" />

        <p className="mt-3 font-semibold">Upload your lead file</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Drag and drop a file here, or choose one below
        </p>

        <Input
          ref={input}
          className="sr-only"
          id="lead-file"
          type="file"
          accept=".csv,.xlsx,.docx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={choose}
        />

        <Button
          type="button"
          className="mt-4"
          variant="outline"
          onClick={() => input.current?.click()}
          disabled={parsing}
        >
          <Upload className="size-4" />
          {parsing ? "Reading…" : "Choose File"}
        </Button>

        <p className="mt-3 text-xs text-muted-foreground">
          CSV • Excel (.xlsx) • Word table (.docx)
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Maximum 500 rows · Maximum file size 10 MB
        </p>
      </div>

      <div className="rounded-xl bg-primary-soft/50 p-3 text-xs">
        <b>Using Google Sheets?</b>

        <span className="ml-1 text-muted-foreground">
          Download your sheet as CSV or Excel, then upload it here.
        </span>
      </div>

      {fileName && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm">
          <span className="min-w-0">
            <b className="block truncate">{fileName}</b>

            <span className="text-xs text-muted-foreground">
              {fileKind ?? "Lead file"} · {formatBytes(fileSize)}
              {parsed ? ` · ${parsed.rows.length} rows detected` : ""}
            </span>
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => input.current?.click()}
            >
              <RefreshCw className="size-3.5" />
              Replace
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
        >
          {message}
        </p>
      )}

      {parsed && mapping && (
        <>
        <div className="rounded-xl border bg-muted/20 p-4">
  <label className="text-sm font-semibold">
    Project Name *

    <Input
      className="mt-2"
      value={projectName}
      maxLength={160}
      placeholder="e.g. Interior Leads - September"
      onChange={(event) => setProjectName(event.target.value)}
    />

    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
      All leads from this file will be saved inside this project.
    </span>
  </label>
</div>
          <div>
            <h3 className="text-sm font-bold">Column mapping</h3>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {fields.map(([key, label, required]) => (
                <label
                  key={key}
                  className="text-xs font-semibold"
                >
                  {label}
                  {required ? " *" : ""}

                  <select
                    className={selectClass}
                    value={mapping[key]}
                    onChange={(event) =>
                      setMapping({
                        ...mapping,
                        [key]: event.target.value,
                      })
                    }
                  >
                    <option value="">Not mapped</option>

                    {parsed.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Default status

              <select
                className={selectClass}
                value={defaultStatus}
                onChange={(event) =>
                  setDefaultStatus(event.target.value as LeadStatus)
                }
              >
                {Object.entries(leadStatusLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="text-sm font-semibold">
              Assign all to

              <select
                className={selectClass}
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(event.target.value)
                }
              >
                <option value="">Unassigned</option>

                {telecallers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="flex flex-wrap gap-3 text-xs">
              <b>Detected: {rows.length}</b>

              <span className="text-emerald-700">
                Valid: {validCount}
              </span>

              <span className="text-red-700">
                Invalid: {structurallyInvalid.size}
              </span>
            </div>

            {rowErrors.length > 0 && (
              <ul className="mt-2 max-h-24 overflow-y-auto rounded-xl bg-red-50 p-3 text-xs text-red-700">
                {rowErrors.slice(0, 20).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

            <div className="mt-3 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "Row",
                      "Name",
                      "Phone",
                      "Requirement",
                      "Email",
                      "Company",
                      "Status",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-2"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {rows.slice(0, 10).map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="px-3 py-2">
                        {row.rowNumber}
                      </td>

                      <td className="px-3 py-2">
                        {row.name || "—"}
                      </td>

                      <td className="px-3 py-2">
                        {row.phone || "—"}
                      </td>

                      <td className="px-3 py-2">
                        {row.requirement || "—"}
                      </td>

                      <td className="px-3 py-2">
                        {row.email || "—"}
                      </td>

                      <td className="px-3 py-2">
                        {row.company || "—"}
                      </td>

                      <td className="px-3 py-2">
                        {row.status ||
                          leadStatusLabels[defaultStatus]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > 10 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing the first 10 of {rows.length} rows.
              </p>
            )}
          </div>
        </>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <b>Import completed</b>

          <p className="mt-1 text-sm">
            Imported: {result.imported} · Skipped: {result.skipped} ·
            Failed: {result.failed}
          </p>

          {[...result.skippedRows, ...result.failedRows].length >
            0 && (
            <ul className="mt-2 max-h-24 overflow-y-auto text-xs text-muted-foreground">
              {[...result.skippedRows, ...result.failedRows]
                .slice(0, 20)
                .map((item) => (
                  <li
                    key={`${item.rowNumber}-${item.reason}`}
                  >
                    Row {item.rowNumber}: {item.reason}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Expected columns: Name, Phone, Email, Company, Source, Status,
        Notes
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Close
        </Button>

        <Button
          type="button"
          onClick={() => void submit()}
          disabled={!canImport}
        >
          {importing ? "Importing…" : "Import Leads"}
        </Button>
      </div>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;

  if (value < 1024 * 1024)
    return `${Math.round(value / 1024)} KB`;

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function validMime(extension: string, mime: string) {
  if (
    !mime ||
    mime === "application/octet-stream" ||
    mime === "application/zip"
  )
    return true;

  const accepted: Record<string, string[]> = {
    csv: [
      "text/csv",
      "text/plain",
      "application/csv",
      "application/vnd.ms-excel",
    ],
    xlsx: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    docx: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };

  return accepted[extension]?.includes(mime) ?? false;
}