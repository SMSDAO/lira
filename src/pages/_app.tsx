import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const { connectors } = getDefaultWallets({
  appName: 'Lira Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'YOUR_PROJECT_ID',
});

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient: createPublicClient({
    chain: base,
    transport: http(),
  }),
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={[base, baseSepolia]}>
          <Component {...pageProps} />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0a0e1a',
                color: '#fff',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              },
            }}
          />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
