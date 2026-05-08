"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "mainnet") || "testnet";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
          <WalletProvider autoConnect>
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
