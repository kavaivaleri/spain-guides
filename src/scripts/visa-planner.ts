// Калькулятор дат для гайда «Гостевая виза по приглашению».
// Считает от даты въезда назад по тем же допущениям, что и пример
// в гайде (страница «Календарь и сроки»). Если меняете допущения,
// поменяйте и текст на той странице.

const GUIDE = 'viza-po-priglasheniyu';
const STORAGE_KEY = 'gd-planner:visa';

// Допущения в днях. Официальных сроков для них нет.
const D = {
	visaBuffer: 60, // подача в BLS не позже чем за 60 дней до въезда
	cartaBeforeBls: 14, // Carta у гостя за 2 недели до подачи
	delivery: 28, // доставка в Россию
	pickup: 7, // оплата и получение Carta после решения
	review: 42, // рассмотрение в полиции
	citaSearch: 28, // поиск записи в полицию
	freshFrom: 21, // выписки и справки — за 3…1 неделю до подачи
	freshTo: 7,
	visaDecision: 45, // предупреждение BLS о сроках
};

type Milestone = {
	date: Date;
	dateTo?: Date;
	title: string;
	note?: string;
	step?: string;
	kind?: 'entry' | 'exit' | 'info';
};

const DAY = 86_400_000;

function parseDate(value: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}
function addDays(d: Date, days: number) {
	return new Date(d.getTime() + days * DAY);
}
function addMonths(d: Date, months: number) {
	const r = new Date(d);
	r.setUTCMonth(r.getUTCMonth() + months);
	return r;
}
function today() {
	const n = new Date();
	return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}
function iso(d: Date) {
	return d.toISOString().slice(0, 10);
}
const fmtFull = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtDay = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtShort = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const wd = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' });
/** «4 октября 2027» — без «г.», чтобы не было двойной точки в конце фразы. */
const fmt = { format: (d: Date) => fmtFull.format(d).replace(/\s?г\.$/, '') };

/** Сколько дней нужно от начала до въезда при наших допущениях. */
const LEAD = D.visaBuffer + D.cartaBeforeBls + D.delivery + D.pickup + D.review + D.citaSearch;

function plan(entry: Date, days: number): Milestone[] {
	const exit = addDays(entry, days - 1);
	const bls = addDays(entry, -D.visaBuffer);
	const cartaAtGuest = addDays(bls, -D.cartaBeforeBls);
	const send = addDays(cartaAtGuest, -D.delivery);
	const apply = addDays(send, -(D.pickup + D.review));
	const start = addDays(apply, -D.citaSearch);
	const notified = addDays(send, -D.pickup);

	return [
		{
			date: start,
			title: 'Старт: даты, паспорт гостя, padrón, поиск записи в полицию',
			note: `Паспорт гостя должен действовать минимум до ${fmt.format(addMonths(exit, 3))}.`,
			step: 'shag-1-poezdka',
		},
		{
			date: apply,
			title: 'Подать заявление на Carta de invitación в комисарии',
			note: 'Спросите, сколько сейчас занимает рассмотрение. Если дольше 6 недель — сдвигайте план.',
			step: 'shag-4-carta',
		},
		{
			date: notified,
			title: 'Решение по Carta: оплатить выдачу и забрать',
			note: `На это даётся месяц. Carta будет действовать примерно до ${fmt.format(addMonths(notified, 9))}.`,
			step: 'shag-4-carta',
		},
		{
			date: send,
			title: 'Отправить оригинал Carta в Россию',
			note: 'Вместе с копиями ваших документов для визы. Начните искать запись в BLS.',
			step: 'shag-5-otpravka',
		},
		{
			date: cartaAtGuest,
			title: 'Carta у гостя: билеты, страховка, запись в BLS',
			step: 'shag-7-bilety-strahovka',
		},
		{
			date: addDays(bls, -D.freshFrom),
			dateTo: addDays(bls, -D.freshTo),
			title: 'Получить свежие выписки, справки, выписку СФР',
			note: 'Они действуют один месяц на момент подачи.',
			step: 'shag-8-dokumenty-gostya',
		},
		{
			date: bls,
			title: 'Подать документы в BLS — не позже этой даты',
			note: `Закон разрешает подачу с ${fmt.format(addMonths(entry, -6))} по ${fmt.format(addDays(entry, -15))}, но решение может занять 45 дней и больше.`,
			step: 'shag-9-podacha-bls',
		},
		{
			date: addDays(bls, D.visaDecision),
			title: 'Ориентир: паспорт с визой вернулся',
			note: 'Проверьте даты и число дней в визе, подгоните билеты.',
			step: 'shag-10-proverka-vizy',
			kind: 'info',
		},
		{
			date: entry,
			title: 'Въезд в Шенген',
			step: 'shag-11-vezd',
			kind: 'entry',
		},
		{
			date: exit,
			title: `Выезд из Шенгена — ${days}-й день поездки`,
			note: 'Дни въезда и выезда считаются целиком.',
			kind: 'exit',
		},
	];
}

function escapeIcs(s: string) {
	return s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

function toIcs(items: Milestone[], root: string) {
	const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
	const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//spain-guides//visa-planner//RU', 'CALSCALE:GREGORIAN'];
	items.forEach((m, i) => {
		const end = addDays(m.dateTo ?? m.date, 1);
		const url = m.step ? new URL(`${m.step}/`, root).href : '';
		lines.push(
			'BEGIN:VEVENT',
			`UID:${iso(m.date)}-${i}-${Math.random().toString(36).slice(2)}@spain-guides`,
			`DTSTAMP:${stamp}`,
			`DTSTART;VALUE=DATE:${iso(m.date).replace(/-/g, '')}`,
			`DTEND;VALUE=DATE:${iso(end).replace(/-/g, '')}`,
			`SUMMARY:${escapeIcs(`Виза: ${m.title}`)}`,
			...(m.note || url ? [`DESCRIPTION:${escapeIcs([m.note, url].filter(Boolean).join('\n'))}`] : []),
			...(url ? [`URL:${url}`] : []),
			'END:VEVENT'
		);
	});
	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}

export function mountPlanner(host: HTMLElement) {
	const idx = location.pathname.indexOf(`/${GUIDE}/`);
	const root = location.origin + (idx >= 0 ? location.pathname.slice(0, idx + GUIDE.length + 2) : '/');

	let saved: { entry?: string; days?: number } = {};
	try {
		saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
	} catch {}

	const defaultEntry = iso(addDays(today(), LEAD + 14));
	host.innerHTML = `
		<form class="gd-planner__form" novalidate>
			<label>Дата въезда в Шенген
				<input type="date" name="entry" required value="${saved.entry ?? defaultEntry}">
			</label>
			<label>Дней в поездке
				<input type="number" name="days" min="1" max="90" inputmode="numeric" value="${saved.days ?? 90}">
			</label>
		</form>
		<div class="gd-planner__out" aria-live="polite"></div>
		<div class="gd-planner__actions">
			<button type="button" class="gd-btn" data-ics>Добавить в календарь (.ics)</button>
			<button type="button" class="gd-btn gd-btn--ghost" data-print>Распечатать план</button>
		</div>`;

	const form = host.querySelector('form')!;
	const out = host.querySelector<HTMLElement>('.gd-planner__out')!;
	let current: Milestone[] = [];

	function render() {
		const entry = parseDate((form.elements.namedItem('entry') as HTMLInputElement).value);
		let days = Math.round(Number((form.elements.namedItem('days') as HTMLInputElement).value) || 90);
		const alerts: string[] = [];
		if (days > 90) {
			alerts.push('<p class="gd-planner__alert gd-planner__alert--bad">Больше 90 дней по этой визе нельзя. Считаем для 90.</p>');
			days = 90;
		}
		if (days < 1) days = 1;
		if (!entry) {
			out.innerHTML = '<p class="gd-planner__alert gd-planner__alert--warn">Выберите дату въезда.</p>';
			current = [];
			return;
		}
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ entry: iso(entry), days }));
		} catch {}

		current = plan(entry, days);
		const now = today();
		const late = current.filter((m) => m.kind === undefined && m.date < now);
		if (entry.getTime() - now.getTime() < 15 * DAY) {
			alerts.push('<p class="gd-planner__alert gd-planner__alert--bad">До въезда меньше 15 дней — подать на визу к этой дате уже нельзя.</p>');
		} else if (late.length) {
			const earliest = addDays(now, LEAD);
			alerts.push(
				`<p class="gd-planner__alert gd-planner__alert--warn">Часть дат уже прошла (отмечены красным). Если эти шаги ещё не сделаны, с нашим запасом поездка успевает не раньше <b>${fmt.format(earliest)}</b>. Можно попробовать уложиться быстрее, но без запаса на задержки.</p>`
			);
		}

		const items = current
			.map((m) => {
				const date = m.dateTo
					? `${fmtShort.format(m.date)} — ${fmtShort.format(m.dateTo)}<small>${m.dateTo.getUTCFullYear()}</small>`
					: `${fmtDay.format(m.date)}<small>${wd.format(m.date)}, ${m.date.getUTCFullYear()}</small>`;
				const cls = [m.kind === 'entry' || m.kind === 'exit' ? 'is-entry' : '', m.kind === undefined && m.date < now ? 'is-past' : '']
					.filter(Boolean)
					.join(' ');
				const title = m.step ? `<a href="${new URL(`${m.step}/`, root).pathname}">${m.title}</a>` : m.title;
				return `<li class="${cls}"><span class="gd-planner__date">${date}</span><span class="gd-planner__what"><strong>${title}</strong>${m.note ? `<small>${m.note}</small>` : ''}</span></li>`;
			})
			.join('');
		out.innerHTML = `${alerts.join('')}<ol class="gd-planner__list">${items}</ol>`;
	}

	form.addEventListener('input', render);
	form.addEventListener('submit', (e) => e.preventDefault());
	host.querySelector('[data-print]')!.addEventListener('click', () => window.print());
	host.querySelector('[data-ics]')!.addEventListener('click', () => {
		if (!current.length) return;
		const blob = new Blob([toIcs(current, root)], { type: 'text/calendar;charset=utf-8' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'viza-po-priglasheniyu-plan.ics';
		document.body.append(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	});
	render();
}
