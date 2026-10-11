export type CsvLeadField =
  | "name"
  | "phone"
  | "requirement"
  | "email"
  | "company"
  | "source"
  | "status"
  | "notes";

export type CsvMapping = Record<CsvLeadField, string>;

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  errors: string[];
  mapping: CsvMapping;
  hasHeader: boolean;
}

const aliases: Record<CsvLeadField, string[]> = {
  name: ["name", "full name", "fullname"],
  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "contact number",
    "telephone",
  ],
  requirement: [
  "requirement",
  "requirements",
  "service required",
  "required service",
  "service",
  "interested in",
  "interest",
  "looking for",
  "enquiry",
  "inquiry",
  "customer requirement",
  "lead requirement"
],
  email: ["email", "email address", "e mail"],
  company: ["company", "company name", "organization", "organisation"],
  source: ["source", "lead source"],
  status: ["status", "lead status"],
  notes: ["notes", "note", "comments", "remark", "remarks"],
};

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export function parseCsv(text: string): ParsedCsv {
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const errors: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;

      row.push(field.trim());
      field = "";

      if (row.some(Boolean)) table.push(row);

      row = [];
    } else field += char;
  }

  if (quoted) errors.push("The CSV contains an unclosed quoted value.");

  row.push(field.trim());

  if (row.some(Boolean)) table.push(row);

  if (!table.length)
  return {
    headers: [],
    rows: [],
    errors: ["The CSV file is empty."],
    mapping: emptyMapping(),
    hasHeader: false,
  };

  return tableToParsed(table, errors);
}

export function tableToParsed(
  table: string[][],
  initialErrors: string[] = [],
): ParsedCsv {
  const errors = [...initialErrors];

  const meaningful = table.filter((row) =>
    row.some((value) => value.trim()),
  );

  if (!meaningful.length) {
    return {
      headers: [],
      rows: [],
      errors: ["No leads found in this file."],
      mapping: emptyMapping(),
      hasHeader: false,
    };
  }

  const firstRow = meaningful[0];

  const knownAliases = Object.values(aliases)
    .flat()
    .map((value) => normalize(value));

  const headerMatches = firstRow.filter((value) =>
    knownAliases.includes(normalize(value)),
  ).length;

  const hasHeader = headerMatches >= 2;

  const columnCount = Math.max(
    ...meaningful.map((row) => row.length),
  );

  const headers = hasHeader
    ? firstRow.map(
        (value, index) =>
          value.trim() || `Column ${index + 1}`,
      )
    : Array.from(
        { length: columnCount },
        (_, index) => `Column ${index + 1}`,
      );

  const rows = hasHeader
    ? meaningful.slice(1)
    : meaningful;

  rows.forEach((values, index) => {
    if (values.length !== headers.length) {
      const rowNumber = hasHeader
        ? index + 2
        : index + 1;

      errors.push(
        `Row ${rowNumber}: Expected ${headers.length} columns but found ${values.length}.`,
      );
    }
  });

  const mapping = emptyMapping();

  if (hasHeader) {
    for (const key of Object.keys(aliases) as CsvLeadField[]) {
      const found = headers.find((header) =>
        aliases[key].includes(normalize(header)),
      );

      if (found) {
        mapping[key] = found;
      }
    }
  }

  return {
    headers,
    rows,
    errors,
    mapping,
    hasHeader,
  };
}

function emptyMapping(): CsvMapping {
  return {
    name: "",
    phone: "",
    requirement: "",
    email: "",
    company: "",
    source: "",
    status: "",
    notes: "",
  };
}

export function mappedLeadRows(
  parsed: ParsedCsv,
  mapping: CsvMapping,
) {
  const index = (field: CsvLeadField) =>
    mapping[field] ? parsed.headers.indexOf(mapping[field]) : -1;

  return parsed.rows.map((row, offset) => {
    const value = (field: CsvLeadField) => {
      const position = index(field);

      return position >= 0
        ? (row[position] ?? "").trim()
        : undefined;
    };

    return {
      rowNumber: offset + (parsed.hasHeader ? 2 : 1),
      name: value("name"),
      phone: value("phone"),
      requirement: value("requirement"),
      email: value("email"),
      company: value("company"),
      source: value("source"),
      status: value("status"),
      notes: value("notes"),
    };
  });
}

export type LeadFileKind =
  | "CSV file"
  | "Excel spreadsheet"
  | "Word table document";

export async function parseLeadFile(
  file: File,
): Promise<{ parsed: ParsedCsv; kind: LeadFileKind }> {
  const extension = file.name.toLowerCase().split(".").pop();

  if (extension === "csv")
    return {
      parsed: parseCsv(await file.text()),
      kind: "CSV file",
    };

  if (extension === "xlsx") {
    const { default: readXlsxFile } = await import(
      "read-excel-file/browser"
    );

    const sheets = await readXlsxFile(file);
    const rows = sheets[0]?.data ?? [];

    return {
      parsed: tableToParsed(
        rows.map((row) =>
          row.map((cell) =>
            cell === null
              ? ""
              : cell instanceof Date
                ? cell.toISOString()
                : String(cell),
          ),
        ),
      ),
      kind: "Excel spreadsheet",
    };
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth");

    const result = await mammoth.convertToHtml({
      arrayBuffer: await file.arrayBuffer(),
    });

    const document = new DOMParser().parseFromString(
      result.value,
      "text/html",
    );

    const table = document.querySelector("table");

    if (!table)
      throw new Error(
        "No lead table found. Please upload a Word document containing a table with Name and Phone columns.",
      );

    const rows = [...table.querySelectorAll("tr")].map((row) =>
      [...row.querySelectorAll("th,td")].map((cell) =>
        (cell.textContent ?? "").trim(),
      ),
    );

    return {
      parsed: tableToParsed(rows),
      kind: "Word table document",
    };
  }

  throw new Error("Please choose a supported lead file.");
}