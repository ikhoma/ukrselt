/**
 * Контакти й навігація. Значення з живого сайту ukrselt.com (SPEC §7, §2).
 * Порядок пунктів у шапці, мобільному меню і футері на живому сайті різний — переносимо 1:1.
 */
export const phones = [
  { label: '+38 (063) 076-3022', href: 'tel:+380630763022' },
  { label: '+38 (094) 906-2388', href: 'tel:+380949062388' },
  { label: '+38 (044) 337-7388', href: 'tel:+380443377388' },
] as const;

export const address = { label: 'Київ, Велика Васильківська 134', href: '/contacts' } as const;

export const messengers = [
  { label: 'Telegram', href: 'https://t.me/+380630763022' },
  { label: 'Viber', href: 'viber://chat?number=%2B380630763022' },
  { label: 'WhatsApp', href: 'https://wa.me/+380630763022' },
  { label: 'info@ukrselt.com', href: 'mailto:info@ukrselt.com' },
] as const;

export const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/dental.ukrselt/' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100086790133405' },
] as const;

/** Ключі словника i18n → шлях. */
export const routes = {
  home: '/',
  services: '/services',
  team: '/team',
  price: '/price',
  sterilization: '/sterilization',
  about: '/about-us',
  contacts: '/contacts',
} as const;
export type RouteKey = keyof typeof routes;

/** Пігулки в шапці (desktop). */
export const headerNav: RouteKey[] = ['home', 'services', 'team', 'price', 'sterilization', 'about', 'contacts'];
/** Мобільне/планшетне меню. */
export const mobileNav: RouteKey[] = ['home', 'about', 'price', 'services', 'team', 'sterilization', 'contacts'];
/** Колонка «Навігація» у футері (на живому сайті без «Ціни»). */
export const footerNav: RouteKey[] = ['home', 'about', 'services', 'team', 'sterilization', 'contacts'];

/** Кнопка «Записатися» веде на блок запису на головній. */
export const bookHref = '/#book';

/** Активний пункт: точний збіг або вкладена сторінка (/team/servinsky → team). */
export function isActive(key: RouteKey, pathname: string) {
  const path = pathname.replace(/\/$/, '') || '/';
  const target = routes[key];
  return target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`);
}
