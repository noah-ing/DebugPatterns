import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WorkflowCardProps {
  id: string
  title: string
  description: string
  diagram: string
  category?: string
  priority?: boolean
}

export function WorkflowCard({
  id,
  title,
  description,
  diagram,
  category,
  priority = false
}: WorkflowCardProps) {
  return (
    <Link href={`/patterns/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/20 group">
        <div className="aspect-[2/1] relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <Image
              src={diagram}
              alt={`${title} workflow diagram`}
              fill
              priority={priority}
              className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            {category && (
              <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wide">
                {category}
              </Badge>
            )}
          </div>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </Card>
    </Link>
  )
}
