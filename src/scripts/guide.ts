// Интерактив гайдов: отметки в чек-листах, кнопка «Скопировать»,
// калькулятор дат. Без JavaScript страницы читаются как обычный текст.

const store = {
	get(key: string): Record<string, boolean> {
		try {
			return JSON.parse(localStorage.getItem(key) ?? '{}');
		} catch {
			return {};
		}
	},
	set(key: string, value: Record<string, boolean>) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// Хранилище недоступно (приватный режим) — отметки просто не сохранятся.
		}
	},
};

/** Чек-листы: включаем галочки, запоминаем их и показываем прогресс. */
function initChecklists() {
	const pageKey = `gd-check:${location.pathname}`;
	const saved = store.get(pageKey);
	const lists = document.querySelectorAll<HTMLUListElement>('.sl-markdown-content ul.contains-task-list');

	lists.forEach((list, listIndex) => {
		list.dataset.interactive = '';
		const items = [...list.querySelectorAll<HTMLLIElement>(':scope > li.task-list-item')];
		const section = list.closest<HTMLElement>('.gd-checklist');

		items.forEach((item) => {
			const box = item.querySelector<HTMLInputElement>(':scope > input[type="checkbox"]');
			if (!box) return;
			const key = `${listIndex}:${(item.textContent ?? '').trim().slice(0, 80)}`;
			box.disabled = false;
			box.setAttribute('aria-label', (item.textContent ?? '').trim().slice(0, 120));
			if (key in saved) box.checked = saved[key];
			box.addEventListener('change', () => {
				saved[key] = box.checked;
				store.set(pageKey, saved);
				updateProgress();
			});
			// Клик по тексту пункта тоже ставит галочку (кроме ссылок).
			item.addEventListener('click', (event) => {
				const target = event.target as HTMLElement;
				if (target === box || target.closest('a, button, summary')) return;
				box.checked = !box.checked;
				box.dispatchEvent(new Event('change'));
			});
		});

		const boxes = () => items.map((i) => i.querySelector<HTMLInputElement>(':scope > input')).filter(Boolean) as HTMLInputElement[];
		let progress: { text: HTMLElement; fill: HTMLElement } | undefined;

		if (section && !section.querySelector('.gd-progress')) {
			const wrap = document.createElement('div');
			wrap.className = 'gd-progress';
			wrap.innerHTML =
				'<span class="gd-progress__text"></span><span class="gd-progress__bar"><span class="gd-progress__fill"></span></span><button type="button" class="gd-progress__reset">Сбросить</button>';
			section.querySelector('.gd-checklist__head')?.after(wrap);
			progress = {
				text: wrap.querySelector('.gd-progress__text')!,
				fill: wrap.querySelector('.gd-progress__fill')!,
			};
			wrap.querySelector('button')!.addEventListener('click', () => {
				boxes().forEach((box) => {
					if (box.checked) {
						box.checked = false;
						box.dispatchEvent(new Event('change'));
					}
				});
			});
		}

		function updateProgress() {
			if (!progress || !section) return;
			const all = boxes();
			const done = all.filter((b) => b.checked).length;
			progress.text.textContent = done === all.length ? `Готово: все ${all.length}` : `Отмечено ${done} из ${all.length}`;
			progress.fill.style.width = `${all.length ? (done / all.length) * 100 : 0}%`;
			section.toggleAttribute('data-complete', done === all.length && all.length > 0);
		}
		updateProgress();
	});
}

/** Кнопка «Скопировать» у шаблонов. */
function initTemplates() {
	document.querySelectorAll<HTMLElement>('.gd-template').forEach((template) => {
		const caption = template.querySelector('.gd-template__title');
		const body = template.querySelector<HTMLElement>('.gd-template__body');
		if (!caption || !body || caption.querySelector('.gd-copy')) return;
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'gd-copy';
		button.textContent = 'Скопировать';
		button.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(body.innerText.trim());
				button.textContent = 'Скопировано';
				button.dataset.done = '';
			} catch {
				button.textContent = 'Не вышло — выделите текст вручную';
			}
			setTimeout(() => {
				button.textContent = 'Скопировать';
				delete button.dataset.done;
			}, 2000);
		});
		caption.append(button);
	});
}

function init() {
	initChecklists();
	initTemplates();
	const planners = document.querySelectorAll<HTMLElement>('[data-planner]');
	if (planners.length) {
		import('./visa-planner.ts').then(({ mountPlanner }) => planners.forEach(mountPlanner));
	}
}

init();
