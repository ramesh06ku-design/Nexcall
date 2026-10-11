"use client";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils/cn";

export function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) { return <AvatarPrimitive.Root className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full bg-primary-soft", className)} {...props} />; }
export function AvatarImage(props: React.ComponentProps<typeof AvatarPrimitive.Image>) { return <AvatarPrimitive.Image className="aspect-square size-full object-cover" {...props} />; }
export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) { return <AvatarPrimitive.Fallback className={cn("grid size-full place-items-center text-xs font-bold text-primary-strong", className)} {...props} />; }
