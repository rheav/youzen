import { useEffect, useRef } from 'react';

/**
 * Subscribe to chrome.runtime messages. Cleans up on unmount.
 * Handles "Extension context invalidated" gracefully.
 *
 * @param {Object} handlers - Map of { MESSAGE_TYPE: (message, sender) => void }
 *
 * @example
 * useMessages({
 *   NETWORK_REQUEST_UPDATE: (msg) => setRequests(prev => [...prev, msg.data]),
 *   DOM_DATA_UPDATE: (msg) => setDomData(msg.data),
 * });
 */
export function useMessages(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const listener = (message, sender, _sendResponse) => {
      try {
        if (!message || !message.type) return;
        const handler = handlersRef.current[message.type];
        if (handler) handler(message, sender);
      } catch (err) {
        if (err.message?.includes('Extension context invalidated')) return;
        console.error('[useMessages]', err);
      }
    };

    try {
      chrome.runtime.onMessage.addListener(listener);
    } catch {
      return undefined;
    }

    return () => {
      try {
        chrome.runtime.onMessage.removeListener(listener);
      } catch {
        // Context invalidated — listener already gone
      }
    };
  }, []);
}
