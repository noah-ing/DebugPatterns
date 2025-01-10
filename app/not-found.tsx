import Link from 'next/link'
import { Navigation } from "@/components/navigation"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="container max-w-[1000px] px-6 py-16 flex flex-col items-center justify-center flex-grow">
        <h2 className="font-mono text-2xl font-medium tracking-tight text-zinc-200 mb-4">404 - Page Not Found</h2>
        <p className="text-zinc-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="text-accent hover:underline">
          Go back to the homepage
        </Link>
      </main>
    </div>
  )
}

