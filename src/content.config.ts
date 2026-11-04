/**
 * Колекції контенту (SPEC §2, ADR-0003). Файли лежать у папці мови: src/content/<колекція>/<locale>/<id>.json.
 * id запису = "<locale>/<id>", мова береться з першого сегмента.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.object({ title: z.string(), text: z.string() });

/** Команда (/team, /team/<slug>). Нова людина = новий файл, шаблон не змінюється. */
const team = defineCollection({
  loader: glob({ base: './src/content/team', pattern: '*/*.json' }),
  schema: ({ image }) =>
    z.object({
      /** Група на /team (порядок груп задає src/content/pages/<locale>/team.json). */
      group: z.enum(['doctors', 'assistants', 'nurses', 'administration']),
      /** Порядок у групі. */
      order: z.number(),
      /** Ім'я на картці (CardTeam). */
      name: z.string(),
      role: z.string(),
      photo: image(),
      photoAlt: z.string(),
      /** Фото для блоку Team на головній (Framer: doc1…doc6). Є — людина показується на головній. */
      homePhoto: image().optional(),
      /** Точка кадрування портрета (CSS object-position) у квадраті на головній і в рамці на сторінці лікаря, якщо стандартна «center top» лишає забагато місця над головою. */
      photoPosition: z.string().optional(),
      /** Окрема сторінка /team/<slug> (slug = ім'я файлу). Немає — немає кнопки «Детальніше». */
      page: z
        .object({
          seo: z.object({ title: z.string(), description: z.string() }),
          /** H1 у два рядки, як у Framer: прізвище / ім'я та по батькові. */
          surname: z.string(),
          givenNames: z.string(),
          intro: z.string().optional(),
          facts: z.array(text),
          image: image(),
          imageAlt: z.string(),
          /** Блоки benefit-1 (1–3): заголовок і два стовпчики списку. */
          sections: z.array(z.object({ title: z.string(), left: z.array(z.string()), right: z.array(z.string()) })).min(1),
          /** Photos: перше фото широке (840), друге вузьке (420; на планшеті й телефоні приховане, як у Framer). */
          photos: z.array(z.object({ src: image(), alt: z.string() })).max(2),
        })
        .optional(),
    }),
});

/** Напрями лікування (/services). */
const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '*/*.json' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      title: z.string(),
      /** Перший абзац (Body 2). */
      lead: z.string(),
      /** Решта абзаців (Body). */
      paragraphs: z.array(z.string()),
      image: image(),
      imageAlt: z.string(),
    }),
});

export const collections = { team, services };
