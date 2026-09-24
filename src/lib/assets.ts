import { site } from '../site';
import type { Post } from './posts';

const images = import.meta.glob<string>('../content/blog/**/*.{png,jpg,jpeg,webp,gif,svg}', {
  query: '?url',
  import: 'default',
  eager: true,
});

// Maps each relative image path a post can write to the absolute URL of the built asset.
export function postAssets(post: Post) {
  const directory = post.filePath?.replace(/^src\//, '../').replace(/[^/]+$/, '') ?? '';
  return Object.fromEntries(
    Object.entries(images)
      .filter(([path]) => path.startsWith(directory))
      .flatMap(([path, url]) => {
        const name = path.slice(directory.length);
        const absolute = new URL(url, site.url).href;
        return [
          [`./${name}`, absolute],
          [name, absolute],
        ];
      }),
  );
}
