/**
 * Доступ до колекцій з урахуванням мови (id запису = "<locale>/<slug>").
 * Якщо для мови ще немає записів — беремо мову за замовчуванням.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/config';
import { defaultLocale } from '../i18n/config';

export type TeamEntry = CollectionEntry<'team'>;
export type ServiceEntry = CollectionEntry<'services'>;

export const entrySlug = (id: string) => id.split('/').slice(1).join('/');
const entryLocale = (id: string) => id.split('/')[0];

async function byLocale<C extends 'team' | 'services'>(name: C, locale: Locale) {
  const all = await getCollection(name);
  const own = all.filter((e) => entryLocale(e.id) === locale);
  return own.length ? own : all.filter((e) => entryLocale(e.id) === defaultLocale);
}

export async function getTeam(locale: Locale): Promise<TeamEntry[]> {
  return (await byLocale('team', locale)).sort((a, b) => a.data.order - b.data.order);
}

export async function getServices(locale: Locale): Promise<ServiceEntry[]> {
  return (await byLocale('services', locale)).sort((a, b) => a.data.order - b.data.order);
}
