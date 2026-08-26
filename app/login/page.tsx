"use client"

import Image from "next/image"
import Link from "next/link"
import { FormEvent, useState } from "react"

export default function LoginPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  const isSignup = mode === "signup"

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3e9] p-4 text-[#151515] sm:p-8">
      <div className="flex min-h-[590px] w-full max-w-[1000px] overflow-hidden rounded-[34px] bg-white shadow-[0_20px_70px_rgba(32,38,30,0.12)]">
        <section className="flex w-full flex-col justify-center px-8 py-12 sm:px-14 lg:w-1/2 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-[420px]">
            <Link href="/" className="mb-14 inline-flex items-center text-sm font-semibold tracking-tight" aria-label="Optimus home">
              Optimus<span className="ml-1 align-top text-[9px] text-[#777]">TM</span>
            </Link>
            <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-[34px]">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-3 text-sm text-[#777]">
              {isSignup ? "Start building with Optimus today." : "Sign in to continue creating."}
            </p>

            <button type="button" className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dedede] bg-[#fafafa] text-sm transition-colors hover:bg-[#f1f1f1]">
              <span className="font-bold text-[#4285f4]">G</span>
              {isSignup ? "Sign up with Google" : "Continue with Google"}
            </button>

            <div className="my-7 flex items-center gap-4 text-xs text-[#a0a0a0]"><span className="h-px flex-1 bg-[#e8e8e8]" />or<span className="h-px flex-1 bg-[#e8e8e8]" /></div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-xs font-medium" htmlFor="email">Email<input id="email" name="email" type="email" required placeholder="name@email.com" className="h-12 rounded-xl border border-[#dedede] px-3 text-sm font-normal outline-none transition focus:border-[#151515]" /></label>
              <label className="flex flex-col gap-2 text-xs font-medium" htmlFor="password">Password<input id="password" name="password" type="password" required minLength={6} placeholder="••••••••" className="h-12 rounded-xl border border-[#dedede] px-3 text-sm font-normal outline-none transition focus:border-[#151515]" /></label>
              <button type="submit" className="h-12 rounded-xl bg-[#171717] text-sm text-white transition hover:bg-[#303030]">{isSignup ? "Create account" : "Sign in"}</button>
            </form>
            {submitted && <p className="mt-4 text-center text-xs text-[#5f7b66]" role="status">This demo form is ready to connect to your auth provider.</p>}
            <button type="button" onClick={() => { setMode(isSignup ? "login" : "signup"); setSubmitted(false) }} className="mx-auto mt-6 block text-sm text-[#858585] transition hover:text-[#151515]">
              {isSignup ? "Already have an account?" : "Need an account? Create one"}
            </button>
          </div>
        </section>

        <aside className="relative hidden w-1/2 overflow-hidden bg-[#0b3b46] lg:block">
          <Image src="/login-portrait.png" alt="Stylish portrait with headphones and sunglasses" fill priority className="object-cover" sizes="50vw" />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/95 p-5 backdrop-blur-sm">
            <p className="max-w-[360px] text-sm leading-6 text-[#202020]">Modern tools for turning ambitious ideas into something real, from first thought to final launch.</p>
            <div className="mt-5 flex items-center justify-between text-xs font-medium text-[#6d6d6d]"><span className="rounded-full bg-[#e4f5e9] px-3 py-1 text-[#36734d]">Inspiration</span><span>Optimus 1.0</span></div>
          </div>
        </aside>
      </div>
    </main>
  )
}
