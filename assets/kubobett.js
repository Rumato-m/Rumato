'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  (function(){
    const articleModal = $('articleModal');
    const fabricModal  = $('fabricModal');
    if (articleModal){ articleModal.style.display='none'; articleModal.setAttribute('aria-hidden','true'); }
    if (fabricModal){  fabricModal.style.display='none';  fabricModal.setAttribute('aria-hidden','true'); }
    document.body.style.overflow='';
  })();

  const state = { sleepplace:'160x200', border:20, lift:false, fabric:null };

  const el = {
  sleepSize: $('sleepSize'),
  borderSelect: $('borderSelect'),
  liftSelect: $('liftSelect'),
  priceValue: $('priceValue'),
  previewLeft: $('filterPreviewLeft'),
  previewRight: $('filterPreviewRight'),
  addToCart: $('addToCart'),
  chairSize: $('chairSize'),
  poufSize: $('poufSize'),
  fabricGrid: $('fabricGrid')   // ← ДОБАВИЛИ ЭТО
};


  // ТОЛЬКО папка заменена:
  const SOFA_BASE = 'images/Sofas/kubobett';
  const TRY_EXTS  = ['png','jpg','jpeg','PNG','JPG','JPEG'];

  function buildCode(){
    const m = state.sleepplace.match(/^(\d{3})/);
    const w = m ? m[1] : '160';
    const b = String(state.border).padStart(2,'0');
    return `${w}${b}`; // 16020, 18020, 20020...
  }
  function pickFirst(urls, img){
    let i=0;
    const probe=()=>{
      if(i>=urls.length){ return; }
      const u=urls[i++], im=new Image();
      im.onload=()=>{ img.src=u; };
      im.onerror=probe;
      im.src=u;
    };
    probe();
  }
  function updatePreviews(){
    const code = buildCode();
    const left  = TRY_EXTS.map(e=>`./${SOFA_BASE}/${code}.${e}`);
    const right = TRY_EXTS.map(e=>`./${SOFA_BASE}/${code}V.${e}`);
    if (el.previewLeft)  pickFirst(left,  el.previewLeft);
    if (el.previewRight) pickFirst(right, el.previewRight);
  }

  function computeMainPrice(){
    const map = {'160x200':21500,'180x200':22500,'200x200':25000};
    let p = map[state.sleepplace] ?? 21500;
    if (state.lift) p += 2000;
    if (['f02','f03','f04'].includes(state.fabric)) p = Math.round(p*1.10);
    return p;
  }
  function formatUAH(n){ return new Intl.NumberFormat('uk-UA').format(n) + ' грн.'; }
  function updateMainPrice(){ if (el.priceValue) el.priceValue.textContent = formatUAH(computeMainPrice()); }

  // Ткани — пути НЕ трогаем
  const FABRICS = [
    { code:'f01', name:'Тканина Lili' },
    { code:'f02', name:'Тканина Lotus' },
    { code:'f03', name:'Тканина Alpaca' },
    { code:'f04', name:'Тканина Spark' }
  ];
  const FABRIC_INFO = {
    f01:{title:'Тканина Lili',  body:'Шлифований велюр, антикіготь, антібруд'},
    f02:{title:'Тканина Lotus', body:'Щільний велюр з антикогтем, легко чиститься.'},
    f03:{title:'Тканина Alpaca',body:'Фактурне букле, трендовий тактильний ефект.'},
    f04:{title:'Тканина Spark', body:'Преміальний велюр, стійкість до зношення.'}
  };
    // ===== Варіанти зразків (як на диванах Kubo) =====
  const FABRIC_FILES = {
    f01: ['03','04','05','61','63','65','82','84','88','91','92','94','95','96','97','98','99'],
    f02: ['02','03','05','09','15','20','37','39','45','54','62','65','67','83','85','88','90','92','93','94','95','96','97','98','99','100'],
    f03: ['02','04','12','20','37','48','61','82','88','90','93','97','99'],
    f04: ['01','02','03','04','05','06','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','32','33','34','35','36','38','39','40','41']
  };

  // Папка з образцями для кожної тканини
  const fabricFolder = code => `./filter/stof/${Number(code.replace('f','')) || 1}`;

  // Перевірка доступних URL для конкретного зразка
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

  // ===== Рендер блока выбора тканини =====
async function renderFabrics(){
  const grid = el.fabricGrid;
  grid.innerHTML = '';

  for (const [i, fab] of FABRICS.entries()){
    const col = document.createElement('div');
    col.className = 'fabric-col';

    const card = document.createElement('div');
    card.className = 'fabric-card';
    card.dataset.fabric = fab.code;

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

    title.addEventListener('click', () => {
      const open = palette.style.display === 'grid';
      palette.style.display = open ? 'none' : 'grid';

      if (!palette.dataset.built){
        valid.forEach(({name, url}) => {
          const sw = document.createElement('button');
          sw.className = 'sw';
          sw.style.background = `url('${url}') center/cover no-repeat`;
          sw.innerHTML = `<span class="sw-badge">${name}</span>`;
          sw.onclick = () => {
            card.style.backgroundImage = `url('${url}')`;
            state.fabric = fab.code;
            updateMainPrice();
            palette.style.display='none';
          };
          palette.appendChild(sw);
        });
        palette.dataset.built = '1';
      }
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
      if (input.checked) state.fabric = fab.code;
      else state.fabric = null;
      updateMainPrice();
    };

    sel.append(more, input, label);
    card.append(title, palette);
    col.append(card, sel);
    grid.append(col);
  }
}

renderFabrics();


  const fModal=$('fabricModal'), fTitle=$('fabricTitle'), fBody=$('fabricBody'), fClose=$('fabricClose');
  function openFabricModal(code){
    const d=FABRIC_INFO[code]; if(!d||!fModal) return;
    fTitle.textContent=d.title; fBody.textContent=d.body;
    fModal.style.display='flex'; fModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function closeFabricModal(){ if(!fModal) return; fModal.style.display='none'; fModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  fClose?.addEventListener('click', closeFabricModal);
  fModal?.addEventListener('click', e=>{ if(e.target===fModal) closeFabricModal(); });

  // Тексты статей без упоминания модели (убрали «задвоєння»)
  const aModal=$('articleModal'), aTitle=$('articleTitle'), aBody=$('articleBody'), aClose=$('articleClose');
  const articleContent={
    fabric:{ title:'Як обрати тканину для ліжка',
      body:`Вибирайте тканину за щільністю, фактурою та зносостійкістю. Для сімей і тварин — велюр з антикогтем або щільне букле.`},
    color:{ title:'Колір ліжка як мова інтер’єру',
      body:`Світлі тони додають легкості, темні — камерності та глибини. Орієнтуйтесь на освітлення й текстиль кімнати.`},
    philosophy:{ title:'Комфорт щодня',
      body:`Міцний каркас, тиха конструкція, зручна висота узголів’я. Розмір, тканина та опції — під ваш простір.`}
  };
  function openArticle(key){
    const d=articleContent[key]; if(!d||!aModal) return;
    aTitle.textContent=d.title; aBody.textContent=d.body;
    aModal.style.display='flex'; aModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function closeArticle(){ if(!aModal) return; aModal.style.display='none'; aModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  document.addEventListener('click', e=>{
    const b=e.target.closest('.article-link[data-article]'); if(!b) return; openArticle(b.dataset.article);
  });
  aClose?.addEventListener('click', closeArticle);
  aModal?.addEventListener('click', e=>{ if(e.target===aModal) closeArticle(); });

  const SPEC_TEXT={
    chair:{ title:'Технічні параметри матраца Lotos Guru',
      body:['Висота — 25 см','Жорсткість — 5/4','Навантаження — не обмежене','Тип — Пружинний','Чохол — Незнімний','Пружинний блок — Premium PS 7-zone hard'].join('\n')},
    pouf:{ title:'Матрас Лотос-Етерно — характеристики',
      body:['Навантаження 180 кг','Жорсткість — 4/4','Наповнення — Ортопедична піна багатошаровий','Чохол — незмінний','Висота -25 см.'].join('\n')},
    'cushion-rect':{ title:'Пуф',
      body:['Габарит — 120×42','Наповнення — HR-пінa','Опції — індивідуальна тканина','Призначення — модуль до ліжка або окремо'].join('\n')}
  };
  document.addEventListener('click', e=>{
    const b=e.target.closest('.spec-link[data-spec]'); if(!b) return;
    const spec=SPEC_TEXT[b.dataset.spec] || {title:'Характеристики',body:'Дані уточнюються.'};
    aTitle.textContent=spec.title; aBody.textContent=spec.body;
    aModal.style.display='flex'; aModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  });

  const ADDON_PRICE = {'160x200':19000,'180x200':23000,'200x200':25000};
  function updateAddonsBySleep(){
    const g = state.sleepplace.replace('x','×');
    if (el.chairSize) el.chairSize.textContent = g;
    if (el.poufSize)  el.poufSize.textContent  = g;
    document.querySelectorAll('.addon-price-val[data-price-for]').forEach(span=>{
      span.textContent = new Intl.NumberFormat('uk-UA').format(ADDON_PRICE[state.sleepplace] || 10000) + ' ₴';
    });
  }

  el.sleepSize?.addEventListener('change', e=>{
    state.sleepplace = e.target.value;
    updatePreviews();
    updateMainPrice();
    updateAddonsBySleep();
  });
  $('borderSelect')?.addEventListener('change', e=>{
    state.border = Number(e.target.value)||20;
    updatePreviews();
  });
  el.liftSelect?.addEventListener('change', e=>{
    state.lift = (e.target.value==='on');
    updateMainPrice();
  });

  updatePreviews();
  updateMainPrice();
  updateAddonsBySleep();

  $('addToCart')?.addEventListener('click', ()=>{
    const p = el.priceValue ? el.priceValue.textContent : '';
    const t = document.createElement('div');
    t.textContent = `Додано до кошика. ${p}`;
    Object.assign(t.style,{position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',background:'#23483e',color:'#fff',padding:'10px 20px',borderRadius:'30px',fontSize:'14px',opacity:'0',transition:'opacity .3s',zIndex:2147483647});
    document.body.append(t); requestAnimationFrame(()=>t.style.opacity='1'); setTimeout(()=>t.remove(),2500);
  });
});
