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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="surface-card rounded-xl p-4 sm:p-md flex flex-col items-center justify-center min-h-[240px] sm:min-h-[320px] md:min-h-[400px] border-dashed border-2 hover:border-primary transition-all duration-300 group cursor-pointer relative overflow-hidden"
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
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-3 sm:mb-md group-hover:scale-110 group-hover:border-primary/50 transition-transform duration-300">
              <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
            </div>
            <h3 className="text-headline-sm text-on-surface mb-xs break-all text-center px-2">{fileName}</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mb-4 sm:mb-lg px-2">Click to replace with another file</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-3 sm:mb-md group-hover:scale-110 group-hover:border-primary/50 transition-transform duration-300">
              <Table2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-headline-sm text-on-surface mb-xs">Upload Excel Data</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mb-4 sm:mb-lg px-2">
              Drag and drop your .xlsx or .xls file, or browse your local files.
            </p>
            <div className="flex gap-sm">
              <button
                type="button"
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Browse File
              </button>
            </div>
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
