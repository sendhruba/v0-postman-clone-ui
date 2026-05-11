"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "./json-editor";
import { JsonViewer } from "./json-viewer";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ResponseData {
  status: number;
  statusText: string;
  data: unknown;
  time: number;
  size: number;
}

const methodClasses: Record<HttpMethod, string> = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  PATCH: "method-patch",
  DELETE: "method-delete",
};

// SVG Icons as components
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L14.5 8.5L20 9L16 13L17 19L12 16L7 19L8 13L4 9L9.5 8.5L12 3Z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export function ApiClient() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("POST");
  const [requestBody, setRequestBody] = useState(`{
  "name": "John Doe",
  "email": "john@example.com"
}`);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [responseTab, setResponseTab] = useState<"pretty" | "raw">("pretty");

  const beautifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      setError("Invalid JSON - cannot beautify");
    }
  }, [requestBody]);

  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed));
      setError(null);
    } catch {
      setError("Invalid JSON - cannot minify");
    }
  }, [requestBody]);

  const sendRequest = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (method !== "GET" && requestBody.trim()) {
        try {
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch {
          setError("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      const responseText = await res.text();

      let responseData: unknown;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: responseData,
        time: Math.round(endTime - startTime),
        size: new Blob([responseText]).size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = async () => {
    if (response) {
      await navigator.clipboard.writeText(
        JSON.stringify(response.data, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusClass = (status: number) => {
    if (status >= 200 && status < 300) return "status-success";
    if (status >= 300 && status < 400) return "status-redirect";
    if (status >= 400 && status < 500) return "status-client-error";
    return "status-server-error";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="api-client">
      <div className="api-client-container">
        {/* Header */}
        <header className="api-client-header">
          <div className="api-client-logo">
            <GlobeIcon />
          </div>
          <div>
            <h1 className="api-client-title">API Client</h1>
            <p className="api-client-subtitle">Send HTTP requests and view responses</p>
          </div>
        </header>

        {/* URL Bar */}
        <div className="url-bar">
          <div className="url-bar-inner">
            {/* Method Selector */}
            <div className="method-selector">
              <button
                onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
                className="method-selector-btn"
              >
                <span className={methodClasses[method]}>{method}</span>
                <ChevronDownIcon />
              </button>

              {methodDropdownOpen && (
                <div className="method-dropdown animate-fadeIn">
                  {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMethod(m);
                        setMethodDropdownOpen(false);
                      }}
                      className={`method-dropdown-item ${methodClasses[m]} ${method === m ? "active" : ""}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* URL Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL (e.g., https://api.example.com/endpoint)"
              className="url-input"
            />

            {/* Send Button */}
            <button
              onClick={sendRequest}
              disabled={isLoading}
              className="send-btn"
            >
              {isLoading ? (
                <div className="loading-spinner" style={{ width: 18, height: 18, marginBottom: 0, borderWidth: 2 }} />
              ) : (
                <SendIcon />
              )}
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Request Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-tabs">
                <button className="panel-tab active">Body</button>
                <button className="panel-tab">Headers</button>
                <button className="panel-tab">Params</button>
              </div>
              <div className="panel-actions">
                <button onClick={minifyJson} className="panel-action-btn">
                  Minify
                </button>
                <button onClick={beautifyJson} className="panel-action-btn primary">
                  <SparklesIcon />
                  Beautify
                </button>
              </div>
            </div>

            <div className="body-type-bar">
              <label className="body-type-option">
                <input type="radio" name="bodyType" defaultChecked />
                <span>raw</span>
              </label>
              <span className="body-type-badge">JSON</span>
            </div>

            <div className="panel-content">
              <JsonEditor
                value={requestBody}
                onChange={setRequestBody}
                placeholder='Enter JSON body...\n{\n  "key": "value"\n}'
              />
            </div>
          </div>

          {/* Response Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-tabs">
                <button
                  onClick={() => setResponseTab("pretty")}
                  className={`panel-tab ${responseTab === "pretty" ? "active" : ""}`}
                >
                  Pretty
                </button>
                <button
                  onClick={() => setResponseTab("raw")}
                  className={`panel-tab ${responseTab === "raw" ? "active" : ""}`}
                >
                  Raw
                </button>
              </div>
              {response && (
                <div className="panel-actions">
                  <button onClick={copyResponse} className="panel-action-btn">
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {response && (
              <div className="status-bar">
                <div className="status-item">
                  <GlobeIcon />
                  <span className={`status-code ${getStatusClass(response.status)}`}>
                    {response.status}
                  </span>
                  <span>{response.statusText}</span>
                </div>
                <div className="status-item">
                  <ClockIcon />
                  <span>{response.time} ms</span>
                </div>
                <div className="status-item">
                  <FileTextIcon />
                  <span>{formatSize(response.size)}</span>
                </div>
              </div>
            )}

            <div className="panel-content">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <span className="loading-text">Sending request...</span>
                </div>
              ) : error ? (
                <div className="error-box">
                  <p className="error-text">{error}</p>
                </div>
              ) : response ? (
                responseTab === "pretty" ? (
                  <JsonViewer json={JSON.stringify(response.data, null, 2)} />
                ) : (
                  <pre className="raw-viewer custom-scrollbar">
                    {JSON.stringify(response.data)}
                  </pre>
                )
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <SendIcon />
                  </div>
                  <p className="empty-state-text">
                    Enter a URL and click Send to see the response
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h3 className="tips-title">Quick Tips</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <span className="tip-bullet">•</span>
              <span>
                Use <kbd>Tab</kbd> to indent in the JSON editor
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-bullet">•</span>
              <span>Click Beautify to format messy JSON</span>
            </div>
            <div className="tip-item">
              <span className="tip-bullet">•</span>
              <span>Response shows status, time, and size</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
