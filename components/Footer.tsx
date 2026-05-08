import Link from "next/link";
import { Shield, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-bold gradient-text">SecureLink</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Encrypted video access marketplace powered by Sui blockchain and AES-256-GCM encryption.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-3">
              ⚠️ For full content protection, use Walrus/IPFS storage instead of YouTube.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: "/explore", label: "Explore" },
                { href: "/upload", label: "Upload" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/login", label: "Login" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Technology</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Sui Testnet</li>
              <li>zkLogin</li>
              <li>AES-256-GCM</li>
              <li>Next.js 14</li>
              <li>Pinata IPFS</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 SecureLink. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan-400 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan-400 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
