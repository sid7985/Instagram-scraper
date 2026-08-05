"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Table2, UploadCloud } from "lucide-react";

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="surface-card rounded-xl px-4 py-6 sm:py-8 flex flex-col items-center justify-center border-dashed border-2 hover:border-primary transition-all duration-300 group cursor-pointer relative overflow-hidden"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

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
        className="flex flex-col items-center text-center z-10 relative w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {fileName ? (
          <>
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-2 group-hover:scale-110 group-hover:border-primary/50 transition-transform duration-300">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-headline-sm text-on-surface mb-1 break-all text-center px-2">{fileName}</h3>
            <p className="text-xs text-on-surface-variant mb-3">Click to replace</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-2 group-hover:scale-110 group-hover:border-primary/50 transition-transform duration-300">
              <Table2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm sm:text-headline-sm text-on-surface mb-1">Upload Excel Data</h3>
            <p className="text-xs text-on-surface-variant mb-3 max-w-xs">
              Drag & drop or browse your .xlsx file
            </p>
            <button
              type="button"
              className="btn-secondary text-xs px-4 py-1.5"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Browse File
            </button>
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
