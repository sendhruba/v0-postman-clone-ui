"use client";

import { useCallback, useState, useEffect, useRef } from "react";

interface JsonViewerProps {
  json: string;
  showLineNumbers?: boolean;
}

interface SearchMatch {
  lineIndex: number;
  startIndex: number;
  endIndex: number;
  text: string;
  path: string;
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function JsonViewer({ json, showLineNumbers = true }: JsonViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const formatJson = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  }, []);

  const formattedJson = formatJson(json);
  const lines = formattedJson.split("\n");

  // Build JSON path mapping
  const buildPathMap = useCallback((jsonString: string): Map<number, string> => {
    const pathMap = new Map<number, string>();
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      const lines = formatted.split("\n");
      
      const pathStack: string[] = [];
      let inArray = false;
      let arrayIndex = 0;
      const arrayIndexStack: number[] = [];
      const inArrayStack: boolean[] = [];

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Track entering arrays/objects
        if (trimmed.includes("[")) {
          inArrayStack.push(inArray);
          arrayIndexStack.push(arrayIndex);
          inArray = true;
          arrayIndex = 0;
        }
        if (trimmed.includes("{") && !trimmed.includes(":")) {
          if (inArray) {
            pathStack.push(`[${arrayIndex}]`);
            arrayIndex++;
          }
        }
        
        // Extract key if present
        const keyMatch = trimmed.match(/^"([^"]+)"\s*:/);
        if (keyMatch) {
          const key = keyMatch[1];
          const currentPath = pathStack.length > 0 ? pathStack.join("") + "." + key : key;
          pathMap.set(index, currentPath);
          
          // If this line opens an object or array, push to stack
          if (trimmed.includes("{") || trimmed.includes("[")) {
            pathStack.push("." + key);
          }
        } else if (inArray && (trimmed.startsWith('"') || /^-?\d/.test(trimmed) || trimmed === "true" || trimmed === "false" || trimmed === "null")) {
          const currentPath = pathStack.length > 0 ? pathStack.join("") + `[${arrayIndex}]` : `[${arrayIndex}]`;
          pathMap.set(index, currentPath);
          if (!trimmed.endsWith(",")) {
            // Don't increment if we're at the last item
          }
          arrayIndex++;
        }
        
        // Track exiting arrays/objects
        if (trimmed.startsWith("}") || trimmed === "},") {
          if (pathStack.length > 0 && !pathStack[pathStack.length - 1].startsWith("[")) {
            pathStack.pop();
          }
        }
        if (trimmed.startsWith("]") || trimmed === "],") {
          pathStack.pop();
          inArray = inArrayStack.pop() ?? false;
          arrayIndex = arrayIndexStack.pop() ?? 0;
        }
      });
    } catch {
      // If JSON is invalid, return empty map
    }
    return pathMap;
  }, []);

  // Find all matches in the JSON
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const pathMap = buildPathMap(json);
    const searchLower = searchQuery.toLowerCase();
    const newMatches: SearchMatch[] = [];

    lines.forEach((line, lineIndex) => {
      let searchIndex = 0;
      const lineLower = line.toLowerCase();
      
      while (searchIndex < line.length) {
        const matchIndex = lineLower.indexOf(searchLower, searchIndex);
        if (matchIndex === -1) break;
        
        newMatches.push({
          lineIndex,
          startIndex: matchIndex,
          endIndex: matchIndex + searchQuery.length,
          text: line.substring(matchIndex, matchIndex + searchQuery.length),
          path: pathMap.get(lineIndex) || "",
        });
        
        searchIndex = matchIndex + 1;
      }
    });

    setMatches(newMatches);
    setCurrentMatchIndex(0);
  }, [searchQuery, json, lines, buildPathMap]);

  // Navigate to current match
  useEffect(() => {
    if (matches.length > 0 && matches[currentMatchIndex]) {
      const lineIndex = matches[currentMatchIndex].lineIndex;
      const lineElement = lineRefs.current.get(lineIndex);
      
      if (lineElement && viewerRef.current) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, matches]);

  const goToNextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  };

  const goToPrevMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
      e.preventDefault();
    }
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const highlightLine = useCallback((line: string, lineIndex: number) => {
    const lineMatches = matches.filter((m) => m.lineIndex === lineIndex);
    const currentMatch = matches[currentMatchIndex];
    
    if (lineMatches.length === 0) {
      // No search matches, apply syntax highlighting
      let highlighted = line;

      highlighted = highlighted.replace(
        /"([^"]+)"(?=\s*:)/g,
        '<span class="json-key">"$1"</span>'
      );

      highlighted = highlighted.replace(
        /:\s*"([^"]*)"/g,
        ': <span class="json-string">"$1"</span>'
      );

      highlighted = highlighted.replace(
        /:\s*(-?\d+\.?\d*)/g,
        ': <span class="json-number">$1</span>'
      );

      highlighted = highlighted.replace(
        /:\s*(true|false)/g,
        ': <span class="json-boolean">$1</span>'
      );

      highlighted = highlighted.replace(
        /:\s*(null)/g,
        ': <span class="json-null">$1</span>'
      );

      highlighted = highlighted.replace(
        /([{}\[\]])/g,
        '<span class="json-bracket">$1</span>'
      );

      return highlighted;
    }

    // Build highlighted string with search matches
    let result = "";
    let lastIndex = 0;

    // Sort matches by start index
    const sortedMatches = [...lineMatches].sort((a, b) => a.startIndex - b.startIndex);

    sortedMatches.forEach((match) => {
      // Add text before match with syntax highlighting
      if (match.startIndex > lastIndex) {
        const beforeText = line.substring(lastIndex, match.startIndex);
        result += applySyntaxHighlighting(beforeText);
      }

      // Add highlighted match
      const isCurrentMatch = currentMatch && 
        match.lineIndex === currentMatch.lineIndex && 
        match.startIndex === currentMatch.startIndex;
      
      const matchClass = isCurrentMatch ? "search-match current" : "search-match";
      result += `<span class="${matchClass}">${escapeHtml(match.text)}</span>`;
      
      lastIndex = match.endIndex;
    });

    // Add remaining text
    if (lastIndex < line.length) {
      result += applySyntaxHighlighting(line.substring(lastIndex));
    }

    return result;
  }, [matches, currentMatchIndex]);

  const applySyntaxHighlighting = (text: string): string => {
    let highlighted = escapeHtml(text);

    highlighted = highlighted.replace(
      /&quot;([^&]+)&quot;(?=\s*:)/g,
      '<span class="json-key">"$1"</span>'
    );

    highlighted = highlighted.replace(
      /:\s*&quot;([^&]*)&quot;/g,
      ': <span class="json-string">"$1"</span>'
    );

    highlighted = highlighted.replace(
      /:\s*(-?\d+\.?\d*)/g,
      ': <span class="json-number">$1</span>'
    );

    highlighted = highlighted.replace(
      /:\s*(true|false)/g,
      ': <span class="json-boolean">$1</span>'
    );

    highlighted = highlighted.replace(
      /:\s*(null)/g,
      ': <span class="json-null">$1</span>'
    );

    highlighted = highlighted.replace(
      /([{}\[\]])/g,
      '<span class="json-bracket">$1</span>'
    );

    return highlighted;
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const setLineRef = (lineIndex: number) => (el: HTMLDivElement | null) => {
    if (el) {
      lineRefs.current.set(lineIndex, el);
    }
  };

  return (
    <div className="json-viewer-container">
      {/* Search Bar */}
      <div className="json-search-bar">
        <button 
          className="json-search-toggle"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          title="Search JSON (Ctrl+F)"
        >
          <SearchIcon />
        </button>
        
        {isSearchOpen && (
          <div className="json-search-input-wrapper">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search keys or values..."
              className="json-search-input"
              autoFocus
            />
            
            {matches.length > 0 && (
              <span className="json-search-count">
                {currentMatchIndex + 1} / {matches.length}
              </span>
            )}
            
            {searchQuery && matches.length === 0 && (
              <span className="json-search-no-results">No results</span>
            )}
            
            <div className="json-search-nav">
              <button 
                onClick={goToPrevMatch} 
                disabled={matches.length === 0}
                className="json-search-nav-btn"
                title="Previous match (Shift+Enter)"
              >
                <ChevronUpIcon />
              </button>
              <button 
                onClick={goToNextMatch} 
                disabled={matches.length === 0}
                className="json-search-nav-btn"
                title="Next match (Enter)"
              >
                <ChevronDownIcon />
              </button>
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                className="json-search-nav-btn"
                title="Close search (Esc)"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}
        
        {/* Current match path */}
        {isSearchOpen && matches.length > 0 && matches[currentMatchIndex]?.path && (
          <div className="json-search-path">
            <span className="json-search-path-label">Path:</span>
            <code className="json-search-path-value">{matches[currentMatchIndex].path}</code>
          </div>
        )}
      </div>

      {/* JSON Content */}
      <div className="json-viewer custom-scrollbar" ref={viewerRef}>
        <div style={{ minWidth: "max-content" }}>
          {lines.map((line, index) => {
            const hasMatch = matches.some((m) => m.lineIndex === index);
            const isCurrentMatchLine = matches[currentMatchIndex]?.lineIndex === index;
            
            return (
              <div 
                key={index} 
                ref={setLineRef(index)}
                className={`json-line ${hasMatch ? "has-match" : ""} ${isCurrentMatchLine ? "current-match-line" : ""}`}
              >
                {showLineNumbers && (
                  <span className="json-line-number">{index + 1}</span>
                )}
                <span
                  className="json-line-content"
                  dangerouslySetInnerHTML={{ __html: highlightLine(line, index) }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
