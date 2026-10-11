import * as React from "react";
import { cn } from "@/lib/utils/cn";
export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) { return <aside className={cn("flex flex-col bg-[#19182c] text-white", className)} {...props} />; }
