# Chrome Extension Template

Production-ready MV3 Chrome extension boilerplate with a sidepanel UI, network interception, DOM tools, and a modular content script architecture.

![React 19](https://img.shields.io/badge/React-19-blue) ![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Vite 6](https://img.shields.io/badge/Vite-6-646cff) ![Manifest V3](https://img.shields.io/badge/Chrome-MV3-4285f4)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/chrome-extension-template.git
cd chrome-extension-template

# 2. Install dependencies
npm install

# 3. Start the dev server (with hot reload)
npm run dev

# 4. Load in Chrome
#    - Open chrome://extensions
#    - Enable "Developer mode" (top right)
#    - Click "Load unpacked"
#    - Select the generated dist/ folder

# 5. Build for production
npm run build
```

The `dist/` folder is your unpacked extension. Click the extension icon to open the sidepanel.

---

## Architecture Overview

```
                          MAIN World                         ISOLATED World
                      (page JS context)                   (extension context)
                    ┌─────────────────────┐             ┌─────────────────────┐
 [Web Page]  ──►   │  fetch-interceptor   │             │   dom-observer      │
                    │  xhr-interceptor     │── bridge ──►│   element-finder    │
                    │                     │  (postMsg)   │                     │
                    └─────────────────────┘             └────────┬────────────┘
                                                                 │
                                                  chrome.runtime.sendMessage
                                                                 │
                                                                 ▼
                                                  ┌──────────────────────────┐
                                                  │   Background Router      │
                                                  │   (service worker)       │
                                                  │                          │
                                                  │   handlers/network.js    │
                                                  │   handlers/dom.js        │
                                                  │   handlers/storage.js    │
                                                  └────────────┬─────────────┘
                                                               │
                                                chrome.runtime.sendMessage
                                                               │
                                                               ▼
                                                  ┌──────────────────────────┐
                                                  │   Sidepanel React App    │
                                                  │   (useMessages hook)     │
                                                  │                          │
                                                  │   Dashboard | DOM | Net  │
                                                  └──────────────────────────┘
```

**Data flows one way:** page interceptors capture data in MAIN world, the bridge relays it to ISOLATED world, ISOLATED forwards it to the background service worker, and the background broadcasts updates to the sidepanel.

---

## Project Structure

```
chrome-extension-template/
├── manifest.config.js              # Dynamic MV3 manifest (CRXJS defineManifest)
├── vite.config.js                  # Build config — CRXJS + React + Tailwind + zip
├── package.json                    # Scripts: dev, build, test, lint, format, zip
├── eslint.config.js                # ESLint flat config with React + Hooks plugins
├── .prettierrc                     # Prettier settings (single quotes, trailing commas)
├── .editorconfig                   # Editor defaults (2-space indent, LF, UTF-8)
├── public/
│   ├── _locales/en/messages.json   # Chrome i18n strings (extension_name, etc.)
│   └── icons/                      # Extension icons (16, 32, 48, 128 px)
├── src/
│   ├── background/
│   │   ├── index.js                # Service worker — message router + tab cleanup
│   │   └── handlers/
│   │       ├── network.js          # Caches intercepted requests per tab, forwards to sidepanel
│   │       ├── dom.js              # Caches DOM tree per tab, forwards mutations
│   │       └── storage.js          # Storage proxy — lets content scripts read/write chrome.storage
│   ├── content/
│   │   ├── main-world.js           # MAIN world entry — fetch + XHR interception via bridge
│   │   ├── isolated-world.js       # ISOLATED world entry — bridge listener + DOM observer
│   │   └── modules/
│   │       ├── xhr-interceptor.js   # Monkey-patches XMLHttpRequest prototype
│   │       ├── fetch-interceptor.js # Monkey-patches window.fetch (cloned responses)
│   │       ├── dom-observer.js      # MutationObserver wrapper with selector filtering
│   │       ├── element-finder.js    # DOM query utilities (findByText, waitForElement, etc.)
│   │       └── bridge.js           # MAIN <-> ISOLATED postMessage bridge with nonce handshake
│   ├── sidepanel/
│   │   ├── index.html              # Sidepanel HTML shell
│   │   ├── main.jsx                # React root — ThemeProvider + ToastProvider + App
│   │   ├── App.jsx                 # Tab router with lazy loading + message subscriptions
│   │   ├── components/
│   │   │   ├── ui/                 # Design system components
│   │   │   │   ├── Button.jsx      # Variants: primary, secondary, ghost, danger
│   │   │   │   ├── Card.jsx        # Collapsible card with title, subtitle, badge
│   │   │   │   ├── Badge.jsx       # Status badges with optional pulse dot
│   │   │   │   ├── Toggle.jsx      # Accessible switch toggle
│   │   │   │   ├── Skeleton.jsx    # Loading placeholders (text, card, table)
│   │   │   │   ├── StatusMessage.jsx # Inline alerts (info, success, warning, error)
│   │   │   │   ├── TabNav.jsx      # Tab bar with sliding indicator
│   │   │   │   ├── Header.jsx      # Sticky header with icon + title + settings
│   │   │   │   ├── Footer.jsx      # Version footer
│   │   │   │   ├── OptionsDropdown.jsx # Settings dropdown (theme toggle)
│   │   │   │   └── ErrorBoundary.jsx   # React error boundary with retry
│   │   │   └── tabs/              # Demo tab panels
│   │   │       ├── DashboardTab.jsx # Page info + stats overview
│   │   │       ├── DOMTab.jsx       # Element tree viewer + selector tester
│   │   │       └── NetworkTab.jsx   # Request list with filtering + export
│   │   ├── hooks/
│   │   │   ├── useMessages.js      # Subscribe to chrome.runtime messages (auto-cleanup)
│   │   │   ├── useStorage.js       # Reactive chrome.storage.local with cross-context sync
│   │   │   └── useTabInfo.js       # Active tab info (url, title, tabId, favIconUrl)
│   │   └── context/
│   │       ├── ThemeContext.jsx     # Dark/light theme with system preference + persistence
│   │       └── ToastContext.jsx     # Toast notification system (success, error, warning, info)
│   ├── config/
│   │   ├── featureFlags.js         # Build-time feature flags (analytics, debug, tabs)
│   │   ├── analyticsConfig.js      # GA4 Measurement Protocol settings
│   │   └── apiConfig.js            # API base URLs + timeout config
│   ├── i18n/
│   │   ├── index.js                # Vanilla JS translation loader with placeholder substitution
│   │   └── useTranslation.js       # React hook for i18n (language switching, auto-reload)
│   ├── utils/
│   │   ├── logger.js               # Debug-gated console wrapper (compile-time flag)
│   │   ├── storage.js              # Promise-based chrome.storage helpers with quota awareness
│   │   ├── messaging.js            # Message type constants + sendMessage/sendTabMessage wrappers
│   │   ├── security.js             # HTML/URL sanitisation, message validation, secure headers
│   │   └── analytics.js            # GA4 Measurement Protocol client (no-op when disabled)
│   └── styles/
│       └── global.css              # CSS custom properties (light/dark), animations, base styles
└── tests/
    ├── setup.js                    # Vitest setup — chrome API mocks
    ├── background/
    │   └── router.test.js          # Message router dispatch tests
    └── hooks/
        └── useStorage.test.js      # useStorage hook tests with @testing-library/react
```

---

## Guides

### 5.1 Adding a New Tab

**Step 1.** Create the tab component at `src/sidepanel/components/tabs/MyTab.jsx`:

```jsx
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function MyTab({ tabInfo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-slide-up">
      <Card title="My New Feature" badge={0}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          This is a custom tab. The active page is: {tabInfo?.url || 'unknown'}
        </p>
      </Card>

      <Card title="Actions">
        <Button variant="primary" size="md" onClick={() => alert('Clicked!')}>
          Do Something
        </Button>
      </Card>
    </div>
  );
}
```

**Step 2.** Add the lazy import in `src/sidepanel/App.jsx`:

```jsx
const MyTab = React.lazy(() => import('./components/tabs/MyTab'));
```

**Step 3.** Add an entry to the `TABS` array (pick an icon from `lucide-react`):

```jsx
import { LayoutDashboard, Code2, Network, Star } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dom', label: 'DOM', icon: Code2 },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'my-tab', label: 'My Tab', icon: Star },       // <-- new
];
```

**Step 4.** Add the render condition inside the `<ErrorBoundary>` block:

```jsx
{activeTab === 'my-tab' && (
  <MyTab tabInfo={tabInfo} />
)}
```

Reload the extension and the new tab appears in the tab bar.

---

### 5.2 Adding a Content Script Module

**Example: Intercept all images loaded on a page.**

**Step 1.** Create `src/content/modules/image-interceptor.js`:

```js
/**
 * Image Interceptor — observes img elements as they load.
 */
export function interceptImages({ onImage }) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check the node itself
        if (node.tagName === 'IMG' && node.src) {
          onImage({ src: node.src, alt: node.alt || '', timestamp: Date.now() });
        }

        // Check descendants
        const imgs = node.querySelectorAll?.('img[src]') || [];
        for (const img of imgs) {
          onImage({ src: img.src, alt: img.alt || '', timestamp: Date.now() });
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Also capture images already present
  document.querySelectorAll('img[src]').forEach((img) => {
    onImage({ src: img.src, alt: img.alt || '', timestamp: Date.now() });
  });

  return () => observer.disconnect();
}
```

**Step 2.** This module reads the DOM, so import it in `src/content/isolated-world.js`:

```js
import { interceptImages } from './modules/image-interceptor.js';

interceptImages({
  onImage: (data) => {
    chrome.runtime.sendMessage({ type: 'IMAGE_FOUND', data });
  },
});
```

If your module needs MAIN world access (e.g., monkey-patching `Image()` constructor), import it in `main-world.js` instead and use `bridgeSend` to relay data:

```js
// In main-world.js
import { interceptImages } from './modules/image-interceptor.js';

interceptImages({
  onImage: (data) => {
    bridgeSend('IMAGE_FOUND', data);
  },
});
```

Then in `isolated-world.js`, forward bridge messages to the background:

```js
onBridgeMessage('IMAGE_FOUND', (data) => {
  chrome.runtime.sendMessage({ type: 'IMAGE_FOUND', data });
});
```

**Step 3.** Create a background handler (see section 5.3) and subscribe in the sidepanel with `useMessages` (see section 5.4).

---

### 5.3 Adding a Background Handler

**Step 1.** Create `src/background/handlers/images.js`:

```js
/**
 * Image data handlers.
 * Caches discovered images per tab, forwards to sidepanel.
 */
const imagesByTab = new Map();

export const imageHandlers = {
  IMAGE_FOUND: (message, sender) => {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const images = imagesByTab.get(tabId) || [];
    images.push(message.data);
    imagesByTab.set(tabId, images);

    // Forward to sidepanel
    try {
      chrome.runtime.sendMessage({
        type: 'IMAGE_UPDATE',
        data: message.data,
        tabId,
      });
    } catch {}
  },

  GET_IMAGES: (message) => {
    return imagesByTab.get(message.tabId) || [];
  },

  __onTabRemoved: (tabId) => {
    imagesByTab.delete(tabId);
  },
};
```

**Step 2.** Import and register in `src/background/index.js`:

```js
import { imageHandlers } from './handlers/images.js';

const handlerModules = [networkHandlers, domHandlers, storageHandlers, imageHandlers];

const handlers = Object.assign({}, ...handlerModules);
```

The `__onTabRemoved` function is called automatically by the existing tab cleanup listener. No extra wiring needed.

---

### 5.4 Adding a New Message Type

**Full example: adding a SCREENSHOT message.**

**Step 1.** Add the type constants to `src/utils/messaging.js`:

```js
export const MESSAGE_TYPES = {
  // ... existing types ...
  TAKE_SCREENSHOT: 'TAKE_SCREENSHOT',
  SCREENSHOT_RESULT: 'SCREENSHOT_RESULT',
};
```

**Step 2.** Add a background handler in `src/background/handlers/screenshot.js`:

```js
export const screenshotHandlers = {
  TAKE_SCREENSHOT: async (message) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return { error: 'No active tab' };

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    // Broadcast result to sidepanel
    try {
      chrome.runtime.sendMessage({
        type: 'SCREENSHOT_RESULT',
        data: { dataUrl, tabId: tab.id, timestamp: Date.now() },
      });
    } catch {}

    return { success: true };
  },
};
```

Register it in `src/background/index.js` (same pattern as section 5.3).

**Step 3.** Subscribe in the sidepanel via `useMessages`:

```jsx
import { useMessages } from '../hooks/useMessages';

const [screenshot, setScreenshot] = useState(null);

useMessages({
  SCREENSHOT_RESULT: (msg) => {
    setScreenshot(msg.data.dataUrl);
  },
});

// Trigger the screenshot
const handleCapture = () => {
  chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' });
};
```

Note: `captureVisibleTab` requires the `"activeTab"` permission (already included in the template manifest).

---

### 5.5 Using the Design System

All components use CSS custom properties for theming and work in both light and dark mode.

#### Button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `icon` | `LucideIcon` | - | Icon component from lucide-react |
| `loading` | `boolean` | `false` | Show spinner and disable |
| `disabled` | `boolean` | `false` | Disable button |
| `fullWidth` | `boolean` | `false` | Stretch to container width |
| `onClick` | `function` | - | Click handler |

```jsx
import { Download, Trash2 } from 'lucide-react';
import Button from './components/ui/Button';

<Button variant="primary" size="md" icon={Download} onClick={handleExport}>
  Export Data
</Button>

<Button variant="danger" size="sm" icon={Trash2} loading={isDeleting}>
  Delete
</Button>

<Button variant="ghost" size="sm" onClick={handleCancel}>
  Cancel
</Button>
```

#### Card

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Card header title |
| `subtitle` | `string` | - | Smaller text below title |
| `badge` | `string \| number` | - | Badge shown next to title |
| `collapsible` | `boolean` | `false` | Allow collapse/expand |
| `padding` | `boolean` | `true` | Apply body padding |

```jsx
import Card from './components/ui/Card';

<Card title="Results" badge={42} collapsible>
  <p>Card content goes here.</p>
</Card>

<Card title="Details" subtitle="Last updated 2 minutes ago">
  <p>Non-collapsible card with subtitle.</p>
</Card>
```

#### Badge

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Color scheme |
| `dot` | `boolean` | `false` | Show animated pulse dot |
| `size` | `'sm' \| 'md'` | `'md'` | Badge size |

```jsx
import Badge from './components/ui/Badge';

<Badge variant="success" dot>Active</Badge>
<Badge variant="error" size="sm">3 errors</Badge>
<Badge variant="info">v2.1</Badge>
```

#### Toggle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Toggle state |
| `onChange` | `function` | - | Called with new boolean value |
| `label` | `string` | - | Text label beside toggle |
| `disabled` | `boolean` | `false` | Disable interaction |

```jsx
import Toggle from './components/ui/Toggle';

const [enabled, setEnabled] = useState(false);

<Toggle checked={enabled} onChange={setEnabled} label="Auto-refresh" />
```

#### Skeleton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'card' \| 'table'` | `'text'` | Skeleton shape |
| `lines` | `number` | `3` | Number of text lines (text variant) |
| `rows` | `number` | `5` | Number of table rows (table variant) |

```jsx
import Skeleton from './components/ui/Skeleton';

<Skeleton variant="text" lines={4} />
<Skeleton variant="card" />
<Skeleton variant="table" rows={8} />
```

#### StatusMessage

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Message style |
| `dismissible` | `boolean` | `false` | Show close button |
| `onDismiss` | `function` | - | Called when dismissed |
| `autoTimeout` | `number` | `0` | Auto-dismiss after N milliseconds |

```jsx
import StatusMessage from './components/ui/StatusMessage';

<StatusMessage type="success" dismissible onDismiss={() => setMsg(null)}>
  Settings saved successfully.
</StatusMessage>

<StatusMessage type="warning" autoTimeout={5000} onDismiss={() => setMsg(null)}>
  Your session will expire soon.
</StatusMessage>
```

#### Toast (via useToast)

Toasts are managed by `ToastContext`. Use the `useToast` hook to trigger them from any component inside the providers.

```jsx
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Data saved successfully.');
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  // Available methods:
  // toast.success(message, duration?)
  // toast.error(message, duration?)
  // toast.warning(message, duration?)
  // toast.info(message, duration?)
  //
  // Default duration: 3000ms. Pass 0 for persistent toasts.
}
```

#### TabNav

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `Array<{ id, label, icon }>` | Tab definitions |
| `active` | `string` | Currently active tab id |
| `onChange` | `function` | Called with new tab id |

```jsx
import TabNav from './components/ui/TabNav';
import { LayoutDashboard, Settings } from 'lucide-react';

const TABS = [
  { id: 'main', label: 'Main', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

<TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
```

#### ErrorBoundary

Wraps children in a React error boundary. When an error occurs, it displays a retry button. Reset the boundary by changing its `key` prop (the template uses `activeTab` as the key so each tab has its own boundary).

```jsx
import ErrorBoundary from './components/ui/ErrorBoundary';

<ErrorBoundary key={activeTab}>
  <MyComponent />
</ErrorBoundary>
```

---

### 5.6 Internationalizing Your Extension

The template uses Chrome's `_locales` system with a custom translation loader that works in all extension contexts.

**Step 1.** Replace a hardcoded string with `t('key')`:

```jsx
// Before
<span>Settings saved</span>

// After
import { t } from '@/i18n';
<span>{t('settings_saved')}</span>
```

**Step 2.** Add the key to `public/_locales/en/messages.json`:

```json
{
  "extension_name": {
    "message": "Extension Template"
  },
  "settings_saved": {
    "message": "Settings saved"
  },
  "welcome_user": {
    "message": "Welcome, $USER$!",
    "description": "Greeting with user name",
    "placeholders": {
      "user": {
        "content": "$1",
        "example": "Alice"
      }
    }
  }
}
```

Use placeholders with `t('welcome_user', ['Alice'])`.

**Step 3.** Create additional locale folders for each language:

```
public/_locales/
├── en/messages.json
├── es/messages.json     # Spanish
├── pt_BR/messages.json  # Brazilian Portuguese
└── fr/messages.json     # French
```

Each `messages.json` follows the same structure with translated `message` values.

**Step 4.** Use the React hook for components that need language switching:

```jsx
import { useTranslation } from '@/i18n/useTranslation';

function MyComponent() {
  const { t, language, setLanguage, isLoaded, LANGUAGES } = useTranslation();

  if (!isLoaded) return <Skeleton variant="text" />;

  return (
    <div>
      <h1>{t('extension_name')}</h1>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </select>
    </div>
  );
}
```

Update the `LANGUAGES` array in `src/i18n/useTranslation.js` when you add new locales:

```js
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Espanol' },
  { code: 'pt_BR', name: 'Portugues (Brasil)' },
];
```

For non-React contexts (background, content scripts), use the vanilla API:

```js
import { initTranslations, t } from '@/i18n';

await initTranslations();
console.log(t('extension_name'));
```

---

### 5.7 Enabling Analytics

The template includes a GA4 Measurement Protocol client that is a complete no-op when disabled. When the flag is `false`, Vite dead-code eliminates all analytics code from the bundle.

**Step 1.** Set `ENABLE_ANALYTICS` to `true` in `src/config/featureFlags.js`:

```js
export const FLAGS = {
  ENABLE_ANALYTICS: true,   // <-- enable
  ENABLE_NETWORK_TAB: true,
  ENABLE_DOM_TAB: true,
  DEBUG_MODE: false,
};
```

**Step 2.** Replace the placeholder measurement ID in `src/config/analyticsConfig.js`:

```js
export const ANALYTICS_CONFIG = {
  MEASUREMENT_ID: 'G-YOUR_REAL_ID',
  API_SECRET: 'your_api_secret_here',
};
```

Get these values from the Google Analytics 4 console under Admin > Data Streams > Measurement Protocol API secrets.

**Step 3.** Use `trackEvent` and `trackError` anywhere in your code:

```js
import { trackEvent, trackError } from '@/utils/analytics';
import { EVENTS } from '@/config/analyticsConfig';

// Track a feature interaction
trackEvent(EVENTS.TAB_SWITCHED, { tab: 'network' });

// Track an error
try {
  await riskyOperation();
} catch (err) {
  trackError('sidepanel', err);
}

// Track a custom event
trackEvent('custom_action', { category: 'export', format: 'json' });
```

Analytics is initialised lazily on the first `trackEvent` call. The client ID is persisted in `chrome.storage.local`, and sessions use a 30-minute sliding window stored in `chrome.storage.session`.

---

### 5.8 Dark/Light Theme Customization

The theme system uses CSS custom properties defined in `src/styles/global.css`. The `ThemeContext` handles persistence, system preference detection, and cross-context sync.

**Which CSS variables to change:**

All theme colors are in two blocks at the top of `global.css`:

```css
/* Light theme (default) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fb;
  --bg-tertiary: #f0f2f5;
  --text-primary: #1a1a2e;
  --text-secondary: #5a6072;
  --text-muted: #9ca3b4;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --accent-subtle: #eff6ff;
  /* ... */
}

/* Dark theme */
html.dark {
  --bg-primary: #0f1117;
  --bg-secondary: #181a24;
  --bg-tertiary: #222436;
  --text-primary: #e2e8f0;
  --accent: #60a5fa;
  /* ... */
}
```

To change the accent color, update `--accent`, `--accent-hover`, `--accent-subtle`, and `--accent-text` in both blocks.

**Adding a new color scheme** (e.g., a purple theme):

```css
html.purple {
  --accent: #8b5cf6;
  --accent-hover: #7c3aed;
  --accent-subtle: #f5f3ff;
  --accent-text: #ffffff;
}
```

Then extend `ThemeContext.jsx` to support the new theme value.

**How theme initialization works:**

1. On mount, `ThemeProvider` checks `chrome.storage.local` for a saved `appTheme` key.
2. If no preference is stored, it reads `prefers-color-scheme` from the OS.
3. The `dark` class is toggled on `<html>` via `document.documentElement.classList.toggle('dark', ...)`.
4. When the user toggles the theme, it is saved to storage and synced to any other open extension views via `chrome.storage.onChanged`.

---

### 5.9 Network Interception Patterns

All examples go in `src/content/main-world.js`. The interceptors are configured with a `filter` function and callback hooks.

**Intercept requests to a specific domain:**

```js
const teardownFetch = interceptFetch({
  filter: (url) => url.includes('api.example.com'),
  onRequest: (data) => {
    bridgeSend('NETWORK_REQUEST', { ...data, source: 'fetch' });
  },
  onResponse: (data) => {
    const { rawResponse, ...rest } = data;
    bridgeSend('NETWORK_RESPONSE', { ...rest, source: 'fetch' });
  },
});
```

**Capture only POST requests:**

```js
const teardownFetch = interceptFetch({
  filter: (url, method) => method === 'POST',
  onRequest: (data) => {
    bridgeSend('NETWORK_REQUEST', { ...data, source: 'fetch' });
  },
  onResponse: (data) => {
    const { rawResponse, ...rest } = data;
    bridgeSend('NETWORK_RESPONSE', { ...rest, source: 'fetch' });
  },
});
```

**Intercept both XHR and fetch to the same domain:**

```js
const domainFilter = (url) => {
  try {
    return new URL(url).hostname === 'api.target.com';
  } catch {
    return false;
  }
};

const teardownFetch = interceptFetch({
  filter: domainFilter,
  onRequest: (data) => bridgeSend('NETWORK_REQUEST', { ...data, source: 'fetch' }),
  onResponse: (data) => {
    const { rawResponse, ...rest } = data;
    bridgeSend('NETWORK_RESPONSE', { ...rest, source: 'fetch' });
  },
});

const teardownXHR = interceptXHR({
  filter: domainFilter,
  onRequest: (data) => bridgeSend('NETWORK_REQUEST', { ...data, source: 'xhr' }),
  onResponse: (data) => bridgeSend('NETWORK_RESPONSE', { ...data, source: 'xhr' }),
});
```

**Log response bodies for debugging:**

```js
const teardownFetch = interceptFetch({
  filter: (url) => url.includes('/api/'),
  onRequest: () => {},
  onResponse: (data) => {
    console.log(`[${data.method}] ${data.url}`, {
      status: data.status,
      duration: `${data.duration}ms`,
      body: data.body ? JSON.parse(data.body) : null,
    });
  },
});
```

**Important:** The fetch interceptor clones the response before reading its body, so the page's own `.json()` or `.text()` calls are never affected. The XHR interceptor reads `responseText` in a `loadend` handler, which also does not interfere with the page.

---

### 5.10 DOM Manipulation Patterns

These modules run in the ISOLATED world (or can be injected via `chrome.scripting.executeScript`). Import them from `src/content/modules/element-finder.js` and `src/content/modules/dom-observer.js`.

**Wait for an element to appear:**

```js
import { waitForElement } from './modules/element-finder.js';

const sidebar = await waitForElement('#sidebar-container', 15000);
console.log('Sidebar loaded:', sidebar);
```

**Watch for new elements matching a selector:**

```js
import { observeDOM } from './modules/dom-observer.js';

const observer = observeDOM({
  target: '#feed',
  selector: '.post-card',
  onAdded: (posts) => {
    console.log(`${posts.length} new posts appeared`);
    posts.forEach((post) => {
      // Process each new post element
    });
  },
});

// Pause during your own DOM modifications to avoid self-triggering
observer.pause();
// ... make changes ...
observer.resume();

// Stop observing entirely
observer.disconnect();
```

**Find elements by text content:**

```js
import { findByText } from './modules/element-finder.js';

// Find all buttons containing "Submit"
const submitButtons = findByText('button', 'Submit');

// Case-insensitive exact match
const heading = findByText('h1', 'welcome to our site', {
  exact: true,
  caseSensitive: false,
});
```

**Find all hidden elements:**

```js
import { findHidden } from './modules/element-finder.js';

const hidden = findHidden(document.body);
console.log(`Found ${hidden.length} hidden elements`);
// Elements with display:none, visibility:hidden, opacity:0, or off-screen
```

**Build an element tree from a specific root:**

```js
import { getElementTree } from './modules/element-finder.js';

const tree = getElementTree(document.querySelector('#app'), 4);
// Returns: { tag, id, classes, children, attributes, textContent }
// Depth-limited to 4 levels
```

**Extract structured data from a page:**

```js
import { walkDOM } from './modules/element-finder.js';

const links = [];
walkDOM(
  document.body,
  (el) => {
    if (el.tagName === 'A' && el.href) {
      links.push({ text: el.textContent.trim(), href: el.href });
    }
  },
  (el) => {
    // Skip nav and footer subtrees entirely
    return !el.matches('nav, footer, .cookie-banner');
  },
);
```

---

### 5.11 Stripping the Demo / Starting Fresh

Follow these steps to remove all demo content and start with a clean slate.

**Step 1.** Delete the demo tab files:

```bash
rm src/sidepanel/components/tabs/DashboardTab.jsx
rm src/sidepanel/components/tabs/DOMTab.jsx
rm src/sidepanel/components/tabs/NetworkTab.jsx
```

**Step 2.** Update `src/sidepanel/App.jsx` -- remove the lazy imports:

```jsx
// Remove these lines:
const DashboardTab = React.lazy(() => import('./components/tabs/DashboardTab'));
const DOMTab = React.lazy(() => import('./components/tabs/DOMTab'));
const NetworkTab = React.lazy(() => import('./components/tabs/NetworkTab'));
```

**Step 3.** Replace the `TABS` array with your own tab (keep at least one):

```jsx
import { LayoutDashboard } from 'lucide-react';

const HomeTab = React.lazy(() => import('./components/tabs/HomeTab'));

const TABS = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
];
```

**Step 4.** Simplify the render block:

```jsx
<Suspense fallback={<Skeleton variant="card" />}>
  <ErrorBoundary key={activeTab}>
    {activeTab === 'home' && <HomeTab tabInfo={tabInfo} />}
  </ErrorBoundary>
</Suspense>
```

**Step 5.** Remove demo state and `useMessages` subscriptions you do not need:

```jsx
// Remove these if you don't need network/DOM data in the sidepanel:
const [networkRequests, setNetworkRequests] = useState([]);
const [domData, setDomData] = useState(null);
const [mutations, setMutations] = useState([]);
```

**Step 6.** Remove demo background handlers you are not using:

```js
// In src/background/index.js, remove imports you don't need:
// import { networkHandlers } from './handlers/network.js';
// import { domHandlers } from './handlers/dom.js';

const handlerModules = [storageHandlers]; // Keep storage, remove others
```

**Step 7.** Update `manifest.config.js` match patterns to target your site:

```js
content_scripts: [
  {
    matches: ['https://your-target-site.com/*'],
    js: ['src/content/main-world.js'],
    world: 'MAIN',
    run_at: 'document_start',
  },
  {
    matches: ['https://your-target-site.com/*'],
    js: ['src/content/isolated-world.js'],
    run_at: 'document_idle',
  },
],
```

If you do not need content scripts at all, remove the `content_scripts` array entirely.

---

### 5.12 Adding Tests

The template uses Vitest with jsdom and `@testing-library/react`. Chrome API mocks are configured in `tests/setup.js`.

**Run tests:**

```bash
npm test          # Single run
npm run test:watch  # Watch mode
```

**Writing a hook test:**

```js
// tests/hooks/useTabInfo.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabInfo } from '../../src/sidepanel/hooks/useTabInfo';

describe('useTabInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty state initially', () => {
    const { result } = renderHook(() => useTabInfo());
    expect(result.current.url).toBe('');
    expect(result.current.tabId).toBeNull();
  });

  it('should query the active tab on mount', () => {
    chrome.tabs.query.mockImplementation((opts, cb) => {
      cb([{ id: 42, url: 'https://example.com', title: 'Example' }]);
    });

    const { result } = renderHook(() => useTabInfo());

    expect(chrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function),
    );
  });
});
```

**Writing a component test:**

```jsx
// tests/components/Button.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../src/sidepanel/components/ui/Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Testing a background message handler:**

```js
// tests/background/storage.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Storage Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read from chrome.storage.local', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => {
      cb({ myKey: 'myValue' });
    });

    // Import the handler
    const { storageHandlers } = await import(
      '../../src/background/handlers/storage.js'
    );

    const result = await storageHandlers.STORAGE_GET({
      key: 'myKey',
      defaultValue: null,
    });

    expect(result).toBe('myValue');
  });
});
```

The chrome API mocks in `tests/setup.js` cover `runtime`, `storage`, `tabs`, `sidePanel`, `scripting`, and `i18n`. Add new mocks there as you use additional Chrome APIs.

---

## Content Script Worlds Explained

Chrome MV3 content scripts can run in two isolated JavaScript contexts. Understanding the difference is essential for network interception and DOM access.

### MAIN World

- Runs in the **page's own JavaScript context**.
- Has full access to `window.fetch`, `XMLHttpRequest`, and all page globals.
- **Cannot** access `chrome.*` extension APIs.
- Use case: monkey-patching network APIs, reading page-defined JavaScript objects.
- Declared in `manifest.config.js` with `world: 'MAIN'`.

### ISOLATED World

- Runs in the **extension's sandboxed context** (the default for content scripts).
- Has full access to `chrome.runtime`, `chrome.storage`, and other extension APIs.
- **Cannot** access page-defined globals (the page's `window.fetch` is a different object).
- Shares the DOM with the page -- can read/write elements, attributes, and styles.
- Use case: DOM observation, element queries, relaying data to the background.

### Why You Need Both

Network interception requires MAIN world access (to patch `fetch` and `XHR`). Sending that data to the background requires ISOLATED world access (to call `chrome.runtime.sendMessage`). The bridge connects them.

### The Bridge Pattern

The bridge (`src/content/modules/bridge.js`) uses `window.postMessage` with a cryptographic nonce handshake:

1. MAIN world generates a random nonce and sends a `__HANDSHAKE__` message.
2. ISOLATED world captures the nonce from the handshake.
3. All subsequent messages include the nonce and a direction tag (`to-isolated` or `to-main`).
4. Each side validates the nonce and direction before dispatching to listeners.

This prevents random page scripts from injecting fake messages into the bridge.

```
MAIN world                              ISOLATED world
    │                                        │
    │── __HANDSHAKE__ (nonce=abc123) ──────► │  (captures nonce)
    │                                        │
    │── NETWORK_REQUEST (nonce=abc123) ────► │
    │                                        │── chrome.runtime.sendMessage ──► Background
    │                                        │
    │◄── SOME_RESPONSE (nonce=abc123) ────── │
```

### Common Mistakes

- **Trying to call `chrome.runtime` from MAIN world** -- this will throw. Use `bridgeSend()` to relay data to ISOLATED world first.
- **Trying to read `window.myPageVar` from ISOLATED world** -- this returns undefined. Page globals are only visible in MAIN world.
- **Forgetting to match the content script URL pattern** -- the scripts will not inject if `matches` does not include the target site.
- **Running DOM-heavy code in MAIN world** -- while technically possible, DOM access from MAIN world does not go through the extension's CSP sandbox. Prefer ISOLATED world for DOM operations.

---

## Configuration Reference

### manifest.config.js

The manifest uses CRXJS's `defineManifest` helper, which generates a valid `manifest.json` at build time.

| Field | Purpose | Notes |
|-------|---------|-------|
| `matches` in `content_scripts` | Which URLs trigger content scripts | Change from `https://example.com/*` to your target |
| `permissions` | Required Chrome permissions | Add `webRequest`, `downloads`, etc. as needed |
| `host_permissions` | URL patterns for API access | Uncomment `<all_urls>` or specify domains |
| `side_panel.default_path` | Sidepanel HTML entry point | Usually does not need changing |

**Adding a new permission:**

```js
permissions: ['sidePanel', 'scripting', 'activeTab', 'tabs', 'storage', 'downloads'],
```

### vite.config.js

| Section | Purpose | Notes |
|---------|---------|-------|
| `plugins` | Build pipeline | Order matters: Tailwind, React, CRXJS, ZipPack |
| `resolve.alias` | `@` maps to `src/` | Use `import x from '@/utils/logger'` |
| `define` | Compile-time constants | Feature flags are injected here |
| `build.sourcemap` | Source maps in dev only | Set to `true` for debugging production builds |
| `test` | Vitest configuration | jsdom environment, setup file path |

**Adding a new path alias:**

```js
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
    '@components': resolve(__dirname, 'src/sidepanel/components'),
  },
},
```

### Feature Flags

Flags are defined in `src/config/featureFlags.js` and injected by Vite's `define` option.

| Flag | Default | Purpose |
|------|---------|---------|
| `__ENABLE_ANALYTICS__` | `false` | GA4 analytics (zero cost when false) |
| `__ENABLE_NETWORK_TAB__` | `true` | Show/hide the Network tab |
| `__ENABLE_DOM_TAB__` | `true` | Show/hide the DOM tab |
| `__DEBUG_MODE__` | `false` | Enable console logging via the logger utility |

**Adding a new flag:**

1. Add it to `FLAGS` in `src/config/featureFlags.js`:
   ```js
   export const FLAGS = {
     // ...existing flags...
     ENABLE_MY_FEATURE: false,
   };
   ```

2. Add the `__FLAG__` define in `vite.config.js`:
   ```js
   define: {
     // ...existing defines...
     __ENABLE_MY_FEATURE__: FLAGS.ENABLE_MY_FEATURE,
   },
   ```

3. Add the global to `eslint.config.js` so ESLint does not report it as undefined:
   ```js
   globals: {
     // ...existing globals...
     __ENABLE_MY_FEATURE__: 'readonly',
   },
   ```

4. Use it in code:
   ```js
   if (__ENABLE_MY_FEATURE__) {
     // This code is removed entirely from the bundle when false
   }
   ```

---

## Common Recipes

### Send data from content script to sidepanel in real time

```js
// In content script (isolated-world.js):
chrome.runtime.sendMessage({
  type: 'PRICE_UPDATE',
  data: { product: 'Widget', price: 29.99 },
});

// In background handler:
PRICE_UPDATE: (message, sender) => {
  chrome.runtime.sendMessage({
    type: 'PRICE_UPDATE_BROADCAST',
    data: message.data,
    tabId: sender.tab?.id,
  });
},

// In sidepanel component:
useMessages({
  PRICE_UPDATE_BROADCAST: (msg) => {
    setPrices((prev) => [...prev, msg.data]);
  },
});
```

### Store and retrieve user preferences

```jsx
import { useStorage } from './hooks/useStorage';

function SettingsPanel() {
  const [autoRefresh, setAutoRefresh] = useStorage('auto_refresh', true);
  const [interval, setInterval] = useStorage('refresh_interval', 5000);

  return (
    <div>
      <Toggle checked={autoRefresh} onChange={setAutoRefresh} label="Auto-refresh" />
      <input
        type="number"
        value={interval}
        onChange={(e) => setInterval(Number(e.target.value))}
      />
    </div>
  );
}
```

Changes are persisted to `chrome.storage.local` and synced across all open extension views automatically.

### Show a toast when injection completes

```jsx
import { useToast } from '../context/ToastContext';
import { useMessages } from '../hooks/useMessages';

function MyComponent() {
  const { toast } = useToast();

  useMessages({
    INJECTION_COMPLETE: (msg) => {
      toast.success(`Injected into ${msg.data.url}`);
    },
  });
}
```

### Inject a script into the active tab on button click

```jsx
const handleInject = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // This runs in the page's ISOLATED world
      const headings = document.querySelectorAll('h1, h2, h3');
      return Array.from(headings).map((h) => ({
        tag: h.tagName,
        text: h.textContent.trim(),
      }));
    },
  });

  const headings = results?.[0]?.result || [];
  console.log('Found headings:', headings);
};
```

### Download intercepted data as JSON

```js
function downloadAsJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `data-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Usage in a component:
<Button icon={Download} onClick={() => downloadAsJSON(requests, 'requests.json')}>
  Export
</Button>
```

---

## Troubleshooting

### "Extension context invalidated"

**What it means:** The extension was updated or reloaded while a content script or sidepanel was still running. The old context is stale and `chrome.*` API calls throw this error.

**How the template handles it:** All hooks (`useMessages`, `useStorage`, `useTabInfo`) and utilities (`sendMessage`, `getStorage`) wrap Chrome API calls in try/catch and silently degrade when the context is invalid. The user can reload the page to get a fresh context.

### Content script not injecting

Check the `matches` pattern in `manifest.config.js`. The default is `https://example.com/*` -- you must change this to your target site. Common patterns:

```js
matches: ['https://*.example.com/*']  // All subdomains
matches: ['<all_urls>']               // Every page (requires host_permissions)
matches: ['https://example.com/app/*'] // Specific path
```

After changing match patterns, reload the extension in `chrome://extensions` and refresh the target page.

### MAIN world script cannot access chrome APIs

This is by design. MAIN world scripts run in the page's JavaScript context and have no access to `chrome.runtime`, `chrome.storage`, etc. Use the bridge to relay data:

```js
// MAIN world:
bridgeSend('MY_DATA', payload);

// ISOLATED world:
onBridgeMessage('MY_DATA', (data) => {
  chrome.runtime.sendMessage({ type: 'MY_DATA', data });
});
```

### Hot reload not working

CRXJS hot reload has known limitations:

- Background service worker changes require a full extension reload (`chrome://extensions` > click the reload button).
- Content script changes sometimes require a page refresh.
- If HMR gets stuck, stop the dev server, delete the `dist/` folder, and run `npm run dev` again.

### Sidepanel not opening

1. Verify `sidePanel` is in the `permissions` array in `manifest.config.js`.
2. Check that `side_panel.default_path` points to a valid HTML file.
3. The template calls `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` in the background script -- ensure this line is present.
4. In Chrome, the sidepanel opens when you click the extension icon in the toolbar. If the icon is hidden, click the puzzle piece icon to find it.

### Build fails

Common issues:

- **Module not found:** Check import paths. The template uses `@/` as an alias for `src/`. Ensure `vite.config.js` has the resolve alias configured.
- **CRXJS manifest error:** Ensure `manifest.config.js` exports a valid `defineManifest()` call. CRXJS is strict about manifest shape.
- **Tailwind not applying:** Confirm `@import 'tailwindcss'` is at the top of `src/styles/global.css` and the `@tailwindcss/vite` plugin is in `vite.config.js`.
- **Node version:** Vite 6 requires Node.js 18+. Run `node -v` to check.

---

## Build and Release

### Development

```bash
npm run dev
```

Starts Vite in watch mode. The `dist/` folder is generated and updated on file changes. Load `dist/` as an unpacked extension in Chrome.

### Production Build

```bash
npm run build
```

Outputs an optimised build to `dist/`. Source maps are excluded in production.

### Create Release ZIP

```bash
npm run zip
```

Runs `vite build` and then packages `dist/` into `release/extension.zip`, ready for Chrome Web Store upload.

### Loading in Chrome

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `dist/` folder from this project.
5. The extension icon appears in the toolbar. Click it to open the sidepanel.

### Publishing to Chrome Web Store

1. Run `npm run zip` to generate `release/extension.zip`.
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Click **New Item** and upload `extension.zip`.
4. Fill in the store listing (description, screenshots, category).
5. Submit for review.

Before publishing, update the extension name and description in `public/_locales/en/messages.json`, replace the placeholder icons, and set the version in `package.json`.

---

## Personalizing the Template

### Change extension name

Edit `public/_locales/en/messages.json`:

```json
{
  "extension_name": {
    "message": "My Extension Name"
  },
  "extension_description": {
    "message": "A short description of what your extension does."
  }
}
```

Also update the title in `src/sidepanel/components/ui/Header.jsx`:

```jsx
<span>My Extension Name</span>
```

And in `src/sidepanel/index.html`:

```html
<title>My Extension Name</title>
```

### Update icons

Replace the PNG files in `public/icons/`. You need four sizes:

| File | Size | Used for |
|------|------|----------|
| `icon16.png` | 16x16 | Favicon, small toolbar |
| `icon32.png` | 32x32 | Windows taskbar |
| `icon48.png` | 48x48 | Extensions page |
| `icon128.png` | 128x128 | Chrome Web Store, install dialog |

All icons should be square PNGs with a transparent background.

### Reset version

Update the version in two places:

1. `package.json`:
   ```json
   "version": "0.1.0"
   ```

2. `manifest.config.js`:
   ```js
   version: '0.1.0',
   ```

3. Optionally update the footer in `src/sidepanel/components/ui/Footer.jsx` and the info text in `OptionsDropdown.jsx`.

### Update manifest description

The description is pulled from `__MSG_extension_description__` in i18n. Edit the `extension_description` message in `public/_locales/en/messages.json`.

### Change the API base URL

Edit `src/config/apiConfig.js`:

```js
export const API_CONFIG = {
  BASE_URL: 'https://api.your-domain.com',
  LOCAL_URL: 'http://localhost:8080',
  TIMEOUT: 15000,
};
```

---

## License

MIT
