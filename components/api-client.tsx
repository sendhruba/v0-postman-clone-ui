"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "./json-editor";
import { JsonViewer } from "./json-viewer";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Clock,
  FileText,
  Globe,
} from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ResponseData {
  status: number;
  statusText: string;
  data: unknown;
  time: number;
  size: number;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "text-success",
  POST: "text-warning",
  PUT: "text-json-key",
  PATCH: "text-json-boolean",
  DELETE: "text-destructive",
};

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
      setError(
        err instanceof Error ? err.message : "An error occurred"
      );
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

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-success";
    if (status >= 300 && status < 400) return "text-json-key";
    if (status >= 400 && status < 500) return "text-warning";
    return "text-destructive";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              API Client
            </h1>
            <p className="text-sm text-muted-foreground">
              Send HTTP requests and view responses
            </p>
          </div>
        </div>

        {/* URL Bar */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-lg">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Method Selector */}
            <div className="relative">
              <button
                onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary rounded-lg hover:bg-muted transition-colors min-w-28 justify-between font-mono font-semibold"
              >
                <span className={methodColors[method]}>{method}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {methodDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden min-w-28">
                  {(
                    ["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMethod(m);
                        setMethodDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-secondary transition-colors font-mono font-semibold ${methodColors[m]} ${
                        method === m ? "bg-secondary" : ""
                      }`}
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
              className="flex-1 px-4 py-2.5 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />

            {/* Send Button */}
            <button
              onClick={sendRequest}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-semibold"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Request Panel */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-1">
                <button className="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary -mb-px">
                  Body
                </button>
                <button className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Headers
                </button>
                <button className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Params
                </button>
              </div>

              {/* Beautify/Minify */}
              <div className="flex items-center gap-2">
                <button
                  onClick={minifyJson}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Minify
                </button>
                <button
                  onClick={beautifyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Beautify
                </button>
              </div>
            </div>

            {/* Body Type Selector */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-secondary/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bodyType"
                  defaultChecked
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-sm text-muted-foreground">raw</span>
              </label>
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded font-medium">
                JSON
              </span>
            </div>

            {/* Editor */}
            <div className="p-4">
              <JsonEditor
                value={requestBody}
                onChange={setRequestBody}
                placeholder='Enter JSON body...\n{\n  "key": "value"\n}'
              />
            </div>
          </div>

          {/* Response Panel */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
            {/* Response Header */}
            <div className="flex items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setResponseTab("pretty")}
                  className={`px-4 py-3 text-sm font-medium transition-colors -mb-px ${
                    responseTab === "pretty"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pretty
                </button>
                <button
                  onClick={() => setResponseTab("raw")}
                  className={`px-4 py-3 text-sm font-medium transition-colors -mb-px ${
                    responseTab === "raw"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Raw
                </button>
              </div>

              {response && (
                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {/* Status Bar */}
            {response && (
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-secondary/30 text-sm">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={getStatusColor(response.status)}>
                    {response.status}
                  </span>
                  <span className="text-muted-foreground">
                    {response.statusText}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{response.time} ms</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{formatSize(response.size)}</span>
                </div>
              </div>
            )}

            {/* Response Content */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm">
                      Sending request...
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive text-sm font-medium">
                    {error}
                  </p>
                </div>
              ) : response ? (
                responseTab === "pretty" ? (
                  <JsonViewer json={JSON.stringify(response.data, null, 2)} />
                ) : (
                  <pre className="bg-secondary rounded-lg p-4 overflow-auto custom-scrollbar max-h-80 font-mono text-sm text-foreground whitespace-pre-wrap">
                    {JSON.stringify(response.data)}
                  </pre>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Enter a URL and click Send to see the response
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-lg">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Use <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono">Tab</kbd> to indent in the JSON editor
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Click Beautify to format messy JSON</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Response shows status, time, and size</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
