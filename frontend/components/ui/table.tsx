import * as React from "react";
import { cn } from "@/lib/utils/cn";
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) { return <div className="w-full overflow-x-auto"><table className={cn("w-full min-w-[600px] text-sm", className)} {...props} /></div>; }
export const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className="border-b text-left text-xs text-muted-foreground" {...props} />;
export const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className="divide-y" {...props} />;
export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr className="transition hover:bg-muted/40" {...props} />;
export const TableHead = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="px-4 py-3 font-semibold" {...props} />;
export const TableCell = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="px-4 py-3" {...props} />;
