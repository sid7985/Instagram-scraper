"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

interface UploadDropzoneProps {
  fileName: string | null;
  onFile: (file: File) => void;
  disabled: boolean;
}

export default function UploadDropzone({ fileName, onFile, disabled }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card p-1"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed px-6 py-12 transition disabled:cursor-not-allowed disabled:opacity-50 ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-border bg-[#101010] hover:border-accent/60"
        }`}
      >
        {fileName ? (
          <>
            <FileSpreadsheet className="h-10 w-10 text-success" />
            <p className="text-sm font-semibold">{fileName}</p>
            <p className="text-xs text-gray-500">Click to replace</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <UploadCloud className="h-7 w-7 text-accent" />
            </div>
            <p className="text-sm font-semibold text-gray-200">
              Drop your Excel file here
            </p>
            <p className="text-xs text-gray-500">
              or click to browse · .xlsx / .xls · one column of Instagram URLs
            </p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </motion.div>
  );
}
