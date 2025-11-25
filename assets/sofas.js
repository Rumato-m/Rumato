document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // Папка с рендерами дивана
  const SOFA_BASE = 'images/sofas/kubo';

  // SVG-заглушка, если нет картинки конфигурации
  const PLACEHOLDER_IMG = (() => {
    const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#e5e7eb'/>
          <stop offset='100%' stop-color='#f3f4f6'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <rect x='80' y='140' width='640' height='120' rx='24' ry='24' fill='#d1d5db'/>
      <rect x='520' y='180' width='200' height='80' rx='24' ry='24' fill='#cbd5e1'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        fill='#6b7280' font-family='Arial' font-size='20'>
        Попередній перегляд дивана Kubo
      </text>
    </svg>`);
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  })();

  // Текущее состояние конфигуратора
  const state = {
    shape: 'straight',      // форма
    len1: 200,              // довжина 1
    len2: 200,              // довжина 2 (для кута)
    depth: 80,              // глибина сидіння
    removeArmL: false,      // без підлокітника зліва
    removeArmR: false,      // без підлокітника справа
    chaise: 'none',         // лежанка (left/right/none)
    sleep: false,           // розкладний механізм
    fabric: null,           // обрана тканина
    addons: {}              // додаткові позиції (крісло, пуф, подушки)
  };

  const el = {
    len1: $('len1Select'),
    len2: $('len2Select'),
    shape: $('shapeSelect'),
    preview: $('previewImg'),
    price: $('priceValue'),
    fabricGrid: $('fabricGrid'),
    addToCart: $('addToCart'),
    filtersRoot: $('filters'),
    chairSize: $('chairSize'),
    poufSize: $('poufSize')
  };

  // Заполнение значений селектов длины
  function fillSelect(target, start, end, step, current){
    target.innerHTML = '';
    for (let w = start; w <= end; w += step){
      const opt = new Option(`${w} см`, w, false, w === current);
      target.add(opt);
    }
  }

  function fillLengths(){
    fillSelect(el.len1, 160, 400, 10, state.len1);
    fillSelect(el.len2, 180, 360, 10, state.len2);
    const isCorner = state.shape !== 'straight';
    el.filtersRoot.classList.toggle('is-corner', isCorner);
  }

  // Выравнивание ширины pill-кнопок
  function equalizePillWidths(){
    const pills = Array.from(document.querySelectorAll('.pill'));
    if (!pills.length) return;
    pills.forEach(p => (p.style.width = 'auto'));
    const visible = pills.filter(p => p.offsetParent !== null);
    if (!visible.length) return;
    const max = Math.max(...visible.map(p => p.offsetWidth));
    visible.forEach(p => (p.style.width = max + 'px'));
  }
  window.addEventListener('resize', equalizePillWidths);

  // Построение имени файла превью по конфигу
  const suf = (left, right) => (left ? 'y' : '') + (right ? 'p' : '');

  function buildFilename(){
    const isCorner = state.shape !== 'straight';
    if (!isCorner){
      const w = +state.len1 || 160;
      let base = (w <= 240) ? '1' : (w <= 320) ? '2' : '3';
      if (state.chaise === 'right') base += 'r';
      else if (state.chaise === 'left') base += 'l';
      return `./${SOFA_BASE}/${base}${suf(state.removeArmL, state.removeArmR)}.png`;
    }

    // Кутовий варіант
    const len1 = +state.len1 || 160;
    const len2 = +state.len2 || 160;
    const g = v => (v <= 259 ? 1 : v <= 319 ? 2 : 3);

    const mapRight = {
      '1-1': 13, '1-2': 12, '1-3': 11,
      '2-1': 8,  '2-2': 9,  '2-3': 10,
      '3-1': 5,  '3-2': 6,  '3-3': 7
    };

    let baseCorner = mapRight[`${g(len1)}-${g(len2)}`] || 5;
    if (state.shape === 'corner-left') baseCorner += 'l';
    return `./${SOFA_BASE}/${baseCorner}${suf(state.removeArmL, state.removeArmR)}.png`;
  }

  // Обновление габарита кресла от глубины сиденья
  function updateChairGabarit(){
    if(!el.chairSize) return;
    if(state.depth === 100){
      el.chairSize.textContent = '140×120';
    } else {
      el.chairSize.textContent = '120×120';
    }
  }

  // Обновление габарита пуфа
  function updatePoufGabarit(){
    if(!el.poufSize) return;
    if(state.depth === 100){
      el.poufSize.textContent = '100×100';
    } else {
      el.poufSize.textContent = '80×80';
    }
  }

  // Обновление превью дивана и цены
  function updatePreview(){
    const url = buildFilename();
    const testImg = new Image();
    testImg.onload = () => { el.preview.src = url; };
    testImg.onerror = () => { el.preview.src = PLACEHOLDER_IMG; };
    testImg.src = url;

    updatePrice();
    updateChairGabarit();
    updatePoufGabarit();
  }

  // Расчёт цены
  function computePrice(){
    const len1 = +state.len1 || 0;
    const len2 = +state.len2 || 0;
    const isCorner = state.shape !== 'straight';

    let price = 24000;
    if (len1 > 240) {
      price += ((len1 - 240) / 10) * 800;
    }

    if (isCorner){
      let cornerAddon = 8000;
      if (len2 > 200){
        cornerAddon += ((len2 - 200) / 10) * 800;
      }
      price += cornerAddon;
    }

    if (state.chaise !== 'none') price += 2000;      // лежанка
    if (state.sleep) price += 2000;                  // розкладний механізм
    if (state.depth === 100) price += 2000;          // глибше сидіння

    if (["f02","f03"].includes(state.fabric)) {
      price *= 1.1; // дорожча тканина
    }

    return Math.round(price);
  }

  function formatPrice(n){
    return new Intl.NumberFormat('uk-UA').format(n) + ' ₴';
  }

  function updatePrice(){
    el.price.textContent = formatPrice(computePrice());
  }

  // ===== Информация о тканях =====
  const FABRICS = [
    { code: 'f01', name: 'Тканина Lili' },
    { code: 'f02', name: 'Тканина Lotus' },
    { code: 'f03', name: 'Тканина Alpaca' },
    { code: 'f04', name: 'Тканина Spark' }
  ];

  // Варианты образцов (палитры) для каждой ткани
  const FABRIC_FILES = {
    f01: ['03','04','05','61','63','65','82','84','88','91','92','94','95','96','97','98','99'],
    f02: ['02','03','05','09','15','20','37','39','45','54','62','65','67','83','85','88','90','92','93','94','95','96','97','98','99','100'],
    f03: ['02','04','12','20','37','48','61','82','88','90','93','97','99'],
    f04: ['01','02','03','04','05','06','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','32','33','34','35','36','38','39','40','41']
  };

  // Опис кожної тканини (для модалки "Про тканину")
 const FABRIC_INFO = {
  f01: {
    title: 'Тканина Lili',
    body: `Тканина Lili — м’який мікровелюр для диванів та м’яких меблів повсякденного використання. 
Відрізняється приємною тактильною фактурою та стабільним кольором у світлих відтінках.

Переваги тканини Lili:
• Антикіготь — стійкість до затяжок і пошкоджень від домашніх тварин;
• Зносостійкість приблизно 50 000 циклів Martindale — тривалий термін служби;
• Щільність близько 260 г/м² — оптимальний баланс м’якості й міцності;
• Підходить для диванів, крісел і модульних елементів у житлових інтер’єрах.

Рекомендації з догляду:
• Перед замовленням уточніть відтінок тканини у менеджера;
• Регулярне чищення пилососом із м’якою насадкою допоможе зберегти структуру мікровелюру;
• Для видалення плям використовуйте делікатні засоби без абразивів;
• У зонах активного користування обирайте практичні середні відтінки.`
  },

  f02: {
    title: 'Тканина Lotus',
    body: `Тканина Lotus — щільна зносостійка оббивка типу «велюр-вельвет» для диванів та м’яких меблів. 
Завдяки фактурі поверхні створює глибину кольору та витриманий характер інтер’єру.

Переваги тканини Lotus:
• Антикіготь — захист від подряпин і зачіпок;
• Зносостійкість близько 100 000 циклів Martindale — стійкість до щоденного навантаження;
• Щільність орієнтовно 325 г/м² — міцність без надлишкової жорсткості;

Рекомендації з догляду:
• Пилососьте м’якою щіткою для збереження структури ворсу;
• Свіжі плями видаляйте вологою тканиною без абразивів;
• Уникайте агресивних хімічних засобів і тривалого впливу прямого сонця;
• Для зон частого використання обирайте помірні, не надто світлі тони.`
  },

  f03: {
    title: 'Тканина Alpaca',
    body: `Тканина Alpaca — фактурне букле (bouclé) із вираженим об’ємним переплетенням. 
Підходить для диванів із глибоким сидінням, де важливі тактильність і комфорт.

Ключові характеристики:
• Тип: букле (bouclé);
• Щільність приблизно 420 г/м²;
• Зносостійкість близько 35 000 циклів Martindale;
• Категорія 5 — оптимальне співвідношення властивостей і вартості.

Переваги тканини Alpaca:
• Фактура букле створює відчуття затишку й приховує дрібні сліди експлуатації;
• Висока щільність забезпечує стабільність та довговічність;
• Добре поєднується з деревом, каменем і нейтральними відтінками інтер’єру.

Рекомендації з догляду:
• Перед замовленням уточніть фактичний відтінок тканини;
• Регулярно пилососьте з м’якою насадкою, щоб зберегти об’єм букле;
• Використовуйте м’які засоби для локального очищення без абразивів;
• У зонах активного використання надавайте перевагу практичним кольорам.`
  },

  f04: {
    title: 'Тканина Spark',
    body: `Тканина Spark — щільний меблевий велюр із просоченням «антикіготь» і водовідштовхувальним ефектом. 
Розроблена для диванів, ліжок і крісел, що зазнають щоденного навантаження.

Ключові характеристики:
• Тип: велюр, антикоготь, водовідштовхувальне покриття;
• Категорія тканини: 6;
• Висока щільність — приємна на дотик поверхня зі стабільною структурою;

Переваги тканини Spark:
• Антикіготь — захист від подряпин і затяжок;
• Щільна, зносостійка структура — підходить для активного використання;
• Водовідштовхувальне просочення спрощує догляд і продовжує термін служби;
• Категорія 6 — високий рівень якості;
• Різноманітна палітра відтінків для сучасних інтер’єрів.

Рекомендації з догляду:
• Регулярно очищайте пилососом із м’якою щіткою;
• Свіжі плями промокайте вологою тканиною без абразивів;
• Уникайте агресивних засобів і надмірного тертя;
• Для зон інтенсивного використання обирайте відтінки середньої насиченості.`
  }
};
  // === Повноекранна палiтра тканини для мобiльних (дивани) ===
  const fabricOverlayMobile = {
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

  function ensureFabricOverlayMobile(){
    if (fabricOverlayMobile.backdrop) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'sofa-fabric-overlay';

    const box = document.createElement('div');
    box.className = 'sofa-fabric-box';

    const titleEl = document.createElement('div');
    titleEl.className = 'sofa-fabric-title';

    const grid = document.createElement('div');
    grid.className = 'sofa-fabric-grid';

    box.appendChild(titleEl);
    box.appendChild(grid);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    const chooseBtn = document.createElement('button');
    chooseBtn.type = 'button';
    chooseBtn.className = 'sofa-fabric-choose';
    chooseBtn.textContent = 'Обрати';
    chooseBtn.style.display = 'none';
    document.body.appendChild(chooseBtn);

    // клик по затемнённому фону — просто закрываем
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop){
        closeFabricOverlayMobile();
      }
    });

    // клик по кнопке "Обрати"
    chooseBtn.addEventListener('click', () => {
      applyMobileFabricSelection();
    });

    fabricOverlayMobile.backdrop = backdrop;
    fabricOverlayMobile.grid = grid;
    fabricOverlayMobile.title = titleEl;
    fabricOverlayMobile.chooseBtn = chooseBtn;
  }

  function openFabricOverlayMobile({ fabric, card, samples }){
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    if (!isMobile) return;

    ensureFabricOverlayMobile();

    const o = fabricOverlayMobile;
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
      sw.className = 'sofa-fabric-swatch';
      sw.style.backgroundImage = `url('${sample.url}')`;
      sw.innerHTML = `<span class="sw-badge">${sample.name}</span>`;

      sw.addEventListener('click', () => {
        selectMobileFabricSwatch(sw, sample);
      });

      o.grid.appendChild(sw);
    });

    o.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeFabricOverlayMobile(){
    const o = fabricOverlayMobile;
    if (!o.backdrop) return;
    o.backdrop.classList.remove('is-open');
    o.chooseBtn.style.display = 'none';
    document.body.style.overflow = '';
  }

  function selectMobileFabricSwatch(el, sample){
    const o = fabricOverlayMobile;
    o.selectedSample = sample;

    if (o.selectedEl){
      o.selectedEl.classList.remove('is-selected');
    }
    o.selectedEl = el;
    el.classList.add('is-selected');

    // позиционируем круглую кнопку "Обрати" около выбранного свотча
    const rect = el.getBoundingClientRect();
    const btn = o.chooseBtn;
    btn.style.display = 'block';
    btn.style.top = `${rect.bottom + 8}px`;
    btn.style.left = `${rect.left + rect.width / 2}px`;
    btn.style.transform = 'translateX(-50%)';
  }

  function applyMobileFabricSelection(){
    const o = fabricOverlayMobile;
    if (!o.selectedSample || !o.currentCard) return;
    o.currentCard.style.backgroundImage = `url('${o.selectedSample.url}')`;
    state.fabric = o.currentFabric;
    updatePreview();
    closeFabricOverlayMobile();
  }


  // Структура папок образцов
  const fabricFolder = code => `./filter/stof/${Number(code.replace('f','')) || 1}`;

  // Проверка доступных URL для конкретного образца
  function resolveValidURL(basePath, name){
    const candidates = [
      `${basePath}/${name}.jpg`,
      `${basePath}/${name}.jpeg`,
      `${basePath}/c${name}.jpg`,
      `${basePath}/c${name}.jpeg`
    ];
    return new Promise((resolve) => {
      let settled = false;
      const onOK = (u) => {
        if (!settled){
          settled = true;
          resolve(u);
        }
      };
      candidates.forEach(u => {
        const img = new Image();
        img.onload = () => onOK(u);
        img.onerror = () => {};
        img.src = u;
      });
      setTimeout(() => { if (!settled) resolve(null); }, 2500);
    });
  }

  // ===== Модалка опису тканини =====
  const fabricModal = document.getElementById('fabricModal');
  const fabricTitle = document.getElementById('fabricTitle');
  const fabricBody  = document.getElementById('fabricBody');
  const fabricClose = document.getElementById('fabricClose');

  function openFabricModal(code){
    const data = FABRIC_INFO[code];
    if(!data) return;
    fabricTitle.textContent = data.title;
    fabricBody.textContent  = data.body;

    fabricModal.style.display = 'flex';
    fabricModal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }

  function closeFabricModal(){
    fabricModal.style.display = 'none';
    fabricModal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  if (fabricClose){
    fabricClose.addEventListener('click', closeFabricModal);
  }
  if (fabricModal){
    fabricModal.addEventListener('click', (e)=>{
      if(e.target === fabricModal) closeFabricModal();
    });
  }

  // ===== Рендер блока выбора ткани =====
  async function renderFabrics(){
    const grid = el.fabricGrid;
    grid.innerHTML = '';

    for (const [i, fab] of FABRICS.entries()){
      const col = document.createElement('div');
      col.className = 'fabric-col';

      const card = document.createElement('div');
      card.className = 'fabric-card';
      card.dataset.fabric = fab.code;

      // загрузка палитры (образцы цветов)
      const list = FABRIC_FILES[fab.code] || [];
      const urls = await Promise.all(
        list.map(n =>
          resolveValidURL(fabricFolder(fab.code), n)
            .then(u => ({ name:n, url:u }))
        )
      );
      const valid = urls.filter(x => x.url);

      if (valid.length){
        card.style.backgroundImage = `url('${valid[0].url}')`;
      } else {
        card.style.background = '#f3f4f6';
      }

      const title = document.createElement('div');
      title.className = 'fabric-title';
      title.textContent = fab.name;

      const palette = document.createElement('div');
      palette.className = 'palette';

            // раскрытие палитри по кліку на назві тканини
      title.addEventListener('click', () => {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;

        // На мобільних відкриваємо повноекранну палiтру
        if (isMobile && valid.length){
          openFabricOverlayMobile({
            fabric: fab,
            card,
            samples: valid
          });
          return;
        }

        // На десктопі залишаємо стару поведінку (палiтра всередині картки)
        const open = palette.style.display === 'grid';
        palette.style.display = open ? 'none' : 'grid';

        if (!palette.dataset.built && valid.length){
          valid.forEach(v => {
            const sw = document.createElement('button');
            sw.className = 'sw';
            sw.style.background = `url('${v.url}') center/cover no-repeat`;
            sw.innerHTML = `<span class="sw-badge">${v.name}</span>`;
            sw.onclick = () => {
              card.style.backgroundImage = `url('${v.url}')`;
              palette.style.display = 'none';
              state.fabric = fab.code;
              updatePreview();
            };
            palette.appendChild(sw);
          });
          palette.dataset.built = '1';
        }
      });

      // На мобільних по кліку на саму картку тканини теж відкриваємо повноекранну палiтру
      card.addEventListener('click', () => {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile || !valid.length) return;
        openFabricOverlayMobile({
          fabric: fab,
          card,
          samples: valid
        });
      });


      // нижняя панель:
      // слева "Про тканину" (открывает модалку),
      // справа переключатель выбора ткани
      const selectWrap = document.createElement('div');
      selectWrap.className = 'fabric-select';

      const id = `fabricToggle_${i}`;

      // текст-кнопка "Про тканину"
      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'fabric-more';
      moreBtn.textContent = 'Про тканину';
      moreBtn.setAttribute('data-fabric', fab.code);
      moreBtn.addEventListener('click', () => {
        openFabricModal(fab.code);
      });

      // переключатель выбора ткани
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'toggle';
      input.id = id;
      input.hidden = true;

      const label = document.createElement('label');
      label.className = 'switch';
      label.htmlFor = id;

      // логика выбора ткани (меняет состояние + цену)
      input.onchange = () => {
        if (input.checked){
          document
            .querySelectorAll('.fabric-select .toggle')
            .forEach(ch => { if (ch !== input) ch.checked = false; });

          document
            .querySelectorAll('.fabric-card')
            .forEach(c => c.classList.toggle('dimmed', c !== card));

          state.fabric = fab.code;
        } else {
          document
            .querySelectorAll('.fabric-select .toggle')
            .forEach(ch => { ch.checked = false; });

          document
            .querySelectorAll('.fabric-card')
            .forEach(c => c.classList.remove('dimmed'));

          state.fabric = null;
        }
        updatePrice();
      };

      // важен порядок: слева текст "Про тканину", справа свитчер
      selectWrap.append(moreBtn, input, label);

      // собираем одну колонку ткани
      card.append(title, palette);
      col.append(card, selectWrap);
      grid.append(col);
    }
  }

  // === Обработчики конфигуратора ===
  el.shape.addEventListener('change', (e) => {
    state.shape = e.target.value;
    state.chaise = 'none';
    document
      .querySelectorAll('#chaisePills .pill')
      .forEach(b => b.setAttribute('aria-pressed','false'));

    fillLengths();
    updatePreview();
    equalizePillWidths();
  });

  el.len1.addEventListener('change', (e) => {
    state.len1 = +e.target.value;
    updatePreview();
    equalizePillWidths();
  });

  el.len2.addEventListener('change', (e) => {
    state.len2 = +e.target.value;
    updatePreview();
  });

  document.getElementById('armRemove').addEventListener('click', (e) => {
    const btn = e.target.closest('button.pill');
    if (!btn) return;

    const side = btn.dataset.side;
    const next = !(btn.getAttribute('aria-pressed') === 'true');
    btn.setAttribute('aria-pressed', String(next));

    if (side === 'left') state.removeArmL = next;
    else state.removeArmR = next;

    updatePreview();
  });

  document.getElementById('chaisePills').addEventListener('click', (e) => {
    const btn = e.target.closest('button.pill');
    if (!btn) return;

    const was = btn.getAttribute('aria-pressed') === 'true';
    document
      .querySelectorAll('#chaisePills .pill')
      .forEach(b => b.setAttribute('aria-pressed','false'));

    state.chaise = was ? 'none' : btn.dataset.chaise;
    if (!was) btn.setAttribute('aria-pressed','true');

    updatePreview();
  });

  document.getElementById('depthPills').addEventListener('click', (e) => {
    const btn = e.target.closest('button.pill');
    if (!btn) return;

    document
      .querySelectorAll('#depthPills .pill')
      .forEach(b => b.setAttribute('aria-pressed','false'));

    btn.setAttribute('aria-pressed','true');
    state.depth = Number(btn.dataset.depth);

    updatePreview();
  });

  document.getElementById('sleepToggle').addEventListener('change', (e) => {
    state.sleep = e.target.checked;
    updatePreview();
  });

  // === Дополнительные товары (кресло, пуф, подушки) ===
  function toastMessage(msg){
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position:'fixed',
      bottom:'20px',
      left:'50%',
      transform:'translateX(-50%)',
      background:'#23483e',
      color:'#fff',
      padding:'10px 20px',
      borderRadius:'30px',
      fontSize:'14px',
      opacity:'0',
      transition:'opacity .3s',
      zIndex:2147483647
    });
    document.body.append(toast);
    requestAnimationFrame(() => (toast.style.opacity = '1'));
    setTimeout(() => toast.remove(), 2500);
  }

  document.querySelectorAll('.addon-ctrl').forEach(block => {
    const item = block.dataset.item;
    const qtyWrap = block.querySelector('.qty-control');
    const minusBtn = qtyWrap.querySelector('.qty-btn[data-dir="minus"]');
    const plusBtn = qtyWrap.querySelector('.qty-btn[data-dir="plus"]');
    const qtyVal = qtyWrap.querySelector('.qty-val');
    const addBtn = block.querySelector('.btn-add');

    let qty = 1;
    function sync(){ qtyVal.textContent = qty; }

    minusBtn.addEventListener('click', () => {
      if(qty>1){
        qty--;
        sync();
      }
    });

    plusBtn.addEventListener('click', () => {
      qty++;
      sync();
    });

    addBtn.addEventListener('click', () => {
      if(!state.addons[item]) state.addons[item] = {};
      state.addons[item].qty = qty;
      state.addons[item].added = true;

      const mapName = {
        'chair':'Крісло Kubo',
        'pouf':'Пуф Kubo',
        'cushion-square':'Подушка квадратна',
        'cushion-rect':'Подушка прямокутна'
      };

      const title = mapName[item] || 'Товар';
      toastMessage(`${title} × ${qty} додано`);
    });
  });

  // ===== Модалка статей =====
  const modal = document.getElementById('articleModal');
  const modalTitle = document.getElementById('articleTitle');
  const modalBody = document.getElementById('articleBody');
  const modalClose = document.getElementById('articleClose');

  const articleContent = {
    fabric: {
      title: 'Оббивка, яка живе разом із вами',
      body: 'Гарний диван — це не тільки колір. Це те, як він поводиться у буденному житті. Мікровелюр дарує мʼякість і виглядає благородно навіть у світлих тонах, при цьому легко чиститься. Фактурне букле створює відчуття тепла і робить інтерʼєр більш тактильним, майже «італійським» за настроєм. Якщо вдома є діти або тварини, звертайте увагу на тканини з підвищеною зносостійкістю: вони тримають форму, не бояться щоденного навантаження і не виглядають втомлено через рік. Ідея проста: диван не має бути річчю «для гостей». Він має бути місцем, де зручно саме вам щодня.'
    },
    color: {
      title: 'Колір дивана як мова інтерʼєру',
      body: 'Диван задає характер кімнати. Світлі відтінки — молочний, пісочний, мʼякий беж — додають повітря і візуально розширюють простір. Це відчувається особливо вдень, коли природне світло відбивається від світлої оббивки. Темні кольори — глибокий зелений, графітовий, шоколадний — працюють як акцент і створюють відчуття стабільності та впевненості. Просте правило стилістів: повторіть колір дивана ще у двох деталях — подушки, плед, ваза, картина — і простір виглядає продуманим, ніби його збирав дизайнер.'
    },
    philosophy: {
      title: 'Комфорт як щоденна звичка',
      body: 'Kubo задуманий не як «предмет інтерʼєру», а як частина вашого життя. Глибоке сидіння дозволяє не просто сісти рівно, а вмоститися так, як вам зручно насправді. Модульність означає, що диван можна підігнати під кімнату сьогодні — і змінити, коли зміниться простір, без купівлі нового. Опція розкладного механізму — це ще один рівень турботи: гість може залишитися на ніч, а вітальня при цьому не втрачає вигляду. Ми вважаємо, що справжній комфорт — це коли дім працює під вас, а не навпаки.'
    }
  };

  function openModal(key){
    const data = articleContent[key];
    if(!data) return;
    modalTitle.textContent = data.title;
    modalBody.textContent = data.body;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }

  function closeModal(){
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  document.querySelectorAll('.article-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.article;
      openModal(key);
    });
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{
    if(e.target === modal) closeModal();
  });

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  fillLengths();
  renderFabrics();
  updatePreview();
  equalizePillWidths();

  // Клик по "додати в кошик"
  el.addToCart.addEventListener('click', () => {
    toastMessage(`Додано до кошика. ${el.price.textContent}`);
  });

  // Самопроверка цен
  (function tests(){
    const bak = {...state};

    // прямий диван
    state.shape='straight'; state.len1=160; state.depth=80; state.chaise='none'; state.sleep=false; state.fabric=null;
    console.assert(computePrice()===24000, '160 см → 24 000');
    state.len1=240; console.assert(computePrice()===24000, '240 см → 24 000');
    state.len1=250; console.assert(computePrice()===24800, '250 см → 24 800');

    // кутовий диван
    state.shape='corner-right'; state.len1=240; state.len2=180; state.depth=80; state.chaise='none'; state.sleep=false; state.fabric=null;
    console.assert(computePrice()===32000, 'кут: 24 000 + 8 000 = 32 000');
    state.len2=230; console.assert(computePrice()===34400, 'кут 230: 24 000 + 8 000 + 3*800 = 34 400');

    // глибина сидіння 100
    state.shape='straight'; state.len1=240; state.depth=100; state.sleep=false; state.chaise='none'; state.fabric=null;
    console.assert(computePrice()===26000, 'прямий 240см + глибина 100 → 26 000');

    // дорожча тканина
    state.shape='straight'; state.len1=240; state.depth=80; state.fabric='f02'; state.sleep=false; state.chaise='none';
    console.assert(computePrice()===26400, 'прямий 24 000 × 1.1 (f02) → ~26 400');

    Object.assign(state, bak);
    updatePrice();
    updateChairGabarit();
    updatePoufGabarit();
  })();
});
