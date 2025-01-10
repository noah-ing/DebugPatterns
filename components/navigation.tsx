import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="w-full bg-zinc-900/50 backdrop-blur-lg border-b border-border/50">
      <div className="container max-w-[1400px] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-mono text-lg font-medium text-zinc-200 hover:text-white transition-colors">
          Debug Patterns
        </Link>
      </div>
    </nav>
  )
}

