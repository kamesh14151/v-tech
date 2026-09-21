import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PDFExportData {
  query: string;
  generatedAt: string;
  totalArticles: number;
  sources: string[];
  topicDomain?: string;
  location?: string;
  recency?: string;
  executiveSummary: string;
  recommendedActions: string[];
  themes: Array<{ name: string; count: number; description?: string }>;
  risks: Array<{ severity: "critical" | "high" | "medium"; title: string; source: string; reason: string }>;
  topStories: Array<{ title: string; source: string; url: string; relevanceScore: number; publishedAt: string }>;
  sentiment: { positive: number; negative: number; neutral: number };
}

export async function exportAnthropicStyledPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Report element not found");
  }

  // 1. Capture bounding box position of all <a> tags relative to container
  const containerRect = element.getBoundingClientRect();
  const anchorElements = Array.from(element.querySelectorAll<HTMLAnchorElement>("a[href]"));

  interface LinkTarget {
    href: string;
    left: number;
    top: number;
    width: number;
    height: number;
  }

  const linkTargets: LinkTarget[] = [];

  for (const anchor of anchorElements) {
    const href = anchor.getAttribute("href") || anchor.href;
    if (!href || href === "#" || href.startsWith("javascript:")) continue;

    const clientRects = Array.from(anchor.getClientRects());
    for (const r of clientRects) {
      if (r.width === 0 || r.height === 0) continue;
      linkTargets.push({
        href,
        left: r.left - containerRect.left,
        top: r.top - containerRect.top,
        width: r.width,
        height: r.height,
      });
    }
  }

  // 2. Generate high-resolution canvas screenshot from HTML
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  let pageCount = 1;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pageCount++;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
  }

  // 3. Scale and overlay clickable PDF hyperlink annotations onto corresponding pages
  if (containerRect.width > 0 && containerRect.height > 0) {
    const scaleX = imgWidth / containerRect.width;
    const scaleY = imgHeight / containerRect.height;

    for (const target of linkTargets) {
      const pdfX = target.left * scaleX;
      const pdfYTotal = target.top * scaleY;
      const pdfW = target.width * scaleX;
      const pdfH = target.height * scaleY;

      const pageIndex = Math.floor(pdfYTotal / pageHeight);
      const yOnPage = pdfYTotal % pageHeight;

      if (pageIndex < pageCount) {
        pdf.setPage(pageIndex + 1);
        pdf.link(pdfX, yOnPage, pdfW, pdfH, { url: target.href });
      }
    }
  }

  pdf.save(`${filename}.pdf`);
}
