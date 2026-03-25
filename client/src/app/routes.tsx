import { createBrowserRouter } from 'react-router';
import { LandingPage } from './components/LandingPage';
import { ChatConversation } from './components/ChatConversation';
import { ResultsScreen } from './components/ResultsScreen';
import { ResultsDetailScreen } from './components/ResultsDetailScreen';
import { ClimateProjectionScreen } from './components/ClimateProjectionScreen';
import { Navigation } from './components/Navigation';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navigation />
      <main className="py-12">
        {children}
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <LandingPage />
      </Layout>
    )
  },
  {
    path: '/chat',
    element: (
      <Layout>
        <ChatConversation />
      </Layout>
    )
  },
  {
    path: '/results',
    element: (
      <Layout>
        <ResultsScreen />
      </Layout>
    )
  },
  {
    path: '/results/detail',
    element: (
      <Layout>
        <ResultsDetailScreen />
      </Layout>
    )
  },
  {
    path: '/results/climate',
    element: (
      <Layout>
        <ClimateProjectionScreen />
      </Layout>
    )
  }
]);
