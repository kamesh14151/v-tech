"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/landing/navigation";
import { CompetitorMatrixSection } from "@/components/landing/competitor-matrix-section";
import { FooterSection } from "@/components/landing/footer-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function ComparePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleOpenWorkspace = () => {
    if (session?.user) {
      router.push("/workspace");
    } else {
      router.push("/login");
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay pt-20">
      <Navigation onOpenWorkspace={handleOpenWorkspace} />
      <div className="py-10">
        <CompetitorMatrixSection onOpenWorkspace={handleOpenWorkspace} />
      </div>
      <CtaSection />
      <FooterSection />
    </main>
  );
}
