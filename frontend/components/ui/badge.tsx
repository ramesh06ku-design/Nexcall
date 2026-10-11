import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "success" | "warning" | "neutral" }) {
  const styles = { default: "bg-primary-soft text-primary-strong", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", neutral: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles[variant], className)} {...props} />;
}
