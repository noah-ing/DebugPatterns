import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PatternCategory } from "@/data"

interface WorkflowCardProps {
  id: string
  title: string
  description: string
  diagram: string
  category: PatternCategory
  useCases: string[]
}

export function WorkflowCard({
  id,
  title,
  description,
  diagram,
  category,
  useCases
}: WorkflowCardProps) {
  return (
    <Link href={`/patterns/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md hover:border-zinc-700 group h-full">
        <div className="aspect-[2/1] relative bg-zinc-900">
          <div className="absolute inset-0 bg-black m-6 rounded-lg">
            <Image
              src={diagram}
              alt={`${title} workflow diagram`}
              fill
              priority={id === "async-promise-hell"}
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h3>
            <Badge 
              variant="secondary" 
              className="bg-zinc-800/50 text-zinc-400 px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
            >
              {category}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">{description}</p>
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Use Cases</h4>
            <ul className="text-xs text-zinc-400 space-y-1">
              {useCases.slice(0, 2).map((useCase, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1 h-1 bg-zinc-700 rounded-full mr-2" />
                  {useCase}
                </li>
              ))}
              {useCases.length > 2 && (
                <li className="text-zinc-500">+{useCases.length - 2} more</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </Link>
  )
}
