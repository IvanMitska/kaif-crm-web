import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sintara CRM',
    short_name: 'Sintara CRM',
    description: 'Современная CRM-система для автоматизации бизнеса. Управление сделками, клиентами, онлайн-запись и аналитика.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#8B5CF6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
