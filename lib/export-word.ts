import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from "docx";

export interface ReportExportData {
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

// 8.5" page with 1" margins = 6.5" printable width = 9360 DXA (twips)
const TOTAL_TABLE_WIDTH = 9000;
const META_COL1_WIDTH = 2800;
const META_COL2_WIDTH = 6200;

const CITE_COL1_WIDTH = 4800;
const CITE_COL2_WIDTH = 2600;
const CITE_COL3_WIDTH = 1600;

const CELL_MARGINS = {
  top: 120,
  bottom: 120,
  left: 160,
  right: 160,
};

const BORDER_LIGHT = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "E5E7EB",
};

const TABLE_BORDERS = {
  top: BORDER_LIGHT,
  bottom: BORDER_LIGHT,
  left: BORDER_LIGHT,
  right: BORDER_LIGHT,
  insideHorizontal: BORDER_LIGHT,
  insideVertical: BORDER_LIGHT,
};

export async function generateWordDocx(data: ReportExportData): Promise<Blob> {
  const dateStr = new Date(data.generatedAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Header / Subtitle
          new Paragraph({
            children: [
              new TextRun({
                text: "OPTIMUS INTELLIGENCE PLATFORM",
                bold: true,
                size: 20,
                color: "059669", // Emerald
                font: "Calibri",
              }),
              new TextRun({
                text: "   |   EXECUTIVE INTELLIGENCE DOSSIER",
                size: 20,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
            spacing: { after: 140 },
          }),

          // Main Title
          new Paragraph({
            children: [
              new TextRun({
                text: `Intelligence Report: ${data.query}`,
                bold: true,
                size: 36,
                font: "Calibri",
                color: "111827",
              }),
            ],
            spacing: { after: 280 },
          }),

          // Metadata Table (Widths explicitly set in DXA twips)
          new Table({
            width: { size: TOTAL_TABLE_WIDTH, type: WidthType.DXA },
            borders: TABLE_BORDERS,
            rows: [
              createMetaRow("Target Subject / Query", data.query),
              createMetaRow("Topic Domain / Sector", data.topicDomain || "General Sector"),
              createMetaRow("Location Scope", data.location || "Global (All)"),
              createMetaRow("Time Horizon Window", data.recency || "Last 24 Hours"),
              createMetaRow("Generated Timestamp", dateStr),
              createMetaRow("Articles Ingested", `${data.totalArticles} verified media items`),
              createMetaRow(
                "Sentiment Distribution",
                `${data.sentiment.positive} Positive · ${data.sentiment.negative} Negative · ${data.sentiment.neutral} Neutral`
              ),
              createMetaRow(
                "Critical Risk Alerts",
                `${data.risks.filter((r) => r.severity === "critical").length} urgent alerts`
              ),
            ],
          }),

          new Paragraph({ spacing: { before: 280, after: 140 } }),

          // Executive Summary Section
          new Paragraph({
            children: [
              new TextRun({
                text: "1. Executive Summary",
                bold: true,
                size: 26,
                color: "111827",
                font: "Calibri",
              }),
            ],
            spacing: { before: 240, after: 140 },
          }),

          // Styled Callout Table for Executive Summary
          new Table({
            width: { size: TOTAL_TABLE_WIDTH, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: "059669" }, // Thick emerald left bar
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: TOTAL_TABLE_WIDTH, type: WidthType.DXA },
                    shading: { type: ShadingType.CLEAR, fill: "F9FAFB" },
                    margins: { top: 160, bottom: 160, left: 240, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: data.executiveSummary,
                            size: 22,
                            font: "Georgia",
                            color: "1F2937",
                          }),
                        ],
                        spacing: { line: 360 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 100 } }),

          // Narrative Themes Section
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Key Narrative Clusters & Thematic Drivers",
                bold: true,
                size: 26,
                color: "111827",
                font: "Calibri",
              }),
            ],
            spacing: { before: 240, after: 140 },
          }),

          ...data.themes.map(
            (t, idx) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${idx + 1}. ${t.name}`,
                    bold: true,
                    size: 22,
                    color: "111827",
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: `  (${t.count} articles)\n`,
                    size: 20,
                    color: "6B7280",
                    italics: true,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: t.description || `Primary media cluster observed across monitored publications.`,
                    size: 21,
                    font: "Calibri",
                    color: "374151",
                  }),
                ],
                spacing: { after: 160 },
              })
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // Risk Signals Section
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Risk Signals & Adverse Media Alerts",
                bold: true,
                size: 26,
                color: "111827",
                font: "Calibri",
              }),
            ],
            spacing: { before: 240, after: 140 },
          }),

          ...(data.risks.length > 0
            ? data.risks.map(
                (r) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `[${r.severity.toUpperCase()}] `,
                        bold: true,
                        size: 21,
                        color: r.severity === "critical" ? "DC2626" : r.severity === "high" ? "D97706" : "CA8A04",
                        font: "Calibri",
                      }),
                      new TextRun({
                        text: `${r.title}\n`,
                        bold: true,
                        size: 22,
                        color: "111827",
                        font: "Calibri",
                      }),
                      new TextRun({
                        text: `Source: ${r.source} — ${r.reason}`,
                        italics: true,
                        size: 20,
                        color: "4B5563",
                        font: "Calibri",
                      }),
                    ],
                    spacing: { after: 160 },
                  })
              )
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "No significant adverse risk signals detected in the active time window.",
                      italics: true,
                      size: 21,
                      color: "6B7280",
                    }),
                  ],
                }),
              ]),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // Strategic Actions
          new Paragraph({
            children: [
              new TextRun({
                text: "4. Recommended Strategic PR Actions",
                bold: true,
                size: 26,
                color: "111827",
                font: "Calibri",
              }),
            ],
            spacing: { before: 240, after: 140 },
          }),

          ...data.recommendedActions.map(
            (action, i) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${i + 1}. `,
                    bold: true,
                    size: 22,
                    color: "059669",
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: action,
                    size: 22,
                    color: "1F2937",
                    font: "Calibri",
                  }),
                ],
                spacing: { after: 120 },
              })
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // Cited Media Stories Table
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Verified Media Citations",
                bold: true,
                size: 26,
                color: "111827",
                font: "Calibri",
              }),
            ],
            spacing: { before: 240, after: 140 },
          }),

          new Table({
            width: { size: TOTAL_TABLE_WIDTH, type: WidthType.DXA },
            borders: TABLE_BORDERS,
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Story Headline", CITE_COL1_WIDTH),
                  createHeaderCell("Source Outlet", CITE_COL2_WIDTH),
                  createHeaderCell("Relevance", CITE_COL3_WIDTH),
                ],
              }),
              ...data.topStories.map(
                (story) =>
                  new TableRow({
                    children: [
                      createBodyCell(story.title, CITE_COL1_WIDTH),
                      createBodyCell(story.source, CITE_COL2_WIDTH),
                      createBodyCell(`${story.relevanceScore}/100`, CITE_COL3_WIDTH, true),
                    ],
                  })
              ),
            ],
          }),

          // Footer Notice
          new Paragraph({
            children: [
              new TextRun({
                text: "\n\nReport autonomously synthesized by Optimus Intelligence Platform · Powered by Optimus AI Engine",
                italics: true,
                size: 18,
                color: "9CA3AF",
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 360 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

function createMetaRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: META_COL1_WIDTH, type: WidthType.DXA },
        margins: CELL_MARGINS,
        shading: { type: ShadingType.CLEAR, fill: "F3F4F6" },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                font: "Calibri",
                color: "374151",
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: META_COL2_WIDTH, type: WidthType.DXA },
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                size: 20,
                font: "Calibri",
                color: "111827",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createHeaderCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    margins: CELL_MARGINS,
    shading: { type: ShadingType.CLEAR, fill: "111827" },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
            color: "FFFFFF",
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

function createBodyCell(text: string, widthDxa: number, isCenter = false): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: isCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            size: 20,
            font: "Calibri",
            color: "1F2937",
          }),
        ],
      }),
    ],
  });
}
