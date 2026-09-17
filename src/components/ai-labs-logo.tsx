import logoUrl from '@/assets/ai-labs-logo.png'
import { cn } from '@/lib/utils'

export function AiLabsMark({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="AI Labs"
      className={cn('inline-block object-contain', className)}
    />
  )
}

export function AiLabsLogo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string
  markClassName?: string
  wordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <AiLabsMark className={cn('h-8 w-8', markClassName)} />
      {wordmark && (
        <span className="text-[15px] font-semibold text-foreground">
          AI Labs
          <span className="text-muted-foreground"> Inc.</span>
        </span>
      )}
    </span>
  )
}
