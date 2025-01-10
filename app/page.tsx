import { PatternGrid } from "@/components/pattern-grid"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="container max-w-[1400px] px-6 py-24">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <h1 className="font-mono text-3xl font-medium tracking-tight mb-4">
            Explore Debug Patterns
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed tracking-wide max-w-2xl">
            Explore common debugging patterns with ready to copy code to improve your development workflow.
            These debug patterns are inspired by real-world scenarios.
          </p>
        </div>
        <PatternGrid />
      </main>
    </div>
  )
}

