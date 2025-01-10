import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { patterns, Pattern } from '@/lib/patterns'

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

          <div className="space-y-8">
            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Diagram Explanation
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                This diagram illustrates the key concepts and flow of the {currentPattern.title} pattern. It provides a visual representation of how different components interact and the overall structure of the debugging process.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Code Examples
              </h2>
              <div className="space-y-6">
                {currentPattern.codeExamples.map((example, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="font-mono text-lg text-zinc-200">
                      {example.title}
                    </h3>
                    <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-zinc-200 whitespace-pre">
                        {example.code}
                      </pre>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      {example.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                How to Use This Pattern
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                To effectively use the {currentPattern.title} pattern in your debugging process:
              </p>
              <ul className="list-disc list-inside text-zinc-400 leading-relaxed mt-2 space-y-2">
                <li>Identify the specific problem area in your code</li>
                <li>Apply the concepts shown in the diagram to your specific case</li>
                <li>Use appropriate tools and techniques as illustrated</li>
                <li>Iterate through the process, refining your approach as needed</li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Common Pitfalls
              </h2>
              <ul className="list-disc list-inside text-zinc-400 leading-relaxed space-y-2">
                <li>Overlooking edge cases in asynchronous flows</li>
                <li>Neglecting error handling in promise chains</li>
                <li>Mismanaging parallel promise execution</li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xl text-white mb-4">
                Best Practices
              </h2>
              <ul className="list-disc list-inside text-zinc-400 leading-relaxed space-y-2">
                <li>Always include proper error handling in promise chains</li>
                <li>Use async/await for more readable asynchronous code</li>
                <li>Leverage Promise.all() for parallel operations when appropriate</li>
                <li>Implement cancellation patterns for long-running operations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-8">
          <h2 className="font-mono text-xl text-white mb-4">
            Related Patterns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patterns.filter(p => p.id !== currentPattern.id).slice(0, 2).map((relatedPattern) => (
              <Link href={`/patterns/${relatedPattern.id}`} key={relatedPattern.id} className="block">
                <div className="glass-panel rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                  <h3 className="font-mono text-lg text-zinc-200 mb-2">{relatedPattern.title}</h3>
                  <p className="text-sm text-zinc-400">{relatedPattern.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex justify-center items-center gap-1.5 text-sm text-zinc-500 py-8">
        Made with ❤️ by Silo-22
      </footer>
    </div>
  )
}
