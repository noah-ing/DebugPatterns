// Core pattern interface definitions
export interface CodeExample {
  title: string;
  language: 'typescript' | 'python';
  code: string;
  explanation: string;
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  category: PatternCategory;
  diagram: string;
  useCases: string[];
  implementation: {
    typescript: string;
    python: string;
  };
  codeExamples: CodeExample[];
  bestPractices: string[];
  commonPitfalls: string[];
}

export type PatternCategory = 'WORKFLOW' | 'PERFORMANCE' | 'INTEGRATION' | 'STATE' | 'RUNTIME';

// Export implemented patterns
export * from './patterns/async-promise-hell';
export * from './patterns/memory-leaks';

// Export pattern registry
export { patterns } from './registry';
