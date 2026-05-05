# CipherView

**Encrypted Video Access Marketplace** built on Sui Testnet with zkLogin, AES-256-GCM encryption, and time-limited access control.

> **Security Limitation:** YouTube embed URLs cannot be fully protected from browser DevTools inspection. For full content protection, encrypted video files should be stored on **Walrus** or **IPFS** instead of YouTube. This project demonstrates the access-control and encryption architecture.

---

## Architecture

```
Creator uploads YouTube URL
        ↓
Backend extracts video ID → builds embed URL
        ↓
AES-256-GCM encrypts embed URL
        ↓
Stores: encrypted_url + iv + auth_tag in Supabase (never plaintext)
        ↓
Buyer pays SUI → Sui transaction recorded on-chain
        ↓
Backend records purchase with expiry = now + duration_hours
        ↓
/watch/[id] → POST /api/videos/[id]/play
        ↓
Backend verifies: authenticated + purchase exists + not expired
        ↓
Decrypts embed URL (ONLY here — single decrypt point)
        ↓
Returns embedUrl to SecureVideoPlayer iframe
```

### Security Rules
- `encryptText()` called only during upload
- `decryptText()` called **only** in `/api/videos/[id]/play`
- Encrypted fields never returned to client in any other route
- Decrypted URL never logged or stored anywhere
- Player clears iframe src on unmount

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Auth | NextAuth + Google OAuth (zkLogin) |
| Blockchain | Sui Testnet |
| Smart Contract | Sui Move |
| Database | Supabase (PostgreSQL) |
| Encryption | AES-256-GCM (Node.js crypto) |
| Deployment | Vercel |

---

## Quick Start (Dev Mode — no blockchain needed)

```bash
cd cipherview
npm install

# Create .env.local
cp .env.example .env.local
```

Edit `.env.local` with these minimal values:
```env
NEXT_PUBLIC_DEV_MODE=true
NEXTAUTH_SECRET=change-this-to-any-32-char-string
NEXTAUTH_URL=http://localhost:3000
ENCRYPTION_SECRET=0000000000000000000000000000000000000000000000000000000000000000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm run dev
# Open http://localhost:3000
```

---

## Full Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your credentials to `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Google OAuth (zkLogin)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Encryption Key

Generate a secure 32-byte hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
ENCRYPTION_SECRET=<64-char-hex-output>
```

### 5. Sui Contract Deployment

Install Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

Get testnet SUI:
```bash
sui client new-address ed25519
sui client faucet
```

Deploy:
```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

Copy the Package ID and VideoRegistry object ID from the output:
```env
NEXT_PUBLIC_PACKAGE_ID=0x<package-id>
NEXT_PUBLIC_REGISTRY_OBJECT_ID=0x<registry-object-id>
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_DEV_MODE=false
```

---

## Vercel Deployment

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Set `NEXTAUTH_URL=https://your-domain.vercel.app`
5. Update Google OAuth redirect URI to `https://your-domain.vercel.app/api/auth/callback/google`
6. Deploy

---

## Test Flow

1. Open `http://localhost:3000`
2. **Login** — use "Dev Login" button (no Google needed in dev mode)
3. **Upload** — go to `/upload`, paste a YouTube URL, set price and duration
4. **Explore** — go to `/explore`, see your video listed with locked thumbnail
5. **Buy** — click a video, click "Buy Access" — mock Sui transaction runs
6. **Watch** — click "Watch Now" — `/watch/[id]` verifies access, decrypts, plays video
7. **Countdown** — timer shows remaining access time
8. **Expire** — set `durationHours` to a small value to test expiry state
9. **Dashboard** — go to `/dashboard` to see uploads, purchases, and transactions

---

## Project Structure

```
cipherview/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/       # NextAuth + Google OAuth
│   │   ├── videos/
│   │   │   ├── route.ts              # GET  /api/videos
│   │   │   ├── upload/route.ts       # POST /api/videos/upload
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET  /api/videos/[id]
│   │   │       ├── buy/route.ts      # POST /api/videos/[id]/buy
│   │   │       ├── play/route.ts     # POST /api/videos/[id]/play  ← ONLY decrypt point
│   │   │       └── purchase-status/  # GET  purchase status
│   │   └── dashboard/[address]/      # GET  dashboard data
│   ├── page.tsx                      # Landing page
│   ├── login/page.tsx                # zkLogin page
│   ├── explore/page.tsx              # Video grid + search
│   ├── upload/page.tsx               # Upload form
│   ├── video/[id]/page.tsx           # Video detail + buy
│   ├── watch/[id]/page.tsx           # Secure player (decrypt here)
│   └── dashboard/page.tsx            # User dashboard
├── components/
│   ├── SecureVideoPlayer.tsx         # iframe — receives embedUrl prop only
│   ├── BuyAccessButton.tsx           # Sui tx + backend purchase record
│   ├── CountdownTimer.tsx            # Live countdown to expiry
│   ├── LockedPlayer.tsx              # Blurred locked preview
│   └── ui/                           # shadcn/ui base components
├── lib/
│   ├── crypto.ts                     # AES-256-GCM encrypt/decrypt
│   ├── youtube.ts                    # URL helpers
│   ├── sui.ts                        # Sui SDK + mock mode
│   ├── supabase.ts                   # DB client + types
│   ├── auth.ts                       # Session helpers
│   └── zklogin.ts                    # zkLogin + dev fallback
├── contracts/
│   ├── Move.toml
│   └── sources/cipherview.move       # Sui Move contract
├── supabase/
│   └── schema.sql                    # DB schema + RLS policies
└── .env.example                      # Environment variable template
```

---

## Security Notes

- **AES-256-GCM** with random 96-bit IV per encryption — authenticated encryption prevents ciphertext tampering
- **Single decrypt point** — `decryptText()` is only called in `/api/videos/[id]/play`
- **Service role key** is server-side only — never sent to the browser
- **No plaintext URLs stored** — only `encrypted_url`, `encryption_iv`, `encryption_auth_tag`
- **Session JWT** — 24h expiry, signed with `NEXTAUTH_SECRET`
- **YouTube limitation** — embed URLs are visible in browser DevTools network tab; use Walrus/IPFS for true content encryption
