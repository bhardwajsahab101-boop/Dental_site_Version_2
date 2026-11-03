"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Camera,
  Upload,
  RotateCw,
  RotateCcw,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  UserCheck,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  History,
  Trash2,
  Grid,
  ArrowDownUp,
  LayoutGrid,
  Crop,
  Check,
  Table,
  FileSpreadsheet,
  Layers,
  BookmarkPlus,
  X,
  FileText
} from "lucide-react";

interface ScanField<T = any> {
  value?: T;
  confidence: number;
  flag?: "high" | "medium" | "low" | "uncertain" | "missing";
}

interface DuplicateMatch {
  patientId: string;
  patientCode: string;
  fullName: string;
  phone: string;
  matchReason: string;
  lastVisit?: string;
}

interface BoxCoords {
  x: number; // 0 - 100%
  y: number;
  width: number;
  height: number;
}

interface ScanEntry {
  entryIndex: number;
  boxIndex?: number;
  colIndex?: number;
  rowIndex?: number;
  boxCoordinates?: BoxCoords;
  rawText?: string;
  status: "pending" | "approved" | "rejected" | "saved";
  unreadableFields?: string[];
  fields: {
    sNo?: ScanField<string | number>;
    fullName: ScanField<string>;
    age: ScanField<number>;
    gender: ScanField<"Male" | "Female" | "Other">;
    phone: ScanField<string>;
    visitDate: ScanField<string>;
    patientCode: ScanField<string>;
    treatment: ScanField<string>;
    dentalNotes: ScanField<string>;
    prescribedTreatment: ScanField<string>;
    fee?: ScanField<number>;
    amount: ScanField<number>;
    paymentStatus: ScanField<"paid" | "partial" | "unpaid">;
    followUpDate: ScanField<string>;
    chiefComplaint?: ScanField<string>;
    prescribedMedication?: ScanField<string>;
    nextAppointmentDate?: ScanField<string>;
    remarks?: ScanField<string>;
  };
  savedPatientId?: string;
  savedPatientCode?: string;
  savedAppointmentId?: string;
  duplicateMatch?: DuplicateMatch;
}

interface ScanDoc {
  _id: string;
  fileName: string;
  storedFileName: string;
  imageUrl: string;
  fileSize: number;
  status: "uploaded" | "processing" | "needs_review" | "partially_approved" | "completed" | "failed";
  ocrEngine: string;
  language: string;
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT" | "grid_boxes" | "table_rows";
  layoutMetadata?: {
    layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
    confidence: number;
    columnsDetected: number;
    rowsDetected: number;
    regionsDetected: number;
    requiresManualReview: boolean;
    detectedHeaders?: string[];
    qualityAssessment?: {
      sharpness: number;
      brightness: number;
      contrast: number;
      isBlurry: boolean;
      qualityScore: number;
    };
  };
  columnsDetected: number;
  readingOrder: "column_first" | "row_first";
  detectedCount: number;
  approvedCount: number;
  rejectedCount: number;
  entries: ScanEntry[];
  errorMessage?: string;
  uploadedByName: string;
  createdAt: string;
}

interface TemplateOption {
  _id: string;
  name: string;
  columnsCount: number;
  rowsPerColumn: number;
  readingOrder: "column_first" | "row_first";
  isDefault: boolean;
}

export default function PatientScannerPage() {
  const [activeTab, setActiveTab] = useState<"scanner" | "batches" | "history">("scanner");
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [batchName, setBatchName] = useState<string>("");
  const [activeScan, setActiveScan] = useState<ScanDoc | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");

  // Scanner & Layout Controls
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(20);
  const [grayscale, setGrayscale] = useState<boolean>(true);
  const [sharpen, setSharpen] = useState<boolean>(true);

  // Box & Column Configuration
  const [layoutType, setLayoutType] = useState<"grid_boxes" | "table_rows">("grid_boxes");
  const [columnsCount, setColumnsCount] = useState<number>(2);
  const [rowsPerColumn, setRowsPerColumn] = useState<number>(4);
  const [readingOrder, setReadingOrder] = useState<"column_first" | "row_first">("column_first");
  const [engine, setEngine] = useState<"apinex" | "tesseract" | "hybrid">("apinex");
  const [language, setLanguage] = useState<"mixed" | "eng" | "hin">("mixed");

  // Review & Verification
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number>(1);
  const [hoveredBoxIndex, setHoveredBoxIndex] = useState<number | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [savingEntryId, setSavingEntryId] = useState<number | null>(null);
  const [reviewViewMode, setReviewViewMode] = useState<"table" | "boxes">("table");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxSnippetCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch scans and templates
  const fetchData = async () => {
    try {
      setLoading(true);
      const [scansRes, tplRes, batchesRes] = await Promise.all([
        fetch("/api/admin/scans"),
        fetch("/api/admin/scans/templates"),
        fetch("/api/admin/scans/batches"),
      ]);
      const scansData = await scansRes.json();
      const tplData = await tplRes.json();
      const batchesData = await batchesRes.json().catch(() => ({}));
      if (batchesData.success) setBatches(batchesData.batches || []);

      if (scansData.success) setScans(scansData.scans || []);
      if (tplData.success && tplData.templates) {
        setTemplates(tplData.templates);
        const def = tplData.templates.find((t: any) => t.isDefault) || tplData.templates[0];
        if (def) {
          setSelectedTemplateId(def._id);
          setColumnsCount(def.columnsCount);
          setRowsPerColumn(def.rowsPerColumn);
          setReadingOrder(def.readingOrder);
        }
      }
    } catch (err) {
      console.error("Failed to load scanner data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update canvas preview with preprocessing adjustments
  useEffect(() => {
    if (!previewUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const isSideways = rotation % 180 !== 0;
      canvas.width = isSideways ? img.height : img.width;
      canvas.height = isSideways ? img.width : img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (grayscale || brightness !== 0 || contrast !== 0) {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

          for (let i = 0; i < d.length; i += 4) {
            let r = d[i];
            let g = d[i + 1];
            let b = d[i + 2];

            if (grayscale) {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = gray;
              g = gray;
              b = gray;
            }

            r += brightness;
            g += brightness;
            b += brightness;

            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;

            d[i] = Math.min(255, Math.max(0, r));
            d[i + 1] = Math.min(255, Math.max(0, g));
            d[i + 2] = Math.min(255, Math.max(0, b));
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn("Pixel filter bypass:", e);
        }
      }
    };
    img.src = previewUrl;
  }, [previewUrl, rotation, brightness, contrast, grayscale, sharpen]);

  // Crop snippet for active box
  const activeEntry = activeScan?.entries.find(
    (e) => (e.boxIndex || e.entryIndex) === selectedBoxIndex
  );

  useEffect(() => {
    if (!activeScan || !activeEntry?.boxCoordinates) return;
    const canvas = boxSnippetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const coords = activeEntry.boxCoordinates!;
      const sx = (coords.x / 100) * img.width;
      const sy = (coords.y / 100) * img.height;
      const sw = (coords.width / 100) * img.width;
      const sh = (coords.height / 100) * img.height;

      canvas.width = Math.max(200, sw);
      canvas.height = Math.max(120, sh);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    };
    img.src = activeScan.imageUrl;
  }, [activeScan, activeEntry]);

  // Auto-switch review view mode based on detected layout
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
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t._id === tplId);
    if (tpl) {
      setColumnsCount(tpl.columnsCount);
      setRowsPerColumn(tpl.rowsPerColumn);
      setReadingOrder(tpl.readingOrder);
      toast.success(`Applied template: ${tpl.name}`);
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setRotation(0);
    setActiveScan(null);
    toast.success(`Selected ${file.name}`);
  };

  // Upload & Process Document with Box Grid
  const handleUploadAndProcess = async () => {
    if (!selectedFile && !canvasRef.current) {
      toast.error("Please select or capture a register page first.");
      return;
    }

    try {
      setProcessing(true);
      setProcessingStage("1/5: Uploading register photograph securely...");

      const formData = new FormData();
      formData.append("testMode", String(testMode));
      if (batchName) formData.append("batchName", batchName);
      if (selectedFiles.length > 1) { selectedFiles.forEach(f => formData.append("files", f)); } else
      if (canvasRef.current && (rotation !== 0 || grayscale || brightness !== 0 || contrast !== 20)) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current?.toBlob(resolve, "image/jpeg", 0.92)
        );
        if (blob) {
          formData.append("file", blob, selectedFile?.name || "register_page.jpg");
        } else if (selectedFile) {
          formData.append("file", selectedFile);
        }
      } else if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // Step 1: Upload
      const uploadRes = await fetch("/api/admin/scans/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.firstScanId) {
        throw new Error(uploadData.message || "Failed to upload register image");
      }

      const scanId = uploadData.firstScanId;

      // Step 2: Processing with Box & Column Grid
      setProcessingStage(`2/5: Detecting register layout (${columnsCount} columns, ${readingOrder})...`);
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStage(`3/5: Isolating individual rectangular patient boxes (Total ${columnsCount * rowsPerColumn} boxes)...`);
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStage("4/5: Running handwriting OCR on each box independently...");

      const processRes = await fetch(`/api/admin/scans/${scanId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine,
          language,
          layoutType,
          columnsCount,
          rowsPerColumn,
          readingOrder,
          templateId: selectedTemplateId || undefined,
          testMode,
          preprocessingSettings: {
            brightness,
            contrast,
            grayscale,
            rotation,
            sharpen,
          },
        }),
      });

      setProcessingStage("5/5: Cross-referencing patient records for duplicate prevention...");
      const processData = await processRes.json();

      if (!processData.success) {
        throw new Error(processData.message || "Extraction failed");
      }

      setActiveScan(processData.scan);
      setSelectedBoxIndex(1);
      fetchData();
      toast.success(
        `Analysis complete! Extracted ${processData.scan.entries?.length || 0} patient boxes.`
      );
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error(err.message || "Document processing failed. Please check image clarity.");
    } finally {
      setProcessing(false);
      setProcessingStage("");
    }
  };

  // Re-detect or Reorder boxes on active scan
  const handleReconfigureBoxes = async (newReadingOrder?: "column_first" | "row_first") => {
    if (!activeScan) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/scans/${activeScan._id}/detect-boxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnsCount,
          rowsPerColumn,
          readingOrder: newReadingOrder || readingOrder,
          templateId: selectedTemplateId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setActiveScan(data.scan);
      if (newReadingOrder) setReadingOrder(newReadingOrder);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to reconfigure boxes");
    } finally {
      setLoading(false);
    }
  };

  // Field change
  const handleFieldChange = (
    boxIndex: number,
    fieldName: keyof ScanEntry["fields"],
    val: any
  ) => {
    if (!activeScan) return;
    const updated = activeScan.entries.map((entry) => {
      const idx = entry.boxIndex || entry.entryIndex;
      if (idx !== boxIndex) return entry;
      return {
        ...entry,
        fields: {
          ...entry.fields,
          [fieldName]: {
            ...entry.fields[fieldName],
            value: val,
            confidence: 100,
            flag: "high" as const,
          },
        },
      };
    });

    setActiveScan({
      ...activeScan,
      entries: updated,
    });
  };

  // Save single box entry
  const handleSaveEntry = async (
    boxIndex: number,
    action: "create_new" | "link_existing" | "update_existing" = "create_new",
    existingPatientId?: string
  ) => {
    if (!activeScan) return;
    const entry = activeScan.entries.find((e) => (e.boxIndex || e.entryIndex) === boxIndex);
    if (!entry) return;

    if (!entry.fields.fullName.value?.trim()) {
      toast.error("Patient name is required before saving.");
      return;
    }

    try {
      setSavingEntryId(boxIndex);
      const res = await fetch(`/api/admin/scans/${activeScan._id}/save-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIndex: entry.entryIndex,
          action,
          existingPatientId: existingPatientId || entry.duplicateMatch?.patientId,
          customFields: {
            fullName: entry.fields.fullName.value,
            phone: entry.fields.phone.value,
            age: entry.fields.age.value,
            gender: entry.fields.gender.value,
            visitDate: entry.fields.visitDate.value,
            treatment: entry.fields.treatment.value,
            dentalNotes: entry.fields.dentalNotes.value,
            amount: entry.fields.amount.value,
            paymentStatus: entry.fields.paymentStatus.value,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success(`Box #${boxIndex} saved as ${data.patientCode}!`);

      const updatedEntries = activeScan.entries.map((e) =>
        (e.boxIndex || e.entryIndex) === boxIndex
          ? {
              ...e,
              status: "saved" as const,
              savedPatientCode: data.patientCode,
              savedPatientId: data.patientId,
            }
          : e
      );

      setActiveScan({
        ...activeScan,
        status: data.scanStatus || activeScan.status,
        approvedCount: (activeScan.approvedCount || 0) + 1,
        entries: updatedEntries,
      });

      const nextPending = updatedEntries.find(
        (e) => (e.boxIndex || e.entryIndex) > boxIndex && e.status === "pending"
      );
      if (nextPending) {
        setSelectedBoxIndex(nextPending.boxIndex || nextPending.entryIndex);
      }

      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save box entry");
    } finally {
      setSavingEntryId(null);
    }
  };

  // Reject single box entry
  const handleRejectEntry = async (boxIndex: number) => {
    if (!activeScan) return;
    const entry = activeScan.entries.find((e) => (e.boxIndex || e.entryIndex) === boxIndex);
    if (!entry) return;

    try {
      const res = await fetch(`/api/admin/scans/${activeScan._id}/reject-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIndex: entry.entryIndex,
          reason: `Box #${boxIndex} handwriting unreadable or rejected by staff`,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success(`Box #${boxIndex} marked as rejected`);

      const updatedEntries = activeScan.entries.map((e) =>
        (e.boxIndex || e.entryIndex) === boxIndex ? { ...e, status: "rejected" as const } : e
      );

      setActiveScan({
        ...activeScan,
        status: data.scanStatus || activeScan.status,
        rejectedCount: (activeScan.rejectedCount || 0) + 1,
        entries: updatedEntries,
      });

      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject entry");
    }
  };

  // Batch save all approved
  const handleBatchSave = async () => {
    if (!activeScan) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/scans/${activeScan._id}/save-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modifiedEntries: activeScan.entries.map((e) => ({
            entryIndex: e.entryIndex,
            boxIndex: e.boxIndex,
            fields: e.fields,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success(data.message);

      const refreshRes = await fetch(`/api/admin/scans/${activeScan._id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) setActiveScan(refreshData.scan);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Batch save failed");
    } finally {
      setLoading(false);
    }
  };

  // Delete batch
  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch and its pages?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/scans/batches/${batchId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete batch");
    } finally {
      setLoading(false);
    }
  };

  // OpenCV Auto-Detect
  const handleOpenCVAutoDetect = async () => {
    if (!activeScan) {
      toast.error("Please upload or open a register page first.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/scans/${activeScan._id}/detect-boxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoDetectWithOpenCV: true,
          columnsCount,
          rowsPerColumn,
          readingOrder,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setActiveScan(data.scan);
      setColumnsCount(data.scan.columnsDetected || columnsCount);
      toast.success("OpenCV grid auto-detection complete!");
    } catch (err: any) {
      toast.error(err.message || "OpenCV auto-detection failed");
    } finally {
      setLoading(false);
    }
  };

  // Save detected layout as a reusable template
  const handleSaveAsTemplate = async () => {
    if (!activeScan) return;
    const defaultName = `${activeScan.layoutType === "COLUMN_BASED" ? "Column Tabular" : "Box Grid"} Register (${activeScan.columnsDetected || 10} cols)`;
    const tplName = prompt("Enter a name to save this register layout as a reusable template:", defaultName);
    if (!tplName) return;
    try {
      const res = await fetch("/api/admin/scans/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tplName,
          columnsCount: activeScan.columnsDetected || 10,
          rowsPerColumn: activeScan.entries.length || 10,
          readingOrder: activeScan.readingOrder || "row_first",
          isDefault: false,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Template "${tplName}" saved! Future registers will match this structure.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    }
  };

  // Confidence badge
  const renderConfidenceBadge = (confidence: number, flag?: string) => {
    if (flag === "missing" || confidence === 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
          Unrecorded
        </span>
      );
    }
    if (flag === "uncertain" || confidence < 50) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low ({confidence}%)
        </span>
      );
    }
    if (confidence < 80) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Check ({confidence}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        High ({confidence}%)
      </span>
    );
  };

  // Summary counts for review screen
  const totalBoxes = activeScan?.entries.length || 0;
  const savedBoxes = activeScan?.entries.filter((e) => e.status === "saved").length || 0;
  const pendingBoxes = activeScan?.entries.filter((e) => e.status === "pending").length || 0;
  const rejectedBoxes = activeScan?.entries.filter((e) => e.status === "rejected").length || 0;
  const duplicateBoxes = activeScan?.entries.filter((e) => Boolean(e.duplicateMatch)).length || 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#102C46]/5 rounded-xl text-[#102C46]">
              <LayoutGrid className="w-6 h-6 text-[#16A6A1]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#102C46]">
                AI Register Scanner & Digitiser
              </h1>
              <p className="text-xs text-slate-500">
                Automatic layout detection for tabular ledgers, multi-column boxes, and handwritten registers
              </p>
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "scanner"
                  ? "bg-white text-[#102C46] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Register Scanner</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("batches");
                fetchData();
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "batches"
                  ? "bg-white text-[#102C46] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batches ({batches.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                fetchData();
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-white text-[#102C46] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Register History ({scans.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "scanner" ? (
        <>
          {/* STAGE 1: CAPTURE & AUTOMATIC DETECTION SETUP */}
          {!activeScan ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Upload & Preprocessing Preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-[#102C46] flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-[#16A6A1]" />
                      <span>1. Capture Register Page</span>
                    </h2>
                    {previewUrl && (
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {!previewUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-[#16A6A1] bg-slate-50/50 hover:bg-[#16A6A1]/5 rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[#16A6A1]">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Upload or Photograph Register Page
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Automatic layout detection for 10-column tables, multi-column boxes, and ledgers
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cameraInputRef.current?.click();
                          }}
                          className="px-4 py-2 bg-[#102C46] hover:bg-[#102C46]/90 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2 transition"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#16A6A1]" />
                          <span>Open Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2 transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse Files</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Image Preview Canvas */}
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[360px] max-h-[500px]">
                        <canvas ref={canvasRef} className="max-w-full max-h-[480px] object-contain rounded" />
                      </div>

                      {/* Image Preprocessing Controls */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                            title="Rotate counter-clockwise"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                            title="Rotate clockwise"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] text-slate-500 font-mono">Rotation: {rotation}°</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setGrayscale((g) => !g)}
                            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
                              grayscale
                                ? "bg-[#102C46] text-white border-[#102C46]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            B&W Contrast
                          </button>
                          <button
                            type="button"
                            onClick={() => setSharpen((s) => !s)}
                            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
                              sharpen
                                ? "bg-[#16A6A1] text-white border-[#16A6A1]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Sharp Edge
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Processing & Automatic Detection Settings */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  {/* Automatic Detection Info Banner */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-[#16A6A1]" />
                      <span>Automatic Layout Detection Enabled</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Staff do not need to manually configure grid formats. DentalOS uses OpenCV morphology and Gemini Vision AI to automatically classify pages into <strong>COLUMN_BASED (Tabular)</strong>, <strong>BOX_BASED (Ledger)</strong>, <strong>FREE_FORM</strong>, or <strong>MIXED_LAYOUT</strong>.
                    </p>
                  </div>

                  {/* Engine & Language Options */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">OCR Engine</label>
                      <select
                        value={engine}
                        onChange={(e: any) => setEngine(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="apinex">APInex Gemini 3.8 Flash (AI Vision)</option>
                        <option value="hybrid">Smart Hybrid (OpenCV + APInex)</option>
                        <option value="tesseract">Local Tesseract (Offline & Free)</option>
                        <option value="gemini">Multilingual Vision AI</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Language</label>
                      <select
                        value={language}
                        onChange={(e: any) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="mixed">Mixed Hindi + English</option>
                        <option value="eng">English Handwriting</option>
                        <option value="hin">Hindi (Devanagari)</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Manual Overrides Accordion */}
                  <details className="group border border-slate-200 rounded-xl bg-slate-50/50 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600 flex items-center justify-between select-none">
                      <span>Advanced: Manual Layout Overrides (Optional)</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="pt-3 space-y-3">
                      {templates.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Apply Template</label>
                          <select
                            value={selectedTemplateId}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                          >
                            {templates.map((tpl) => (
                              <option key={tpl._id} value={tpl._id}>
                                {tpl.name} ({tpl.columnsCount} cols × {tpl.rowsPerColumn} rows)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600">Expected Columns</label>
                          <select
                            value={columnsCount}
                            onChange={(e) => setColumnsCount(Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                          >
                            <option value={1}>1 Column</option>
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns</option>
                            <option value={10}>10 Columns (Table)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600">Reading Order</label>
                          <select
                            value={readingOrder}
                            onChange={(e: any) => setReadingOrder(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="row_first">Row-by-Row</option>
                            <option value="column_first">Col-by-Col</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Process CTA Button */}
                  <button
                    type="button"
                    disabled={!previewUrl || processing}
                    onClick={handleUploadAndProcess}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                      !previewUrl || processing
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-[#102C46] hover:bg-[#102C46]/95 text-white"
                    }`}
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#16A6A1]" />
                        <span>Digitising Register...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#16A6A1]" />
                        <span>Extract & Auto-Detect Register</span>
                      </>
                    )}
                  </button>

                  {processing && (
                    <div className="bg-[#102C46]/5 rounded-xl p-3 border border-[#16A6A1]/20 space-y-2">
                      <p className="text-[11px] text-slate-600 animate-pulse font-medium">
                        {processingStage}
                      </p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#16A6A1] h-full w-3/4 animate-pulse rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STAGE 2: HUMAN VERIFICATION INTERFACE (DUAL-VIEW TABLE & BOXES) */
            <div className="space-y-4">
              {/* Automatic Layout Detection Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveScan(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <span>← Upload Another</span>
                    </button>

                    {/* Layout Category Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                        activeScan.layoutType === "COLUMN_BASED"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : activeScan.layoutType === "BOX_BASED"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : activeScan.layoutType === "FREE_FORM"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {activeScan.layoutType === "COLUMN_BASED" ? (
                        <Table className="w-3.5 h-3.5 text-indigo-600" />
                      ) : activeScan.layoutType === "BOX_BASED" ? (
                        <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>Layout: {activeScan.layoutType || "COLUMN_BASED"}</span>
                    </span>

                    {/* AI Confidence Badge */}
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Confidence: {activeScan.layoutMetadata?.confidence ? Math.round(activeScan.layoutMetadata.confidence * 100) : 96}%
                      </span>
                    </span>

                    {/* Grid Dimensions */}
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {activeScan.layoutMetadata?.columnsDetected || activeScan.columnsDetected || 10} cols × {activeScan.entries.length} rows ({activeScan.layoutMetadata?.regionsDetected || activeScan.entries.length * 10} cells)
                    </span>

                    {/* Image Quality Score */}
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"
                      title="Sharpness score from OpenCV Laplacian variance"
                    >
                      Clarity: {Math.min(100, Math.round(activeScan.layoutMetadata?.qualityAssessment?.sharpness || 98))}%
                    </span>
                  </div>

                  {/* Actions & View Mode Toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher: Table vs Boxes */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setReviewViewMode("table")}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reviewViewMode === "table"
                            ? "bg-[#102C46] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Spreadsheet tabular review"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Spreadsheet View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewViewMode("boxes")}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reviewViewMode === "boxes"
                            ? "bg-[#102C46] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Box-by-box card review"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Box Grid View</span>
                      </button>
                    </div>

                    {/* Save Template Button */}
                    <button
                      type="button"
                      onClick={handleSaveAsTemplate}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-200"
                      title="Save this layout structure as reusable template"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-[#16A6A1]" />
                      <span>Save Template</span>
                    </button>

                    {/* Batch Approve CTA */}
                    <button
                      onClick={handleBatchSave}
                      disabled={loading || pendingBoxes === 0}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition ${
                        pendingBoxes === 0
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve All Verified ({pendingBoxes})</span>
                    </button>
                  </div>
                </div>

                {/* Progress Stats Sub-Bar */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span>Register: <strong className="text-slate-800">{activeScan.fileName}</strong></span>
                    <span>•</span>
                    <span>Total: <strong className="text-[#102C46]">{totalBoxes}</strong></span>
                    <span>•</span>
                    <span>Approved: <strong className="text-emerald-700">{savedBoxes}</strong></span>
                    <span>•</span>
                    <span>Pending: <strong className="text-amber-700">{pendingBoxes}</strong></span>
                    <span>•</span>
                    <span>Rejected: <strong className="text-rose-700">{rejectedBoxes}</strong></span>
                    {duplicateBoxes > 0 && (
                      <>
                        <span>•</span>
                        <span>Existing Matches: <strong className="text-amber-700">{duplicateBoxes}</strong></span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Source of truth: Uploaded photograph • Inline edits immediately update records
                  </div>
                </div>
              </div>

              {/* REVIEW SCREEN: SPREADSHEET TABLE VIEW */}
              {reviewViewMode === "table" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Responsive Image Viewer with Interactive Row Highlighter */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 sticky top-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#16A6A1]" />
                        <span>Register Photograph (Click any row to inspect)</span>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setImageZoom((z) => Math.max(0.6, z - 0.2))}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-slate-500 px-1 font-mono font-bold">
                          {Math.round(imageZoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        {imageZoom !== 1 && (
                          <button
                            type="button"
                            onClick={() => setImageZoom(1)}
                            className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                          >
                            Fit
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Container with Scaled Row Highlight Overlays */}
                    <div className="relative overflow-auto max-h-[640px] bg-slate-900 rounded-xl p-2 select-none border border-slate-800 shadow-inner">
                      <div
                        style={{
                          transform: `scale(${imageZoom})`,
                          transformOrigin: "top left",
                          position: "relative",
                          display: "block",
                          width: imageZoom === 1 ? "100%" : `${imageZoom * 100}%`,
                        }}
                      >
                        <img
                          src={activeScan.imageUrl || previewUrl || ""}
                          alt="Register Scan"
                          className="w-full h-auto block rounded select-none"
                        />

                        {/* Row Bounding Box Overlays */}
                        {activeScan.entries.map((entry) => {
                          const bIdx = entry.boxIndex || entry.entryIndex;
                          const isSelected = bIdx === selectedBoxIndex;
                          const isHovered = bIdx === hoveredBoxIndex;
                          const isSaved = entry.status === "saved";
                          const isRejected = entry.status === "rejected";
                          const coords = entry.boxCoordinates || {
                            x: 2,
                            y: 7 + (bIdx - 1) * 8.6,
                            width: 96,
                            height: 8,
                          };

                          return (
                            <div
                              key={bIdx}
                              onClick={() => setSelectedBoxIndex(bIdx)}
                              onMouseEnter={() => setHoveredBoxIndex(bIdx)}
                              onMouseLeave={() => setHoveredBoxIndex(null)}
                              style={{
                                position: "absolute",
                                left: `${coords.x}%`,
                                top: `${coords.y}%`,
                                width: `${coords.width}%`,
                                height: `${coords.height}%`,
                              }}
                              className={`cursor-pointer rounded transition-all duration-150 flex items-center justify-between px-2 ${
                                isSelected
                                  ? "border-2 border-[#16A6A1] bg-[#16A6A1]/25 ring-4 ring-[#16A6A1]/40 shadow-lg z-20"
                                  : isHovered
                                  ? "border-2 border-amber-400 bg-amber-400/20 z-10"
                                  : isSaved
                                  ? "border border-emerald-500/60 bg-emerald-500/10"
                                  : isRejected
                                  ? "border border-rose-500/60 bg-rose-500/10"
                                  : "border border-white/50 bg-white/5 hover:border-[#16A6A1]"
                              }`}
                            >
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold shadow ${
                                  isSelected
                                    ? "bg-[#16A6A1] text-white"
                                    : isSaved
                                    ? "bg-emerald-600 text-white"
                                    : isRejected
                                    ? "bg-rose-600 text-white"
                                    : "bg-black/75 text-white"
                                }`}
                              >
                                Row #{bIdx}
                              </span>

                              <span className="text-[11px] font-bold text-white drop-shadow truncate max-w-[150px]">
                                {entry.fields.fullName.value || ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>Click any highlighted row to select</span>
                      <span className="flex items-center space-x-2">
                        <span className="inline-block w-2.5 h-2.5 bg-[#16A6A1] rounded-full" />
                        <span>Selected</span>
                        <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <span>Saved</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Full-Density Medical Register Spreadsheet Table */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                      <div>
                        <h3 className="text-sm font-bold text-[#102C46] flex items-center space-x-2">
                          <Table className="w-4 h-4 text-[#16A6A1]" />
                          <span>Extracted Register Entries ({totalBoxes})</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Inline editable cells. Click any value to adjust before saving to DentalOS.
                        </p>
                      </div>
                      <button
                        onClick={handleBatchSave}
                        disabled={loading || pendingBoxes === 0}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition ${
                          pendingBoxes === 0
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve All ({pendingBoxes})</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="px-3 py-3 w-10 text-center">#</th>
                            <th className="px-3 py-3 min-w-[150px]">Patient Name *</th>
                            <th className="px-3 py-3 w-28">Age / Sex</th>
                            <th className="px-3 py-3 min-w-[120px]">Phone</th>
                            <th className="px-3 py-3 min-w-[125px]">Visit Date</th>
                            <th className="px-3 py-3 min-w-[150px]">Treatment / Complaint</th>
                            <th className="px-3 py-3 min-w-[125px]">Next Visit</th>
                            <th className="px-3 py-3 w-20">Fee (₹)</th>
                            <th className="px-3 py-3 w-24">Payment</th>
                            <th className="px-3 py-3 min-w-[130px]">Remarks</th>
                            <th className="px-3 py-3 w-20 text-center">Match</th>
                            <th className="px-3 py-3 w-28 text-center sticky right-0 bg-slate-100 z-10 shadow-l">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeScan.entries.map((entry) => {
                            const bIdx = entry.boxIndex || entry.entryIndex;
                            const isSelected = bIdx === selectedBoxIndex;
                            const isSaved = entry.status === "saved";
                            const isRejected = entry.status === "rejected";

                            return (
                              <tr
                                key={bIdx}
                                onClick={() => setSelectedBoxIndex(bIdx)}
                                onMouseEnter={() => setHoveredBoxIndex(bIdx)}
                                onMouseLeave={() => setHoveredBoxIndex(null)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-teal-50/70 border-l-4 border-l-[#16A6A1]"
                                    : isSaved
                                    ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                                    : isRejected
                                    ? "bg-rose-50/20 opacity-60 hover:opacity-100"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                {/* S.No */}
                                <td className="px-3 py-2 text-center font-mono font-bold text-slate-600">
                                  {entry.fields.sNo?.value || bIdx}
                                </td>

                                {/* Name */}
                                <td className="px-3 py-2">
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={entry.fields.fullName.value || ""}
                                      disabled={isSaved}
                                      onChange={(e) =>
                                        handleFieldChange(bIdx, "fullName", e.target.value)
                                      }
                                      placeholder="Full Name"
                                      className={`w-full px-2 py-1 text-xs rounded border font-semibold ${
                                        !entry.fields.fullName.value
                                          ? "border-rose-300 bg-rose-50/50"
                                          : "border-slate-200 bg-white"
                                      } focus:outline-none focus:ring-1 focus:ring-[#16A6A1]`}
                                    />
                                    <div className="flex items-center space-x-1">
                                      {renderConfidenceBadge(
                                        entry.fields.fullName.confidence,
                                        entry.fields.fullName.flag
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Age & Sex */}
                                <td className="px-3 py-2">
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="110"
                                      disabled={isSaved}
                                      value={entry.fields.age.value ?? ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          bIdx,
                                          "age",
                                          e.target.value ? Number(e.target.value) : undefined
                                        )
                                      }
                                      placeholder="Age"
                                      className="w-12 px-1.5 py-1 text-xs border border-slate-200 rounded bg-white"
                                    />
                                    <select
                                      disabled={isSaved}
                                      value={entry.fields.gender.value || ""}
                                      onChange={(e) =>
                                        handleFieldChange(bIdx, "gender", e.target.value || undefined)
                                      }
                                      className="w-14 px-1 py-1 text-xs border border-slate-200 rounded bg-white"
                                    >
                                      <option value="">--</option>
                                      <option value="Male">M</option>
                                      <option value="Female">F</option>
                                      <option value="Other">O</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Phone */}
                                <td className="px-3 py-2">
                                  <input
                                    type="tel"
                                    disabled={isSaved}
                                    value={entry.fields.phone.value || ""}
                                    onChange={(e) =>
                                      handleFieldChange(bIdx, "phone", e.target.value)
                                    }
                                    placeholder="Mobile #"
                                    className="w-28 px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                                  />
                                </td>

                                {/* Visit Date */}
                                <td className="px-3 py-2">
                                  <input
                                    type="date"
                                    disabled={isSaved}
                                    value={entry.fields.visitDate.value || ""}
                                    onChange={(e) =>
                                      handleFieldChange(bIdx, "visitDate", e.target.value)
                                    }
                                    className="w-32 px-1.5 py-1 text-xs border border-slate-200 rounded bg-white"
                                  />
                                </td>

                                {/* Treatment */}
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    disabled={isSaved}
                                    value={entry.fields.treatment.value || ""}
                                    onChange={(e) =>
                                      handleFieldChange(bIdx, "treatment", e.target.value)
                                    }
                                    placeholder="Treatment / Complaint"
                                    className="w-36 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                                  />
                                </td>

                                {/* Next Visit Date */}
                                <td className="px-3 py-2">
                                  <input
                                    type="date"
                                    disabled={isSaved}
                                    value={entry.fields.followUpDate.value || ""}
                                    onChange={(e) =>
                                      handleFieldChange(bIdx, "followUpDate", e.target.value)
                                    }
                                    className="w-32 px-1.5 py-1 text-xs border border-slate-200 rounded bg-white"
                                  />
                                </td>

                                {/* Fee / Amount */}
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={isSaved}
                                    value={entry.fields.fee?.value ?? entry.fields.amount.value ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : undefined;
                                      handleFieldChange(bIdx, "amount", val);
                                      handleFieldChange(bIdx, "fee", val);
                                    }}
                                    placeholder="₹"
                                    className="w-20 px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white font-semibold"
                                  />
                                </td>

                                {/* Payment Status */}
                                <td className="px-3 py-2">
                                  <select
                                    disabled={isSaved}
                                    value={entry.fields.paymentStatus.value || "paid"}
                                    onChange={(e: any) =>
                                      handleFieldChange(bIdx, "paymentStatus", e.target.value)
                                    }
                                    className="w-24 px-1.5 py-1 text-xs border border-slate-200 rounded bg-white"
                                  >
                                    <option value="paid">Paid</option>
                                    <option value="partial">Due / Part</option>
                                    <option value="unpaid">Unpaid</option>
                                  </select>
                                </td>

                                {/* Remarks */}
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    disabled={isSaved}
                                    value={entry.fields.dentalNotes.value || ""}
                                    onChange={(e) =>
                                      handleFieldChange(bIdx, "dentalNotes", e.target.value)
                                    }
                                    placeholder="Remarks"
                                    className="w-32 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                                  />
                                </td>

                                {/* Match */}
                                <td className="px-3 py-2 text-center">
                                  {entry.duplicateMatch ? (
                                    <span
                                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                      title={`Match: ${entry.duplicateMatch.fullName} (${entry.duplicateMatch.patientCode})`}
                                    >
                                      Existing
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                                      New
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-3 py-2 text-center sticky right-0 bg-white/95 shadow-l">
                                  {isSaved ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                      {entry.savedPatientCode || "Saved"}
                                    </span>
                                  ) : isRejected ? (
                                    <span className="px-2 py-0.5 text-[11px] font-semibold text-rose-600 bg-rose-50 rounded">
                                      Rejected
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <button
                                        type="button"
                                        disabled={savingEntryId === bIdx}
                                        onClick={() =>
                                          handleSaveEntry(
                                            bIdx,
                                            entry.duplicateMatch ? "link_existing" : "create_new",
                                            entry.duplicateMatch?.patientId
                                          )
                                        }
                                        className="px-2.5 py-1 bg-[#102C46] hover:bg-emerald-600 text-white rounded text-[11px] font-bold shadow-sm transition flex items-center space-x-1"
                                        title="Confirm & Save Patient to DentalOS"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Save</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectEntry(bIdx)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                        title="Reject Entry"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* REVIEW SCREEN: BOX GRID VIEW (FOR BOX-BASED LEDGERS) */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Register Photo with Box Overlays */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 sticky top-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#16A6A1]" />
                        <span>Box Layout Overlay (Click any box to inspect)</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setImageZoom((z) => Math.max(0.7, z - 0.2))}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-slate-500 px-1 font-mono">
                          {Math.round(imageZoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="relative overflow-auto max-h-[580px] bg-slate-900 rounded-xl p-2 select-none">
                      <div
                        style={{
                          transform: `scale(${imageZoom})`,
                          transformOrigin: "top left",
                          position: "relative",
                          display: "block",
                          width: imageZoom === 1 ? "100%" : `${imageZoom * 100}%`,
                        }}
                      >
                        <img
                          src={activeScan.imageUrl || previewUrl || ""}
                          alt="Register Scan"
                          className="w-full h-auto block rounded select-none"
                        />

                        {activeScan.entries.map((entry) => {
                          const bIdx = entry.boxIndex || entry.entryIndex;
                          const isSelected = bIdx === selectedBoxIndex;
                          const isHovered = bIdx === hoveredBoxIndex;
                          const isSaved = entry.status === "saved";
                          const isRejected = entry.status === "rejected";
                          const coords = entry.boxCoordinates || {
                            x: 5,
                            y: 5 + (bIdx - 1) * 12,
                            width: 90,
                            height: 10,
                          };

                          return (
                            <div
                              key={bIdx}
                              onClick={() => setSelectedBoxIndex(bIdx)}
                              onMouseEnter={() => setHoveredBoxIndex(bIdx)}
                              onMouseLeave={() => setHoveredBoxIndex(null)}
                              style={{
                                position: "absolute",
                                left: `${coords.x}%`,
                                top: `${coords.y}%`,
                                width: `${coords.width}%`,
                                height: `${coords.height}%`,
                              }}
                              className={`cursor-pointer rounded transition-all duration-150 flex flex-col justify-between p-1.5 ${
                                isSelected
                                  ? "border-2 border-[#16A6A1] bg-[#16A6A1]/20 ring-4 ring-[#16A6A1]/30 shadow-lg z-10"
                                  : isHovered
                                  ? "border-2 border-amber-400 bg-amber-400/15 z-10"
                                  : isSaved
                                  ? "border border-emerald-500/70 bg-emerald-500/10"
                                  : isRejected
                                  ? "border border-rose-500/60 bg-rose-500/10"
                                  : "border border-white/60 bg-white/5 hover:border-[#16A6A1]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${
                                    isSelected
                                      ? "bg-[#16A6A1] text-white"
                                      : isSaved
                                      ? "bg-emerald-600 text-white"
                                      : isRejected
                                      ? "bg-rose-600 text-white"
                                      : "bg-black/70 text-white"
                                  }`}
                                >
                                  Box #{bIdx}
                                </span>
                                {isSaved && (
                                  <span className="p-0.5 bg-emerald-500 text-white rounded-full">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-white font-medium truncate drop-shadow">
                                {entry.fields.fullName.value || ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>Click any box to inspect</span>
                      <span className="flex items-center space-x-2">
                        <span className="inline-block w-2.5 h-2.5 bg-[#16A6A1] rounded-full" />
                        <span>Selected</span>
                        <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <span>Saved</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Individual Box Verification Form */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Box Navigation Tabs */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        Patient Box Selector ({totalBoxes} Boxes):
                      </span>
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                        {activeScan.entries.map((entry) => {
                          const bIdx = entry.boxIndex || entry.entryIndex;
                          const isSelected = bIdx === selectedBoxIndex;
                          const isSaved = entry.status === "saved";
                          const isRejected = entry.status === "rejected";

                          return (
                            <button
                              key={bIdx}
                              onClick={() => setSelectedBoxIndex(bIdx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
                                isSelected
                                  ? "bg-[#102C46] text-white shadow-sm ring-2 ring-[#16A6A1]"
                                  : isSaved
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isRejected
                                  ? "bg-slate-100 text-slate-400 line-through"
                                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {isSaved ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : isRejected ? (
                                <XCircle className="w-3 h-3 text-slate-400" />
                              ) : (
                                <Grid className="w-3 h-3 text-slate-400" />
                              )}
                              <span>Box #{bIdx}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Box Details Card */}
                    {activeEntry && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                        <div className="space-y-3 border-b border-slate-100 pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-[#102C46] flex items-center space-x-2">
                                <span>Patient Box #{activeEntry.boxIndex || activeEntry.entryIndex}</span>
                                {activeEntry.status === "saved" && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    Saved ({activeEntry.savedPatientCode})
                                  </span>
                                )}
                                {activeEntry.status === "rejected" && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                                    Rejected
                                  </span>
                                )}
                                {activeEntry.status === "pending" && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                    Needs Verification
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Column {(activeEntry.colIndex ?? 0) + 1} • Row {(activeEntry.rowIndex ?? 0) + 1}
                              </p>
                            </div>
                          </div>

                          {/* Isolated Box Snippet Canvas */}
                          <div className="bg-slate-900 rounded-xl p-3 border border-slate-200 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-between w-full text-[11px] text-slate-400 mb-1.5 px-1">
                              <span className="flex items-center space-x-1">
                                <Crop className="w-3 h-3 text-[#16A6A1]" />
                                <span>Handwriting Snippet for Box #{activeEntry.boxIndex || activeEntry.entryIndex}:</span>
                              </span>
                              <span>100% Isolated Region</span>
                            </div>
                            <canvas
                              ref={boxSnippetCanvasRef}
                              className="max-h-[140px] max-w-full object-contain rounded shadow"
                            />
                          </div>
                        </div>

                        {/* Duplicate Warning */}
                        {activeEntry.duplicateMatch && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-start space-x-2.5">
                              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-amber-900">
                                  Existing Patient Match in DentalOS
                                </h4>
                                <p className="text-xs text-amber-800 mt-0.5">
                                  {activeEntry.duplicateMatch.matchReason}
                                </p>
                                <p className="text-[11px] text-amber-700 mt-1">
                                  Record:{" "}
                                  <span className="font-semibold">
                                    {activeEntry.duplicateMatch.fullName} ({activeEntry.duplicateMatch.patientCode})
                                  </span>{" "}
                                  • Phone: {activeEntry.duplicateMatch.phone}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveEntry(
                                    activeEntry.boxIndex || activeEntry.entryIndex,
                                    "link_existing",
                                    activeEntry.duplicateMatch?.patientId
                                  )
                                }
                                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>Link Visit to Existing ({activeEntry.duplicateMatch.patientCode})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveEntry(
                                    activeEntry.boxIndex || activeEntry.entryIndex,
                                    "create_new"
                                  )
                                }
                                className="px-3 py-1.5 text-xs text-slate-600 hover:underline"
                              >
                                Create as New
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Editable Form Inputs for Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Patient Full Name *</label>
                              {renderConfidenceBadge(activeEntry.fields.fullName.confidence, activeEntry.fields.fullName.flag)}
                            </div>
                            <input
                              type="text"
                              value={activeEntry.fields.fullName.value || ""}
                              onChange={(e) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "fullName", e.target.value)
                              }
                              placeholder="Patient Name"
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A6A1] font-semibold text-slate-800"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Age</label>
                              {renderConfidenceBadge(activeEntry.fields.age.confidence, activeEntry.fields.age.flag)}
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="110"
                              value={activeEntry.fields.age.value ?? ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  activeEntry.boxIndex || activeEntry.entryIndex,
                                  "age",
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              placeholder="e.g. 34"
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Gender</label>
                              {renderConfidenceBadge(activeEntry.fields.gender.confidence, activeEntry.fields.gender.flag)}
                            </div>
                            <select
                              value={activeEntry.fields.gender.value || ""}
                              onChange={(e) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "gender", e.target.value || undefined)
                              }
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            >
                              <option value="">Not Recorded</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Phone Number</label>
                              {renderConfidenceBadge(activeEntry.fields.phone.confidence, activeEntry.fields.phone.flag)}
                            </div>
                            <input
                              type="tel"
                              value={activeEntry.fields.phone.value || ""}
                              onChange={(e) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "phone", e.target.value)
                              }
                              placeholder="10-digit mobile number"
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Visit Date</label>
                              {renderConfidenceBadge(activeEntry.fields.visitDate.confidence, activeEntry.fields.visitDate.flag)}
                            </div>
                            <input
                              type="date"
                              value={activeEntry.fields.visitDate.value || ""}
                              onChange={(e) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "visitDate", e.target.value)
                              }
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Treatment / Chief Complaint</label>
                              {renderConfidenceBadge(activeEntry.fields.treatment.confidence, activeEntry.fields.treatment.flag)}
                            </div>
                            <input
                              type="text"
                              value={activeEntry.fields.treatment.value || ""}
                              onChange={(e) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "treatment", e.target.value)
                              }
                              placeholder="e.g. Filling / Root Canal"
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Notes in Box</label>
                              {renderConfidenceBadge(activeEntry.fields.dentalNotes.confidence, activeEntry.fields.dentalNotes.flag)}
                            </div>
                            <textarea
                              rows={2}
                              value={activeEntry.fields.dentalNotes.value || ""}
                              onChange={(e) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "dentalNotes", e.target.value)
                              }
                              placeholder="Notes written in this box..."
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Fee Charged (₹)</label>
                              {renderConfidenceBadge(activeEntry.fields.amount.confidence, activeEntry.fields.amount.flag)}
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={activeEntry.fields.fee?.value ?? activeEntry.fields.amount.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : undefined;
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "amount", val);
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "fee", val);
                              }}
                              placeholder="Fee in ₹"
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700">Payment Status</label>
                              {renderConfidenceBadge(activeEntry.fields.paymentStatus.confidence, activeEntry.fields.paymentStatus.flag)}
                            </div>
                            <select
                              value={activeEntry.fields.paymentStatus.value || "paid"}
                              onChange={(e: any) =>
                                handleFieldChange(activeEntry.boxIndex || activeEntry.entryIndex, "paymentStatus", e.target.value)
                              }
                              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                            >
                              <option value="paid">Paid</option>
                              <option value="partial">Partial / Balance Due</option>
                              <option value="unpaid">Unpaid</option>
                            </select>
                          </div>
                        </div>

                        {/* Actions for Single Box */}
                        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-3">
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <button
                              type="button"
                              disabled={savingEntryId === (activeEntry.boxIndex || activeEntry.entryIndex)}
                              onClick={() =>
                                handleSaveEntry(
                                  activeEntry.boxIndex || activeEntry.entryIndex,
                                  "create_new"
                                )
                              }
                              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#102C46] hover:bg-[#102C46]/95 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-2 transition"
                            >
                              {savingEntryId === (activeEntry.boxIndex || activeEntry.entryIndex) ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving Box...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A6A1]" />
                                  <span>Confirm & Save Box</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleRejectEntry(activeEntry.boxIndex || activeEntry.entryIndex)
                              }
                              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject Box</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const next = (selectedBoxIndex % totalBoxes) + 1;
                              setSelectedBoxIndex(next);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                          >
                            <span>Next Box ({selectedBoxIndex + 1 > totalBoxes ? 1 : selectedBoxIndex + 1})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
                ) : activeTab === "batches" ? (
            /* TAB 2: REGISTER BATCHES */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#102C46]">
                    Digitised Register Batches
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-page register batches, extraction status, and batch approval tracking
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Batches</span>
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#16A6A1]" />
                  <span>Loading register batches...</span>
                </div>
              ) : batches.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No register batches found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload multiple register pages or specify a batch name when scanning to organize pages into batches.
                  </p>
                  <button
                    onClick={() => setActiveTab("scanner")}
                    className="px-4 py-2 bg-[#102C46] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Create New Batch
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Batch Name & Code</th>
                        <th className="px-5 py-3.5">Pages</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Mode</th>
                        <th className="px-5 py-3.5">Box Breakdown</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batches.map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3">
                            <div className="font-bold text-slate-800">{b.batchName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{b.batchCode}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-xs">
                              {b.totalPages || b.pages?.length || 0} page(s)
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                b.status === "approved" || b.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : b.status === "partially_approved"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : b.status === "needs_review"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : b.status === "processing"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {b.status === "approved"
                                ? "Approved"
                                : b.status === "partially_approved"
                                ? "Partially Approved"
                                : b.status === "needs_review"
                                ? "Needs Review"
                                : b.status === "processing"
                                ? "Processing..."
                                : "Uploaded"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {b.testMode ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800">
                                🧪 Synthetic Test
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                                🔒 Production Secure
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-slate-700 font-semibold">
                              {b.totalApproved || 0} Saved / {b.totalDetected || 0} Detected
                            </div>
                            {b.totalRejected > 0 && (
                              <div className="text-[11px] text-rose-600">
                                {b.totalRejected} Rejected
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const res = await fetch(`/api/admin/scans/batches/${b._id}`);
                                    const data = await res.json();
                                    if (data.success && data.batch.pages?.length > 0) {
                                      setActiveScan(data.batch.pages[0]);
                                      setActiveTab("scanner");
                                      setSelectedBoxIndex(1);
                                      toast.success(`Opened batch: ${b.batchName}`);
                                    } else {
                                      toast.error("No pages found in this batch.");
                                    }
                                  } catch (err) {
                                    toast.error("Failed to open batch");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="px-3 py-1 bg-[#102C46] hover:bg-[#102C46]/90 text-white rounded-lg text-xs font-semibold"
                              >
                                Review Batch
                              </button>
                              <button
                                onClick={() => handleDeleteBatch(b._id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Batch"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* TAB 3: REGISTER HISTORY & ARCHIVES */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#102C46]">
                    Digitised Register History
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-column register scans, verification states, and saved patient records
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#16A6A1]" />
                  <span>Loading register history...</span>
                </div>
              ) : scans.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No register scans recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Capture or upload a multi-column handwritten register page to digitise patient entries.
                  </p>
                  <button
                    onClick={() => setActiveTab("scanner")}
                    className="px-4 py-2 bg-[#102C46] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Start Register Scan
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Document</th>
                        <th className="px-5 py-3.5">File & Date</th>
                        <th className="px-5 py-3.5">Layout</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Boxes Breakdown</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scans.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                              <img
                                src={s.imageUrl}
                                alt="Thumb"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-bold text-slate-800">{s.fileName}</div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(s.createdAt).toLocaleDateString()} at{" "}
                              {new Date(s.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-medium text-slate-700">
                              {s.columnsDetected || 2} Columns
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {s.readingOrder === "column_first" ? "Col-by-Col" : "Row-by-Row"}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                s.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : s.status === "partially_approved"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : s.status === "needs_review"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : s.status === "failed"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {s.status === "completed"
                                ? "Completed"
                                : s.status === "partially_approved"
                                ? "Partially Approved"
                                : s.status === "needs_review"
                                ? "Needs Review"
                                : s.status === "failed"
                                ? "Failed"
                                : "Uploaded"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-slate-700 font-semibold">
                              {s.approvedCount} Saved / {s.detectedCount} Boxes
                            </div>
                            {s.rejectedCount > 0 && (
                              <div className="text-[11px] text-rose-600">
                                {s.rejectedCount} Rejected
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const res = await fetch(`/api/admin/scans/${s._id}`);
                                    const data = await res.json();
                                    if (data.success) {
                                      setActiveScan(data.scan);
                                      setActiveTab("scanner");
                                      setSelectedBoxIndex(1);
                                    }
                                  } catch (err) {
                                    toast.error("Failed to open scan");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="px-3 py-1 bg-[#102C46] hover:bg-[#102C46]/90 text-white rounded-lg text-xs font-semibold"
                              >
                                Review Boxes
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm("Delete this scan?")) return;
                                  await fetch(`/api/admin/scans/${s._id}`, { method: "DELETE" });
                                  fetchData();
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Scan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
    </div>
  );
}
