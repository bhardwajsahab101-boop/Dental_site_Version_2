import { IBoxCoordinates } from "../../models/ScanDocument";

export interface BoxGridItem {
  boxIndex: number;
  col: number;
  row: number;
  colIndex?: number;
  rowIndex?: number;
  coordinates: IBoxCoordinates;
}

/**
 * Generates regular grid box coordinates for a multi-column register page.
 * Margins and gutters account for header titles and page edges.
 */
export function generateGridBoxes(
  columnsCount: number = 2,
  rowsPerColumn: number = 4,
  readingOrder: "column_first" | "row_first" = "column_first",
  options: {
    topMarginPct?: number;
    bottomMarginPct?: number;
    leftMarginPct?: number;
    rightMarginPct?: number;
    colGutterPct?: number;
    rowGutterPct?: number;
  } = {}
): BoxGridItem[] {
  const topMargin = options.topMarginPct ?? 8; // Top 8% usually contains register header
  const bottomMargin = options.bottomMarginPct ?? 4;
  const leftMargin = options.leftMarginPct ?? 3;
  const rightMargin = options.rightMarginPct ?? 3;
  const colGutter = options.colGutterPct ?? 2;
  const rowGutter = options.rowGutterPct ?? 1.5;

  const availableWidth = 100 - leftMargin - rightMargin - (columnsCount - 1) * colGutter;
  const availableHeight = 100 - topMargin - bottomMargin - (rowsPerColumn - 1) * rowGutter;

  const boxWidth = Math.max(10, availableWidth / columnsCount);
  const boxHeight = Math.max(5, availableHeight / rowsPerColumn);

  const rawGrid: { col: number; row: number; coordinates: IBoxCoordinates }[] = [];

  for (let r = 0; r < rowsPerColumn; r++) {
    for (let c = 0; c < columnsCount; c++) {
      const x = leftMargin + c * (boxWidth + colGutter);
      const y = topMargin + r * (boxHeight + rowGutter);

      rawGrid.push({
        col: c,
        row: r,
        coordinates: {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          width: Math.round(boxWidth * 10) / 10,
          height: Math.round(boxHeight * 10) / 10,
        },
      });
    }
  }

  // Sort by specified reading order
  if (readingOrder === "column_first") {
    // Sort by column first (0, 1, 2...), then by row (0, 1, 2...)
    rawGrid.sort((a, b) => {
      if (a.col !== b.col) return a.col - b.col;
      return a.row - b.row;
    });
  } else {
    // Row first: Sort by row first, then column
    rawGrid.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  }

  return rawGrid.map((item, idx) => ({
    boxIndex: idx + 1,
    col: item.col,
    row: item.row,
    colIndex: item.col,
    rowIndex: item.row,
    coordinates: item.coordinates,
  }));
}

/**
 * Standard templates provided out of the box for dental clinics
 */
export const DEFAULT_REGISTER_TEMPLATES = [
  {
    name: "2 Columns x 4 Rows (8 Patient Boxes)",
    description: "Standard daily outpatient register with two tall vertical columns of 4 rectangular patient cards each.",
    columnsCount: 2,
    rowsPerColumn: 4,
    readingOrder: "column_first" as const,
    fieldLayout: ["Patient Name", "Age/Sex", "Phone", "Treatment", "Fee", "Notes"],
    isDefault: true,
  },
  {
    name: "2 Columns x 5 Rows (10 Patient Boxes)",
    description: "Compact 10-patient register layout with 5 boxes down each column.",
    columnsCount: 2,
    rowsPerColumn: 5,
    readingOrder: "column_first" as const,
    fieldLayout: ["Patient Name", "Age/Sex", "Phone", "Treatment", "Fee", "Notes"],
    isDefault: false,
  },
  {
    name: "3 Columns x 5 Rows (15 Patient Boxes)",
    description: "High-volume clinic register with three vertical columns of 5 square patient slots.",
    columnsCount: 3,
    rowsPerColumn: 5,
    readingOrder: "column_first" as const,
    fieldLayout: ["Patient Name", "Phone", "Treatment", "Amount", "Notes"],
    isDefault: false,
  },
  {
    name: "3 Columns x 6 Rows (18 Patient Boxes)",
    description: "18-box grid ledger for busy consultation days.",
    columnsCount: 3,
    rowsPerColumn: 6,
    readingOrder: "column_first" as const,
    fieldLayout: ["Patient Name", "Phone", "Treatment", "Amount"],
    isDefault: false,
  },
  {
    name: "Single Column Ledger (10 Tabular Rows)",
    description: "Traditional full-width single-column ledger rows.",
    columnsCount: 1,
    rowsPerColumn: 10,
    readingOrder: "row_first" as const,
    fieldLayout: ["Date", "Name", "Age/Sex", "Phone", "Treatment", "Amount", "Notes"],
    isDefault: false,
  },
];

