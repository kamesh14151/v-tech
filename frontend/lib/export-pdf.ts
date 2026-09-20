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

  // Generate canvas from HTML with high pixel density
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

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}
