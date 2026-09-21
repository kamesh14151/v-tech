"use client"

import Image from "next/image"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get("callbackUrl") || "/workspace";
    await signIn("google", { callbackUrl: targetUrl })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3e9] p-4 text-[#151515] sm:p-8">
      <div className="flex min-h-[520px] w-full max-w-[960px] overflow-hidden rounded-[34px] bg-white shadow-[0_20px_70px_rgba(32,38,30,0.12)]">
        <section className="flex w-full flex-col justify-center px-8 py-12 sm:px-14 lg:w-1/2 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-[420px] text-center sm:text-left">
            <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold tracking-tight" aria-label="Optimus home">
              <img src="/logo.jpeg" alt="Optimus Logo" className="w-8 h-8 rounded-xl object-cover border border-[#dedede] shadow-sm" />
              <span>Optimus</span><span className="align-top text-[9px] text-[#777]">TM</span>
            </Link>
            
            <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-[34px]">
              Sign in to Optimus
            </h1>
            <p className="mt-3 text-sm text-[#777] leading-relaxed">
              Access real-time media intelligence and automated executive briefings directly with your verified Google account.
            </p>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-[#dedede] bg-[#fafafa] px-6 text-sm font-semibold text-[#151515] shadow-sm transition-all hover:bg-[#f1f1f1] hover:border-[#4285f4]/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {googleLoading ? "Connecting Google Account…" : "Continue with Google"}
              </button>

              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-[11px] font-mono text-[#555] text-center">
                🔒 Google Account authentication automatically syncs your email for automated morning briefings.
              </div>
            </div>
          </div>
        </section>

        <aside className="relative hidden w-1/2 overflow-hidden bg-[#0b3b46] lg:block">
          <Image src="/login-portrait.jpeg" alt="Login portrait" fill priority className="object-cover" sizes="50vw" />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/95 p-5 backdrop-blur-sm">
            <p className="max-w-[360px] text-sm leading-6 text-[#202020]">Automated executive media intelligence, citation synthesis, and risk scores directly to your inbox.</p>
            <div className="mt-5 flex items-center justify-between text-xs font-medium text-[#6d6d6d]">
              <span className="rounded-full bg-[#e4f5e9] px-3 py-1 text-[#36734d]">Single Sign-On</span>
              <span>Google Verified</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
