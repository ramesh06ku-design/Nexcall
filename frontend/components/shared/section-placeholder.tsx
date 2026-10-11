import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { PageHeading } from "@/components/shared/page-heading";
export function SectionPlaceholder({ title, description }: { title: string; description: string }) { return <><PageHeading title={title} description={description} /><Card className="p-3"><EmptyState title={`${title} is ready for the next phase`} description="The route, navigation and responsive foundation are in place. Business workflows will be added in a later prompt." /><p className="sr-only"><Construction /> Foundation only</p></Card></>; }
