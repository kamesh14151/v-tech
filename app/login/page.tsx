"use client"

import Image from "next/image"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { FormEvent, useState } from "react"

export default function LoginPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isSignup = mode === "signup"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const form = event.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    try {
      if (isSignup) {
        // Register new user
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Registration failed.")
          return
        }

        // Auto sign in after successful registration
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Account created! Please sign in.")
          setMode("login")
          setSuccess("Account created! Please sign in below.")
        } else {
          window.location.href = "/workspace"
        }
      } else {
        // Sign in existing user
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Invalid email or password.")
        } else {
          window.location.href = "/workspace"
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    await signIn("google", { callbackUrl: "/workspace" })
  }

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

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dedede] bg-[#fafafa] text-sm transition-colors hover:bg-[#f1f1f1] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="font-bold text-[#4285f4]">G</span>
              {googleLoading ? "Redirecting…" : isSignup ? "Sign up with Google" : "Continue with Google"}
            </button>

            <div className="my-7 flex items-center gap-4 text-xs text-[#a0a0a0]">
              <span className="h-px flex-1 bg-[#e8e8e8]" />
              or
              <span className="h-px flex-1 bg-[#e8e8e8]" />
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-xs font-medium" htmlFor="email">
                Email
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@email.com"
                  className="h-12 rounded-xl border border-[#dedede] px-3 text-sm font-normal outline-none transition focus:border-[#151515]"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium" htmlFor="password">
                Password
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border border-[#dedede] px-3 text-sm font-normal outline-none transition focus:border-[#151515]"
                />
              </label>

              {error && (
                <p className="text-xs text-red-500 text-center" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-[#5f7b66] text-center" role="status">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-[#171717] text-sm text-white transition hover:bg-[#303030] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {loading ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setMode(isSignup ? "login" : "signup"); setError(null); setSuccess(null) }}
              className="mx-auto mt-6 block text-sm text-[#858585] transition hover:text-[#151515]"
            >
              {isSignup ? "Already have an account?" : "Need an account? Create one"}
            </button>
          </div>
        </section>

        <aside className="relative hidden w-1/2 overflow-hidden bg-[#0b3b46] lg:block">
          <Image src="/login-portrait.jpeg" alt="Login portrait" fill priority className="object-cover" sizes="50vw" />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/95 p-5 backdrop-blur-sm">
            <p className="max-w-[360px] text-sm leading-6 text-[#202020]">Modern tools for turning ambitious ideas into something real, from first thought to final launch.</p>
            <div className="mt-5 flex items-center justify-between text-xs font-medium text-[#6d6d6d]">
              <span className="rounded-full bg-[#e4f5e9] px-3 py-1 text-[#36734d]">Inspiration</span>
              <span>Optimus 1.0</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
