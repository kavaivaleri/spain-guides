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
			}),
		}),
	}),
};
