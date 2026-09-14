/**
 * ==========================================================================
 * Deals Egypt — منطق الموقع
 * ==========================================================================
 * ملاحظة معمارية مهمة:
 * كل التعامل مع "تتبع الضغطات" اتحط في كائن واحد اسمه Tracking.
 * دلوقتي بيسجل في localStorage بس (عشان مفيش Backend/Database لسه).
 * لما نضيف API حقيقي (/api/track-click) هنغيّر جوه الكائن ده بس،
 * وباقي الكود (كل حتة تانية في الملف ده) مش هيتغير خالص.
 * ==========================================================================
 */

const Tracking = {
  KEY: "deals_egypt_clicks_v1",

  _read() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch (e) {
      return {};
    }
  },

  _write(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      /* التخزين مش متاح - نتجاهل بهدوء */
    }
  },

  // سجل ضغطة على منتج معيّن. هنا بالظبط هيتحط استدعاء الـ API لاحقًا:
  // await fetch('/api/track-click', { method: 'POST', body: JSON.stringify({ productId }) })
  recordClick(productId) {
    const data = this._read();
    const now = new Date().toISOString();
    if (!data[productId]) data[productId] = { total: 0, lastClick: null };
    data[productId].total += 1;
    data[productId].lastClick = now;
    this._write(data);
  },
};

// ------------------------------------------------------------------------
// عناصر الصفحة
// ------------------------------------------------------------------------
const categoriesRow = document.getElementById("categoriesRow");
const productsGrid = document.getElementById("productsGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const searchToggle = document.getElementById("searchToggle");
const searchBar = document.getElementById("searchBar");
const yearEl = document.getElementById("year");

let activeCategory = "all";
let searchTerm = "";

// ------------------------------------------------------------------------
// تصيير التصنيفات
// ------------------------------------------------------------------------
function renderCategories() {
  const allChip = createChip({ id: "all", label: "الكل", icon: "✨" });
  categoriesRow.appendChild(allChip);

  CATEGORIES.forEach((cat) => {
    categoriesRow.appendChild(createChip(cat));
  });
}

function createChip(cat) {
  const btn = document.createElement("button");
  btn.className = "chip" + (cat.id === activeCategory ? " chip--active" : "");
  btn.type = "button";
  btn.dataset.category = cat.id;
  btn.innerHTML = `<span class="chip__icon">${cat.icon}</span><span>${cat.label}</span>`;
  btn.addEventListener("click", () => {
    activeCategory = cat.id;
    document
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("chip--active"));
    btn.classList.add("chip--active");
    renderProducts();
  });
  return btn;
}

// ------------------------------------------------------------------------
// تصيير المنتجات
// ------------------------------------------------------------------------
function getFilteredProducts() {
  return PRODUCTS.filter((p) => {
    const matchesCategory =
      activeCategory === "all" || p.category === activeCategory;
    const matchesSearch =
      searchTerm.trim() === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const list = getFilteredProducts();
  productsGrid.innerHTML = "";

  if (list.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  list.forEach((product) => {
    productsGrid.appendChild(createProductCard(product));
  });
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const priceHTML =
    product.price != null
      ? `<span class="product-card__price">${product.price} <span class="product-card__currency">ج.م</span></span>`
      : "";

  const badgeHTML = product.badge
    ? `<span class="product-card__badge">${product.badge}</span>`
    : "";

  card.innerHTML = `
    <div class="product-card__media">
      ${badgeHTML}
      ${
        product.image
          ? `<img src="${product.image}" alt="${product.name}" loading="lazy" class="product-card__img" />`
          : `<div class="product-card__placeholder" role="img" aria-label="${product.name}">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                 <path d="M4 7h16M6 7l1.5 12a2 2 0 002 2h5a2 2 0 002-2L18 7M9 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
             </div>`
      }
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">${product.name}</h3>
      <p class="product-card__desc">${product.description}</p>
      <div class="product-card__footer">
        ${priceHTML}
        <a class="product-card__cta" href="${product.url}" target="_blank" rel="noopener noreferrer nofollow" data-product-id="${product.id}">
          🛒 شوف المنتج
        </a>
      </div>
    </div>
  `;

  const cta = card.querySelector(".product-card__cta");
  cta.addEventListener("click", () => {
    Tracking.recordClick(product.id);
  });

  return card;
}

// ------------------------------------------------------------------------
// البحث
// ------------------------------------------------------------------------
if (searchToggle) {
  searchToggle.addEventListener("click", () => {
    const isHidden = searchBar.hasAttribute("hidden");
    if (isHidden) {
      searchBar.removeAttribute("hidden");
      searchInput.focus();
    } else {
      searchBar.setAttribute("hidden", "");
      searchTerm = "";
      searchInput.value = "";
      renderProducts();
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });
}

// ------------------------------------------------------------------------
// أقسام سريعة (بطاقات التصنيفات في القسم المخصص لها)
// ------------------------------------------------------------------------
function renderCategoryCards() {
  const grid = document.getElementById("categoryCardsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.innerHTML = `<span class="category-card__icon">${cat.icon}</span><span class="category-card__label">${cat.label}</span>`;
    card.addEventListener("click", () => {
      activeCategory = cat.id;
      document.querySelectorAll(".chip").forEach((c) => {
        c.classList.toggle("chip--active", c.dataset.category === cat.id);
      });
      renderProducts();
      document
        .getElementById("products")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    });
    grid.appendChild(card);
  });
}

// ------------------------------------------------------------------------
// تشغيل
// ------------------------------------------------------------------------
renderCategories();
renderCategoryCards();
renderProducts();
if (yearEl) yearEl.textContent = new Date().getFullYear();
