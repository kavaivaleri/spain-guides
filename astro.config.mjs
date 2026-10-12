// @ts-check
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import { guideDirectives } from './src/markdown/guide-directives.mjs';

/**
 * Меню слева собирается из папки guides/:
 * - guides/<slug>.md — одна страница;
 * - guides/<slug>/ — многостраничный гайд. Название группы берётся из
 *   `title` в guides/<slug>/index.md, порядок страниц — из `sidebar.order`.
 * Файлы и папки, имя которых начинается с `_` или `.`, пропускаются.
 */
function guidesSidebar() {
	const dir = new URL('./guides/', import.meta.url);
	const readTitle = (/** @type {URL} */ file) =>
		readFileSync(file, 'utf8').match(/^title:\s*(.+)$/m)?.[1].trim();
	return readdirSync(dir)
		.filter((name) => !/^[_.]/.test(name))
		.map((name) => {
			const path = new URL(name, dir);
			if (statSync(path).isDirectory()) {
				const label = readTitle(new URL(`${name}/index.md`, dir)) ?? name;
				// Starlight ищет страницы по пути относительно src/content/docs,
				// а гайды лежат в guides/, поэтому путь — от корня проекта.
				return { label, collapsed: false, items: [{ autogenerate: { directory: `guides/${name}` } }] };
			}
			if (name.endsWith('.md')) return { slug: name.replace(/\.md$/, '') };
			return null;
		})
		.filter((item) => item !== null)
		.sort((a, b) => ('label' in a ? 1 : 0) - ('label' in b ? 1 : 0));
}

// GitHub Pages: https://<user>.github.io/<repo>/
// Если репозиторий называется иначе, поменяйте `site` и `base`.
export default defineConfig({
	site: 'https://kavaivaleri.github.io',
	base: '/spain-guides',
	markdown: {
		// Плашки для документов, сумм и сроков: src/markdown/guide-directives.mjs
		processor: satteri({ mdastPlugins: [guideDirectives()] }),
	},
	integrations: [
		starlight({
			title: 'Гайды по Испании',
			description: 'Практические гайды на русском языке о жизни, переезде и путешествиях по Испании.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'Русский', lang: 'ru' },
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/kavaivaleri/spain-guides' },
			],
			editLink: {
				baseUrl: 'https://github.com/kavaivaleri/spain-guides/edit/main/',
			},
			sidebar: guidesSidebar(),
			customCss: ['./src/styles/guide.css'],
			// Гайды лежат вне src/content/docs, поэтому включаем для них
			// разметку Starlight (плашки :::note, якоря заголовков).
			markdown: {
				processedDirs: ['./guides/'],
			},
			components: {
				PageTitle: './src/components/PageTitle.astro',
			},
		}),
	],
});
