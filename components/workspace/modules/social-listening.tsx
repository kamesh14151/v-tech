"use client";

import { useState } from "react";
import { Share2, MessageSquare, Heart, Repeat, TrendingUp, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const socialPosts = [
  {
    id: "soc-1",
    platform: "X (Twitter)",
    handle: "@TechAnalyst_Jane",
    author: "Jane Vance (Enterprise AI Analyst)",
    content: "Just attended the Acme Robotics launch event. The zero-trust security architecture on TitanX Bot is a game changer for manufacturing automation! 🚀 #EnterpriseAI #Robotics",
    time: "45 mins ago",
    likes: 1420,
    reposts: 380,
    sentiment: "+0.92 Positive Advocate",
    bridgeStatus: "Trending into Earned Media (Picked up by TechCrunch)",
  },
  {
    id: "soc-2",
    platform: "LinkedIn",
    handle: "robert-smith-cto",
    author: "Robert Smith (CTO, Acme Robotics)",
    content: "Excited to share our technical whitepaper on multi-modal industrial AI kernels. Thank you to our engineering team for making Autonomous OS v4 a reality.",
    time: "2 hours ago",
    likes: 3890,
    reposts: 640,
    sentiment: "+0.95 Positive",
    bridgeStatus: "Key Executive Quote Tracked",
  },
];

export function SocialListeningView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="text-foreground font-bold">Brandwatch Powered Integration</span>
            <span>•</span>
            <span className="text-foreground">Cross-Platform Social Intelligence</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Social Listening Stream</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tracks social conversations across X (Twitter), LinkedIn, and Instagram, bridging digital trends into earned mainstream news.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
            Social Velocity: +342% Volume Surge
          </span>
        </div>
      </div>

      {/* Social Posts Grid */}
      <div className="space-y-4">
        {socialPosts.map((post) => (
          <div
            key={post.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{post.platform}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{post.handle}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{post.time}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                {post.sentiment}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">{post.author}</h4>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">{post.content}</p>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 font-mono text-xs text-amber-600 dark:text-amber-400">
              ⚡ Social-to-Earned Media Bridge: {post.bridgeStatus}
            </div>

            <div className="pt-2 border-t border-foreground/10 flex justify-between font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-foreground" /> {post.likes} Likes</span>
                <span className="flex items-center gap-1"><Repeat className="w-3.5 h-3.5 text-foreground" /> {post.reposts} Reposts</span>
              </div>
              <span>Brandwatch Engine Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
