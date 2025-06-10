'use client';

import React from 'react';

interface CopyableCodeLineProps {
  code: string;
}

function CopyableCodeLine({ code }: CopyableCodeLineProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center justify-between group py-1 hover:bg-zinc-700/30 p-2 rounded-lg">
      <code className="text-sm text-zinc-300">{code}</code>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
        title="Copy to clipboard"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export default function CopyableCode() {
  const installCommands = [
    { label: "# Using npm", command: "npm install loglog-core" },
    { label: "# Using yarn", command: "yarn add loglog-core" },
    { label: "# Using pnpm", command: "pnpm install loglog-core" },
    { label: "# Using bun", command: "bun add loglog-core" }
  ];

  return (
    <div className="space-y-4">
      {installCommands.map(({ label, command }, index) => (
        <div key={index} className="space-y-1">
          <div className="text-zinc-500">{label}</div>
          <CopyableCodeLine code={command} />
        </div>
      ))}
    </div>
  );
}