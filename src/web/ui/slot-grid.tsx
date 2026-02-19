import * as React from "react"

import { cn } from "@/web/ui/lib/utils"

interface SlotGridProps extends React.ComponentProps<"div"> {
  columns?: number
}

function SlotGrid({ className, columns = 10, style, ...props }: SlotGridProps) {
  return (
    <div
      data-slot="slot-grid"
      className={cn("inline-grid gap-px bg-border/50 rounded-sm", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 40px)`,
        ...style,
      }}
      {...props}
    />
  )
}

interface SlotProps extends React.ComponentProps<"button"> {
  selected?: boolean
  "aria-label"?: string
}

function Slot({
  className,
  selected = false,
  children,
  ...props
}: SlotProps) {
  return (
    <button
      data-slot="slot"
      data-selected={selected || undefined}
      className={cn(
        "flex items-center justify-center",
        "size-10 bg-background border border-secondary",
        "transition-colors cursor-pointer",
        "hover:border-muted-foreground",
        "data-[selected]:border-primary data-[selected]:shadow-[inset_0_0_6px_rgba(224,144,48,0.3)]",
        "disabled:cursor-default disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface SlotIconProps extends React.ComponentProps<"img"> {
  size?: number
}

function SlotIcon({ className, size = 32, alt = "", ...props }: SlotIconProps) {
  return (
    <img
      data-slot="slot-icon"
      alt={alt}
      width={size}
      height={size}
      className={cn("[image-rendering:pixelated] pointer-events-none", className)}
      {...props}
    />
  )
}

export { SlotGrid, Slot, SlotIcon }
