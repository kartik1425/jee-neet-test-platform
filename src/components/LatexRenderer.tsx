"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface LatexRendererProps {
  content: string;
  className?: string;
}

export function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    try {
      // Split by display math $$...$$ and inline math $...$
      // Replace $$...$$ first
      let processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return `<div class="my-2 overflow-x-auto">${katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
          })}</div>`;
        } catch (e) {
          return `$$${math}$$`;
        }
      });

      // Replace inline math $...$
      processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
          });
        } catch (e) {
          return `$${math}$`;
        }
      });

      // Replace newlines with <br/> where appropriate
      processed = processed.replace(/\n/g, "<br />");

      return processed;
    } catch (err) {
      console.error("Error rendering KaTeX content:", err);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`katex-content text-slate-900 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
