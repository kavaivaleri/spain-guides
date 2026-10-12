// Разметка гайдов: плашки для документов, сумм, сроков и т. п.
// Работает в обычных .md через директивы (:doc[...], :::doc[...] ... :::).
// Справка по синтаксису — в README, раздел «Разметка гайдов».
//
// Плагин для Sätteri (Markdown-движок Astro). Он должен стоять раньше
// плагинов Starlight: неизвестные директивы (например, «10:30») он
// не трогает, и Starlight потом возвращает их в текст как было.

/** Строчные пометки: :doc[Carta de invitación], :fee[75,05 €] и т. д. */
const INLINE = {
	doc: { label: 'Документ' },
	fee: { label: 'Сумма' },
	time: { label: 'Срок' },
	place: { label: 'Место' },
	fill: { label: 'Заполнить' },
	host: { label: 'Приглашающий', text: 'Приглашающий' },
	guest: { label: 'Гость', text: 'Гость' },
	sponsor: { label: 'Спонсор', text: 'Спонсор' },
};

const ACTORS = {
	host: 'Приглашающий',
	guest: 'Гость',
	sponsor: 'Спонсор',
	both: 'Приглашающий и гость',
};

/** Подписи к атрибутам карточки документа, в порядке вывода. */
const DOC_META = [
	['place', 'Адрес'],
	['where', 'Где взять'],
	['form', 'Что сдать'],
	['fresh', 'Срок годности'],
	['when', 'Когда'],
];

function el(tagName, properties, children = []) {
	return { type: 'paragraph', data: { hName: tagName, hProperties: properties }, children };
}

function text(value) {
	return { type: 'text', value };
}

/** Забирает подпись директивы (то, что в [...]) из первого абзаца контейнера. */
function takeLabel(node) {
	const children = [...node.children];
	const first = children[0];
	if (first?.type === 'paragraph' && first.data?.directiveLabel) {
		children.shift();
		return { label: first.children, children };
	}
	return { label: null, children };
}

function actorPill(who) {
	if (!ACTORS[who]) return null;
	return el('span', { class: `gd-actor gd-actor--${who}` }, [text(ACTORS[who])]);
}

const containers = {
	/** Карточка документа. С `kind="place"` — карточка организации или офиса. */
	doc(node) {
		const { label, children } = takeLabel(node);
		const attrs = node.attributes ?? {};
		const head = [el('span', { class: 'gd-doc__title' }, label ?? [text('Документ')])];
		const pill = actorPill(attrs.who);
		if (pill) head.push(pill);
		const meta = DOC_META.filter(([key]) => attrs[key]).map(([key, name]) =>
			el('div', { class: `gd-doc__meta-item gd-doc__meta-item--${key}` }, [
				el('dt', {}, [text(name)]),
				el('dd', {}, [text(attrs[key])]),
			])
		);
		const parts = [el('div', { class: 'gd-doc__head' }, head)];
		if (meta.length) parts.push(el('dl', { class: 'gd-doc__meta' }, meta));
		if (children.length) parts.push(el('div', { class: 'gd-doc__body' }, children));
		const classes = ['gd-doc', attrs.who && `gd-doc--${attrs.who}`, attrs.kind === 'place' && 'gd-doc--place'];
		return el('div', { class: classes.filter(Boolean).join(' ') }, parts);
	},

	/** «Коротко о шаге»: список вида «- **Кто:** ...» превращается в сетку. */
	summary(node) {
		const { label, children } = takeLabel(node);
		return el('section', { class: 'gd-summary', 'aria-label': 'Коротко' }, [
			el('p', { class: 'gd-summary__title' }, label ?? [text('Коротко')]),
			...children,
		]);
	},

	/** Текст-шаблон с кнопкой «Скопировать» (кнопку добавляет скрипт). */
	template(node) {
		const { label, children } = takeLabel(node);
		return el('figure', { class: 'gd-template' }, [
			el('figcaption', { class: 'gd-template__title' }, label ?? [text('Шаблон')]),
			el('div', { class: 'gd-template__body' }, children),
		]);
	},

	/** Нумерованный список шагов в виде вертикальной ленты. */
	steps(node) {
		return el('div', { class: 'gd-steps' }, [...node.children]);
	},

	/** Группа чек-листа: заголовок и список с прогрессом (прогресс добавляет скрипт). */
	checklist(node) {
		const { label, children } = takeLabel(node);
		const attrs = node.attributes ?? {};
		const head = [el('span', { class: 'gd-checklist__title' }, label ?? [text('Чек-лист')])];
		const pill = actorPill(attrs.who);
		if (pill) head.push(pill);
		return el('section', { class: 'gd-checklist', 'data-checklist': attrs.id ?? '' }, [
			el('div', { class: 'gd-checklist__head' }, head),
			...children,
		]);
	},
};

const leaves = {
	/** Калькулятор дат. Сам калькулятор рисует скрипт. */
	planner() {
		return el('div', { class: 'gd-planner', 'data-planner': '' }, [
			el('p', { class: 'gd-planner__fallback' }, [
				text('Калькулятор работает при включённом JavaScript. Без него ориентируйтесь на пример расчёта ниже.'),
			]),
		]);
	},

	/** Сравнение тарифов: ::tariffs{kind="luz"} или ::tariffs{kind="gas"}. Рисует скрипт. */
	tariffs(node) {
		const kind = node.attributes?.kind === 'gas' ? 'gas' : 'luz';
		return el('div', { class: 'gd-planner gd-calc', 'data-tariff-calc': kind }, [
			el('p', { class: 'gd-planner__fallback' }, [
				text('Калькулятор работает при включённом JavaScript. Без него посчитайте по формуле ниже.'),
			]),
		]);
	},
};

export function guideDirectives() {
	return {
		name: 'guide-directives',
		textDirective(node) {
			const spec = INLINE[node.name];
			if (!spec) return;
			let children = node.children?.length ? [...node.children] : [text(spec.text ?? '')];
			// Скобки остаются в тексте, чтобы их было видно и в скопированном шаблоне.
			if (node.name === 'fill') children = [text('['), ...children, text(']')];
			const isActor = node.name in ACTORS;
			return el(
				'span',
				{
					class: isActor ? `gd-actor gd-actor--${node.name}` : `gd-chip gd-chip--${node.name}`,
					title: spec.label,
				},
				children
			);
		},
		containerDirective(node) {
			return containers[node.name]?.(node);
		},
		leafDirective(node) {
			return leaves[node.name]?.(node);
		},
	};
}
