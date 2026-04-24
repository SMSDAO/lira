import Head from 'next/head';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/common/DashboardLayout';

// Dynamic import — VisualEditor uses browser-only drag events
const VisualEditor = dynamic(() => import('@/components/editor/VisualEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-500 text-sm">
      Loading editor…
    </div>
  ),
});

export default function EditorPage() {
  return (
    <>
      <Head>
        <title>Visual DSL Editor — Lira Protocol</title>
        <meta name="description" content="Drag-and-drop Lira contract builder" />
      </Head>
      <DashboardLayout>
        <div className="h-[calc(100vh-64px)]">
          <VisualEditor />
        </div>
      </DashboardLayout>
    </>
  );
}
