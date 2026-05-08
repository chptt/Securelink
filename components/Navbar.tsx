"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, Upload, LayoutDashboard, Compass, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { ConnectButton } from "@mysten/dapp-kit";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const address = (session?.user as { address?: string })?.address;

  const navLinks = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full group-hover:bg-cyan-400/30 transition-all" />
            </div>
            <span className="text-xl font-bold gradient-text">SecureLink</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/5 transition-all"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sui Wallet Connect */}
            <ConnectButton
              connectText="Connect Wallet"
              className="!bg-transparent !border !border-cyan-500/30 !text-cyan-400 !text-xs !px-3 !py-1.5 !rounded-lg hover:!bg-cyan-500/10 !transition-all"
            />

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg glass-hover border border-white/5 text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-cyan-400 font-mono text-xs">
                    {address ? truncateAddress(address) : session.user?.name}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass border border-white/10 rounded-xl shadow-xl overflow-hidden"
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border-0">
                  Connect
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 glass"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/5 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/5 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full mt-2">Connect</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
