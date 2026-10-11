# Гайды по Испании

Практические гайды на русском языке о жизни, переезде и путешествиях по Испании.

## Структура

```
guides/          готовые гайды, один файл на тему (из них собирается сайт)
templates/       шаблон для нового гайда
src/             код сайта на Astro + Starlight
```

## Как добавить гайд

1. Скопируйте `templates/guide.md` в `guides/<тема>.md`. Имя файла пишите латиницей через дефис, например `guides/nie.md` или `guides/arenda-zhilya.md`.
2. Заполните `title` и `description` в начале файла и разделы шаблона. Заголовок `# ...` в тексте не нужен: сайт берёт его из `title`.
3. Укажите источники и дату последней проверки: правила и цены в Испании часто меняются.

## Сайт

Гайды публикуются как сайт на [Astro](https://astro.build) с темой [Starlight](https://starlight.astro.build): https://kavaivaleri.github.io/spain-guides/

Каждый файл `guides/<slug>.md` становится страницей `/<slug>/`. Главная страница и меню слева собираются автоматически.

Локальный запуск (нужен Node.js 22+):

```
npm install
npm run dev      # http://localhost:4321/spain-guides/
npm run build    # сборка в dist/
```

После каждого пуша в `main` GitHub Actions собирает сайт и публикует его на GitHub Pages (`.github/workflows/deploy.yml`).

## Гайды

- [Гостевая виза для родственника по приглашению](guides/viza-po-priglasheniyu.md) — Carta de invitación, документы и подача визы через BLS
