import { cn } from '@/lib/utils'

export function PurpleMark({ className }: { className?: string }) {
  return (
    <img
      src="/purple-mark.png"
      alt="Purple geometric logo"
      className={cn('inline-block object-contain', className)}
    />
  )
}

export function PurpleLogo({
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
      <PurpleMark className={cn('h-8 w-8', markClassName)} />
      {wordmark && (
        <span className="text-[17px] font-extrabold text-foreground">Purple</span>
      )}
    </span>
  )
}
