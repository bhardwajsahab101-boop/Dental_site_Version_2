const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'app', 'admin', 'patient-scanner', 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

// 1. Update imports
const oldImport = `import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/admin/Sidebar";
import toast from "react-hot-toast";`;

const newImport = `import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";`;

content = content.replace(oldImport, newImport);

// Add missing icons to lucide-react import
const lucideOld = `  Table,
  FileSpreadsheet,
  Layers,
  BookmarkPlus
} from "lucide-react";`;

const lucideNew = `  Table,
  FileSpreadsheet,
  Layers,
  BookmarkPlus,
  X,
  FileText
} from "lucide-react";`;

content = content.replace(lucideOld, lucideNew);

// 2. Add useEffect to auto-switch reviewViewMode based on activeScan layout
const targetAfterActiveEntry = `  // Handle template selection
  const handleTemplateChange = (tplId: string) => {`;

const newEffectCode = `  // Auto-switch review view mode based on detected layout
  useEffect(() => {
    if (activeScan) {
      if (activeScan.layoutType === "COLUMN_BASED" || (activeScan.layoutType as string) === "table_rows") {
        setReviewViewMode("table");
      } else {
        setReviewViewMode("boxes");
      }
    }
  }, [activeScan?._id, activeScan?.layoutType]);

  // Handle template selection
  const handleTemplateChange = (tplId: string) => {`;

content = content.replace(targetAfterActiveEntry, newEffectCode);

// 3. Update handleBatchSave to send modifiedEntries
const oldBatchSave = `  // Batch save all approved
  const handleBatchSave = async () => {
    if (!activeScan) return;
    try {
      setLoading(true);
      const res = await fetch(\`/api/admin/scans/\${activeScan._id}/save-batch\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });`;

const newBatchSave = `  // Batch save all approved
  const handleBatchSave = async () => {
    if (!activeScan) return;
    try {
      setLoading(true);
      const res = await fetch(\`/api/admin/scans/\${activeScan._id}/save-batch\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modifiedEntries: activeScan.entries.map((e) => ({
            entryIndex: e.entryIndex,
            boxIndex: e.boxIndex,
            fields: e.fields,
          })),
        }),
      });`;

content = content.replace(oldBatchSave, newBatchSave);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully updated imports and handlers in page.tsx");

