import { openFileSaveDialogTauri } from "@/adapters/tauri";
import { format } from "date-fns";

/**
 * Export an SVG element (or container with SVG) to a file
 * @param elementRef - The DOM element containing the SVG to export
 * @param filename - Optional filename (defaults to performance-chart with timestamp)
 * @returns Promise<boolean> - true if export succeeded, false if cancelled or failed
 */
export async function exportSvgToFile(
  elementRef: HTMLElement | null,
  filename?: string,
): Promise<boolean> {
  if (!elementRef) {
    throw new Error("Element reference is null");
  }

  // Find the SVG element (could be the element itself or a child)
  const svgElement = elementRef.querySelector("svg");
  if (!svgElement) {
    throw new Error("No SVG element found in the provided container");
  }

  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;

  // Get computed styles to preserve styling
  const computedStyle = window.getComputedStyle(svgElement);
  const backgroundColor = computedStyle.backgroundColor || "white";

  // Add background rect if the SVG doesn't have one
  // This ensures the exported SVG has a proper background
  const hasBackground = clonedSvg.querySelector("rect[data-background]");
  if (!hasBackground && backgroundColor !== "transparent") {
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", backgroundColor);
    bgRect.setAttribute("data-background", "true");
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
  }

  // Ensure SVG has proper namespace
  if (!clonedSvg.hasAttribute("xmlns")) {
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // Serialize the SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);

  // Add XML declaration for proper SVG file format
  const svgWithDeclaration = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgString}`;

  // Generate default filename with timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const defaultFilename = `performance-chart_${timestamp}.svg`;

  // Use Tauri file save dialog
  const success = await openFileSaveDialogTauri(svgWithDeclaration, filename || defaultFilename);

  return success;
}

/**
 * Export the entire performance card (including metrics and chart) to SVG
 * This captures the whole analysis view
 * @param cardRef - The DOM element containing the entire card
 * @param filename - Optional filename
 * @returns Promise<boolean> - true if export succeeded
 */
export async function exportPerformanceCardToSvg(
  cardRef: HTMLElement | null,
  filename?: string,
): Promise<boolean> {
  if (!cardRef) {
    throw new Error("Card reference is null");
  }

  // For a full card export, we need to convert HTML to SVG
  // This is more complex as we need to capture text, layout, etc.
  // For now, we'll just export the chart SVG
  // TODO: Implement full HTML-to-SVG conversion if needed
  return exportSvgToFile(cardRef, filename);
}
