/** Картинки сторінок (src/assets/pages) за іменем файлу → ImageMetadata для astro:assets. */
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/pages/*.{png,jpg,jpeg,webp}', { eager: true });

export function pageImage(name: string): ImageMetadata {
  const hit = images[`../assets/pages/${name}`];
  if (!hit) throw new Error(`Немає картинки: ${name}`);
  return hit.default;
}

const homeImages = import.meta.glob<{ default: ImageMetadata }>('../assets/home/*.{png,jpg,jpeg,webp}', { eager: true });

/** Картинки головної (src/assets/home). */
export function homeImage(name: string): ImageMetadata {
  const hit = homeImages[`../assets/home/${name}`];
  if (!hit) throw new Error(`Немає картинки головної: ${name}`);
  return hit.default;
}
