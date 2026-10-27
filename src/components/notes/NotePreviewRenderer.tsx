import React from 'react';

interface NotePreviewRendererProps {
  content: string;
  className?: string;
  onToggleCheckbox?: (lineIndex: number, newChecked: boolean) => void;
  interactiveCheckboxes?: boolean;
}

export const NotePreviewRenderer: React.FC<NotePreviewRendererProps> = ({
  content,
  className = '',
  onToggleCheckbox,
  interactiveCheckboxes = false,
}) => {
  if (!content || !content.trim()) {
    return (
      <div className={`text-xs text-[#8E8EA0] italic ${className}`}>
        No content written yet.
      </div>
    );
  }

  const lines = content.split('\n');

  // Helper to format inline bold, italic, inline code, links, strikethrough
  const formatInlineText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // 1. Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      // 2. Bold: **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
      // 3. Strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~(.*?)~~/);
      // 4. Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
      // 5. Link: [label](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);

      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 text-[11px] font-mono bg-[#EFEFF5] text-[#191927] rounded"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
      } else if (boldMatch && boldMatch[2]) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-[#191927]">
            {boldMatch[2]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
      } else if (strikeMatch && strikeMatch[1]) {
        parts.push(
          <span key={keyIdx++} className="line-through text-[#8E8EA0]">
            {strikeMatch[1]}
          </span>
        );
        remaining = remaining.slice(strikeMatch[0].length);
      } else if (italicMatch && italicMatch[2]) {
        parts.push(
          <em key={keyIdx++} className="italic text-[#191927]">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
      } else if (linkMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#191927] underline decoration-[#A9C9F5] underline-offset-2 hover:decoration-[#191927] transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
      } else {
        // Find next special syntax trigger: ` * _ ~ [
        const nextSpecial = remaining.search(/[`*_~[]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          // Unmatched character, take 1 character
          parts.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          parts.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }
    }

    return parts;
  };

  // Block parser
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block check
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre
            key={`code-block-${i}`}
            className="my-2.5 p-3.5 bg-[#191927] text-white text-xs font-mono rounded-lg overflow-x-auto leading-relaxed"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Horizontal divider
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(
        <hr key={`hr-${i}`} className="my-3 border-t border-[#E8E8EE]" />
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-lg sm:text-xl font-bold text-[#191927] mt-3.5 mb-1.5 tracking-tight"
        >
          {formatInlineText(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-base sm:text-lg font-semibold text-[#191927] mt-3 mb-1 tracking-tight"
        >
          {formatInlineText(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-sm sm:text-base font-semibold text-[#191927] mt-2.5 mb-1"
        >
          {formatInlineText(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-xs sm:text-sm font-semibold text-[#191927] mt-2 mb-0.5"
        >
          {formatInlineText(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-1.5 pl-3 py-1 border-l-2 border-[#191927] text-xs italic text-[#646477] bg-[#FAFAFC] rounded-r"
        >
          {formatInlineText(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Checklist item: supports - [ ] or * [ ]
    const checkMatch = rawLine.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const itemText = checkMatch[3];
      const lineIdx = i;

      elements.push(
        <div
          key={`check-${i}`}
          className="flex items-start gap-2.5 my-1 text-xs text-[#191927]"
        >
          <input
            type="checkbox"
            checked={isChecked}
            disabled={!interactiveCheckboxes}
            onChange={(e) => {
              if (onToggleCheckbox) {
                onToggleCheckbox(lineIdx, e.target.checked);
              }
            }}
            className={`mt-0.5 rounded border-[#D0D0DC] text-[#191927] focus:ring-[#191927] ${
              interactiveCheckboxes ? 'cursor-pointer' : 'cursor-default'
            }`}
            aria-label={itemText || 'Checklist item'}
          />
          <span
            className={`flex-1 leading-relaxed ${
              isChecked ? 'line-through text-[#8E8EA0]' : 'text-[#191927]'
            }`}
          >
            {formatInlineText(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // Bulleted list item
    const bulletMatch = rawLine.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-0.5 text-xs text-[#191927]">
          <span className="text-[#8E8EA0] leading-relaxed select-none">•</span>
          <span className="flex-1 leading-relaxed">
            {formatInlineText(bulletMatch[2])}
          </span>
        </div>
      );
      continue;
    }

    // Numbered list item
    const numMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-0.5 text-xs text-[#191927]">
          <span className="text-[#8E8EA0] font-mono text-[11px] leading-relaxed tabular-nums select-none min-w-[1.2rem]">
            {numMatch[2]}.
          </span>
          <span className="flex-1 leading-relaxed">
            {formatInlineText(numMatch[3])}
          </span>
        </div>
      );
      continue;
    }

    // Empty blank line
    if (!trimmed) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p-${i}`} className="text-xs leading-relaxed text-[#191927] my-0.5">
        {formatInlineText(rawLine)}
      </p>
    );
  }

  // Handle unclosed code block if file ends inside code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="code-block-end"
        className="my-2 p-3 bg-[#191927] text-white text-xs font-mono rounded-lg overflow-x-auto"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
};
