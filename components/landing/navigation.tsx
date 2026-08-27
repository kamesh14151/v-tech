"use client";

import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { useState } from "react";

export function Navigation({ onOpenWorkspace }: { onOpenWorkspace?: () => void }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["Features", "#features"],
    ["How it works", "#how-it-works"],
    ["Pricing", "#pricing"],
  ];

  return (
    <header className="relative z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">optimus<span className="text-primary">.</span></Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
          <button type="button" onClick={onOpenWorkspace} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Get started <ArrowUpRight aria-hidden="true" /></button>
        </div>
        <button type="button" aria-label="Toggle navigation menu" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-md p-2 text-foreground sm:hidden"><Menu aria-hidden="true" /></button>
      </div>
      {open && <nav className="flex flex-col gap-4 border-t border-border/60 px-6 py-5 sm:hidden" aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground">{label}</Link>)}<Link href="/login" className="text-sm font-medium text-muted-foreground">Sign in</Link></nav>}
    </header>
  );
}
