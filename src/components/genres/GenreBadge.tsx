import type { Genre } from '@/types/database'
import { cn } from '@/lib/utils'

type GenreBadgeProps = {
  genre: Genre
  className?: string
}

export const GenreBadge = ({ genre, className }: GenreBadgeProps) => {
  const color = genre.color ?? '#64748b'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {genre.name}
    </span>
  )
}
