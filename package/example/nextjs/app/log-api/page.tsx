"use client";

import { useState } from "react";
import { useLogger } from "../hooks/useLogger";

export default function LogApiPage() {
  const { logInfo } = useLogger();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    message: string;
  } | null>(null);

  const simulateApiCall = async (action: string) => {
    setLoading(true);
    setResult(null);

    try {
      logInfo("Making API request", { action });

      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          payload: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).slice(2),
          },
        }),
      });

      const data = await response.json();
      setResult(data);

      logInfo("API response received", { action, status: data.status });
    } catch (error) {
      setResult({ status: "error", message: "Failed to make API request" });
      logInfo("API request failed", {
        action,
        error: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-800 to-zinc-600 bg-clip-text text-transparent mb-2">
            Server-Side Logging Demo
          </h1>
          <p className="text-zinc-600 text-lg">
            Test server-side logging through API endpoints
          </p>
          <div className="mt-4 p-3 bg-zinc-600 rounded-lg text-white flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium">
              Check server logs to see the logging output
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-zinc-800 mb-6">
              API Actions
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => simulateApiCall("process")}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Simulate Processing
              </button>
              <button
                onClick={() => simulateApiCall("error")}
                disabled={loading}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Simulate Error
              </button>
              <button
                onClick={() => simulateApiCall("warning")}
                disabled={loading}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Simulate Warning
              </button>
              <button
                onClick={() => simulateApiCall("debug")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Log Debug Info
              </button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-zinc-800 mb-6">
              Response
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800"></div>
              </div>
            ) : result ? (
              <div
                className={`p-4 rounded-lg ${
                  result.status === "success"
                    ? "bg-green-100 text-green-800"
                    : result.status === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                <p className="font-medium mb-2">Status: {result.status}</p>
                <p>{result.message}</p>
              </div>
            ) : (
              <div className="text-zinc-600 text-center h-[200px] flex items-center justify-center">
                <p>Make an API call to see the response</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-800">
              How It Works
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium text-zinc-800">Client-Side Logging</p>
                <p className="text-sm text-zinc-600">
                  Uses the client logger to track API requests and responses
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-green-600">2</span>
              </div>
              <div>
                <p className="font-medium text-zinc-800">
                  Server-Side Processing
                </p>
                <p className="text-sm text-zinc-600">
                  API endpoints use server logger to record operations and
                  events
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-purple-600">3</span>
              </div>
              <div>
                <p className="font-medium text-zinc-800">Log Types</p>
                <p className="text-sm text-zinc-600">
                  Demonstrates INFO, ERROR, WARNING, and DEBUG level logs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
