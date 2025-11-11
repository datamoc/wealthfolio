import { ExportedFileFormat } from "@/lib/types";

export function formatData(data: unknown[], format: ExportedFileFormat): string {
  if (!data || data.length === 0) return "";
  if (format === "CSV") {
    return convertToCSV(data as Record<string, unknown>[]);
  } else if (format === "JSON") {
    return JSON.stringify(data, null, 2);
  }
  return "";
}

export function convertToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  // Check if 'assetID' is present and replace it with 'symbol'
  const assetIDIndex = headers.indexOf("assetId");
  if (assetIDIndex !== -1) {
    headers[assetIDIndex] = "symbol";
  }

  // Format CSV: quote headers, quote string values but not numbers
  const formatCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    // Quote strings and escape internal quotes
    return JSON.stringify(String(value));
  };

  const headerRow = headers.map((h) => JSON.stringify(h)).join(",");
  const dataRows = data.map((row) => {
    return Object.values(row).map(formatCSVValue).join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}
