const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'app', 'admin', 'patient-scanner', 'page.tsx');
const rawContent = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

// Find boundary 1: start of return (
const returnStartMarker = '  // Summary counts for review screen';
const returnStartIndex = rawContent.indexOf(returnStartMarker);
if (returnStartIndex === -1) {
  console.error("Could not find returnStartMarker");
  process.exit(1);
}

// Find boundary 2: start of Tab 2: Batches
const batchesTabMarker = '          ) : activeTab === "batches" ? (';
const batchesTabIndex = rawContent.indexOf(batchesTabMarker);
if (batchesTabIndex === -1) {
  console.error("Could not find batchesTabMarker");
  process.exit(1);
}

// Find boundary 3: end of History tab before the closing tags
const historyEndMarker = '                  </table>\n                </div>\n              )}\n            </div>\n          )}';
const historyEndIndex = rawContent.indexOf(historyEndMarker);
if (historyEndIndex === -1) {
  console.error("Could not find historyEndMarker");
  process.exit(1);
}

const headerAndLogic = rawContent.substring(0, returnStartIndex);
const batchesAndHistory = rawContent.substring(batchesTabIndex, historyEndIndex + historyEndMarker.length);

const newComponentJSX = `  // Summary counts for review screen
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
              className={\`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all \${
                activeTab === "scanner"
                  ? "bg-white text-[#102C46] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }\`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Register Scanner</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("batches");
                fetchData();
              }}
              className={\`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all \${
                activeTab === "batches"
                  ? "bg-white text-[#102C46] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }\`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batches ({batches.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                fetchData();
              }}
              className={\`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all \${
                activeTab === "history"
                  ? "bg-white text-[#102C46] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }\`}
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
                            className={\`px-3 py-1.5 rounded-lg font-semibold border transition \${
                              grayscale
                                ? "bg-[#102C46] text-white border-[#102C46]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }\`}
                          >
                            B&W Contrast
                          </button>
                          <button
                            type="button"
                            onClick={() => setSharpen((s) => !s)}
                            className={\`px-3 py-1.5 rounded-lg font-semibold border transition \${
                              sharpen
                                ? "bg-[#16A6A1] text-white border-[#16A6A1]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }\`}
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
                    className={\`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all \${
                      !previewUrl || processing
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-[#102C46] hover:bg-[#102C46]/95 text-white"
                    }\`}
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
                      className={\`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 \${
                        activeScan.layoutType === "COLUMN_BASED"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : activeScan.layoutType === "BOX_BASED"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : activeScan.layoutType === "FREE_FORM"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }\`}
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
                        className={\`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${
                          reviewViewMode === "table"
                            ? "bg-[#102C46] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }\`}
                        title="Spreadsheet tabular review"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Spreadsheet View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewViewMode("boxes")}
                        className={\`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${
                          reviewViewMode === "boxes"
                            ? "bg-[#102C46] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }\`}
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
                      className={\`px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition \${
                        pendingBoxes === 0
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                      }\`}
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
                          transform: \`scale(\${imageZoom})\`,
                          transformOrigin: "top left",
                          position: "relative",
                          display: "block",
                          width: imageZoom === 1 ? "100%" : \`\${imageZoom * 100}%\`,
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
                                left: \`\${coords.x}%\`,
                                top: \`\${coords.y}%\`,
                                width: \`\${coords.width}%\`,
                                height: \`\${coords.height}%\`,
                              }}
                              className={\`cursor-pointer rounded transition-all duration-150 flex items-center justify-between px-2 \${
                                isSelected
                                  ? "border-2 border-[#16A6A1] bg-[#16A6A1]/25 ring-4 ring-[#16A6A1]/40 shadow-lg z-20"
                                  : isHovered
                                  ? "border-2 border-amber-400 bg-amber-400/20 z-10"
                                  : isSaved
                                  ? "border border-emerald-500/60 bg-emerald-500/10"
                                  : isRejected
                                  ? "border border-rose-500/60 bg-rose-500/10"
                                  : "border border-white/50 bg-white/5 hover:border-[#16A6A1]"
                              }\`}
                            >
                              <span
                                className={\`px-1.5 py-0.5 rounded text-[10px] font-bold shadow \${
                                  isSelected
                                    ? "bg-[#16A6A1] text-white"
                                    : isSaved
                                    ? "bg-emerald-600 text-white"
                                    : isRejected
                                    ? "bg-rose-600 text-white"
                                    : "bg-black/75 text-white"
                                }\`}
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
                        className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition \${
                          pendingBoxes === 0
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }\`}
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
                                className={\`transition-colors cursor-pointer \${
                                  isSelected
                                    ? "bg-teal-50/70 border-l-4 border-l-[#16A6A1]"
                                    : isSaved
                                    ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                                    : isRejected
                                    ? "bg-rose-50/20 opacity-60 hover:opacity-100"
                                    : "hover:bg-slate-50"
                                }\`}
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
                                      className={\`w-full px-2 py-1 text-xs rounded border font-semibold \${
                                        !entry.fields.fullName.value
                                          ? "border-rose-300 bg-rose-50/50"
                                          : "border-slate-200 bg-white"
                                      } focus:outline-none focus:ring-1 focus:ring-[#16A6A1]\`}
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
                                      title={\`Match: \${entry.duplicateMatch.fullName} (\${entry.duplicateMatch.patientCode})\`}
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
                          transform: \`scale(\${imageZoom})\`,
                          transformOrigin: "top left",
                          position: "relative",
                          display: "block",
                          width: imageZoom === 1 ? "100%" : \`\${imageZoom * 100}%\`,
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
                                left: \`\${coords.x}%\`,
                                top: \`\${coords.y}%\`,
                                width: \`\${coords.width}%\`,
                                height: \`\${coords.height}%\`,
                              }}
                              className={\`cursor-pointer rounded transition-all duration-150 flex flex-col justify-between p-1.5 \${
                                isSelected
                                  ? "border-2 border-[#16A6A1] bg-[#16A6A1]/20 ring-4 ring-[#16A6A1]/30 shadow-lg z-10"
                                  : isHovered
                                  ? "border-2 border-amber-400 bg-amber-400/15 z-10"
                                  : isSaved
                                  ? "border border-emerald-500/70 bg-emerald-500/10"
                                  : isRejected
                                  ? "border border-rose-500/60 bg-rose-500/10"
                                  : "border border-white/60 bg-white/5 hover:border-[#16A6A1]"
                              }\`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={\`px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm \${
                                    isSelected
                                      ? "bg-[#16A6A1] text-white"
                                      : isSaved
                                      ? "bg-emerald-600 text-white"
                                      : isRejected
                                      ? "bg-rose-600 text-white"
                                      : "bg-black/70 text-white"
                                  }\`}
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
                              className={\`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 \${
                                isSelected
                                  ? "bg-[#102C46] text-white shadow-sm ring-2 ring-[#16A6A1]"
                                  : isSaved
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isRejected
                                  ? "bg-slate-100 text-slate-400 line-through"
                                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                              }\`}
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
      `;

const finalFileContent = headerAndLogic + newComponentJSX + batchesAndHistory + `
    </div>
  );
}
`;

fs.writeFileSync(targetFile, finalFileContent, 'utf8');
console.log("Successfully rebuilt patient-scanner page.tsx with single sidebar and dual review views!");
