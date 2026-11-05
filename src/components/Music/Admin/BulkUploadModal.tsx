"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { musicService } from "@/services/music.service";
import {
  BulkEntityType,
  BulkFormatType,
  downloadSampleTemplate,
  parseBulkFile,
  validateBulkRecords,
  ValidationResult,
} from "@/lib/bulkDataHandler";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileText,
  FileCode,
  Music,
  Mic2,
  Disc,
  ArrowRight,
  Filter,
} from "lucide-react";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [entity, setEntity] = useState<BulkEntityType>("songs");
  const [sampleFormat, setSampleFormat] = useState<BulkFormatType>("xlsx");

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [validatedRows, setValidatedRows] = useState<ValidationResult<any>[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [filterValidOnly, setFilterValidOnly] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle entity change -> reset states
  const handleEntityChange = (newEntity: BulkEntityType) => {
    setEntity(newEntity);
    setFile(null);
    setValidatedRows([]);
    setValidCount(0);
    setInvalidCount(0);
    setParseError(null);
    setImportResult(null);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    downloadSampleTemplate(entity, sampleFormat);
  };

  // Parse & Validate File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const records = await parseBulkFile(selected);
      if (!records || records.length === 0) {
        throw new Error("No records found in uploaded file.");
      }

      const { validated, validCount: vCount, invalidCount: invCount } = validateBulkRecords(
        entity,
        records
      );

      setValidatedRows(validated);
      setValidCount(vCount);
      setInvalidCount(invCount);
    } catch (err: any) {
      setParseError(err.message || "Failed to parse file. Please verify the format.");
      setValidatedRows([]);
      setValidCount(0);
      setInvalidCount(0);
    } finally {
      setIsParsing(false);
    }
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    const validItems = validatedRows.filter((r) => r.isValid).map((r) => r.item);
    if (validItems.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      let count = 0;
      if (entity === "songs") {
        const res = await musicService.bulkImportSongs(validItems);
        count = res.count;
      } else if (entity === "artists") {
        const res = await musicService.bulkImportArtists(validItems);
        count = res.count;
      } else if (entity === "albums") {
        const res = await musicService.bulkImportAlbums(validItems);
        count = res.count;
      }

      setImportResult({
        success: true,
        count,
        message: `Successfully imported ${count} ${entity} into the catalog!`,
      });
      onSuccess();
    } catch (err: any) {
      setImportResult({
        success: false,
        count: 0,
        message: err.message || "Failed to complete bulk import.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const displayedRows = filterValidOnly
    ? validatedRows.filter((r) => r.isValid)
    : validatedRows;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#181818] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-bold">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Bulk Catalog Importer</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  EXCEL &bull; CSV &bull; JSON
                </span>
              </h2>
              <p className="text-xs text-[#b3b3b3]">
                Verify requirements and batch-upload Songs, Artists, or Albums in bulk.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Select Entity & Export Sample Template */}
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#2e2e2e] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#727272] block">
              Step 1: Choose Entity & Download Sample Template
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Entity Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEntityChange("songs")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    entity === "songs"
                      ? "bg-[#1db954] text-black shadow-md shadow-[#1db954]/20"
                      : "bg-[#282828] text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Music className="size-3.5" />
                  <span>Tracks / Songs</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEntityChange("artists")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    entity === "artists"
                      ? "bg-[#1db954] text-black shadow-md shadow-[#1db954]/20"
                      : "bg-[#282828] text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Mic2 className="size-3.5" />
                  <span>Artists</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEntityChange("albums")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    entity === "albums"
                      ? "bg-[#1db954] text-black shadow-md shadow-[#1db954]/20"
                      : "bg-[#282828] text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Disc className="size-3.5" />
                  <span>Albums</span>
                </button>
              </div>

              {/* Format Selector + Download Button */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <select
                  value={sampleFormat}
                  onChange={(e) => setSampleFormat(e.target.value as BulkFormatType)}
                  className="h-8 px-2.5 rounded-lg bg-[#282828] border border-[#383838] text-xs text-white outline-none cursor-pointer"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>

                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/10"
                >
                  <Download className="size-3.5 text-emerald-400" />
                  <span>Export Sample File</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: Upload File Dropzone */}
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#2e2e2e] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#727272] block">
              Step 2: Upload Excel, CSV, or JSON File
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#383838] hover:border-[#1db954] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#181818]"
            >
              <Upload className="size-8 text-[#b3b3b3] mb-2" />
              <span className="text-xs font-semibold text-white">
                {file ? file.name : "Click to select or drag and drop spreadsheet / JSON file"}
              </span>
              <span className="text-[10px] text-[#727272] mt-1">
                Supports .xlsx, .xls, .csv, and .json formats
              </span>
              {isParsing && (
                <div className="flex items-center gap-2 mt-3 text-xs text-[#1db954] font-medium">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Parsing and verifying requirements...</span>
                </div>
              )}
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* STEP 3: Verification & Pre-Upload Validation Table */}
          {validatedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#202020] border border-[#2e2e2e]">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-white font-bold">
                    Parsed: <span className="font-mono">{validatedRows.length}</span>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    Valid: <span className="font-mono">{validCount}</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      Invalid: <span className="font-mono">{invalidCount}</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setFilterValidOnly(!filterValidOnly)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto ${
                    filterValidOnly
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-[#282828] border-[#383838] text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Filter className="size-3" />
                  <span>{filterValidOnly ? "Showing Valid Only" : "Show All Rows"}</span>
                </button>
              </div>

              {/* Table */}
              <div className="w-full max-h-64 overflow-auto rounded-xl border border-[#282828] bg-[#181818]">
                <table className="w-full text-left text-xs text-[#b3b3b3]">
                  <thead className="bg-[#202020] text-[10px] uppercase font-bold text-white sticky top-0 border-b border-[#282828]">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Title / Name</th>
                      {entity === "songs" && <th className="py-2.5 px-3">Artist</th>}
                      {entity === "songs" && <th className="py-2.5 px-3">Album</th>}
                      {entity === "songs" && <th className="py-2.5 px-3">Category</th>}
                      {entity === "artists" && <th className="py-2.5 px-3">Instagram</th>}
                      <th className="py-2.5 px-3">Validation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282828]">
                    {displayedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-white/5 transition-colors ${
                          !row.isValid ? "bg-red-500/5" : ""
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-[#727272]">
                          #{row.rawRow}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              <CheckCircle2 className="size-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">
                              <AlertTriangle className="size-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white truncate max-w-[150px]">
                          {row.item.name || "(Missing Name)"}
                        </td>
                        {entity === "songs" && (
                          <td className="py-2 px-3 truncate max-w-[120px]">
                            {row.item.artist || "-"}
                          </td>
                        )}
                        {entity === "songs" && (
                          <td className="py-2 px-3 truncate max-w-[120px]">
                            {row.item.album || "Single"}
                          </td>
                        )}
                        {entity === "songs" && (
                          <td className="py-2 px-3 truncate max-w-[100px]">
                            {row.item.category || "Pop"}
                          </td>
                        )}
                        {entity === "artists" && (
                          <td className="py-2 px-3 truncate max-w-[120px]">
                            @{row.item.instagram || "-"}
                          </td>
                        )}
                        <td className="py-2 px-3 text-[11px]">
                          {row.isValid ? (
                            <span className="text-[#727272]">Ready to insert</span>
                          ) : (
                            <span className="text-red-400 font-medium">
                              {row.errors.join(", ")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
                importResult.success
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {importResult.success ? (
                <CheckCircle2 className="size-5 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 shrink-0" />
              )}
              <span>{importResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#202020] border-t border-[#282828] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#282828] hover:bg-[#333333] text-[#b3b3b3] hover:text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isImporting || validCount === 0}
            className="px-6 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#383838] text-black font-extrabold text-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-[#1db954]/20"
          >
            {isImporting ? (
              <>
                <Loader2 className="size-4 animate-spin text-black" />
                <span>Importing to Catalog...</span>
              </>
            ) : (
              <>
                <span>Import {validCount} Valid Records</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

