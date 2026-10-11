import Link from "next/link";
import { ArrowRight, BarChart3, Check, PhoneCall, Sparkles, Users2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionReveal } from "@/components/marketing/motion-reveal";
import { cn } from "@/lib/utils/cn";

const benefits = [
  { icon: Users2, title: "A focused team workspace", text: "Give managers and telecallers the right tools, without the clutter of a heavyweight CRM." },
  { icon: PhoneCall, title: "Every call stays visible", text: "Keep leads, conversations and follow-ups organized so opportunities never slip through." },
  { icon: BarChart3, title: "Know what is working", text: "See clear performance signals across your team and make faster, better decisions." },
];

export default function MarketingPage() {
  return (
    <main className="overflow-hidden bg-white">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-white"><PhoneCall className="size-4" /></span>NEXCALL
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a><a href="#how" className="hover:text-foreground">How it works</a><Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/worker-login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>Worker Login</Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>Sign in</Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>Start free</Link>
          </div>
        </nav>
      </header>

      <section className="relative px-5 pb-20 pt-18 sm:pt-24 lg:px-8 lg:pb-28">
        <div className="absolute inset-x-0 top-0 -z-0 mx-auto h-[620px] max-w-6xl rounded-full bg-[radial-gradient(circle_at_center,rgba(97,87,232,.11),transparent_66%)]" />
        <MotionReveal className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-strong"><Sparkles className="size-3.5" /> Built for modern calling teams</div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-foreground sm:text-6xl lg:text-7xl">Your telecalling team,<br /><span className="text-primary">beautifully organized.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Manage your team, leads, calls and follow-ups from one simple workspace—so everyone knows what to do next.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>Create your agency <ArrowRight className="size-4" /></Link>
            <a href="#product" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>See how it works</a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Simple setup · Secure access · Built for every screen</p>
        </MotionReveal>

        <div id="product" className="relative mx-auto mt-16 max-w-6xl rounded-[28px] border border-slate-200 bg-slate-950 p-2 shadow-[0_32px_80px_rgba(23,32,51,.16)] sm:p-3">
          <div className="grid min-h-[430px] overflow-hidden rounded-[20px] bg-background md:grid-cols-[210px_1fr]">
            <aside className="hidden bg-[#19182c] p-5 text-white md:block">
              <div className="mb-8 flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-lg bg-primary"><PhoneCall className="size-3.5" /></span>NEXCALL</div>
              {["Overview", "Telecallers", "Leads", "Calls", "Follow-ups", "Analytics"].map((item, index) => <div key={item} className={cn("mb-1 rounded-lg px-3 py-2.5 text-xs", index === 0 ? "bg-white/10 text-white" : "text-slate-400")}>{item}</div>)}
            </aside>
            <div className="p-5 sm:p-8">
              <div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Monday, 29 August</p><h2 className="mt-1 text-xl font-bold">Good morning, Aisha</h2></div><span className="size-9 rounded-full bg-primary-soft" /></div>
              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total leads", "2,480"], ["Calls today", "146"], ["Active team", "24"], ["Follow-ups", "38"]].map(([label, value], i) => <Card key={label} className="p-4"><div className="mb-4 size-8 rounded-lg bg-primary-soft" /><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p><span className="mt-3 inline-block text-[10px] font-semibold text-emerald-600">+{4 + i * 3}% this week</span></Card>)}</div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_1fr]"><Card className="h-40 p-5"><div className="mb-6 flex justify-between"><b className="text-sm">Call activity</b><span className="text-xs text-muted-foreground">Last 7 days</span></div><div className="flex h-18 items-end gap-3">{[48,72,44,86,66,92,76].map((height, i) => <span key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${height}%` }} />)}</div></Card><Card className="h-40 p-5"><b className="text-sm">Team progress</b><div className="mt-5 space-y-4">{[82,68,54].map((width, i) => <div key={i}><div className="mb-1.5 flex justify-between text-[10px]"><span>Caller {i + 1}</span><span>{width}%</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} /></div></div>)}</div></Card></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background px-5 py-20 lg:px-8" aria-labelledby="benefits-title"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold text-primary">EVERYTHING IN ONE PLACE</p><h2 id="benefits-title" className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Less chasing. More conversations that move business forward.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) => <Card key={title} className="p-6"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></Card>)}</div></div></section>

      <section id="how" className="px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-sm font-bold text-primary">HOW NEXCALL WORKS</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">From assignment to follow-up, in one clear flow.</h2><p className="mt-4 max-w-xl leading-7 text-muted-foreground">Set up your team, assign leads, and give every telecaller a focused daily view. NexCall keeps progress visible without getting in the way.</p></div><div className="space-y-3">{["Create your agency and invite your team", "Organize and assign the right leads", "Call, follow up and improve together"].map((item, i) => <div key={item} className="flex items-center gap-4 rounded-2xl border bg-white p-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span><p className="font-semibold">{item}</p><Check className="ml-auto size-5 text-emerald-500" /></div>)}</div></div></section>

      <section className="px-5 pb-20 lg:px-8"><div className="mx-auto max-w-7xl rounded-[32px] bg-[#19182c] px-6 py-14 text-center text-white sm:px-10"><p className="text-sm font-bold text-violet-300">A SIMPLER WAY TO LEAD</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Bring clarity to every call.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">Start with a clean workspace your managers and telecallers will actually enjoy using.</p><Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-7 bg-white text-[#19182c] hover:bg-slate-100")}>Start your agency <ArrowRight className="size-4" /></Link></div></section>

      <footer className="border-t px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><b className="text-foreground">NEXCALL</b><p>© 2026 NexCall. Built for better conversations.</p><div className="flex gap-5"><Link href="/pricing">Pricing</Link><Link href="/login">Sign in</Link></div></div></footer>
    </main>
  );
}
