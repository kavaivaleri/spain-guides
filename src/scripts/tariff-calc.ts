// Сравнение двух тарифов на свет или газ за год, до налогов.
// Налоги (impuesto sobre la electricidad / hidrocarburos и IVA) одинаково
// пропорциональны для обоих предложений, поэтому на выбор не влияют.
//
// TUR — значения из BOE-A-2026-20389, действуют с 1 октября 2026 года.
// Пересматриваются раз в квартал: при обновлении поменяйте TUR и TUR_SOURCE,
// а также таблицу на странице guides/kommunalnye-uslugi/gaz.md.

const TUR = [
	{ name: 'TUR.1', upTo: 5_000, fixedMonth: 3.83, perKwh: 0.0525259 },
	{ name: 'TUR.2', upTo: 15_000, fixedMonth: 8.17, perKwh: 0.05042762 },
	{ name: 'TUR.3', upTo: 50_000, fixedMonth: 19.32, perKwh: 0.04698799 },
];
const TUR_SOURCE = 'с 1 октября 2026 года';

type Field = { key: string; label: string; unit: string; step?: string; value?: number };

const eur = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

function num(input: HTMLInputElement | null): number {
	if (!input) return 0;
	const v = Number(input.value.replace(',', '.'));
	return Number.isFinite(v) && v > 0 ? v : 0;
}

function fieldHtml(prefix: string, f: Field) {
	const id = `${prefix}-${f.key}`;
	const value = f.value === undefined ? '' : String(f.value).replace('.', ',');
	return `<label for="${id}"><span>${f.label}<span class="gd-calc__unit">${f.unit}</span></span>
		<input id="${id}" name="${id}" type="text" inputmode="decimal" autocomplete="off" value="${value}" placeholder="0">
	</label>`;
}

function store(key: string, form: HTMLFormElement) {
	try {
		const data: Record<string, string> = {};
		form.querySelectorAll<HTMLInputElement>('input').forEach((i) => (data[i.name] = i.value));
		localStorage.setItem(key, JSON.stringify(data));
	} catch {}
}
function restore(key: string, form: HTMLFormElement) {
	try {
		const data = JSON.parse(localStorage.getItem(key) ?? '{}');
		form.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
			if (typeof data[i.name] === 'string') i.value = data[i.name];
		});
	} catch {}
}

function verdict(a: number, b: number) {
	if (!a || !b) return 'Заполните оба предложения, чтобы сравнить.';
	const diff = Math.abs(a - b);
	if (diff < 1) return 'Предложения стоят почти одинаково.';
	return `Дешевле <b>${a < b ? 'A' : 'B'}</b> — на <b>${eur.format(diff)}</b> в год (${Math.round((diff / Math.max(a, b)) * 100)} %).`;
}

function mountLuz(host: HTMLElement) {
	const usage: Field[] = [
		{ key: 'p1', label: 'Мощность punta-llano', unit: 'кВт', value: 3.45 },
		{ key: 'p2', label: 'Мощность valle', unit: 'кВт', value: 3.45 },
		{ key: 'e1', label: 'Потребление punta', unit: 'кВт·ч в год' },
		{ key: 'e2', label: 'Потребление llano', unit: 'кВт·ч в год' },
		{ key: 'e3', label: 'Потребление valle', unit: 'кВт·ч в год' },
	];
	const offer: Field[] = [
		{ key: 'pp1', label: 'Мощность punta-llano', unit: '€/кВт в день' },
		{ key: 'pp2', label: 'Мощность valle', unit: '€/кВт в день' },
		{ key: 'pe1', label: 'Энергия punta', unit: '€/кВт·ч' },
		{ key: 'pe2', label: 'Энергия llano', unit: '€/кВт·ч' },
		{ key: 'pe3', label: 'Энергия valle', unit: '€/кВт·ч' },
		{ key: 'fee', label: 'Абонентская плата', unit: '€ в месяц' },
	];
	host.innerHTML = `
		<form class="gd-calc__form" novalidate>
			<fieldset><legend>Ваше потребление</legend>${usage.map((f) => fieldHtml('u', f)).join('')}</fieldset>
			<fieldset><legend>Предложение A</legend>${offer.map((f) => fieldHtml('a', f)).join('')}</fieldset>
			<fieldset><legend>Предложение B</legend>${offer.map((f) => fieldHtml('b', f)).join('')}</fieldset>
		</form>
		<div class="gd-calc__out" aria-live="polite"></div>
		<p class="gd-calc__note">Цена одна на все часы — впишите её во все три строки энергии. Мощность указана за год (€/кВт·год) — разделите на 365.</p>`;
	const form = host.querySelector('form')!;
	const out = host.querySelector<HTMLElement>('.gd-calc__out')!;
	const get = (id: string) => num(form.querySelector<HTMLInputElement>(`[name="${id}"]`));
	restore('gd-calc:luz', form);

	function cost(p: 'a' | 'b') {
		const power = (get('u-p1') * get(`${p}-pp1`) + get('u-p2') * get(`${p}-pp2`)) * 365;
		const energy = get('u-e1') * get(`${p}-pe1`) + get('u-e2') * get(`${p}-pe2`) + get('u-e3') * get(`${p}-pe3`);
		const fee = get(`${p}-fee`) * 12;
		return { power, energy, fee, total: power + energy + fee };
	}
	function render() {
		store('gd-calc:luz', form);
		const a = cost('a');
		const b = cost('b');
		const row = (name: string, x: ReturnType<typeof cost>) =>
			`<tr><th scope="row">${name}</th><td>${eur.format(x.power)}</td><td>${eur.format(x.energy)}</td><td>${eur.format(x.fee)}</td><td><b>${eur.format(x.total)}</b></td></tr>`;
		out.innerHTML = `<table class="gd-calc__table"><thead><tr><th></th><th>Мощность</th><th>Энергия</th><th>Абонплата</th><th>Год, до налогов</th></tr></thead>
			<tbody>${row('A', a)}${row('B', b)}</tbody></table>
			<p class="gd-calc__verdict">${verdict(a.total, b.total)}</p>`;
	}
	form.addEventListener('input', render);
	render();
}

function mountGas(host: HTMLElement) {
	const offer = (p: string, fixed?: number, variable?: number) =>
		[
			fieldHtml(p, { key: 'fix', label: 'Фиксированная часть', unit: '€ в месяц', value: fixed }),
			fieldHtml(p, { key: 'var', label: 'Цена газа', unit: '€/кВт·ч', value: variable }),
		].join('');
	host.innerHTML = `
		<form class="gd-calc__form" novalidate>
			<fieldset><legend>Ваше потребление</legend>${fieldHtml('u', { key: 'kwh', label: 'Газ за год', unit: 'кВт·ч — есть в счёте' })}</fieldset>
			<fieldset><legend>A — TUR <button type="button" class="gd-btn gd-btn--ghost gd-calc__tur">Подставить TUR</button></legend>${offer('a')}</fieldset>
			<fieldset><legend>B — предложение рынка</legend>${offer('b')}</fieldset>
		</form>
		<div class="gd-calc__out" aria-live="polite"></div>
		<p class="gd-calc__note">TUR ${TUR_SOURCE}, без налогов. Фиксированная часть указана за день — умножьте на 30,4; за год — разделите на 12. Цена в центах — разделите на 100.</p>`;
	const form = host.querySelector('form')!;
	const out = host.querySelector<HTMLElement>('.gd-calc__out')!;
	const input = (id: string) => form.querySelector<HTMLInputElement>(`[name="${id}"]`)!;
	restore('gd-calc:gas', form);

	function turFor(kwh: number) {
		return TUR.find((t) => kwh <= t.upTo) ?? null;
	}
	function fillTur() {
		const t = turFor(num(input('u-kwh')) || 1);
		if (!t) return;
		input('a-fix').value = String(t.fixedMonth).replace('.', ',');
		input('a-var').value = String(t.perKwh).replace('.', ',');
		render();
	}
	host.querySelector('.gd-calc__tur')!.addEventListener('click', fillTur);
	if (!input('a-fix').value && !input('a-var').value) fillTur();

	function render() {
		store('gd-calc:gas', form);
		const kwh = num(input('u-kwh'));
		const t = turFor(kwh || 1);
		const cost = (p: 'a' | 'b') => num(input(`${p}-fix`)) * 12 + kwh * num(input(`${p}-var`));
		const a = cost('a');
		const b = cost('b');
		const turNote = !kwh
			? 'Впишите годовое потребление.'
			: t
				? `При таком потреблении ваш тариф — <b>${t.name}</b>.`
				: 'Больше 50 000 кВт·ч в год — TUR для отдельной квартиры недоступен.';
		out.innerHTML = `<table class="gd-calc__table"><thead><tr><th></th><th>Фикс. часть</th><th>Газ</th><th>Год, до налогов</th></tr></thead>
			<tbody>
				<tr><th scope="row">A</th><td>${eur.format(num(input('a-fix')) * 12)}</td><td>${eur.format(kwh * num(input('a-var')))}</td><td><b>${eur.format(a)}</b></td></tr>
				<tr><th scope="row">B</th><td>${eur.format(num(input('b-fix')) * 12)}</td><td>${eur.format(kwh * num(input('b-var')))}</td><td><b>${eur.format(b)}</b></td></tr>
			</tbody></table>
			<p class="gd-calc__verdict">${turNote} ${kwh ? verdict(a, b) : ''}</p>`;
	}
	form.addEventListener('input', render);
	render();
}

export function mountTariffCalc(host: HTMLElement) {
	if (host.dataset.tariffCalc === 'gas') mountGas(host);
	else mountLuz(host);
}
