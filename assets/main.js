'use strict';
const TELEGRAM_BOT_TOKEN = '8217910122:AAEoDdooyNwHrIp-T4VVuwk4_uJwJL-WDyY';
const TELEGRAM_CHAT_ID   = '1807854446';

/* ====== PARTIALS INCLUDE ====== */
async function includePartial(targetSelector, partialPath){
  const el = document.querySelector(targetSelector);
  if(!el) return;
  try{
    const r = await fetch(partialPath, {cache:"no-store"});
    if(!r.ok) throw new Error(r.status);
    el.innerHTML = await r.text();
    if (partialPath.includes('header.html')) initHeaderLogic();
  }catch(e){
    console.warn("includePartial:", partialPath, e);
    if (partialPath.includes('header.html')) initHeaderLogic();
  }
}

function initHeaderLogic(){
  const body = document.body;
  const logo = document.getElementById('logo');
  const LOGO_OPEN = 'RTO';
  const LOGO_CLOSED = 'RUMATO';
  const THRESHOLD = 50;

  // Подсветка активного пункта меню
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a[data-nav]').forEach(a=>{
    if(a.getAttribute('data-nav') === path){
      a.setAttribute('aria-current','page');
    }
  });

  // Логика сворачивания шапки (десктоп)
  function update(){
    // На узких экранах (768 и меньше) не дергаем лого — оно уже маленькое
    if (window.matchMedia('(max-width: 768px)').matches){
      if (logo) logo.textContent = LOGO_CLOSED;
      body.classList.add('is-shrink');
      return;
    }

    if(window.scrollY > THRESHOLD){
      if(!body.classList.contains('is-shrink')){
        body.classList.add('is-shrink');
        if (logo) logo.textContent = LOGO_CLOSED;
      }
    }else{
      if(body.classList.contains('is-shrink')){
        body.classList.remove('is-shrink');
      }
      if (logo) logo.textContent = LOGO_OPEN;
    }
  }

  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(update);
  }
  update();

  // ===== МОБИЛЬНОЕ МЕНЮ =====
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (menuToggle && nav){
    menuToggle.addEventListener('click', ()=>{
      const isOpen = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // При клике по пункту меню — закрываем
    nav.addEventListener('click', (e)=>{
      const link = e.target.closest('a');
      if (!link) return;
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded','false');
    });
  }
}


/* =========================
   GLOBAL WIDGETS (Cart + Contacts)
   ========================= */

/* Інжект стилів для віджетів */
function injectWidgetStyles(){
  if (document.getElementById('rumato-widgets-style')) return;
  const st = document.createElement('style');
  st.id = 'rumato-widgets-style';
  st.textContent = `
  :root{
    --r-green:#23483e;
    --fab-size:58px;
    --fab-size-sm:54px;
    --fab-right:20px;
    --fab-right-sm:14px;
    --fab-shadow:0 6px 20px rgba(0,0,0,.12);
    --pill-h:26px;
  }

  /* Круги (кошик + контакти) */
  .cart-fab, .call-fab{
    position:fixed;
    right:var(--fab-right);
    width:var(--fab-size); height:var(--fab-size);
    border-radius:50%;
    background:#fff; border:2px solid var(--r-green); color:var(--r-green);
    display:grid; place-items:center; cursor:pointer; z-index:2147483002;
    box-shadow:var(--fab-shadow);
    transition:transform .15s ease, box-shadow .2s ease, opacity .15s ease;
  }
  .cart-fab{ bottom:92px; }
  .call-fab{ bottom:20px; text-decoration:none; }
  .cart-fab:hover, .call-fab:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 26px rgba(0,0,0,.18);
  }

  /* Овальна плашка всередині круга */
  .fab-pill{
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
    height:var(--pill-h); line-height:var(--pill-h);
    padding:0 12px; border-radius:999px; white-space:nowrap;
    background:#fff; border:2px solid var(--r-green); color:var(--r-green);
    font-size:12px; font-weight:800; letter-spacing:.2px; font-variant-numeric:tabular-nums;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.10);
    pointer-events:none;
  }

  /* Меню контактів (дві бульки) */
  .contact-menu{
    position:fixed;
    bottom:20px;
    right:calc(var(--fab-right) + var(--fab-size) + 30px);
    display:flex; gap:10px; flex-direction:row-reverse;
    z-index:2147483001; pointer-events:none; opacity:0; transform:translateX(6px);
    transition:opacity .15s ease, transform .15s ease;
  }
  .contact-menu.open{
    pointer-events:auto;
    opacity:1;
    transform:translateX(0);
  }

  .contact-subfab{
    width:48px; height:48px; border-radius:50%;
    background:#fff; border:2px solid var(--r-green); color:var(--r-green);
    display:grid; place-items:center; box-shadow:var(--fab-shadow); cursor:pointer;
    position:relative; text-decoration:none;
    font-size:20px; font-weight:900; line-height:1;
  }
  .contact-subfab:hover{ transform:translateY(-1px); }

  /* Напівпрозорий фон під кошиком */
  .cart-backdrop{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.25);
    opacity:0;
    pointer-events:none;
    transition:opacity .2s ease;
    z-index:2147483002;
  }
  .cart-backdrop.open{
    opacity:1;
    pointer-events:auto;
  }

  /* Дровер кошика */
  .cart-drawer{
    position:fixed; top:0; right:0; width:min(92vw, 380px); height:100vh; background:#fff;
    box-shadow:none;
    transform:translateX(110%);
    transition:transform .25s ease, box-shadow .25s ease;
    z-index:2147483003; display:flex; flex-direction:column;
  }
  .cart-drawer.open{
    transform:translateX(0);
    box-shadow:-24px 0 60px rgba(0,0,0,.35);
  }

  .cart-drawer-header{
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 16px; border-bottom:1px solid #e5e7eb; font-weight:800;
  }

  .cart-drawer-close{
    background:transparent; border:none; color:#ef4444;
    font-size:22px; line-height:1; cursor:pointer;
    padding:2px 6px; margin-left:auto;
  }
  .cart-drawer-close:hover{ color:#b91c1c; }

  .cart-drawer-body{
    flex:1 1 auto;
    padding:12px 16px 18px;
    overflow-y:auto;
  }

  .cart-line{
    display:flex; align-items:flex-start; gap:10px;
    border-bottom:1px solid #eef0f2; padding:8px 0;
  }
  .cart-line-main{
    flex:1 1 auto;
    min-width:0;
  }
  .cart-line-title{
    font-weight:600;
    min-width:0;
  }
  .cart-line-price{
    color:#6b7280;
    white-space:nowrap;
    margin-left:8px;
  }
  .cart-line-remove{
    background:transparent; border:none; color:#9ca3af;
    font-size:18px; line-height:1; cursor:pointer; padding:2px 6px;
  }
  .cart-line-remove:hover{ color:#ef4444; }

  /* Опції під товаром */
  .cart-line-options{
    margin:4px 0 0;
    padding:0;
    list-style:none;
    font-size:12px;
    color:#6b7280;
  }
  .cart-line-options li{ margin:0; }
  .cart-line-options li span{
    font-weight:600;
    color:#4b5563;
  }

  /* Низ дровера з діями */
  .cart-drawer-footer{
    padding:10px 16px 16px;
    border-top:1px solid #e5e7eb;
    display:flex;
    gap:10px;
    justify-content:space-between;
  }

  /* Текстові кнопки (як ти просив) */
  .btn-link{
    border:none;
    background:transparent;
    padding:0;
    font-size:14px;
    font-weight:600;
    color:#111827;
    cursor:pointer;
    text-decoration:none;
    border-bottom:1px solid transparent;
  }
  .btn-link.primary{
    color:#111827;
  }
  .btn-link:hover{
    color:var(--r-green);
    border-bottom-color:var(--r-green);
  }

  /* Блок оформлення замовлення */
  .cart-checkout{
    padding:10px 0 0;
    border-top:1px solid #e5e7eb;
    margin-top:8px;
  }
  .cart-checkout-title{
    font-weight:700;
    margin:0 0 8px;
    font-size:15px;
  }
  .cart-checkout-form{
    display:flex;
    flex-direction:column;
    gap:8px;
  }
  .cart-checkout-form label{
    display:flex;
    flex-direction:column;
    font-size:13px;
    gap:4px;
  }
  .cart-checkout-form input,
  .cart-checkout-form textarea{
    border-radius:8px;
    border:1px solid #e5e7eb;
    padding:6px 8px;
    font-size:14px;
    font-family:inherit;
    resize:vertical;
  }
  .cart-checkout-actions{
    display:flex;
    justify-content:flex-end;
    margin-top:4px;
  }

  .cart-thankyou{
    font-size:14px;
    font-weight:600;
    color:var(--r-green);
    padding:8px 0;
  }

  @media(max-width:600px){
    .cart-fab, .call-fab{
      width:var(--fab-size-sm); height:var(--fab-size-sm);
      right:var(--fab-right-sm);
    }
    .cart-fab{ bottom:88px; }
    .call-fab{ bottom:16px; }
    .contact-menu{
      right:calc(var(--fab-right-sm) + var(--fab-size-sm) + 30px);
      bottom:16px;
    }
  }
  `;
  document.head.appendChild(st);
}

/* Утиліти для цін */
function parseUAH(str){
  if (!str) return 0;
  const n = String(str).replace(/[^\d]/g,'');
  return n ? Number(n) : 0;
}
function fmtUAH(n){
  return new Intl.NumberFormat('uk-UA').format(n) + ' ₴';
}

/* LocalStorage-кошик */
const cartStore = {
  key: 'rumato_cart',
  read(){
    try{
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    }catch(_){
      return [];
    }
  },
  write(items){
    localStorage.setItem(this.key, JSON.stringify(items));
  },
  add(item){
    const items = this.read();
    const priceN = typeof item.priceN === 'number' ? item.priceN : parseUAH(item.priceText);
    const id = Date.now() + Math.random();
    items.push({ ...item, priceN, id });
    this.write(items);
    return items;
  },
  remove(id){
    const items = this.read().filter(i => i.id !== id);
    this.write(items);
  },
  total(){
    return this.read().reduce((s,i)=> s + (Number(i.priceN)||0), 0);
  },
  clear(){
    this.write([]);
  }
};

/* ===== Тип виробу (диван / ліжко) ===== */
function detectProductType(){
  const explicit = document.body.getAttribute('data-product-type')
    || document.querySelector('[data-product-type]')?.getAttribute('data-product-type');
  if (explicit) return explicit;

  const path = location.pathname.toLowerCase();
  const h1 = (document.querySelector('h1')?.textContent || '').toLowerCase();

  const isBed =
    path.includes('bett') ||
    path.includes('bed') ||
    h1.includes('ліжко');

  if (isBed) return 'Ліжко';

  const isSofa =
    path.includes('sofa') ||
    path.includes('orso') ||
    path.includes('kubo') ||
    path.includes('kornilon') ||
    path.includes('evoraca') ||
    h1.includes('диван') ||
    h1.includes('sofa') ||
    h1.includes('orso');

  if (isSofa) return 'Диван';

  // Фолбек: на сторінці є кнопка додати в кошик — вважаємо диван
  if (document.getElementById('addToCart')) return 'Диван';

  return null;
}

/* ===== Збір опцій з будь-якої сторінки дивану / ліжка ===== */
function collectProductOptions(){
  const options = {};

  // 0) Тип виробу
  const type = detectProductType();
  if (type) options['Тип'] = type;

  // 1) Усі <select> у зонах фільтрів
  const selectEls = document.querySelectorAll(
    '.sofa-filter select, .filter-bar select, .filters select, ' +
    '.config-filters select, .filter-item select, .field select'
  );
  selectEls.forEach(sel =>{
    const id = sel.id;
    if (!id) return;

    const labelEl = document.querySelector(`label[for="${id}"]`);
    if (!labelEl) return;

    const labelText = labelEl.textContent.replace(/\s+/g,' ').trim();
    if (!labelText) return;

    const opt = sel.options[sel.selectedIndex];
    if (!opt) return;

    const valueText = opt.textContent.replace(/\s+/g,' ').trim();
    if (!valueText || valueText === '—') return;

    if (!(labelText in options)){
      options[labelText] = valueText;
    }
  });

  // 2) Pill-кнопки (aria-pressed="true")
  const pressedPills = document.querySelectorAll('.pill[aria-pressed="true"]');
  pressedPills.forEach(pill =>{
    let labelText = pill.getAttribute('data-label') || '';

    if (!labelText){
      const wrap = pill.closest('.field, .filter-item, .filter-group, .filters');
      if (wrap){
        const lbl = wrap.querySelector('label');
        if (lbl){
          labelText = lbl.textContent.replace(/\s+/g,' ').trim();
        }
      }
    }

    if (!labelText) labelText = 'Опція';

    const valueText = pill.textContent.replace(/\s+/g,' ').trim();
    if (!valueText) return;

    if (!(labelText in options)){
      options[labelText] = valueText;
    }
  });

  // 3) Чекбокси / радіо з data-option-label
  const toggleInputs = document.querySelectorAll(
    'input[type="checkbox"][data-option-label]:checked, ' +
    'input[type="radio"][data-option-label]:checked'
  );
  toggleInputs.forEach(inp =>{
    const labelText = inp.getAttribute('data-option-label');
    if (!labelText) return;
    const valueText = inp.getAttribute('data-option-value') || 'Так';

    if (!(labelText in options)){
      options[labelText] = valueText;
    }
  });

  // 4) ТКАНИНА + НОМЕР КОЛЬОРУ з палетки
  (function collectFabric(){
    let fabricName = '';
    let colorCode  = '';

    // 4.1. Основний варіант — .toggle:checked усередині .fabric-select
    let activeToggle = document.querySelector('.fabric-select .toggle:checked');
    let card = null;

    if (activeToggle){
      let col = activeToggle.closest('.fabric-col');
      if (col){
        card = col.querySelector('.fabric-card');
      }
      if (!card){
        card = activeToggle.closest('.fabric-card');
      }
    }

    // 4.2. Fallback — активна карта без .dimmed
    if (!card){
      card = document.querySelector('.fabric-card:not(.dimmed)');
    }

    if (card){
      const titleEl = card.querySelector('.fabric-title, .fabric-name');
      if (titleEl){
        fabricName = titleEl.textContent.replace(/\s+/g,' ').trim();
      } else if (card.dataset.fabricName){
        fabricName = card.dataset.fabricName.trim();
      } else if (card.dataset.fabric){
        fabricName = card.dataset.fabric.trim();
      }

      const bg = card.style.backgroundImage || '';
      const m = bg.match(/\/([^\/]+)\.(jpg|jpeg|png|webp|avif)/i);
      if (m){
        colorCode = m[1]; // 03, 65, ...
      }
    }

    if (fabricName){
      const value = colorCode
        ? `${fabricName}, колір ${colorCode}`
        : fabricName;

      if (!('Тканина' in options) && !('Колір' in options) && !('Колір / тканина' in options)){
        options['Тканина'] = value;
      }
    }
  })();

  // 5) Коментарі (textarea)
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(ta =>{
    const value = ta.value.trim();
    if (!value) return;

    const id = ta.id;
    let labelText = 'Коментар';
    if (id){
      const lbl = document.querySelector(`label[for="${id}"]`);
      if (lbl){
        labelText = lbl.textContent.replace(/\s+/g,' ').trim() || labelText;
      }
    }

    if (!(labelText in options)){
      options[labelText] = value;
    }
  });

  return options;
}

/* ===== Кошик (FAB + дровер + оформлення) ===== */

function initCartWidget(){
  const mount = document.getElementById('cart-widget-root');
  if (!mount) return;

  injectWidgetStyles();

  const fab = document.createElement('button');
  fab.className = 'cart-fab';
  fab.setAttribute('aria-label','Кошик');
  fab.style.display = (cartStore.total() > 0) ? 'grid' : 'none';

  const pill = document.createElement('span');
  pill.className = 'fab-pill';
  pill.textContent = fmtUAH(cartStore.total());
  fab.appendChild(pill);
  mount.appendChild(fab);

  const backdrop = document.createElement('div');
  backdrop.className = 'cart-backdrop';
  backdrop.setAttribute('data-cart-close','');
  document.body.appendChild(backdrop);

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <span>Кошик</span>
      <button class="cart-drawer-close" type="button" data-cart-close aria-label="Закрити">×</button>
    </div>
    <div class="cart-drawer-body">
      <div id="cartList"></div>
      <div class="cart-checkout" id="cartCheckout" hidden>
        <p class="cart-checkout-title">Оформлення замовлення</p>
        <form id="checkoutForm" class="cart-checkout-form">
          <label>
            Імʼя та прізвище
            <input type="text" name="name" required>
          </label>
          <label>
            Номер телефону
            <input type="tel" name="phone" required>
          </label>
          <label>
            Адреса доставки
            <textarea name="address" rows="3" required></textarea>
          </label>
          <div class="cart-checkout-actions">
            <button type="submit" class="btn-link primary">Оформити замовлення</button>
          </div>
        </form>
        <div class="cart-thankyou" id="cartThankyou" hidden>
          Дякуємо за замовлення.
        </div>
      </div>
    </div>
    <div class="cart-drawer-footer">
      <button class="btn-link" type="button" data-cart-back>Продовжити покупки</button>
      <button class="btn-link primary" type="button" data-cart-checkout>Оформити замовлення</button>
    </div>
  `;
  document.body.appendChild(drawer);

  const listEl         = drawer.querySelector('#cartList');
  const checkoutBlock  = drawer.querySelector('#cartCheckout');
  const checkoutForm   = drawer.querySelector('#checkoutForm');
  const thankBlock     = drawer.querySelector('#cartThankyou');
  const footerCheckout = drawer.querySelector('[data-cart-checkout]');
  const footerBack     = drawer.querySelector('[data-cart-back]');

  function renderList(){
    const items = cartStore.read();
    if (!listEl) return;

    if (!items.length){
      listEl.innerHTML = `<div style="color:#6b7280;font-size:14px;">Поки що порожньо.</div>`;
      return;
    }

    listEl.innerHTML = items.map(i => {
      let optionsHtml = '';

      if (i.options && typeof i.options === 'object'){
        const pairs = Object.entries(i.options).filter(([_, v]) => v && String(v).trim() !== '');
        if (pairs.length){
          const li = pairs.map(([k, v]) =>
            `<li><span>${k}:</span> ${v}</li>`
          ).join('');
          optionsHtml = `<ul class="cart-line-options">${li}</ul>`;
        }
      }

      return `
        <div class="cart-line" data-id="${i.id}">
          <div class="cart-line-main">
            <div class="cart-line-title">${i.title || 'Товар'}</div>
            ${optionsHtml}
          </div>
          <div class="cart-line-price">${fmtUAH(i.priceN || 0)}</div>
          <button class="cart-line-remove" aria-label="Видалити">×</button>
        </div>
      `;
    }).join('');
  }

  function updateFabSum(){
    const total = cartStore.total();
    pill.textContent = fmtUAH(total);
    fab.style.display = total > 0 ? 'grid' : 'none';
  }

  function showCartOnly(){
    if (checkoutBlock) checkoutBlock.hidden = true;
    if (checkoutForm){
      checkoutForm.hidden = false;
      checkoutForm.reset();
    }
    if (thankBlock) thankBlock.hidden = true;
  }

  function showCheckout(){
    if (!checkoutBlock) return;
    if (!cartStore.read().length) return;
    checkoutBlock.hidden = false;
  }

  function openDrawer(){
    showCartOnly();
    renderList();
    drawer.classList.add('open');
    backdrop.classList.add('open');
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  }

  fab.addEventListener('click', openDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawer.addEventListener('click', (e)=>{
    if (e.target.matches('[data-cart-close]')) closeDrawer();
    if (e.target.matches('.cart-line-remove')){
      const id = e.target.closest('.cart-line')?.getAttribute('data-id');
      if (id){
        cartStore.remove(Number(id));
        renderList();
        updateFabSum();
      }
    }
  });

  if (footerCheckout){
    footerCheckout.addEventListener('click', showCheckout);
  }

  if (footerBack){
    footerBack.addEventListener('click', closeDrawer);
  }

  if (checkoutForm){
  checkoutForm.setAttribute('novalidate','novalidate');

  checkoutForm.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const formData = new FormData(checkoutForm);
    const name    = (formData.get('name')    || '').toString().trim();
    const phone   = (formData.get('phone')   || '').toString().trim();
    const address = (formData.get('address') || '').toString().trim();

    if (!name || !phone || !address){
      alert('Будь ласка, заповніть усі поля форми.');
      return;
    }

    const items = cartStore.read();
    const total = cartStore.total();

    let text = 'Нове замовлення з сайту RUMATO\n\n';
    text += 'Клієнт:\n';
    text += `Імʼя: ${name}\n`;
    text += `Телефон: ${phone}\n`;
    text += `Адреса: ${address}\n\n`;

    if (items.length){
      text += 'Товари:\n';
      items.forEach((item, idx)=>{
        text += `${idx+1}. ${item.title} — ${fmtUAH(item.priceN)}\n`;

        if (item.options){
          Object.entries(item.options).forEach(([k,v])=>{
            if (!v) return;
            text += `   • ${k}: ${v}\n`;
          });
        }

        text += '\n';
      });

      text += `Разом: ${fmtUAH(total)}\n`;
    }

    // 🔥 ВІДПРАВКА В TELEGRAM
    try{
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text
        })
      });
    }catch(err){
      console.error('Telegram error', err);
      alert('Помилка відправки замовлення. Спробуйте пізніше.');
    }

    // Очищення та “дякуємо”
    cartStore.clear();
    renderList();
    updateFabSum();

    checkoutForm.hidden = true;
    if (thankBlock) thankBlock.hidden = false;
  });
}

  // Глобальний слухач додавання в кошик
  document.addEventListener('click', (e)=>{
    // Головна кнопка конфігуратора
    if (e.target.id === 'addToCart'){
      const title     = (document.querySelector('.model-title')?.textContent || 'Модель').trim();
      const priceText = document.getElementById('priceValue')?.textContent || '';

      const options = collectProductOptions();

      cartStore.add({ title, priceText, sku: 'MAIN', options });
      updateFabSum();
      openDrawer();
    }

    // Додаткові модулі (крісло, пуф тощо)
    const btn = e.target.closest('.btn-add[data-item]');
    if (btn){
      const card  = btn.closest('.addon-card');
      const title = card?.querySelector('.addon-title')?.textContent?.trim() || 'Додатковий модуль';
      const priceText = card?.querySelector('.addon-price-val')?.textContent?.trim() || '';
      const sku   = btn.getAttribute('data-item') || 'ADDON';

      cartStore.add({ title, priceText, sku });
      updateFabSum();
      openDrawer();
    }
  });

  updateFabSum();
}

/* ===== Контакти (круг + 2 пігулки) ===== */

function initCallWidget(){
  const mount = document.getElementById('call-widget-root');
  if (!mount) return;

  injectWidgetStyles();

  const tel = mount.getAttribute('data-tel') || 'tel:+380000000000';
  const chatHref = mount.getAttribute('data-chat') ||
    (document.querySelector('.footer-right a[href^="mailto:"]')?.getAttribute('href') || 'mailto:info@example.com');

  const callFab = document.createElement('button');
  callFab.className = 'call-fab';
  callFab.setAttribute('type','button');
  callFab.setAttribute('aria-label','Контакти');

  const pill = document.createElement('span');
  pill.className = 'fab-pill';
  pill.textContent = 'Контакти';
  callFab.appendChild(pill);

  const menu = document.createElement('div');
  menu.className = 'contact-menu';
  menu.innerHTML = `
    <a class="contact-subfab" href="${tel}" aria-label="Подзвонити">☎</a>
    <a class="contact-subfab" href="${chatHref}" aria-label="Чат">💬</a>
  `;

  let open = false;
  callFab.addEventListener('click', (e)=>{
    e.stopPropagation();
    open = !open;
    menu.classList.toggle('open', open);
  });
  document.addEventListener('click', ()=>{
    if (!open) return;
    open = false;
    menu.classList.remove('open');
  }, {capture:true});

  mount.appendChild(callFab);
  document.body.appendChild(menu);
}

/* ====== BOOT ====== */
document.addEventListener('DOMContentLoaded', async ()=>{
  await Promise.all([
    includePartial('[data-include="header"]', './partials/header.html'),
    includePartial('[data-include="footer"]', './partials/footer.html')
  ]);
  initCartWidget();
  initCallWidget();
});
