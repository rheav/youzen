import { useState, useEffect } from 'react';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import TabNav from './components/ui/TabNav';
import ErrorBoundary from './components/ui/ErrorBoundary';
import FeedsTab from './components/tabs/FeedsTab';
import WatchTab from './components/tabs/WatchTab';
import BlocklistTab from './components/tabs/BlocklistTab';
import { useTheme } from './context/ThemeContext';

const TABS = [
  { id: 'feeds', label: 'Feeds' },
  { id: 'watch', label: 'Watch' },
  { id: 'blocklist', label: 'Blocklist' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('feeds');
  const { theme } = useTheme();

  // Apply the root atmosphere class to <body> so the gradient fills the whole panel.
  useEffect(() => {
    document.body.classList.toggle('bg-dark-app', theme === 'dark');
    document.body.classList.toggle('bg-light-app', theme !== 'dark');
    return () => {
      document.body.classList.remove('bg-dark-app', 'bg-light-app');
    };
  }, [theme]);

  return (
    <div className="sidepanel-app">
      <Header />
      <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <main>
        <ErrorBoundary key={activeTab}>
          {activeTab === 'feeds' && <FeedsTab />}
          {activeTab === 'watch' && <WatchTab />}
          {activeTab === 'blocklist' && <BlocklistTab />}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
