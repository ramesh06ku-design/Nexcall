import { TelecallerDetails } from "@/components/agency/telecallers/telecaller-details";
export default async function TelecallerDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <TelecallerDetails id={id} />; }
