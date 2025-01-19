'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string | React.ReactNode;
  className?: string;
}

interface LanguageToggleProps {
  languages: string[];
  activeLanguage: string;
  onLanguageChange: (language: string) => void;
}

function LanguageToggle({ languages, activeLanguage, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            activeLanguage === lang
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          {lang === 'typescript' ? 'TypeScript' : 'Python'}
        </button>
      ))}
    </div>
  );
}

interface ImplementationBlockProps {
  typescript: string;
  python: string;
  title?: string;
  className?: string;
}

export function ImplementationBlock({ typescript, python, title, className }: ImplementationBlockProps) {
  const [language, setLanguage] = useState<'typescript' | 'python'>('typescript');
  const code = language === 'typescript' ? typescript : python;

  return (
    <CodeBlock
      code={code}
      language={language}
      title={
        <div className="flex justify-between items-center w-full">
          <span>{title}</span>
          <LanguageToggle
            languages={['typescript', 'python']}
            activeLanguage={language}
            onLanguageChange={(lang) => setLanguage(lang as 'typescript' | 'python')}
          />
        </div>
      }
      className={className}
    />
  );
}

export function CodeBlock({ code, language, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700">
          {typeof title === 'string' ? (
            <>
              <h3 className="font-mono text-sm text-zinc-300">{title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">{language}</span>
              </div>
            </>
          ) : (
            title
          )}
        </div>
      )}
      <div className="relative bg-zinc-900">
        <button
          onClick={copyToClipboard}
          className="absolute right-2 top-2 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-zinc-400" />
          )}
        </button>
        <pre className="p-4 text-sm overflow-x-auto">
          <code className={`language-${language} text-zinc-100`}>
            {code.trim()}
          </code>
        </pre>
      </div>
    </div>
  );
}
