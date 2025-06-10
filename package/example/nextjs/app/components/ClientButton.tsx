"use client";

export default function ClientButton() {
  return (
    <button
      onClick={() => {
        window.location.href = "/log";
      }}
      className="px-6 rounded-lg py-3 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
      >
      Client-Side Logging
    </button>
  );
}