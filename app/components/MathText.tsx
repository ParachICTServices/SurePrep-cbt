"use client";
import { useEffect, useRef } from "react";


interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean; // true → render as display math (centered, larger)
}

export function MathText({ text, className = "", block = false }: MathTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import KaTeX so it only loads when needed
    import("katex").then((katex) => {
      if (!containerRef.current) return;

      // Split on $...$ — captures both the delimiters and the content
      const parts = text.split(/(\$[^$]+\$)/g);

      // Clear previous content
      containerRef.current.innerHTML = "";

      parts.forEach((part) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          // Math segment — strip the $ delimiters and render
          const mathExpr = part.slice(1, -1);
          const span = document.createElement("span");
          span.className = "math-segment";
          try {
            katex.default.render(mathExpr, span, {
              throwOnError: false,
              displayMode: block,
              output: "html",
            });
          } catch {
            // Fallback: show raw expression if KaTeX chokes
            span.textContent = part;
          }
          containerRef.current!.appendChild(span);
        } else if (part) {
          // Plain text segment
          containerRef.current!.appendChild(document.createTextNode(part));
        }
      });
    });
  }, [text, block]);

  return <span ref={containerRef} className={className} />;
}

export function hasMath(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}