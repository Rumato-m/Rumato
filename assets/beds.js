'use strict';
// Beds pages logic — KORNILON, KUBO, MODEL3–5
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // --- Текущая модель (по data-model или H1) ---
  let model = (document.body.dataset.model || '').toLowerCase();
  if (!model) {
    const titleEl = document.querySelector('.model-title');
    if (titleEl) {
      model = titleEl.textContent.trim().toLowerCase();
    }
  }
  if (!model) model = 'kornilon';

  const modelName =
    (document.querySelector('.model-title')?.textContent || 'KORNILON').trim();

  // --- Карта путей к папкам с картинками по моделям ---
  const MODEL_ASSET_BASE = {
    kornilon: 'images/sofas/kornilon',
    kubo: 'images/sofas/kubobett',
    model3: 'images/sofas/model3',
    model4: 'images/sofas/model4',
    model5: 'images/sofas/model5'
  };
  const SOFA_BASE = MODEL_ASSET_BASE[model] || MODEL_ASSET_BASE.kornilon;

  // --- Конфиг цен для разных моделей ---
  // TODO: просто поправь цифры под реальный прайс
  const PRICE_CONFIG = {
    kornilon: {
      base: { '160x200': 23500, '180x200': 24100, '200x200': 26000 },
      defaultBase: 21500,
      liftExtra: 2000,
      premiumFabrics: ['f02', 'f03', 'f04'],
      fabricMarkup: 0.10
    },
    kubo: {
      // ориентировочно чуть мягче по цене
      base: { '160x200': 20500, '180x200': 22100, '200x200': 24000 },
      defaultBase: 20500,
      liftExtra: 1800,
      premiumFabrics: ['f02', 'f03', 'f04'],
      fabricMarkup: 0.10
    },
    model3: {
      base: { '160x200': 21000, '180x200': 22000, '200x200': 24000 },
      defaultBase: 20500,
      liftExtra: 1800,
      premiumFabrics: ['f02', 'f03', 'f04'],
      fabricMarkup: 0.10
    },
    model4: {
      base: { '160x200': 26000, '180x200': 27000, '200x200': 29000 },
      defaultBase: 25500,
      liftExtra: 2200,
      premiumFabrics: ['f02', 'f03', 'f04'],
      fabricMarkup: 0.11
    },
    model5: {
      base: { '160x200': 28000, '180x200': 29500, '200x200': 31500 },
      defaultBase: 27500,
      liftExtra: 2300,
      premiumFabrics: ['f02', 'f03', 'f04'],
      fabricMarkup: 0.12
    }
  };

  // --- Modals guard ---
  (function () {
    const articleModal = $('articleModal');
    const fabricModal = $('fabricModal');
    if (articleModal) {
      articleModal.style.display = 'none';
      articleModal.setAttribute('aria-hidden', 'true');
    }
    if (fabricModal) {
      fabricModal.style.display = 'none';
      fabricModal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  })();

  // --- State ---
  const state = {
    sleepplace: '160x200',
    border: 20,
    lift: false,
    fabric: null // f01..f04
  };

  // --- Elements ---
  const el = {
    sleepSize: $('sleepSize'),
    borderSelect: $('borderSelect'),
    liftSelect: $('liftSelect'),
    priceValue: $('priceValue'),
    previewLeft: $('filterPreviewLeft'),
    previewRight: $('filterPreviewRight'),
    addToCart: $('addToCart'),
    chairSize: $('chairSize'),
    poufSize: $('poufSize')
  };

  // --- File naming for previews ---
  const TRY_EXTS = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'];

  function buildCode() {
    const m = state.sleepplace.match(/^(\d{3})/);
    const w = m ? m[1] : '160';
    const b = String(state.border).padStart(2, '0');
    return `${w}${b}`; // 16020, 18020, 20020 ...
  }

  function pickFirst(urls, img) {
    let i = 0;
    const probe = () => {
      if (i >= urls.length) {
        return;
      }
      const u = urls[i++], im = new Image();
      im.onload = () => {
        img.src = u;
      };
      im.onerror = probe;
      im.src = u;
    };
    probe();
  }

  function updatePreviews() {
    const code = buildCode();
    const left = TRY_EXTS.map(e => `./${SOFA_BASE}/${code}.${e}`);
    const right = TRY_EXTS.map(e => `./${SOFA_BASE}/${code}V.${e}`);
    if (el.previewLeft) pickFirst(left, el.previewLeft);
    if (el.previewRight) pickFirst(right, el.previewRight);
  }

  // --- Main price: разные формулы по model ---
  function computeMainPrice() {
    const cfg = PRICE_CONFIG[model] || PRICE_CONFIG.kornilon;
    const baseMap = cfg.base || {};
    let p = baseMap[state.sleepplace] ?? cfg.defaultBase;

    if (state.lift) {
      p += cfg.liftExtra || 0;
    }

    if ((cfg.premiumFabrics || []).includes(state.fabric)) {
      const markup = cfg.fabricMarkup ?? 0;
      p = Math.round(p * (1 + markup));
    }

    return p;
  }

  function formatUAH(n) {
    return new Intl.NumberFormat('uk-UA').format(n) + ' грн.';
  }

  function updateMainPrice() {
    if (el.priceValue) el.priceValue.textContent = formatUAH(computeMainPrice());
  }

  // --- Fabrics (минимально; пути не меняю) ---
  const FABRICS = [
    { code: 'f01', name: 'Тканина Lili' },
    { code: 'f02', name: 'Тканина Lotus' },
    { code: 'f03', name: 'Тканина Alpaca' },
    { code: 'f04', name: 'Тканина Spark' }
  ];

  const FABRIC_INFO = {
    f01: { title: 'Тканина Lili', body: 'шлифованний велюр, антикіготь, антібруд.' },
    f02: { title: 'Тканина Lotus', body: 'Щільний велюр з антикогтем, легко чиститься.' },
    f03: { title: 'Тканина Alpaca', body: 'Фактурне букле, трендовий тактильний ефект.' },
    f04: { title: 'Тканина Spark', body: 'Преміальний велюр, стійкість до зношення.' }
  };

  const FABRIC_FOLDERS = { f01: 1, f02: 2, f03: 3, f04: 4 };

  const FABRIC_TILES = {
    f01: ['03', '04', '05', '61', '63', '65', '82', '84', '88', '91', '92', '94', '95', '96', '97', '98', '99'],
    f02: ['02', '03', '05', '09', '15', '20', '37', '39', '45', '54', '62', '65', '67', '83', '85', '88', '90', '92', '93', '94', '95', '96', '97', '98', '99', '100'],
    f03: ['02', '04', '12', '20', '37', '48', '61', '82', '88', '90', '93', '97', '99'],
    f04: ['01', '02', '03', '04', '05', '06', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '32', '33', '34', '35', '36', '38', '39', '40', '41']
  };

  // === Повноекранна палiтра тканини для мобiльних (ліжка) ===
  const bedFabricOverlay = {
    backdrop: null,
    grid: null,
    title: null,
    chooseBtn: null,
    currentCard: null,
    currentFabric: null,
    samples: [],
    selectedSample: null,
    selectedEl: null
  };

  function ensureBedFabricOverlay() {
    if (bedFabricOverlay.backdrop) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'bed-fabric-overlay';

    const box = document.createElement('div');
    box.className = 'bed-fabric-box';

    const titleEl = document.createElement('div');
    titleEl.className = 'bed-fabric-title';

    const grid = document.createElement('div');
    grid.className = 'bed-fabric-grid';

    box.appendChild(titleEl);
    box.appendChild(grid);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    const chooseBtn = document.createElement('button');
    chooseBtn.type = 'button';
    chooseBtn.className = 'bed-fabric-choose';
    chooseBtn.textContent = 'Обрати';
    chooseBtn.style.display = 'none';
    document.body.appendChild(chooseBtn);

    // клик по затемненному фону — закрыть без выбора
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeBedFabricOverlay();
      }
    });

    // клик по "Обрати" — применяем и закрываем
    chooseBtn.addEventListener('click', () => {
      applyBedFabricSelection();
    });

    bedFabricOverlay.backdrop = backdrop;
    bedFabricOverlay.grid = grid;
    bedFabricOverlay.title = titleEl;
    bedFabricOverlay.chooseBtn = chooseBtn;
  }

  function openBedFabricOverlay({ fabric, card, samples }) {
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    ensureBedFabricOverlay();

    const o = bedFabricOverlay;
    o.currentCard = card;
    o.currentFabric = fabric.code;
    o.samples = samples;
    o.selectedSample = null;
    o.selectedEl = null;

    o.title.textContent = fabric.name;
    o.grid.innerHTML = '';

    samples.forEach(sample => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'bed-fabric-swatch';
      sw.style.backgroundImage = `url('${sample.url}')`;
      sw.innerHTML = `<span class="sw-badge">${sample.name}</span>`;

      sw.addEventListener('click', () => {
        selectBedFabricSwatch(sw, sample);
      });

      o.grid.appendChild(sw);
    });

    o.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeBedFabricOverlay() {
    const o = bedFabricOverlay;
    if (!o.backdrop) return;
    o.backdrop.classList.remove('is-open');
    o.chooseBtn.style.display = 'none';
    document.body.style.overflow = '';
  }

  function selectBedFabricSwatch(el, sample) {
    const o = bedFabricOverlay;
    o.selectedSample = sample;

    if (o.selectedEl) {
      o.selectedEl.classList.remove('is-selected');
    }
    o.selectedEl = el;
    el.classList.add('is-selected');

    // позиционируем круглую кнопку "Обрати" под выбранным свотчем
    const rect = el.getBoundingClientRect();
    const btn = o.chooseBtn;
    btn.style.display = 'block';
    btn.style.top = `${rect.bottom + 8}px`;
    btn.style.left = `${rect.left + rect.width / 2}px`;
    btn.style.transform = 'translateX(-50%)';
  }

  function applyBedFabricSelection() {
    const o = bedFabricOverlay;
    if (!o.selectedSample || !o.currentCard) return;
    o.currentCard.style.backgroundImage = `url('${o.selectedSample.url}')`;
    state.fabric = o.currentFabric;
    updateMainPrice();
    closeBedFabricOverlay();
  }

  // === полноэкранное "колесо" тканей (десктоп) ===
  const fabricWheel = {
    backdrop: null,
    box: null,
    preview: null,
    title: null,
    code: null,
    tiles: [],
    index: 0,
    fabricCode: null,
    card: null
  };

  function applyFabricWheelSelection() {
    if (!fabricWheel.preview || !fabricWheel.tiles.length) return;
    const num = fabricWheel.tiles[fabricWheel.index];
    const folder = FABRIC_FOLDERS[fabricWheel.fabricCode];
    const url = `url('./filter/stof/${folder}/${num}.jpg')`;

    fabricWheel.preview.style.backgroundImage = url;
    fabricWheel.code.textContent = `Колір ${num}`;

    if (fabricWheel.card) {
      fabricWheel.card.style.backgroundImage = url;
      state.fabric = fabricWheel.fabricCode;
      updateMainPrice();
    }
  }

  function closeFabricWheel() {
    if (!fabricWheel.backdrop) return;
    fabricWheel.backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function ensureFabricWheel() {
    if (fabricWheel.backdrop) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'fabric-wheel-overlay';
    backdrop.innerHTML = `
      <div class="fabric-wheel-box">
        <button type="button" class="fabric-wheel-close" aria-label="Закрити">✕</button>
        <div class="fabric-wheel-title"></div>
        <div class="fabric-wheel-preview"></div>
        <div class="fabric-wheel-code"></div>
        <div class="fabric-wheel-controls">
          <button type="button" class="wheel-btn" data-dir="prev">Попередній</button>
          <button type="button" class="wheel-btn" data-dir="next">Наступний</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const box = backdrop.querySelector('.fabric-wheel-box');
    fabricWheel.backdrop = backdrop;
    fabricWheel.box = box;
    fabricWheel.preview = box.querySelector('.fabric-wheel-preview');
    fabricWheel.title = box.querySelector('.fabric-wheel-title');
    fabricWheel.code = box.querySelector('.fabric-wheel-code');

    const closeBtn = box.querySelector('.fabric-wheel-close');
    closeBtn.addEventListener('click', closeFabricWheel);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeFabricWheel();
    });

    box.querySelectorAll('.wheel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!fabricWheel.tiles.length) return;
        const dir = (btn.dataset.dir === 'prev') ? -1 : 1;
        const len = fabricWheel.tiles.length;
        fabricWheel.index = (fabricWheel.index + dir + len) % len; // по колу
        applyFabricWheelSelection();
      });
    });
  }

  function openFabricWheel(fabricCode, card) {
    ensureFabricWheel();

    const tiles = FABRIC_TILES[fabricCode] || [];
    if (!tiles.length) return;

    fabricWheel.fabricCode = fabricCode;
    fabricWheel.tiles = tiles;
    fabricWheel.index = 0;
    fabricWheel.card = card;

    const info = FABRIC_INFO[fabricCode];
    fabricWheel.title.textContent = info ? info.title : 'Тканина';

    applyFabricWheelSelection();

    fabricWheel.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  // === Рендер тканей ===
  (function renderFabrics() {
    const grid = $('fabricGrid');
    if (!grid) return;

    grid.innerHTML = '';

    FABRICS.forEach((fab, i) => {
      const col = document.createElement('div');
      col.className = 'fabric-col';

      const card = document.createElement('div');
      card.className = 'fabric-card';
      card.dataset.fabric = fab.code;

      const folder = FABRIC_FOLDERS[fab.code];
      const tiles = FABRIC_TILES[fab.code] || [];
      const valid = (folder ? tiles.map(n => ({
        name: n,
        url: `./filter/stof/${folder}/${n}.jpg`
      })) : []);

      const firstTile = tiles[0];
      if (folder && firstTile) {
        card.style.backgroundImage = `url('./filter/stof/${folder}/${firstTile}.jpg')`;
      }

      const title = document.createElement('div');
      title.className = 'fabric-title';
      title.textContent = fab.name;

      const palette = document.createElement('div');
      palette.className = 'palette';

      const buildPalette = () => {
        if (palette.childElementCount || !valid.length) return;
        valid.forEach(v => {
          const sw = document.createElement('button');
          sw.className = 'sw';
          sw.style.background = `url('${v.url}') center/cover no-repeat`;
          sw.innerHTML = `<span class="sw-badge">${v.name}</span>`;
          sw.onclick = () => {
            card.style.backgroundImage = `url('${v.url}')`;
            state.fabric = fab.code;
            updateMainPrice();
            palette.style.display = 'none';
          };
          palette.appendChild(sw);
        });
      };

      // клік по назві тканини
      title.addEventListener('click', () => {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;

        // мобільна версія — повноекранна палiтра
        if (isMobile && valid.length) {
          openBedFabricOverlay({
            fabric: fab,
            card,
            samples: valid
          });
          return;
        }

        // десктоп — стара палiтра в картці
        buildPalette();
        palette.style.display = (palette.style.display === 'grid') ? 'none' : 'grid';
      });

      // тап по самій картці тканини на мобiлi — теж відкриває повноекранну палiтру
      card.addEventListener('click', (e) => {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile || !valid.length) return;
        if (e.target.closest('.fabric-select')) return;
        openBedFabricOverlay({
          fabric: fab,
          card,
          samples: valid
        });
      });

      const sel = document.createElement('div');
      sel.className = 'fabric-select';

      const more = document.createElement('button');
      more.className = 'fabric-more';
      more.type = 'button';
      more.textContent = 'Про тканину';
      more.onclick = () => openFabricModal(fab.code);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'toggle';
      input.id = `fabricToggle_${i}`;
      input.hidden = true;

      const label = document.createElement('label');
      label.className = 'switch';
      label.htmlFor = input.id;

      input.onchange = () => {
        if (input.checked) {
          state.fabric = fab.code;
        } else {
          state.fabric = null;
        }
        updateMainPrice();
      };

      sel.append(more, input, label);

      card.append(title, palette);
      col.append(card, sel);
      grid.append(col);
    });
  })();

  // --- Fabric modal ---
  const fModal = $('fabricModal'),
    fTitle = $('fabricTitle'),
    fBody = $('fabricBody'),
    fClose = $('fabricClose');

  function openFabricModal(code) {
    const d = FABRIC_INFO[code]; if (!d || !fModal) return;
    fTitle.textContent = d.title;
    fBody.textContent = d.body;
    fModal.style.display = 'flex';
    fModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeFabricModal() {
    if (!fModal) return;
    fModal.style.display = 'none';
    fModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  fClose?.addEventListener('click', closeFabricModal);
  fModal?.addEventListener('click', e => { if (e.target === fModal) closeFabricModal(); });

  // --- Article modal (UA тексты — теперь подставляем имя модели) ---
  const aModal = $('articleModal'),
    aTitle = $('articleTitle'),
    aBody = $('articleBody'),
    aClose = $('articleClose');

  const articleContent = {
    fabric: {
      title: `Як обрати тканину для ліжка ${modelName}`,
      body: `Ліжко ${modelName} — індивідуальна робота під ваш простір. Вибирайте тканину за щільністю, фактурою та зносостійкістю. Для сімей і тварин — велюр з антикогтем або щільне букле. Спершу визначте розмір (160×200, 180×200, 200×200), далі — відтінок під освітлення кімнати.`
    },
    color: {
      title: 'Колір ліжка як мова інтер’єру',
      body: `Колір ліжка формує настрій спальні: світлі тони додають легкості, темні — камерності та глибини. ${modelName} можна виконати у будь-якому відтінку й поєднати з текстилем або дерев’яними акцентами.`
    },
    philosophy: {
      title: 'Комфорт щодня: філософія ліжка',
      body: `Міцний каркас, тиха конструкція, зручна висота узголів’я. Ви обираєте розмір, тканину та опції (підйомний механізм), а ми збираємо й акуратно доставляємо по Україні.`
    }
  };

  function openArticle(key) {
    const d = articleContent[key]; if (!d || !aModal) return;
    aTitle.textContent = d.title;
    aBody.textContent = d.body;
    aModal.style.display = 'flex';
    aModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeArticle() {
    if (!aModal) return;
    aModal.style.display = 'none';
    aModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.article-link[data-article]'); if (!b) return;
    openArticle(b.dataset.article);
  });
  aClose?.addEventListener('click', closeArticle);
  aModal?.addEventListener('click', e => { if (e.target === aModal) closeArticle(); });

  // --- SPEC (характеристики) ---
  const SPEC_TEXT = {
    chair: {
      title: 'Технічні параметри матраца Lotos Guru',
      body: [
        'Висота — 25 см',
        'Жорсткість — 5/4',
        'Навантаження — не обмежене',
        'Тип — Пружинний',
        'Чохол — Незнімний',
        'Пружинний блок — Premium PS 7-zone hard'
      ].join('\n')
    },
    pouf: {
      title: 'Матрас Лотос-Етерно — характеристики',
      body: [
        'Навантаження 180 кг',
        'Жорсткість — 4/4',
        'Наповнення — Ортопедична піна багатошаровий',
        'Чохол — незмінний',
        'Висота -25 см.'
      ].join('\n')
    },
    'cushion-rect': {
      title: 'Пуф',
      body: [
        'Габарит — 120×45',
        'Наповнення — HR-пінa',
        'Опції — індивідуальна тканина',
        'Призначення — модуль до ліжка або окремо'
      ].join('\n')
    }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.spec-link[data-spec]'); if (!b) return;
    const spec = SPEC_TEXT[b.dataset.spec] || { title: 'Характеристики', body: 'Дані уточнюються.' };
    aTitle.textContent = spec.title;
    aBody.textContent = spec.body;
    aModal.style.display = 'flex';
    aModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  // --- Addons: габарит и цена зависят от sleepplace (первые две карточки) ---
  const ADDON_PRICE = { '160x200': 19000, '180x200': 23000, '200x200': 25000 };

  function updateAddonsBySleep() {
    const g = state.sleepplace.replace('x', '×');
    // размеры
    if (el.chairSize) el.chairSize.textContent = g;
    if (el.poufSize) el.poufSize.textContent = g;
    // цены (первые две карточки)
    document.querySelectorAll('.addon-price-val[data-price-for]').forEach(span => {
      span.textContent =
        new Intl.NumberFormat('uk-UA').format(ADDON_PRICE[state.sleepplace] || 10000) + ' ₴';
    });
  }

  // --- Events ---
  el.sleepSize?.addEventListener('change', e => {
    state.sleepplace = e.target.value;
    updatePreviews();
    updateMainPrice();
    updateAddonsBySleep();
  });
  $('borderSelect')?.addEventListener('change', e => {
    state.border = Number(e.target.value) || 20;
    updatePreviews();
  });
  el.liftSelect?.addEventListener('change', e => {
    state.lift = (e.target.value === 'on');
    updateMainPrice();
  });

  // --- Init ---
  updatePreviews();
  updateMainPrice();
  updateAddonsBySleep();

  // Add-to-cart toast
  $('addToCart')?.addEventListener('click', () => {
    const p = el.priceValue ? el.priceValue.textContent : '';
    const t = document.createElement('div');
    t.textContent = `Додано до кошика. ${p}`;
    Object.assign(t.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#23483e',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '30px',
      fontSize: '14px',
      opacity: '0',
      transition: 'opacity .3s',
      zIndex: 2147483647
    });
    document.body.append(t);
    requestAnimationFrame(() => t.style.opacity = '1');
    setTimeout(() => t.remove(), 2500);
  });

  // ==== MOBILE: только первая статья + без дыр ====
  document.addEventListener('DOMContentLoaded', function () {
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    const articlesSection = document.querySelector('.articles');
    const grid = articlesSection ? articlesSection.querySelector('.article-grid') : null;
    if (!grid) return;

    // прячем все article-card, кроме первого
    const cards = grid.querySelectorAll('.article-card');
    cards.forEach((card, index) => {
      if (index > 0) {
        card.style.display = 'none';
      }
    });

    // прячем разделитель
    const divider = grid.querySelector('.article-divider');
    if (divider) {
      divider.style.display = 'none';
    }

    // убираем лишние отступы, чтобы футер сразу шёл за статтею
    articlesSection.style.paddingBottom = '0';
    articlesSection.style.marginBottom = '0';
  });
});
