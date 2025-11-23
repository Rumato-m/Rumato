'use strict';
// Kornilon page logic — cleaned & aligned with UI requirements
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // --- Modals guard ---
  (function(){
    const articleModal = $('articleModal');
    const fabricModal  = $('fabricModal');
    if (articleModal){ articleModal.style.display='none'; articleModal.setAttribute('aria-hidden','true'); }
    if (fabricModal){  fabricModal.style.display='none';  fabricModal.setAttribute('aria-hidden','true'); }
    document.body.style.overflow='';
  })();

  // --- State ---
  const state = {
    depth: '100',
    width: '180',
    headboard: 'standard',
    feet: 'standard',
    fabric: null,
    addons: new Set()
  };

  // --- Elements map ---
  const el = {
    priceValue: $('priceValue'),
    previewMain: $('previewMain'),
    previewTop: $('previewTop')
  };

  // --- Price logic (simplified, same as before) ---
  const BASE_PRICE = 21500;

  function computeMainPrice(){
    let price = BASE_PRICE;

    if (state.width === '200') price += 1000;
    if (state.width === '220') price += 2000;

    if (state.headboard === 'high') price += 2500;
    if (state.headboard === 'none') price -= 1500;

    if (state.feet === 'metal') price += 1200;

    if (state.fabric) price += 1500;

    state.addons.forEach(id => {
      if (id === 'pouf') price += 5500;
      if (id === 'chair') price += 7800;
      if (id === 'cushion-rect') price += 2200;
    });

    return price;
  }

  function formatUAH(n){ return new Intl.NumberFormat('uk-UA').format(n) + ' грн.'; }
  function updateMainPrice(){ if (el.priceValue) el.priceValue.textContent = formatUAH(computeMainPrice()); }

  // --- Fabrics + колесо выбора ткани (револьвер) ---
  const FABRICS = [
    { code:'f01', name:'Тканина Lili' },
    { code:'f02', name:'Тканина Lotus' },
    { code:'f03', name:'Тканина Alpaca' },
    { code:'f04', name:'Тканина Spark' }
  ];

  const FABRIC_INFO = {
    f01:{title:'Тканина Lili',  body:'шлифованний велюр, антикіготь, антібруд.'},
    f02:{title:'Тканина Lotus', body:'Щільний велюр з антикогтем, легко чиститься.'},
    f03:{title:'Тканина Alpaca',body:'Фактурне букле, трендовий тактильний ефект.'},
    f04:{title:'Тканина Spark', body:'Преміальний велюр, стійкість до зношення.'}
  };

  const FABRIC_FOLDERS = { f01:1, f02:2, f03:3, f04:4 };

  const FABRIC_TILES = {
    f01: ['03','04','05','61','63','65','82','84','88','91','92','94','95','96','97','98','99'],
    f02: ['02','03','05','09','15','20','37','39','45','54','62','65','67','83','85','88','90','92','93','94','95','96','97','98','99','100'],
    f03: ['02','04','12','20','37','48','61','82','88','90','93','97','99'],
    f04: ['01','02','03','04','05','06','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','32','33','34','35','36','38','39','40','41']
  };

  // состояние модалки-револьвера
  const fabricWheel = {
    backdrop: null,
    box: null,
    preview: null,
    title: null,
    code: null,
    windowEl: null,
    list: null,
    items: [],
    tiles: [],
    index: 0,
    fabricCode: null,
    card: null
  };

  function applyFabricWheelSelection(){
    if (!fabricWheel.tiles.length) return;

    const num = fabricWheel.tiles[fabricWheel.index];
    const folder = FABRIC_FOLDERS[fabricWheel.fabricCode];
    const url = folder && num ? `url('./filter/stof/${folder}/${num}.jpg')` : '';

    if (fabricWheel.preview){
      fabricWheel.preview.style.backgroundImage = url;
    }
    if (fabricWheel.code){
      fabricWheel.code.textContent = num ? `Колір ${num}` : '';
    }

    if (fabricWheel.card && url){
      fabricWheel.card.style.backgroundImage = url;
      state.fabric = fabricWheel.fabricCode;
      updateMainPrice();
    }

    if (fabricWheel.items && fabricWheel.items.length){
      fabricWheel.items.forEach((item, idx) => {
        if (idx === fabricWheel.index){
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      });
    }
  }

  function closeFabricWheel(){
    if (!fabricWheel.backdrop) return;
    fabricWheel.backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function ensureFabricWheel(){
    if (fabricWheel.backdrop) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'fabric-wheel-overlay';
    backdrop.innerHTML = `
      <div class="fabric-wheel-box">
        <button type="button" class="fabric-wheel-close" aria-label="Закрити">✕</button>

        <div class="fabric-wheel-title"></div>
        <div class="fabric-wheel-preview"></div>
        <div class="fabric-wheel-code"></div>

        <div class="fabric-wheel-window">
          <div class="fabric-wheel-list"></div>
          <div class="fabric-wheel-highlight"></div>
        </div>

        <button type="button" class="fabric-wheel-choose">Вибрати</button>
      </div>
    `;
    document.body.appendChild(backdrop);

    const box = backdrop.querySelector('.fabric-wheel-box');
    fabricWheel.backdrop = backdrop;
    fabricWheel.box = box;
    fabricWheel.preview = box.querySelector('.fabric-wheel-preview');
    fabricWheel.title = box.querySelector('.fabric-wheel-title');
    fabricWheel.code = box.querySelector('.fabric-wheel-code');
    fabricWheel.windowEl = box.querySelector('.fabric-wheel-window');
    fabricWheel.list = box.querySelector('.fabric-wheel-list');

    const closeBtn = box.querySelector('.fabric-wheel-close');
    closeBtn.addEventListener('click', closeFabricWheel);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeFabricWheel();
    });

    // колесо: обработка скролла, ищем элемент ближе всего к центру
    let scrollTimer = null;
    fabricWheel.list.addEventListener('scroll', () => {
      if (!fabricWheel.items.length) return;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const rect = fabricWheel.list.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        let closestIndex = 0;
        let minDist = Infinity;
        fabricWheel.items.forEach((item, idx) => {
          const r = item.getBoundingClientRect();
          const itemCenter = r.top + r.height / 2;
          const d = Math.abs(itemCenter - centerY);
          if (d < minDist){
            minDist = d;
            closestIndex = idx;
          }
        });
        fabricWheel.index = closestIndex;
        applyFabricWheelSelection();
      }, 80);
    });

    // клик по элементу колеса — центрируем его
    fabricWheel.list.addEventListener('click', (e) => {
      const item = e.target.closest('.fabric-wheel-item');
      if (!item) return;
      const idx = Number(item.dataset.index);
      if (Number.isNaN(idx)) return;
      fabricWheel.index = idx;
      applyFabricWheelSelection();

      const listRect = fabricWheel.list.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const offset = (itemRect.top - listRect.top) - (listRect.height/2 - itemRect.height/2);
      fabricWheel.list.scrollTop += offset;
    });

    // кнопка "Вибрати" — просто закрывает модалку, выбор уже применён
    const chooseBtn = box.querySelector('.fabric-wheel-choose');
    if (chooseBtn){
      chooseBtn.addEventListener('click', () => {
        closeFabricWheel();
      });
    }
  }

  function openFabricWheel(fabricCode, card){
    ensureFabricWheel();

    const tiles = FABRIC_TILES[fabricCode] || [];
    if (!tiles.length) return;

    fabricWheel.fabricCode = fabricCode;
    fabricWheel.tiles = tiles;
    fabricWheel.card = card;

    const info = FABRIC_INFO[fabricCode];
    fabricWheel.title.textContent = info ? info.title : 'Тканина';

    // перестраиваем список
    const list = fabricWheel.list;
    list.innerHTML = '';
    fabricWheel.items = tiles.map((n, idx) => {
      const item = document.createElement('div');
      item.className = 'fabric-wheel-item';
      item.dataset.index = String(idx);
      item.dataset.color = n;
      item.textContent = n;
      const folder = FABRIC_FOLDERS[fabricCode];
      if (folder){
        item.style.backgroundImage = `url('./filter/stof/${folder}/${n}.jpg')`;
      }
      list.appendChild(item);
      return item;
    });

    // выбираем стартовый индекс: если у карты уже есть цвет — берём его, иначе первый
    let startIndex = 0;
    if (card && card.style.backgroundImage){
      const match = card.style.backgroundImage.match(/\/([0-9]+)\.jpg/);
      if (match){
        const currentNum = match[1];
        const foundIndex = tiles.indexOf(currentNum);
        if (foundIndex >= 0) startIndex = foundIndex;
      }
    }
    fabricWheel.index = startIndex;
    applyFabricWheelSelection();

    // скроллим так, чтобы выбранный элемент оказался по центру окна
    requestAnimationFrame(() => {
      const selected = fabricWheel.items[startIndex];
      if (!selected) return;
      const listRect = fabricWheel.list.getBoundingClientRect();
      const itemRect = selected.getBoundingClientRect();
      const offset = (itemRect.top - listRect.top) - (listRect.height/2 - itemRect.height/2);
      fabricWheel.list.scrollTop += offset;
    });

    fabricWheel.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  (function renderFabrics(){
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
      const firstTile = (FABRIC_TILES[fab.code] || [])[0];
      if (folder && firstTile){
        card.style.backgroundImage = `url('./filter/stof/${folder}/${firstTile}.jpg')`;
      }

      const title = document.createElement('div');
      title.className = 'fabric-title';
      title.textContent = fab.name;

      const palette = document.createElement('div');
      palette.className = 'palette';

      const buildPalette = () => {
        if (palette.childElementCount) return;
        (FABRIC_TILES[fab.code] || []).forEach(n => {
          const sw = document.createElement('button');
          sw.className = 'sw';
          sw.style.background = `url('./filter/stof/${FABRIC_FOLDERS[fab.code]}/${n}.jpg') center/cover no-repeat`;
          sw.innerHTML = `<span class="sw-badge">${n}</span>`;
          sw.onclick = () => {
            card.style.backgroundImage = `url('./filter/stof/${FABRIC_FOLDERS[fab.code]}/${n}.jpg')`;
            state.fabric = fab.code;
            updateMainPrice();
            palette.style.display = 'none';
          };
          palette.appendChild(sw);
        });
      };

      const handleTitleClick = () => {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        if (isMobile){
          openFabricWheel(fab.code, card);
        } else {
          buildPalette();
          palette.style.display = (palette.style.display === 'grid') ? 'none' : 'grid';
        }
      };

      title.addEventListener('click', handleTitleClick);

      // тап по превью (по всей карте) на мобиле — тоже открывает колесо
      card.addEventListener('click', (e) => {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;
        if (e.target.closest('.fabric-select')) return;
        openFabricWheel(fab.code, card);
      });

      // нижняя полоска: слева "Про тканину", справа переключатель
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
        if (input.checked){
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
  const fModal=$('fabricModal'), fTitle=$('fabricTitle'), fBody=$('fabricBody'), fClose=$('fabricClose');
  function openFabricModal(code){
    const d=FABRIC_INFO[code]; if(!d||!fModal) return;
    fTitle.textContent=d.title; fBody.textContent=d.body;
    fModal.style.display='flex'; fModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function closeFabricModal(){ if(!fModal) return; fModal.style.display='none'; fModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  fClose?.addEventListener('click', closeFabricModal);
  fModal?.addEventListener('click', e=>{ if(e.target===fModal) closeFabricModal(); });

  // --- Filters (примерная логика; не трогаю, чтобы не ломать текущий вид) ---
  function updatePreview(){
    if (!el.previewMain || !el.previewTop) return;
    const depth = state.depth;
    const width = state.width;
    el.previewMain.src = `./images/kubo/${width}-${depth}.png`;
    el.previewTop.src = `./images/kubo/${width}-${depth}-top.png`;
  }

  ['depthSelect','widthSelect','headboardSelect','feetSelect'].forEach(id=>{
    const node=$(id); if(!node) return;
    node.addEventListener('change', e=>{
      const v=e.target.value;
      if(id==='depthSelect') state.depth=v;
      if(id==='widthSelect') state.width=v;
      if(id==='headboardSelect') state.headboard=v;
      if(id==='feetSelect') state.feet=v;
      updatePreview(); updateMainPrice();
    });
  });

  // --- Addons handlers (оставляю, как были) ---
  document.querySelectorAll('[data-addon]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id=btn.dataset.addon;
      if(state.addons.has(id)){
        state.addons.delete(id);
        btn.classList.remove('is-active');
      } else {
        state.addons.add(id);
        btn.classList.add('is-active');
      }
      updateMainPrice();
    });
  });

  updatePreview();
  updateMainPrice();

  // --- Articles modal (как было) ---
  const aModal=$('articleModal');
  const aTitle=$('articleTitle');
  const aBody=$('articleBody');
  const aClose=$('articleClose');

  const ARTICLES = {
    'how-to-care':{
      title:'Догляд за тканиною ліжка',
      body:'Використовуйте м’яку щітку або пилосос з насадкою для меблів.\nУникайте агресивних хімічних засобів.\nПри локальних забрудненнях — промокнути серветкою, не терти.'
    },
    'delivery':{
      title:'Доставка та складання',
      body:'Доставка по Києву та області — від 800 грн.\nМожливе занесення в квартиру та монтаж.\nПо Україні — відправка транспортними службами на палеті.'
    },
    'mattress':{
      title:'Матрац та наповнення',
      body:'Рекомендуємо матрац висотою 22–25 см.\nЛіжко підходить для більшості стандартних матраців.\nОснова — ламелі з бука, витримують навантаження до 180 кг на спальне місце.'
    }
  };

  function openArticle(id){
    if (!aModal || !ARTICLES[id]) return;
    const d = ARTICLES[id];
    aTitle.textContent = d.title;
    aBody.textContent = d.body;
    aModal.style.display = 'flex';
    aModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeArticle(){
    if (!aModal) return;
    aModal.style.display = 'none';
    aModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e=>{
    const b=e.target.closest('.article-link[data-article]'); if(!b) return; openArticle(b.dataset.article);
  });
  aClose?.addEventListener('click', closeArticle);
  aModal?.addEventListener('click', e=>{ if(e.target===aModal) closeArticle(); });

  // Add-to-cart toast (оставил как было)
  $('addToCart')?.addEventListener('click', ()=>{
    const p = el.priceValue ? el.priceValue.textContent : '';
    const t = document.createElement('div');
    t.textContent = `Додано до кошика. ${p}`;
    Object.assign(t.style,{
      position:'fixed',
      bottom:'20px',
      left:'20px',
      padding:'10px 16px',
      borderRadius:'999px',
      background:'rgba(0,0,0,0.85)',
      color:'#fff',
      fontSize:'13px',
      zIndex:2147483647,
      opacity:'0',
      transition:'opacity .25s'
    });
    document.body.append(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; });
    setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),250); },2000);
  });
});
