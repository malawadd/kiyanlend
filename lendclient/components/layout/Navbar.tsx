'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoButton } from '../ui/NeoButton';
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function Navbar() {
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = useQuery(api.users.getProfile);

  const isBorrower = profile?.isBorrower || false;
  const isLender = profile?.isLender || false;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black uppercase tracking-tight hover:text-primary transition-colors">
              KiyanLend
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-4 py-2 font-bold hover:bg-accent transition-colors">
                Home
              </Link>
              {isSignedIn && isBorrower && (
                <Link href="/borrow" className="px-4 py-2 font-bold hover:bg-primary transition-colors">
                  Borrow
                </Link>
              )}
              {isSignedIn && isLender && (
                <Link href="/lend" className="px-4 py-2 font-bold hover:bg-secondary transition-colors">
                  Lend
                </Link>
              )}
              {isSignedIn && (
                <>
                  <Link href="/requests" className="px-4 py-2 font-bold hover:bg-success transition-colors">
                    Requests
                  </Link>
                  <Link href="/profile" className="px-4 py-2 font-bold hover:bg-accent transition-colors">
                    Profile
                  </Link>
                  <Link href="/help" className="px-4 py-2 font-bold hover:bg-secondary transition-colors">
                    Help
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex gap-3">
                <SignInButton mode="modal">
                  <NeoButton size="sm" variant="secondary">
                    Sign In
                  </NeoButton>
                </SignInButton>
                <SignUpButton mode="modal">
                  <NeoButton size="sm" variant="primary">
                    Sign Up
                  </NeoButton>
                </SignUpButton>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 border-4 border-foreground bg-accent"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t-4 border-foreground bg-white">
          <div className="flex flex-col">
            <Link href="/" className="px-6 py-4 font-bold hover:bg-accent border-b-2 border-foreground">
              Home
            </Link>
            {isSignedIn && isBorrower && (
              <Link href="/borrow" className="px-6 py-4 font-bold hover:bg-primary border-b-2 border-foreground">
                Borrow
              </Link>
            )}
            {isSignedIn && isLender && (
              <Link href="/lend" className="px-6 py-4 font-bold hover:bg-secondary border-b-2 border-foreground">
                Lend
              </Link>
            )}
            {isSignedIn && (
              <>
                <Link href="/requests" className="px-6 py-4 font-bold hover:bg-success border-b-2 border-foreground">
                  Requests
                </Link>
                <Link href="/profile" className="px-6 py-4 font-bold hover:bg-accent border-b-2 border-foreground">
                  Profile
                </Link>
                <Link href="/help" className="px-6 py-4 font-bold hover:bg-secondary">
                  Help
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
