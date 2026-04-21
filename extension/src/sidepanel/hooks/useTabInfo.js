import { useState, useEffect } from 'react';

/**
 * Get current tab info with auto-updates.
 * Updates on tab switch and URL change.
 *
 * @returns {{ url: string, tabId: number|null, title: string, favIconUrl: string }}
 *
 * @example
 * const { url, tabId, title, favIconUrl } = useTabInfo();
 */
export function useTabInfo() {
  const [info, setInfo] = useState({
    url: '',
    tabId: null,
    title: '',
    favIconUrl: '',
  });

  useEffect(() => {
    function updateFromTab(tab) {
      if (!tab) return;
      setInfo({
        url: tab.url || '',
        tabId: tab.id || null,
        title: tab.title || '',
        favIconUrl: tab.favIconUrl || '',
      });
    }

    function queryActiveTab() {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) return;
          if (tabs?.[0]) updateFromTab(tabs[0]);
        });
      } catch {
        // Extension context invalidated
      }
    }

    // Load on mount
    queryActiveTab();

    // Update when user switches tabs
    const onActivated = () => queryActiveTab();

    // Update when tab URL/title changes
    const onUpdated = (tabId, changeInfo, tab) => {
      if (changeInfo.url || changeInfo.title || changeInfo.favIconUrl) {
        // Only update if this is the active tab
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) return;
            if (tabs?.[0]?.id === tabId) updateFromTab(tab);
          });
        } catch {}
      }
    };

    try {
      chrome.tabs.onActivated.addListener(onActivated);
      chrome.tabs.onUpdated.addListener(onUpdated);
    } catch {
      return undefined;
    }

    return () => {
      try {
        chrome.tabs.onActivated.removeListener(onActivated);
        chrome.tabs.onUpdated.removeListener(onUpdated);
      } catch {}
    };
  }, []);

  return info;
}
