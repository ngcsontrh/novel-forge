import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'NovelForge',
  short_name: 'NovelForge',
  description: 'Chuyển đổi web novel từ nhiều nguồn thành tệp EPUB.',
  version: '0.1.0',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_title: 'NovelForge',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['downloads', 'storage', 'activeTab'],
  host_permissions: [
    'https://ln.hako.vn/*',
    'https://docln.sbs/*',
    'https://i.hako.vip/*',
    'https://i2.hako.vip/*',
    'https://cdn.phototourl.com/*',
  ],
})
