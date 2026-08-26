"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CompetitorMatrixSection } from "@/components/landing/competitor-matrix-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { SecuritySection } from "@/components/landing/security-section";
import { DevelopersSection } from "@/components/landing/developers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState<"site" | "app">("site");

  // If user is already authenticated and tries to open workspace → redirect to real workspace
  const handleOpenWorkspace = () => {
    if (session?.user) {
      router.push("/workspace");
    } else {
      router.push("/login");
    }
  };

  if (viewMode === "app") {
    return <WorkspaceLayout onClose={() => setViewMode("site")} />;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation onOpenWorkspace={handleOpenWorkspace} />
      <HeroSection onOpenWorkspace={handleOpenWorkspace} />
      <FeaturesSection />
      <CompetitorMatrixSection onOpenWorkspace={handleOpenWorkspace} />
      <HowItWorksSection />
      <InfrastructureSection />
      <MetricsSection />
      <IntegrationsSection />
      <SecuritySection />
      <DevelopersSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
