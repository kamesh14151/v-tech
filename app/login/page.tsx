"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "create">("create");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <section className="hidden flex-1 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="text-xl font-semibold tracking-tight">optimus<span className="opacity-70">.</span></Link>
        <div className="max-w-lg">
          <p className="text-sm uppercase tracking-[0.2em] opacity-70">Company intelligence, clarified</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight">Know what matters before the day begins.</h1>
          <p className="mt-6 max-w-md leading-7 opacity-80">Discover direct and indirect coverage, validate context, and receive a personalized morning intelligence report.</p>
        </div>
        <p className="text-sm opacity-60">Semantic discovery · Contextual validation · Smart extraction</p>
      </section>
      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-[48%] lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><Link href="/" className="text-xl font-semibold tracking-tight">optimus<span className="text-primary">.</span></Link></div>
          <p className="text-sm font-medium text-muted-foreground">{mode === "create" ? "Start monitoring smarter" : "Welcome back"}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{mode === "create" ? "Create your account" : "Sign in to Optimus"}</h2>
          <p className="mt-3 leading-6 text-muted-foreground">{mode === "create" ? "Build your company profile and receive the stories that matter." : "Continue to your intelligence workspace."}</p>
          <button type="button" className="mt-8 flex w-full items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent">Continue with Google</button>
          <div className="my-7 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === "create" && <label className="flex flex-col gap-2 text-sm font-medium">Full name<input required name="name" className="rounded-lg border border-border bg-background px-4 py-3 font-normal outline-none ring-primary focus:ring-2" placeholder="Alex Morgan" /></label>}
            <label className="flex flex-col gap-2 text-sm font-medium">Email address<input required type="email" name="email" className="rounded-lg border border-border bg-background px-4 py-3 font-normal outline-none ring-primary focus:ring-2" placeholder="you@company.com" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Password<input required minLength={8} type="password" name="password" className="rounded-lg border border-border bg-background px-4 py-3 font-normal outline-none ring-primary focus:ring-2" placeholder="At least 8 characters" /></label>
            {submitted && <p className="text-sm text-primary" role="status">Form submitted. Authentication will be connected next.</p>}
            <button type="submit" className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">{mode === "create" ? "Create account" : "Sign in"}</button>
          </form>
          <p className="mt-8 text-center text-sm text-muted-foreground">{mode === "create" ? "Already have an account?" : "New to Optimus?"}{" "}<button type="button" onClick={() => { setMode(mode === "create" ? "signin" : "create"); setSubmitted(false); }} className="font-medium text-foreground underline underline-offset-4">{mode === "create" ? "Sign in" : "Create an account"}</button></p>
        </div>
      </section>
    </main>
  );
}
