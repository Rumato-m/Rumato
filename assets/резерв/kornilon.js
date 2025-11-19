document.addEventListener('DOMContentLoaded', () => {

// === Modal init guard: ensure all modals are closed and body is scrollable ===
(function modalInitGuard(){
  try{
    const articleModal = document.getElementById('articleModal');
    const fabricModal  = document.getElementById('fabricModal');
    if (articleModal){ articleModal.style.display = 'none'; articleModal.setAttribute('aria-hidden','true'); }
    if (fabricModal){ fabricModal.style.display  = 'none'; fabricModal.setAttribute('aria-hidden','true'); }
    document.body.style.overflow = '';
  }catch(e){ /* no-op */ }
})();

  const $ = id => document.getElementById(id);

  // ========= Constants =========
  const SOFA_BASE = 'images/Sofas/Kornilon';

  const PLACEHOLDER_IMG = (() => {
    const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#e5e7eb'/>
        <stop offset='100%' stop-color='#f3f4f6'/>
      </linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <rect x='140' y='140' width='920' height='120' rx='24' ry='24' fill='#d1d5db'/>
      <rect x='820' y='180' width='260' height='80' rx='24' ry='24' fill='#cbd5e1'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-family='Arial' font-size='20'>
        Попередній перегляд ліжка Kornilon
      </text>
    </svg>`);
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  })();

  // ========= State =========
  const state = {
    shape: 'straight',
    len1: 200,
    len2: 200,
    depth: 80,
    removeArmL: false,
    removeArmR: false,
    chaise: 'none',
    sleep: false,
    fabric: null,
    addons: {},
    sleepplace: '160x200',
    lift: false,
    border: 20
  };

  // ========= Elements =========
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

  const previewLeft  = $('filterPreviewLeft');
  const previewRight = $('filterPreviewRight');

  // ========= Utils =========
  function fillSelect(target, start, end, step, current){
    if (!target) return;
    target.innerHTML = '';
    for (let w = start; w <= end; w += step){
      const opt = new Option(`${w} см`, w, false, w === current);
      target.add(opt);
    }
  }

  function fillLengths(){
    if (!el.len1 || !el.len2) return;
    fillSelect(el.len1, 160, 400, 10, state.len1);
    fillSelect(el.len2, 180, 360, 10, state.len2);
    const isCorner = state.shape !== 'straight';
    if (el.filtersRoot) el.filtersRoot.classList.toggle('is-corner', isCorner);
  }

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

  // ========= File name builders =========
  function buildBaseName(){
    const raw = state.sleepplace || '160x200';
    const m = String(raw).match(/^(\d{3})/);
    const sleepW = m ? m[1] : '160';
    const border2 = String(state.border).padStart(2, '0');
    return `${sleepW}${border2}`;
  }
  function buildFilename(){
    return `./${SOFA_BASE}/${buildBaseName()}.png`;
  }
  function buildFilenameTop(){
    return `./${SOFA_BASE}/${buildBaseName()}V.png`;
  }

  // ========= Addons gabarits =========
  function updateChairGabarit(){
    if(!el.chairSize) return;
    el.chairSize.textContent = (state.depth === 100) ? '140×120' : '120×120';
  }
  function updatePoufGabarit(){
    if(!el.poufSize) return;
    el.poufSize.textContent = (state.depth === 100) ? '100×100' : '80×80';
  }

  // ========= Price =========
  function computePrice(){
    const len1 = +state.len1 || 0;
    const len2 = +state.len2 || 0;
    const isCorner = state.shape !== 'straight';

    let price = 24000;
    if (len1 > 240) price += ((len1 - 240) / 10) * 800;
    if (isCorner){
      let cornerAddon = 8000;
      if (len2 > 200) cornerAddon += ((len2 - 200) / 10) * 800;
      price += cornerAddon;
    }
    if (state.chaise !== 'none') price += 2000;
    if (state.sleep) price += 2000;
    if (state.depth === 100) price += 2000;
    if (["f02","f03"].includes(state.fabric)) price *= 1.1;
    if (state.lift) price += 1500;
    if (state.border === 10) price += 1000;
    if (state.border === 5)  price -= 1000;
    return Math.round(price);
  }
  function formatPrice(n){
    return new Intl.NumberFormat('uk-UA').format(n) + ' грн.';
  }
  function updatePrice(){
    if (el.price) el.price.textContent = formatPrice(computePrice());
  }

  // ========= Debounced preview update =========
  let previewTimer;
  function updatePreviewDebounced(){
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 150);
  }

  function updatePreview(){
    const urlLeft  = buildFilename();
    const urlRight = buildFilenameTop();

    // single legacy preview
    if (el && el.preview){
      const testSingle = new Image();
      testSingle.onload  = () => { el.preview.src = urlLeft; };
      testSingle.onerror = () => { el.preview.src = PLACEHOLDER_IMG; };
      testSingle.src = urlLeft;
    }

    if (previewLeft){
      const testL = new Image();
      testL.onload  = () => { previewLeft.src = urlLeft; };
      testL.onerror = () => { previewLeft.src = PLACEHOLDER_IMG; };
      testL.src = urlLeft;
    }
    if (previewRight){
      const testR = new Image();
      testR.onload  = () => { previewRight.src = urlRight; };
      testR.onerror = () => { previewRight.src = PLACEHOLDER_IMG; };
      testR.src = urlRight;
    }

    updatePrice();
    updateChairGabarit();
    updatePoufGabarit();
  }

  // ========= Fabrics =========
  const FABRICS = [
    { code: 'f01', name: 'Тканина Lili' },
    { code: 'f02', name: 'Тканина Lotus' },
    { code: 'f03', name: 'Тканина Alpaca' },
    { code: 'f04', name: 'Тканина Spark' }
  ];
  const FABRIC_FILES = {
    f01: ['03','04','05','61','63','65','82','84','88','91','92','94','95','96','97','98','99'],
    f02: ['02','03','05','09','15','20','37','39','45','54','62','65','67','83','85','88','90','92','93','94','95','96','97','98','99','100'],
    f03: ['02','04','12','20','37','48','61','82','88','90','93','97','99'],
    f04: ['01','02','03','04','05','06','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','32','33','34','35','36','38','39','40','41']
  };
  const FABRIC_INFO = {
    f01: { title: 'Тканина Lili',  body:'М’який мікровелюр…' },
    f02: { title: 'Тканина Lotus', body:'Щільна зносостійка…' },
    f03: { title: 'Тканина Alpaca',body:'Фактурне букле…' },
    f04: { title: 'Тканина Spark', body:'Велюр з антикогтем…' }
  };
  const fabricFolder = code => `./filter/stof/${Number(code.replace('f','')) || 1}`;

  const urlCache = new Map();
  function resolveValidURL(basePath, name){
    const key = `${basePath}/${name}`;
    if (urlCache.has(key)) return Promise.resolve(urlCache.get(key));
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
          urlCache.set(key, u);
          resolve(u);
        }
      };
      candidates.forEach(u => {
        const img = new Image();
        img.onload = () => onOK(u);
        img.onerror = () => {};
        img.src = u;
      });
      setTimeout(() => { if (!settled) resolve(null); }, 2000);
    });
  }

  // Fabric modal
  const fabricModal = $('fabricModal');
  const fabricTitle = $('fabricTitle');
  const fabricBody  = $('fabricBody');
  const fabricClose = $('fabricClose');

  function openFabricModal(code){
    const data = FABRIC_INFO[code];
    if(!data) return;
    if (fabricTitle) fabricTitle.textContent = data.title;
    if (fabricBody)  fabricBody.textContent  = data.body;
    if (fabricModal){
      fabricModal.style.display = 'flex';
      fabricModal.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
    }
  }
  function closeFabricModal(){
    if (fabricModal){
      fabricModal.style.display = 'none';
      fabricModal.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    }
  }
  fabricClose?.addEventListener('click', closeFabricModal);
  fabricModal?.addEventListener('click', (e)=>{ if(e.target === fabricModal) closeFabricModal(); });

  // Render fabrics
  async function renderFabrics(){
    const grid = el.fabricGrid;
    if (!grid) return;
    grid.innerHTML = '';

    for (const [i, fab] of FABRICS.entries()){
      const col = document.createElement('div');
      col.className = 'fabric-col';

      const card = document.createElement('div');
      card.className = 'fabric-card';
      card.dataset.fabric = fab.code;

      const list = FABRIC_FILES[fab.code] || [];
      const urls = await Promise.all(
        list.map(n => resolveValidURL(fabricFolder(fab.code), n).then(u => ({ name:n, url:u })))
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

      title.addEventListener('click', () => {
        const open = palette.style.display === 'grid';
        palette.style.display = open ? 'none' : 'grid';

        if (!palette.dataset.built){
          const source = valid.length ? valid : (FABRIC_FILES[fab.code] || []).map(n => ({name:n, url:null}));
          source.forEach(v => {
            const sw = document.createElement('button');
            sw.className = 'sw';
            if (v.url){
              sw.style.background = `url('${v.url}') center/cover no-repeat`;
            } else {
              sw.style.background = '#e5e7eb';
            }
            sw.innerHTML = `<span class="sw-badge">${v.name || '—'}</span>`;
            sw.onclick = () => {
              if (v.url) card.style.backgroundImage = `url('${v.url}')`;
              palette.style.display = 'none';
              state.fabric = fab.code;
              updatePreviewDebounced();
            };
            palette.appendChild(sw);
          });
          palette.dataset.built = '1';
        }
      });

      const selectWrap = document.createElement('div');
      selectWrap.className = 'fabric-select';

      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'fabric-more';
      moreBtn.textContent = 'Про тканину';
      moreBtn.setAttribute('data-fabric', fab.code);
      moreBtn.addEventListener('click', () => openFabricModal(fab.code));

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'toggle';
      input.id = `fabricToggle_${i}`;
      input.hidden = true;

      const label = document.createElement('label');
      label.className = 'switch';
      label.htmlFor = input.id;

      input.onchange = () => {
        if (input.checked){
          document.querySelectorAll('.fabric-select .toggle').forEach(ch => { if (ch !== input) ch.checked = false; });
          document.querySelectorAll('.fabric-card').forEach(c => c.classList.toggle('dimmed', c !== card));
          state.fabric = fab.code;
        } else {
          document.querySelectorAll('.fabric-select .toggle').forEach(ch => { ch.checked = false; });
          document.querySelectorAll('.fabric-card').forEach(c => c.classList.remove('dimmed'));
          state.fabric = null;
        }
        updatePrice();
      };

      selectWrap.append(moreBtn, input, label);
      card.append(title, palette);
      col.append(card, selectWrap);
      grid.append(col);
    }
  }

  // ========= Event handlers =========
  if (el.shape){
    el.shape.addEventListener('change', (e) => {
      state.shape = e.target.value;
      state.chaise = 'none';
      const pills = document.querySelectorAll('#chaisePills .pill');
      pills.forEach(b => b.setAttribute('aria-pressed','false'));
      fillLengths();
      updatePreviewDebounced();
      equalizePillWidths();
    });
  }
  el.len1?.addEventListener('change', (e) => { state.len1 = +e.target.value; updatePreviewDebounced(); equalizePillWidths(); });
  el.len2?.addEventListener('change', (e) => { state.len2 = +e.target.value; updatePreviewDebounced(); });

  const armRemove = $('armRemove');
  armRemove?.addEventListener('click', (e) => {
    const btn = e.target.closest('button.pill');
    if (!btn) return;
    const side = btn.dataset.side;
    const next = !(btn.getAttribute('aria-pressed') === 'true');
    btn.setAttribute('aria-pressed', String(next));
    if (side === 'left') state.removeArmL = next; else state.removeArmR = next;
    updatePreviewDebounced();
  });

  const chaisePills = $('chaisePills');
  chaisePills?.addEventListener('click', (e) => {
    const btn = e.target.closest('button.pill'); if (!btn) return;
    const was = btn.getAttribute('aria-pressed') === 'true';
    chaisePills.querySelectorAll('.pill').forEach(b => b.setAttribute('aria-pressed','false'));
    state.chaise = was ? 'none' : btn.dataset.chaise;
    if (!was) btn.setAttribute('aria-pressed','true');
    updatePreviewDebounced();
  });

  const depthPills = $('depthPills');
  depthPills?.addEventListener('click', (e) => {
    const btn = e.target.closest('button.pill'); if (!btn) return;
    depthPills.querySelectorAll('.pill').forEach(b => b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    state.depth = Number(btn.dataset.depth);
    updatePreviewDebounced();
  });

  const sleepToggle = $('sleepToggle');
  sleepToggle?.addEventListener('change', (e) => { state.sleep = e.target.checked; updatePreviewDebounced(); });

  const sleepSizeEl = $('sleepSize');
  const borderEl    = $('borderSelect');
  const liftEl      = $('liftSelect');
  sleepSizeEl?.addEventListener('change', (e)=>{ state.sleepplace = e.target.value; updatePreviewDebounced(); });
  borderEl?.addEventListener('change', (e)=>{ state.border = Number(e.target.value); updatePreviewDebounced(); });
  liftEl?.addEventListener('change', (e)=>{ state.lift = (e.target.value === 'on'); updatePreviewDebounced(); });

  // ========= Addons =========
  function toastMessage(msg){
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
      background:'#23483e', color:'#fff', padding:'10px 20px', borderRadius:'30px',
      fontSize:'14px', opacity:'0', transition:'opacity .3s', zIndex:2147483647
    });
    document.body.append(toast);
    requestAnimationFrame(() => (toast.style.opacity = '1'));
    setTimeout(() => toast.remove(), 2500);
  }

  document.querySelectorAll('.addon-ctrl').forEach(block => {
    const item = block.dataset.item;
    const qtyWrap = block.querySelector('.qty-control');
    if (!qtyWrap) return;
    const minusBtn = qtyWrap.querySelector('.qty-btn[data-dir="minus"]');
    const plusBtn  = qtyWrap.querySelector('.qty-btn[data-dir="plus"]');
    const qtyVal   = qtyWrap.querySelector('.qty-val');
    const addBtn   = block.querySelector('.btn-add');

    let qty = 1;
    const sync = () => { if (qtyVal) qtyVal.textContent = qty; };
    sync();
    minusBtn?.addEventListener('click', () => { if(qty>1){ qty--; sync(); } });
    plusBtn?.addEventListener('click', () => { qty++; sync(); });
    addBtn?.addEventListener('click', () => {
      if(!state.addons[item]) state.addons[item] = {};
      state.addons[item].qty = qty;
      state.addons[item].added = true;
      const mapName = {
        'chair':'Крісло Kornilon','pouf':'Пуф Kornilon','cushion-square':'Подушка квадратна','cushion-rect':'Подушка прямокутна'
      };
      toastMessage(`${mapName[item] || 'Товар'} × ${qty} додано`);
    });
  });

  // ========= Article modal =========
  const modal = $('articleModal');
  const modalTitle = $('articleTitle');
  const modalBody = $('articleBody');
  const modalClose = $('articleClose');

  const articleContent = {
    fabric: { title: 'Оббивка, яка живе разом із вами', body: '...' },
    color: { title: 'Колір ліжка як мова інтерʼєру', body: '...' },
    philosophy: { title: 'Комфорт як щоденна звичка', body: '...' }
  };

  function openModal(key){
    const data = articleContent[key];
    if(!data) return;
    modalTitle && (modalTitle.textContent = data.title);
    modalBody  && (modalBody.textContent  = data.body);
    if (modal){
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
    }
  }
  function closeModal(){
    if (modal){
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    }
  }
  document.querySelectorAll('.article-link').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.article));
  });
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });

  // ========= Init =========
  fillLengths();
  renderFabrics();
  updatePreview();
  equalizePillWidths();

  el.addToCart?.addEventListener('click', () => {
    const p = el.price ? el.price.textContent : '';
    const t = document.createElement('div');
    t.textContent = `Додано до кошика. ${p}`;
    Object.assign(t.style,{
      position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
      background:'#23483e', color:'#fff', padding:'10px 20px', borderRadius:'30px',
      fontSize:'14px', opacity:'0', transition:'opacity .3s', zIndex:2147483647
    });
    document.body.append(t);
    requestAnimationFrame(()=>t.style.opacity='1');
    setTimeout(()=>t.remove(),2500);
  });
});
// === Характеристики під ціною в картках (використовує існуючий article-modal) ===

// 1) Контент характеристик (за потреби відредагуй цифри)
const SPEC_TEXT = {
  chair: {
    title: "Технічні параметри матраца Lotos Guru",
    body: [
      "Висота - 25 см",
      "Жорсткість - 5/4",
      "Навантаження - Необмежене",
      "Тип матраца - Пружинний",
      "Тип чохла - Незнімний",
      "Тип пружинного блоку - Premium PS 7-zone hard"
    ].join("\n")
  },
  pouf: {
    title: "Пуф Kornilon — характеристики",
    body: [
      "Габарит: 80×80 см",
      "Висота: ~45 см",
      "Наповнення: HR-піна середньої/м’якої жорсткості",
      "Опції: з’ємний чохол, ковзани/ніжки",
      "Призначення: як окремий елемент або модуль до ліжка"
    ].join("\n")
  },
  "cushion-square": {
    title: "Подушка квадратна — характеристики",
    body: [
      "Розмір: ~60×60 см",
      "Наповнення: силіконізоване волокно",
      "Чохол: з’ємний, машинне прання (режим делікатний)",
      "Опції: кант/без канта, декоративні строчки"
    ].join("\n")
  },
  "cushion-rect": {
    title: "Подушка прямокутна — характеристики",
    body: [
      "Розмір: ~35×90 см",
      "Наповнення: силіконізоване волокно",
      "Чохол: з’ємний, блискавка знизу",
      "Опції: індивідуальний розмір під замовлення"
    ].join("\n")
  }
};

// 2) Додаємо кнопку під ціною у кожній картці
document.querySelectorAll(".addon-card").forEach(card => {
  const body = card.querySelector(".addon-body");
  if (!body || body.querySelector(".spec-link")) return;

  const specBtn = document.createElement("button");
  specBtn.className = "article-link spec-link"; // стиль як у нижніх статей
  specBtn.textContent = "Характеристики";
  specBtn.type = "button";
  // беремо ідентифікатор з data-item тієї ж картки
  const key = card.getAttribute("data-item");
  if (key) specBtn.dataset.spec = key;

  body.appendChild(specBtn);
});

// 3) Обробник відкриття модалки (використовує #articleModal)
(function wireSpecModal(){
  const modal = document.getElementById("articleModal");
  const titleEl = document.getElementById("articleTitle");
  const bodyEl = document.getElementById("articleBody");
  const closeBtn = document.getElementById("articleClose");

  if (!modal || !titleEl || !bodyEl) return;

  const openModal = (title, body) => {
    titleEl.textContent = title || "Характеристики";
    bodyEl.textContent = body || "Дані уточнюються.";
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
    // фокус на закриття для доступності
    closeBtn && closeBtn.focus();
  };

  const closeModal = () => {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".spec-link");
    if (btn) {
      const key = btn.dataset.spec;
      const spec = SPEC_TEXT[key] || { title: "Характеристики", body: "Дані уточнюються." };
      openModal(spec.title, spec.body);
    }
    if (e.target.id === "articleClose" || e.target === modal) {
      closeModal();
    }
  });

  // ESC для закриття
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") !== "true") {
      closeModal();
    }
  });
})();
