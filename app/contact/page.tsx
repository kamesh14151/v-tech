import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — Optimus Enterprise",
  description: "Get in touch with the Optimus team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>

        <div className="mt-8">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Contact</span>
          <h1 className="text-4xl font-display tracking-tight mt-3 mb-4">Get in touch</h1>
          <p className="text-muted-foreground mb-10">We typically respond within one business day.</p>

          <form className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted-foreground" htmlFor="name">Name</label>
                <input id="name" name="name" type="text" required placeholder="Your name"
                  className="h-11 rounded-xl border border-foreground/10 bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted-foreground" htmlFor="email">Work Email</label>
                <input id="email" name="email" type="email" required placeholder="name@company.com"
                  className="h-11 rounded-xl border border-foreground/10 bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground" htmlFor="company">Company</label>
              <input id="company" name="company" type="text" placeholder="Company name"
                className="h-11 rounded-xl border border-foreground/10 bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground" htmlFor="subject">Subject</label>
              <select id="subject" name="subject"
                className="h-11 rounded-xl border border-foreground/10 bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors text-foreground">
                <option>Sales inquiry</option>
                <option>Partnership</option>
                <option>Technical support</option>
                <option>Press / Media</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground" htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={5} required placeholder="How can we help?"
                className="rounded-xl border border-foreground/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40 transition-colors resize-none" />
            </div>

            <button type="submit"
              className="h-11 w-full rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors">
              Send message
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-foreground/10 grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">Sales</div>
              <a href="mailto:sales@optimus-intelligence.com" className="text-foreground hover:underline">sales@optimus-intelligence.com</a>
            </div>
            <div>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">Support</div>
              <a href="mailto:support@optimus-intelligence.com" className="text-foreground hover:underline">support@optimus-intelligence.com</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
