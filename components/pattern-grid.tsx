import { WorkflowCard } from '@/components/workflow-card';
import { patterns } from '@/data';

export function PatternGrid() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-10 px-4">
      <div className="max-w-7xl w-full mx-auto">
        <div className="space-y-4 text-center mb-10">
          <h1 className="text-4xl font-bold font-mono">Debug Patterns</h1>
          <p className="text-zinc-400 max-w-[700px] mx-auto">
            Production-ready debugging patterns with TypeScript and Python implementations. Each pattern includes comprehensive error handling, logging, and real-world examples.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {patterns.map((pattern) => (
            <WorkflowCard
              key={pattern.id}
              id={pattern.id}
              title={pattern.title}
              description={pattern.description}
              diagram={pattern.diagram}
              category={pattern.category}
              useCases={pattern.useCases}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
