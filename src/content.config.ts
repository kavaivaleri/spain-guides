import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';

// Страницы сайта собираются прямо из папки guides/.
// Файлы, имя которых начинается с `_`, пропускаются.
export const collections = {
	docs: defineCollection({
		loader: glob({ pattern: '**/[^_]*.md', base: './guides' }),
		schema: docsSchema({
			extend: z.object({
				updated: z.coerce.date().optional(),
				regions: z.string().optional(),
				// Номер шага в многостраничном гайде: над заголовком появится
				// «Шаг N из M» с переходом к другим шагам.
				step: z.number().int().positive().optional(),
				// Кто делает шаг: host — приглашающий, guest — гость, both — оба.
				who: z.enum(['host', 'guest', 'both']).optional(),
			}),
		}),
	}),
};
