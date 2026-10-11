// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages: https://<user>.github.io/<repo>/
// Если репозиторий называется иначе, поменяйте `site` и `base`.
export default defineConfig({
	site: 'https://kavaivaleri.github.io',
	base: '/spain-guides',
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
			components: {
				PageTitle: './src/components/PageTitle.astro',
			},
		}),
	],
});
