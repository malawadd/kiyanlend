"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-screen">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase mb-6 leading-tight">
            Private Micro-Lending,<br />
            <span className="text-primary">Powered by Encrypted AI</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold max-w-3xl mx-auto mb-12">
            Access fair capital without exposing your financial data. Lenders get AI-powered trust scores, borrowers keep their privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSignedIn ? (
              <>
                <Link href="/borrow">
                  <NeoButton size="lg" variant="primary">
                    Get a Private Score
                  </NeoButton>
                </Link>
                <Link href="/lend">
                  <NeoButton size="lg" variant="secondary">
                    Explore Borrowers
                  </NeoButton>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-up">
                  <NeoButton size="lg" variant="primary">
                    Get Started
                  </NeoButton>
                </Link>
                <Link href="#how-it-works">
                  <NeoButton size="lg" variant="accent">
                    How It Works
                  </NeoButton>
                </Link>
              </>
            )}
          </div>
        </div>

        <div id="how-it-works" className="grid md:grid-cols-3 gap-8 mb-20">
          <NeoCard bg="bg-primary">
            <div className="text-center">
              <div className="text-5xl font-black mb-4">01</div>
              <h3 className="text-2xl font-black uppercase mb-4">Keep Data Private</h3>
              <p className="text-lg font-semibold">
                Upload your financial documents to your personal SecretVault. No one can view your raw data.
              </p>
            </div>
          </NeoCard>

          <NeoCard bg="bg-secondary">
            <div className="text-center">
              <div className="text-5xl font-black mb-4">02</div>
              <h3 className="text-2xl font-black uppercase mb-4">AI Trust Score</h3>
              <p className="text-lg font-semibold">
                Lenders run a pre-trained model on your encrypted data. Only a Trust Score is shared, never your files.
              </p>
            </div>
          </NeoCard>

          <NeoCard bg="bg-accent">
            <div className="text-center">
              <div className="text-5xl font-black mb-4">03</div>
              <h3 className="text-2xl font-black uppercase mb-4">Fair Access</h3>
              <p className="text-lg font-semibold">
                Get matched with lenders based on AI assessment, not traditional credit history. Privacy guaranteed.
              </p>
            </div>
          </NeoCard>
        </div>

        <NeoCard bg="bg-success" className="mb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black uppercase text-center mb-8">How Privacy Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-4 border-foreground">
                  1
                </div>
                <h4 className="font-black text-lg mb-2">Upload Privately</h4>
                <p className="font-semibold">Your documents go into your encrypted SecretVault</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-4 border-foreground">
                  2
                </div>
                <h4 className="font-black text-lg mb-2">Model Runs Privately</h4>
                <p className="font-semibold">AI processes encrypted data without seeing raw content</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-4 border-foreground">
                  3
                </div>
                <h4 className="font-black text-lg mb-2">Only Score Shared</h4>
                <p className="font-semibold">Lenders see your Trust Score (1-100), never your files</p>
              </div>
            </div>
          </div>
        </NeoCard>

        <div className="grid md:grid-cols-2 gap-8">
          <NeoCard bg="bg-white">
            <h3 className="text-2xl font-black uppercase mb-4">For Borrowers</h3>
            <ul className="space-y-3 text-lg font-semibold">
              <li className="flex items-start gap-3">
                <span className="text-primary text-2xl">✓</span>
                <span>Your files stay locked in your SecretVault</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-2xl">✓</span>
                <span>Lenders only see your Trust Score</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-2xl">✓</span>
                <span>Control who can request assessments</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-2xl">✓</span>
                <span>Connect multiple wallets to your profile</span>
              </li>
            </ul>
          </NeoCard>

          <NeoCard bg="bg-white">
            <h3 className="text-2xl font-black uppercase mb-4">For Lenders</h3>
            <ul className="space-y-3 text-lg font-semibold">
              <li className="flex items-start gap-3">
                <span className="text-secondary text-2xl">✓</span>
                <span>Run private assessments on encrypted data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-secondary text-2xl">✓</span>
                <span>Get AI-powered Trust Scores (1-100)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-secondary text-2xl">✓</span>
                <span>See Risk Assessment summaries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-secondary text-2xl">✓</span>
                <span>Make informed decisions without raw data</span>
              </li>
            </ul>
          </NeoCard>
        </div>
      </section>
    </main>
  );
}
