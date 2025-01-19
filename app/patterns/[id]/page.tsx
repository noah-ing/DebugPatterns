import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CodeBlock, ImplementationBlock } from '@/components/code-block'
import { patterns, Pattern } from '@/data'

interface PageProps {
  params: {
    id: string
  }
}

export default function PatternPage({ params }: PageProps) {
  const pattern = patterns.find(p => p.id === params.id)

  if (!pattern) {
    notFound()
  }

  // After notFound() above, TypeScript knows pattern is defined
  const currentPattern: Pattern = pattern

  return (
    <div className="min-h-screen">
      <div className="container max-w-[1000px] px-6 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to patterns
        </Link>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-3xl font-medium tracking-tight text-white">
            {currentPattern.title}
          </h1>
          <Badge className="bg-zinc-800/50 text-zinc-400 px-2 py-0.5 tracking-wider">
            {currentPattern.category}
          </Badge>
        </div>

        <p className="text-zinc-400 text-lg mb-12 leading-relaxed">
          {currentPattern.description}
        </p>

        <div className="glass-panel rounded-lg p-8 mb-12">
          <div className="aspect-[2/1] bg-zinc-900 rounded border border-zinc-800 mb-8 overflow-hidden">
            <div className="diagram-container">
              <img
                src={currentPattern.diagram}
                alt={`Diagram for ${currentPattern.title}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Use Cases
              </h2>
              <ul className="list-disc list-inside text-zinc-400 leading-relaxed space-y-2">
                {currentPattern.useCases.map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-6">
                Production Implementation
              </h2>
              <div className="space-y-6">
                <ImplementationBlock
                  title="Implementation"
                  typescript={currentPattern.implementation.typescript}
                  python={currentPattern.implementation.python}
                />
              </div>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-6">
                Code Examples
              </h2>
              <div className="space-y-6">
                {currentPattern.codeExamples.map((example, index) => (
                  <div key={index} className="space-y-4">
                    <CodeBlock
                      title={example.title}
                      language={example.language}
                      code={example.code}
                    />
                    <p className="text-zinc-400 text-sm">
                      {example.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Best Practices
              </h2>
              <ul className="list-disc list-inside text-zinc-400 leading-relaxed space-y-2">
                {currentPattern.bestPractices.map((practice, index) => (
                  <li key={index}>{practice}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Common Pitfalls
              </h2>
              <ul className="list-disc list-inside text-zinc-400 leading-relaxed space-y-2">
                {currentPattern.commonPitfalls.map((pitfall, index) => (
                  <li key={index}>{pitfall}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-8">
          <h2 className="font-mono text-xl text-white mb-4">
            Related Patterns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patterns
              .filter(p => p.id !== currentPattern.id)
              .slice(0, 2)
              .map((relatedPattern) => (
                <Link 
                  href={`/patterns/${relatedPattern.id}`} 
                  key={relatedPattern.id}
                  className="block"
                >
                  <div className="glass-panel rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                    <h3 className="font-mono text-lg text-zinc-200 mb-2">
                      {relatedPattern.title}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {relatedPattern.description}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
