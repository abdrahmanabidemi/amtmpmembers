/**
 * AMTMP CSV Serialization and Parsing Utility
 * RFC 4180 compliant with UTF-8 BOM prefix for seamless Microsoft Excel compatibility.
 */

/**
 * Escapes a single field according to RFC 4180 rules.
 */
export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // If string contains comma, quote, or newline, enclose in quotes and escape internal quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an Excel-compatible CSV string from headers and row objects.
 * Prepends UTF-8 Byte Order Mark (\uFEFF) so Excel opens UTF-8 characters properly.
 */
export function generateCsv(columns: { key: string; label: string }[], rows: any[]): string {
  const headerLine = columns.map((col) => escapeCsvField(col.label)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvField(row[col.key])).join(",")
  );

  return `\uFEFF${headerLine}\r\n${dataLines.join("\r\n")}\r\n`;
}

/**
 * Parses a standard CSV string into an array of header-keyed records.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present
  let text = csvText;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    return [];
  }

  // Parse header line
  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const nc = line[i + 1];

      if (c === '"') {
        if (inQuote && nc === '"') {
          field += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === "," && !inQuote) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || "";
    });
    records.push(record);
  }

  return records;
}
