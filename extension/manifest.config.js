import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: '__MSG_extension_name__',
  description: '__MSG_extension_description__',
  version: '1.0.0',
  version_name: '1.0.0j',
  default_locale: 'en',

  permissions: ['sidePanel', 'storage', 'contextMenus', 'tabs'],
  host_permissions: ['*://www.youtube.com/*', '*://m.youtube.com/*'],

  action: {
    default_title: 'Open youZen',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },

  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },

  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },

  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },

  content_scripts: [
    {
      // ISOLATED world — attribute applier + page router + blocklist filter.
      // CSS rules in src/styles/youtube.css are keyed on html[data-ytc-*]
      // attributes set by the content script at document_start (flicker-free).
      matches: ['*://www.youtube.com/*', '*://m.youtube.com/*'],
      js: ['src/content/isolated-world.js'],
      css: ['src/styles/youtube.css'],
      run_at: 'document_start',
    },
  ],

  web_accessible_resources: [
    {
      resources: ['_locales/*', 'icons/*'],
      matches: ['*://www.youtube.com/*', '*://m.youtube.com/*'],
    },
  ],

  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
});
