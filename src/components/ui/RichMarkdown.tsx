"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
  variant?: "screen" | "print";
};

// Renders Markdown (compatible with the output of ChatGPT) with styles
// tuned for either on-screen viewing or for the print PDF.
export function RichMarkdown({ children, variant = "screen" }: Props) {
  const isPrint = variant === "print";

  // Common inline style: tight spacing on print, breathable on screen.
  const baseFontSize = isPrint ? 12 : 14;
  const lineHeight = isPrint ? 1.55 : 1.7;
  const ink = isPrint ? "#0a0a0a" : "var(--color-text)";
  const muted = isPrint ? "#787876" : "var(--color-text-muted)";
  const accent = "#FF4501";
  const border = isPrint ? "#e6e6e3" : "var(--color-border)";

  return (
    <div
      style={{
        fontSize: baseFontSize,
        lineHeight,
        color: ink,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontWeight: 800,
                fontSize: isPrint ? 18 : 22,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                margin: isPrint ? "14px 0 6px" : "20px 0 8px",
                fontFamily: "var(--font-display)",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontWeight: 800,
                fontSize: isPrint ? 15 : 18,
                margin: isPrint ? "12px 0 5px" : "16px 0 6px",
                fontFamily: "var(--font-display)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: isPrint ? 14 : 18,
                  background: accent,
                  borderRadius: 2,
                  display: "inline-block",
                }}
              />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontWeight: 800,
                fontSize: isPrint ? 13 : 15,
                margin: isPrint ? "10px 0 4px" : "14px 0 5px",
                color: accent,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              style={{
                fontWeight: 700,
                fontSize: isPrint ? 12 : 14,
                margin: isPrint ? "8px 0 3px" : "12px 0 4px",
              }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => <p style={{ margin: isPrint ? "4px 0" : "8px 0" }}>{children}</p>,
          strong: ({ children }) => <strong style={{ fontWeight: 800 }}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
          ul: ({ children }) => (
            <ul style={{ margin: isPrint ? "4px 0 6px" : "6px 0 10px", paddingLeft: 22 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: isPrint ? "4px 0 6px" : "6px 0 10px", paddingLeft: 22 }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: isPrint ? "6px 0" : "10px 0",
                padding: "6px 12px",
                borderLeft: `3px solid ${accent}`,
                background: isPrint ? "#fafaf8" : "var(--color-surface-2)",
                color: muted,
                fontStyle: "italic",
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.92em",
                background: isPrint ? "#fafaf8" : "var(--color-surface-2)",
                padding: "1px 5px",
                borderRadius: 4,
                border: `1px solid ${border}`,
              }}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: isPrint ? 10.5 : 12,
                background: isPrint ? "#fafaf8" : "var(--color-surface-2)",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${border}`,
                overflow: "auto",
                margin: "8px 0",
              }}
            >
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: accent, textDecoration: "underline" }}
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${border}`,
                margin: isPrint ? "10px 0" : "16px 0",
              }}
            />
          ),
          table: ({ children }) => (
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                margin: "8px 0",
                fontSize: isPrint ? 10.5 : 13,
              }}
            >
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th
              style={{
                border: `1px solid ${border}`,
                padding: "5px 8px",
                background: isPrint ? "#fafaf8" : "var(--color-surface-2)",
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ border: `1px solid ${border}`, padding: "5px 8px" }}>{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
