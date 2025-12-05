import { openFileSaveDialogTauri } from "@/adapters/tauri";
import { format } from "date-fns";
import html2canvas from "html2canvas";

/**
 * Export an SVG element (or container with SVG) to a file
 * @param elementRef - The DOM element containing the SVG to export
 * @param filename - Optional filename (defaults to performance-chart with timestamp)
 * @returns Promise<boolean> - true if export succeeded, false if cancelled or failed
 */
/**
 * Inline computed styles for an element and all its descendants
 * This ensures styles are preserved when exporting SVG
 */
function inlineStyles(element: Element, originalElement: Element) {
  const computedStyle = window.getComputedStyle(originalElement);

  // List of style properties to copy
  const stylesToCopy = [
    'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
    'opacity', 'font-family', 'font-size', 'font-weight', 'font-style',
    'text-anchor', 'dominant-baseline', 'alignment-baseline',
    'color', 'background-color', 'display', 'visibility'
  ];

  let inlineStyleString = element.getAttribute('style') || '';

  // Apply computed styles as inline styles
  stylesToCopy.forEach(prop => {
    let value = computedStyle.getPropertyValue(prop);

    // Resolve CSS variables to their computed values
    if (value && value.includes('var(--')) {
      // Extract variable name and get its computed value
      const varMatch = value.match(/var\((--[^,)]+)/);
      if (varMatch) {
        const varName = varMatch[1];
        const resolvedValue = computedStyle.getPropertyValue(varName);
        if (resolvedValue) {
          value = value.replace(/var\([^)]+\)/, resolvedValue);
        }
      }
    }

    if (value && value !== 'none' && value !== 'normal' && !value.includes('var(--')) {
      inlineStyleString += `${prop}: ${value}; `;
    }
  });

  if (inlineStyleString) {
    element.setAttribute('style', inlineStyleString);
  }

  // Recursively process children
  const originalChildren = originalElement.children;
  const clonedChildren = element.children;
  for (let i = 0; i < originalChildren.length; i++) {
    inlineStyles(clonedChildren[i], originalChildren[i]);
  }
}

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

  // Inline all computed styles to preserve appearance
  inlineStyles(clonedSvg, svgElement);

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

  // Also set width and height explicitly to preserve dimensions
  const bbox = svgElement.getBoundingClientRect();
  if (!clonedSvg.hasAttribute("width")) {
    clonedSvg.setAttribute("width", bbox.width.toString());
  }
  if (!clonedSvg.hasAttribute("height")) {
    clonedSvg.setAttribute("height", bbox.height.toString());
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
 * Export SVG with title and date information added as text elements
 * @param chartRef - The chart container
 * @param title - Chart title
 * @param subtitle - Chart subtitle (e.g., date range)
 * @param legendItems - Optional legend items with name and color
 * @param filename - Optional filename
 * @returns Promise<boolean> - true if export succeeded
 */
export async function exportSvgWithHeader(
  chartRef: HTMLElement | null,
  title: string,
  subtitle: string,
  legendItems?: Array<{ name: string; color: string }>,
  filename?: string,
): Promise<boolean> {
  if (!chartRef) {
    throw new Error("Element reference is null");
  }

  // Find the SVG element
  const svgElement = chartRef.querySelector("svg");
  if (!svgElement) {
    throw new Error("No SVG element found");
  }

  // Clone and inline styles
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  inlineStyles(clonedSvg, svgElement);

  // Get original dimensions
  const bbox = svgElement.getBoundingClientRect();
  const originalWidth = bbox.width;
  const originalHeight = bbox.height;

  // Calculate space needed
  const headerHeight = 80;
  const legendHeight = legendItems && legendItems.length > 0 ? 40 + Math.ceil(legendItems.length / 3) * 30 : 0;
  const totalHeight = originalHeight + headerHeight + legendHeight;

  const wrapperSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  wrapperSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  wrapperSvg.setAttribute("width", originalWidth.toString());
  wrapperSvg.setAttribute("height", totalHeight.toString());
  wrapperSvg.setAttribute("viewBox", `0 0 ${originalWidth} ${totalHeight}`);

  // Add white background
  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("width", "100%");
  bgRect.setAttribute("height", "100%");
  bgRect.setAttribute("fill", "white");
  wrapperSvg.appendChild(bgRect);

  // Add title
  const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  titleText.setAttribute("x", "20");
  titleText.setAttribute("y", "35");
  titleText.setAttribute("font-size", "24");
  titleText.setAttribute("font-weight", "bold");
  titleText.setAttribute("fill", "#000");
  titleText.textContent = title;
  wrapperSvg.appendChild(titleText);

  // Add subtitle
  const subtitleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  subtitleText.setAttribute("x", "20");
  subtitleText.setAttribute("y", "60");
  subtitleText.setAttribute("font-size", "14");
  subtitleText.setAttribute("fill", "#666");
  subtitleText.textContent = subtitle;
  wrapperSvg.appendChild(subtitleText);

  // Add the chart SVG as a group, offset by header height
  const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chartGroup.setAttribute("transform", `translate(0, ${headerHeight})`);

  // Move all children from cloned SVG to the group
  while (clonedSvg.firstChild) {
    chartGroup.appendChild(clonedSvg.firstChild);
  }
  wrapperSvg.appendChild(chartGroup);

  // Add legend if provided
  if (legendItems && legendItems.length > 0) {
    const legendY = headerHeight + originalHeight + 20;
    const itemsPerRow = 3;
    const itemWidth = originalWidth / itemsPerRow;

    legendItems.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = 20 + col * itemWidth;
      const y = legendY + row * 30;

      // Color indicator (small rectangle)
      const colorRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      colorRect.setAttribute("x", x.toString());
      colorRect.setAttribute("y", (y - 10).toString());
      colorRect.setAttribute("width", "20");
      colorRect.setAttribute("height", "4");
      colorRect.setAttribute("fill", item.color);
      colorRect.setAttribute("rx", "2");
      wrapperSvg.appendChild(colorRect);

      // Series name
      const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      nameText.setAttribute("x", (x + 28).toString());
      nameText.setAttribute("y", y.toString());
      nameText.setAttribute("font-size", "12");
      nameText.setAttribute("fill", "#333");
      nameText.textContent = item.name;
      wrapperSvg.appendChild(nameText);
    });
  }

  // Serialize
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(wrapperSvg);
  const svgWithDeclaration = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgString}`;

  // Generate filename
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const defaultFilename = `performance-chart_${timestamp}.svg`;

  const success = await openFileSaveDialogTauri(svgWithDeclaration, filename || defaultFilename);
  return success;
}

/**
 * Export the entire performance card (including title, date, metrics, and chart) to PNG
 * Uses html2canvas to capture the entire HTML element
 * Note: Currently has compatibility issues with Tailwind 4's oklab colors
 * @param cardRef - The DOM element containing the entire card
 * @param filename - Optional filename
 * @returns Promise<boolean> - true if export succeeded
 */
export async function exportCardToPng(
  cardRef: HTMLElement | null,
  filename?: string,
): Promise<boolean> {
  if (!cardRef) {
    throw new Error("Card reference is null");
  }

  try {
    // Use html2canvas to convert the card to a canvas
    const canvas = await html2canvas(cardRef, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality (2x resolution)
      logging: false,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (_element) => {
        // Skip elements that might cause issues
        return false;
      },
      onclone: (clonedDoc) => {
        // Remove all stylesheets and inline styles that might contain oklab
        const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styleSheets.forEach(sheet => sheet.remove());

        // Apply basic inline styles from computed values
        const allElements = clonedDoc.querySelectorAll('*');
        const originalElements = cardRef.querySelectorAll('*');

        allElements.forEach((el, index) => {
          if (index < originalElements.length) {
            const element = el as HTMLElement;
            const original = originalElements[index] as HTMLElement;
            const computed = window.getComputedStyle(original);

            // Copy essential computed styles, converting oklab to rgba
            try {
              const props = ['color', 'background-color', 'font-size', 'font-weight', 'font-family'];
              props.forEach(prop => {
                let value = computed.getPropertyValue(prop);

                // Skip oklab colors - html2canvas will use defaults
                if (value && !value.includes('oklab') && !value.includes('oklch')) {
                  element.style.setProperty(prop, value);
                }
              });
            } catch (e) {
              // Ignore parsing errors
            }
          }
        });
      },
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      }, "image/png");
    });

    // Convert blob to base64 string
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);

    const base64Data = await base64Promise;

    // Generate default filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
    const defaultFilename = `performance-chart_${timestamp}.png`;

    // Use Tauri file save dialog
    const success = await openFileSaveDialogTauri(base64Data, filename || defaultFilename);

    return success;
  } catch (error) {
    console.error("Failed to export card to PNG:", error);
    throw error;
  }
}
