import { MetadataRoute } from 'next';

import { DESCRIPTION, SHORT_TITLE, TITLE } from '@/app/data';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: TITLE,
    short_name: SHORT_TITLE,
    description: DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#000',
    theme_color: '#000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
