import { WorkflowCard } from "@/components/workflow-card"
import { patterns } from "@/lib/patterns"

// First 6 patterns should be prioritized for loading
const PRIORITY_PATTERNS = [
  'async-promise-hell',
  'memory-leaks',
  'api-integration',
  'state-management',
  'performance-bottleneck',
  'stack-trace'
]

export function PatternGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {patterns.map((pattern) => (
        <WorkflowCard
          key={pattern.id}
          id={pattern.id}
          title={pattern.title}
          description={pattern.description}
          diagram={pattern.diagram}
          category={pattern.category}
          priority={PRIORITY_PATTERNS.includes(pattern.id)}
        />
      ))}
    </div>
  )
}
