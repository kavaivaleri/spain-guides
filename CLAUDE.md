# Spain Guides

Practical guides about Spain, written in Russian. Structure and workflow are in `README.md`.

## Writing rules

- Write every guide in Russian. Keep Spanish official terms in Spanish on first use, with a Russian explanation: «NIE (Número de Identidad de Extranjero) — номер иностранца».
- Start a new guide from `templates/guide.md` and save it as `guides/<slug>.md` with a Latin, hyphenated slug. A long guide with steps can be a folder `guides/<slug>/` with `index.md` and one page per step; see README («Многостраничный гайд», «Разметка гайдов»).
- Add every new guide to the «Гайды» list in `README.md`.
- Each guide is a page on the Astro/Starlight site. Fill `title` and `description` in the front matter and do not add a `# ...` heading in the body; the site renders `title` as the page heading.

## Facts

- Rules, fees, deadlines, and procedures change often. Take them from official sources (BOE, sede.gob.es, ministry and regional government sites) or from sources the user supplies, and list them in the guide's «Источники» section with the date checked.
- Update the `updated` date in the front matter whenever facts change.
- If a fact is missing or cannot be confirmed, say so in the guide or ask; do not fill the gap.
- Note when a rule differs by autonomous community.
