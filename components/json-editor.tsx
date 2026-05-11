"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function JsonEditor({ value, onChange, placeholder }: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lines, setLines] = useState<number[]>([1]);

  const updateLineNumbers = useCallback((text: string) => {
    const lineCount = text.split("\n").length;
    setLines(Array.from({ length: lineCount }, (_, i) => i + 1));
  }, []);

  useEffect(() => {
    updateLineNumbers(value);
  }, [value, updateLineNumbers]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    updateLineNumbers(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersEl = document.getElementById("line-numbers");
    if (lineNumbersEl) {
      lineNumbersEl.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="flex bg-secondary rounded-lg overflow-hidden border border-border focus-within:border-primary transition-colors">
      {/* Line numbers */}
      <div
        id="line-numbers"
        className="bg-muted py-3 px-2 overflow-hidden select-none flex flex-col items-end border-r border-border"
      >
        {lines.map((line) => (
          <span
            key={line}
            className="text-muted-foreground font-mono text-sm leading-6 h-6"
          >
            {line}
          </span>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="flex-1 bg-transparent p-3 font-mono text-sm leading-6 resize-none focus:outline-none custom-scrollbar min-h-64 text-foreground placeholder:text-muted-foreground"
        spellCheck={false}
      />
    </div>
  );
}
