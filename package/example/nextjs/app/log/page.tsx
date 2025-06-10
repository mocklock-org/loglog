"use client";

import { useLogger } from "../hooks/useLogger";
import { useState } from "react";

export default function LogPage() {
  const { logInfo, logError, logWarning, logDebug } = useLogger();
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount((prev) => {
      const newCount = prev + 1;
      logInfo("Counter incremented", {
        previousValue: prev,
        newValue: newCount,
        timestamp: new Date().toISOString(),
      });
      return newCount;
    });
  };

  const handleSimulateError = () => {
    try {
      throw new Error("This is a simulated error");
    } catch (error) {
      logError(error as Error, {
        component: "LogPage",
        action: "simulateError",
        count: count,
      });
    }
  };

  const handleWarningScenario = () => {
    if (count > 5) {
      logWarning("Counter is getting high", {
        currentCount: count,
        threshold: 5,
        recommendation: "Consider resetting the counter",
      });
    }
  };

  const handleDebugInfo = () => {
    logDebug("Component state details", {
      component: "LogPage",
      count: count,
      timestamp: new Date().toISOString(),
      renderCount: Math.random(),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-800 to-zinc-600 bg-clip-text text-transparent mb-2">
            LogLog Demo
          </h1>
          <p className="text-zinc-600 text-lg">
            logging system demonstration with LogLog Core
          </p>
          <div className="mt-4 p-3 bg-zinc-600 rounded-lg text-white flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">
              Open Developer Tools (F12) to view the logs in the console
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4">
              <span className="text-3xl font-bold text-white">{count}</span>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-800 mb-6">
              Current Count
            </h2>

            <button
              onClick={handleIncrement}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:-tranzinc-y-0.5 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Increment Counter
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-800 mb-2">Error Log</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Simulate error scenario
              </p>
              <button
                onClick={handleSimulateError}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors duration-200 shadow-md hover"
              >
                Trigger Error
              </button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-4">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-800 mb-2">
                Warning Check
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                Check threshold limits
              </p>
              <button
                onClick={handleWarningScenario}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition-colors duration-200 shadow-md hover"
              >
                Check Warning
              </button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-800 mb-2">Debug Info</h3>
              <p className="text-sm text-zinc-600 mb-4">Log detailed state</p>
              <button
                onClick={handleDebugInfo}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors duration-200 shadow-md hover"
              >
                Log Debug
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
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
            <h2 className="text-xl font-semibold text-zinc-800">How to Use</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-zinc-800">
                    Increment Counter
                  </p>
                  <p className="text-sm text-zinc-600">
                    Generates INFO level logs with operation details
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-red-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-zinc-800">Trigger Error</p>
                  <p className="text-sm text-zinc-600">
                    Creates ERROR level logs with exception details
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-yellow-600">
                    3
                  </span>
                </div>
                <div>
                  <p className="font-medium text-zinc-800">Warning Check</p>
                  <p className="text-sm text-zinc-600">
                    Shows WARNING logs when count exceeds threshold (5+)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-gray-600">4</span>
                </div>
                <div>
                  <p className="font-medium text-zinc-800">Debug Info</p>
                  <p className="text-sm text-zinc-600">
                    Outputs DEBUG level logs with component state
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
