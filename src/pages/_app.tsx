import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID ?? '';

if (!walletConnectProjectId || /replace_with|your_project_id|change_me|placeholder/i.test(walletConnectProjectId)) {
  throw new Error(
    'LIRA requires NEXT_PUBLIC_WALLET_CONNECT_ID to be set to a real WalletConnect project ID before the app can run.'
  );
}

const config = getDefaultConfig({
  appName: 'Lira Protocol',
  projectId: walletConnectProjectId,
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {getLayout(<Component {...pageProps} />)}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#121826',
                color: '#fff',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
