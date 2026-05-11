"use client";

import { useCallback } from "react";

interface JsonViewerProps {
  json: string;
  showLineNumbers?: boolean;
}

export function JsonViewer({ json, showLineNumbers = true }: JsonViewerProps) {
  const formatJson = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  }, []);

  const highlightJson = useCallback((text: string) => {
    const lines = text.split("\n");

    return lines.map((line, index) => {
      let highlighted = line;

      // Match JSON keys (quoted strings followed by colon)
      highlighted = highlighted.replace(
        /"([^"]+)"(?=\s*:)/g,
        '<span class="json-key">"$1"</span>'
      );

      // Match string values (quoted strings not followed by colon)
      highlighted = highlighted.replace(
        /:\s*"([^"]*)"/g,
        ': <span class="json-string">"$1"</span>'
      );

      // Match numbers
      highlighted = highlighted.replace(
        /:\s*(-?\d+\.?\d*)/g,
        ': <span class="json-number">$1</span>'
      );

      // Match booleans
      highlighted = highlighted.replace(
        /:\s*(true|false)/g,
        ': <span class="json-boolean">$1</span>'
      );

      // Match null
      highlighted = highlighted.replace(
        /:\s*(null)/g,
        ': <span class="json-null">$1</span>'
      );

      // Match brackets and braces
      highlighted = highlighted.replace(
        /([{}\[\]])/g,
        '<span class="json-bracket">$1</span>'
      );

      return (
        <div key={index} className="json-line">
          {showLineNumbers && (
            <span className="json-line-number">{index + 1}</span>
          )}
          <span
            className="json-line-content"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      );
    });
  }, [showLineNumbers]);

  const formattedJson = formatJson(json);

  return (
    <div className="json-viewer custom-scrollbar">
      <div style={{ minWidth: "max-content" }}>{highlightJson(formattedJson)}</div>
    </div>
  );
}
