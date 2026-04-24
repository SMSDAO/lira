import Head from 'next/head';
import DashboardLayout from '@/components/common/DashboardLayout';
import RegistryDashboard from '@/components/registry/RegistryDashboard';

export default function RegistryPage() {
  return (
    <>
      <Head>
        <title>TradeOS Registry — Lira Protocol</title>
        <meta name="description" content="Deployed Lira smart contract registry with real-time metrics" />
      </Head>
      <DashboardLayout>
        <div className="h-[calc(100vh-64px)]">
          <RegistryDashboard />
        </div>
      </DashboardLayout>
    </>
  );
}
