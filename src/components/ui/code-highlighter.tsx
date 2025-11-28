import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Import base languages first
import "prismjs/components/prism-c";
import "prismjs/components/prism-clike";
// Then languages that depend on them
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";

interface CodeHighlighterProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function CodeHighlighter({ 
  code, 
  language = "javascript", 
  className = "",
  showLineNumbers = true 
}: CodeHighlighterProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // Map common language aliases to Prism language names
  const getLanguage = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'cpp': 'cpp',
      'c++': 'cpp',
      'cs': 'csharp',
      'c#': 'csharp',
      'rb': 'ruby',
      'sh': 'bash',
      'shell': 'bash',
    };
    return languageMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const prismLanguage = getLanguage(language);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <span className="px-2 py-1 text-xs bg-muted/80 text-muted-foreground rounded border">
          {language.toUpperCase()}
        </span>
      </div>
      <pre 
        className={`
          ${showLineNumbers ? 'line-numbers' : ''} 
          !bg-muted/50 !border !border-border/50 !rounded-lg !p-4 !overflow-x-auto !text-sm
          scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent
        `}
        style={{ 
          background: 'hsl(var(--muted) / 0.5)', 
          border: '1px solid hsl(var(--border) / 0.5)',
          borderRadius: '0.5rem',
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}
      >
        <code 
          ref={codeRef} 
          className={`language-${prismLanguage}`}
          style={{ 
            background: 'transparent',
            fontSize: 'inherit',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}

// Line numbers plugin styles
const lineNumbersCSS = `
.line-numbers .line-numbers-rows {
  position: absolute;
  pointer-events: none;
  top: 0;
  font-size: 100%;
  left: -3.8em;
  width: 3em;
  letter-spacing: -1px;
  border-right: 1px solid hsl(var(--border) / 0.3);
  user-select: none;
}

.line-numbers .line-numbers-rows > span {
  display: block;
  counter-increment: linenumber;
}

.line-numbers .line-numbers-rows > span:before {
  content: counter(linenumber);
  color: hsl(var(--muted-foreground) / 0.6);
  display: block;
  padding-right: 0.8em;
  text-align: right;
}

.line-numbers {
  position: relative;
  padding-left: 3.8em;
  counter-reset: linenumber;
}
`;

// Inject line numbers CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = lineNumbersCSS;
  document.head.appendChild(style);
}
