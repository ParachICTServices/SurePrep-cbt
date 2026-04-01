"use client";
import { useEffect, useRef } from "react";


interface MathTextProps {
  text: string;
  className?: string;
block?: boolean;
}

export function MathText({ text, className = "", block = false }: MathTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import("katex").then((katex) => {
      if (!containerRef.current) return;

      const parts = text.split(/(\$[^$]+\$)/g);

      containerRef.current.innerHTML = "";

      parts.forEach((part) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
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
            span.textContent = part;
          }
          containerRef.current!.appendChild(span);
        } else if (part) {
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