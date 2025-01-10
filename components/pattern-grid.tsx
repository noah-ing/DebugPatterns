import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { patterns } from '@/lib/patterns'

export function PatternGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {patterns.map((pattern) => (
        <Link href={`/patterns/${pattern.id}`} key={pattern.id}>
          <div className="group relative glass-panel rounded-lg overflow-hidden hover-card">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-mono text-lg leading-tight tracking-tight text-zinc-200 group-hover:text-white transition-colors">
                  {pattern.title}
                </h2>
                <Badge 
                  variant="secondary"
                  className="bg-zinc-800/50 text-zinc-400 text-[10px] px-2 py-0.5 tracking-wider group-hover:bg-zinc-700/50 group-hover:text-zinc-300 transition-colors"
                >
                  {pattern.category}
                </Badge>
              </div>
              <div className="aspect-[2/1] bg-zinc-900 rounded border border-zinc-800 mb-4 overflow-hidden group-hover:border-zinc-700 transition-colors">
                <div className="diagram-container">
                  <img
                    src={pattern.diagram}
                    alt={`Diagram for ${pattern.title}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <p className="text-sm leading-relaxed tracking-wide text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {pattern.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

