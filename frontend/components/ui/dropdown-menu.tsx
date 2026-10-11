"use client";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;
export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof Dropdown.Content>) { return <Dropdown.Portal><Dropdown.Content sideOffset={8} className={cn("z-50 min-w-44 rounded-xl border bg-white p-1.5 shadow-card", className)} {...props} /></Dropdown.Portal>; }
export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof Dropdown.Item>) { return <Dropdown.Item className={cn("flex cursor-default items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted", className)} {...props} />; }
