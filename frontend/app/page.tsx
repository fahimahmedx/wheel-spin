"use client";

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";


import Swap from "@/app/swapUI/swap";


const config = getDefaultConfig({
  appName: 'WheelSwap',
  projectId: '001',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export default function Home() {
  const queryClient = new QueryClient();
  return (
   <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Swap />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

