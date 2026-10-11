import{CallDetails}from"@/components/agency/calls/call-details";export default async function CallPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <CallDetails id={id}/>;}
