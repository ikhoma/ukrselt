/** Картинки сторінок (src/assets/pages) за іменем файлу → ImageMetadata для astro:assets. */
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/pages/*.{png,jpg,jpeg,webp}', { eager: true });

export function pageImage(name: string): ImageMetadata {
  const hit = images[`../assets/pages/${name}`];
  if (!hit) throw new Error(`Немає картинки: ${name}`);
  return hit.default;
}
