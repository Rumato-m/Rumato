(function () {
  "use strict";

  // Безопасный старт: один запуск + до 2 быстрых ретраев
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootOnce, { once: true });
  } else {
    bootOnce();
  }

  let booted = false;
  let retries = 0;

  function bootOnce() {
    if (booted) return;
    const wrap =
      document.querySelector('.series-wrapper--yawaraka[aria-label="Serie Vector"]') ||
      document.querySelector(".series-wrapper--yawaraka");

    if (!wrap) {
      if (retries++ < 2) return setTimeout(bootOnce, 150);
      return;
    }
    booted = true;
    boot(wrap);
  }

  function boot(wrap) {
    const fmt = (n) => new Intl.NumberFormat("de-DE").format(n);
    const $  = (sel) => wrap.querySelector(sel);

    // ===== cache =====
    const priceEl   = $("#color-price-b");
    const summaryEl = $("#selection-summary-b");

    const widthSel  = $("#ind-width-b");
    const depthSel  = $("#ind-depth-b");
    const shapeSel  = $("#ind-shape-b");
    const orientSel = $("#ind-orient-b");

    const notes   = $("#ind-notes-b");
    const notesCt = $("#notes-counter-b");

    const modal      = $("#swatch-modal-b");
    const swatchesEl = $("#swatches-b");
    const bigImg     = $("#big-preview-img-b");
    const bigLbl     = $("#big-preview-label-b");
    const btnClose   = $("#modal-close-b");

    // ===== «Auswählen» (single-select) =====
    const selectBtns = Array.from(wrap.querySelectorAll(".select-btn"));
    let activeBtn = null;

    function renderSelectState(btn) {
      selectBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.textContent = on ? "Zum Abwählen klicken" : "Auswählen";
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.toggleAttribute("disabled", !!btn && b !== btn);
        b.classList.toggle("dimmed", !!btn && b !== btn);
      });
    }

    selectBtns.forEach((b) =>
      b.addEventListener(
        "click",
        () => {
          activeBtn = activeBtn === b ? null : b;
          renderSelectState(activeBtn);
          recalc();
        },
        { passive: true }
      )
    );

    // ===== Breite: 100..220, Schritt 10 =====
    if (widthSel && !widthSel.options.length) {
      const frag = document.createDocumentFragment();
      for (let w = 100; w <= 220; w += 10) {
        const o = document.createElement("option");
        o.value = String(w);
        o.textContent = w + " cm";
        frag.appendChild(o);
      }
      widthSel.appendChild(frag);
    }
    [widthSel, depthSel, shapeSel, orientSel].forEach((el) =>
      el && el.addEventListener("change", recalc, { passive: true })
    );

    // ===== Notes counter =====
    if (notes && notesCt) {
      notesCt.textContent = `${notes.value.length}/200`;
      notes.addEventListener(
        "input",
        () => (notesCt.textContent = `${notes.value.length}/200`),
        { passive: true }
      );
    }

    // ===== Radios: +100 € bei mittlerer Karte (opt2) =====
    let addon = 0;
    wrap.addEventListener(
      "change",
      (e) => {
        const t = e.target;
        if (t && t.name === "addonChoiceB") {
          addon = t.value === "opt2" ? 100 : 0;
          wrap.querySelectorAll(".radio-card").forEach((c) => c.classList.remove("selected"));
          t.closest(".radio-card")?.classList.add("selected");
          recalc();
        }
      },
      { passive: true }
    );

    // ===== Paletten =====
    const palettes = {
      1: [
        { name: "Anthrazit",     src: "images/farbe/Anthrazit.jpg" },
        { name: "Dunkelgrau",    src: "images/farbe/Dunkelgrau.jpg" },
        { name: "Dunkelgrau",    src: "images/farbe/Dunkelgrau.jpg" }, // laut Vorgabe
        { name: "Dunkler Beton", src: "images/farbe/Dunkler%20Beton.jpg" },
        { name: "Gold",          src: "images/farbe/Gold.jpg" },
        { name: "Helle Eiche",   src: "images/farbe/Helle%20Eiche.jpg" },
        { name: "Wenge",         src: "images/farbe/Wenge.jpg" },
        { name: "Weiß",          src: "images/farbe/Wei%C3%9F.jpg" },
        { name: "Sonoma-Eiche",  src: "images/farbe/Sonoma-Eiche.jpg" },
        { name: "Schwarz",       src: "images/farbe/Schwarz.jpg" },
        { name: "Hellgrau",      src: "images/farbe/Hellgrau.jpg" },
        { name: "Heller Beton",  src: "images/farbe/Heller%20Beton.jpg" },
      ],
      2: [
        { name: "Braun",    src: "images/farbe/stoff/Braun.jpg" },
        { name: "Grün",     src: "images/farbe/stoff/Gr%C3%BCn.jpg" },
        { name: "Hellgrau", src: "images/farbe/stoff/Hellgrau.jpg" },
        { name: "Hellgrün", src: "images/farbe/stoff/Hellgr%C3%BCn.jpg" },
        { name: "Ivory",    src: "images/farbe/stoff/Ivory.jpg" },
        { name: "Karamell", src: "images/farbe/stoff/Karamell.jpg" },
        { name: "Rost",     src: "images/farbe/stoff/Rost.jpg" },
        { name: "Weiß",     src: "images/farbe/stoff/Wei%C3%9F.jpg" },
      ],
    };

    // — модалка
    if (modal && swatchesEl && bigImg && bigLbl && btnClose) {
      btnClose.addEventListener("click", closePalette);
      modal.addEventListener("click", (e) => { if (e.target === modal) closePalette(); });
      modal.querySelector(".modal__dialog")?.addEventListener("click", (e) => e.stopPropagation());
    }

    function openPalette(slot) {
      if (!(modal && swatchesEl && bigImg && bigLbl)) return;
      swatchesEl.innerHTML = "";
      const list = palettes[slot] || [];
      const frag = document.createDocumentFragment();
      for (const col of list) {
        const d = document.createElement("div");
        d.className = "swatch";
        d.innerHTML = `<img class="swatch__img" alt="" src="${col.src}"><div class="swatch__name">${col.name}</div>`;
        d.addEventListener("click", () => applyColor(slot, col));
        frag.appendChild(d);
      }
      swatchesEl.appendChild(frag);
      if (list[0]) { bigImg.src = list[0].src; bigLbl.textContent = list[0].name; }
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");   // блокируем фон для стабильной прокрутки
    }

    function closePalette() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }

    function applyColor(slot, col) {
      const img = $("#swatch-img-" + slot + "b");
      const lbl = $("#label-" + slot + "b");
      const box = $("#preview-" + slot + "b");

      if (img) img.src = col.src;
      if (lbl) lbl.textContent = (slot === 1 ? "Farbe\u00A01 (Material): " : "Farbe\u00A02 (Stoff): ") + col.name;
      if (box) { box.style.backgroundImage = `url(${col.src})`; box.classList.add("is-filled"); }
      bigImg.src = col.src; bigLbl.textContent = col.name;
      recalc();
    }

    ["1", "2"].forEach((s) => {
      const el = $("#preview-" + s + "b");
      if (!el) return;
      el.addEventListener("click", () => openPalette(Number(s)));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPalette(Number(s)); }
      });
    });

    // ===== Preisberechnung =====
    function getBase() {
      if (!activeBtn) return null;
      const id = activeBtn.getAttribute("data-model");
      const node = wrap.querySelector(`.product-price[data-model="${id}"]`);
      return node ? Number(node.dataset.base) : null;
    }
    const getWidth = () => (widthSel ? Number(widthSel.value || "100") : 100);

    function recalc() {
      const base = getBase();
      if (base == null) {
        if (priceEl) priceEl.textContent = "—";
        if (summaryEl) summaryEl.textContent = "—";
        return;
      }
      const width = getWidth();
      const widthExtra = Math.max(0, (width - 100) / 10) * 50; // +50 € je 10 cm
      const total = base + widthExtra + addon;
      if (priceEl) priceEl.textContent = "Gesamt: " + fmt(total) + " €";

      const depth  = depthSel?.value || "";
      const shape  = shapeSel?.value || "";
      const orient = orientSel?.value || "";
      const m = activeBtn?.dataset.model || "—";
      const c1 = $("#label-1w")?.textContent || "";
      const c2 = $("#label-2w")?.textContent || "";
      if (summaryEl)
        summaryEl.textContent = `Modell ${m}; Breite ${width} cm; Tiefe ${depth}; Form ${shape}; Ausrichtung ${orient}; ${c1}; ${c2}`;
    }

    // initial
    recalc();
  }
})();
