"use client";

import React from "react";

type Props = {
  html: string;
  variant?: "screen" | "print";
};

// Renders rich HTML content (from the TipTap editor) with styling that
// matches the design system, tuned for either on-screen or print A4 output.
export function RichHtml({ html, variant = "screen" }: Props) {
  const isPrint = variant === "print";
  const cls = isPrint ? "rich-html rich-html-print" : "rich-html rich-html-screen";
  return <div className={cls} dangerouslySetInnerHTML={{ __html: html }} />;
}
