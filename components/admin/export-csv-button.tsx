"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Column order + header labels. */
  headers: { key: string; label: string }[];
  rows: Record<string, string | number | null | undefined>[];
  filename: string;
  label: string;
};

/** Downloads the given rows as a UTF-8 CSV that opens directly in Excel. */
export function ExportCsvButton({ headers, rows, filename, label }: Props) {
  function esc(v: string | number | null | undefined): string {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function onExport() {
    const lines = [
      headers.map((h) => esc(h.label)).join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h.key])).join(",")),
    ];
    // BOM so Excel detects UTF-8 (Arabic text renders correctly).
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onExport}
      disabled={rows.length === 0}
      className="gap-2"
    >
      <Download className="size-4" />
      {label}
    </Button>
  );
}
