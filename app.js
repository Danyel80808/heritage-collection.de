/* =========================
   Heritage Collection Shop
   app.js
========================= */

/* ---------- CONFIG ---------- */
const BRAND = "Heritage Collection";

const CART_KEY = "shop_cart_v1";
const COUPON_KEY = "shop_coupon_v1";

// Login (Demo)
const USER_KEY_PERSIST = "shop_user_v1_persist";
const USER_KEY_SESSION = "shop_user_v1_session";
const USERS_DB_KEY = "shop_users_db_v1";

// Address (persist + session)
const ADDRESS_KEY_PERSIST = "shop_address_persist_v1";
const ADDRESS_KEY_SESSION = "shop_address_session_v1";

// Offer popup
const OFFER_KEY = "shop_offer_seen_v1";

// Cookie consent
const COOKIE_CONSENT_KEY = "shop_cookie_consent_v1"; // "all" | "necessary"

// Neukunden Popup
const WELCOME_POP_KEY = "shop_welcome_seen_v1";

/* ---------- HELPERS ---------- */
function qs(id){ return document.getElementById(id); }

function money(amount, currency = "EUR") {
  const n = Number(amount) || 0;
  try { return new Intl.NumberFormat("de-DE", { style:"currency", currency }).format(n); }
  catch { return `${n.toFixed(2)} ${currency}`; }
}

function setBrand() {
  const bn = qs("brandName");
  const bf = qs("brandFooter");
  if (bn) bn.textContent = BRAND;
  if (bf) bf.textContent = BRAND;

  const year = qs("year");
  if (year) year.textContent = new Date().getFullYear();

  document.title = document.title.replace("DEINE BRAND", BRAND);
}

/* ---------- TOAST ---------- */
function toast(text) {
  let host = document.querySelector(".toastHost");
  if (!host) {
    host = document.createElement("div");
    host.className = "toastHost";
    document.body.appendChild(host);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  host.appendChild(t);
  setTimeout(() => t.remove(), 950);
}

/* ---------- USER (persist/session) ---------- */
function getUser() {
  // prefer session if exists
  try {
    const s = sessionStorage.getItem(USER_KEY_SESSION);
    if (s) return JSON.parse(s);
  } catch {}
  try {
    const p = localStorage.getItem(USER_KEY_PERSIST);
    if (p) return JSON.parse(p);
  } catch {}
  return null;
}

function clearUser() {
  localStorage.removeItem(USER_KEY_PERSIST);
  sessionStorage.removeItem(USER_KEY_SESSION);
}

function setUserSession(u) {
  sessionStorage.setItem(USER_KEY_SESSION, JSON.stringify(u));
  localStorage.removeItem(USER_KEY_PERSIST);
}

function setUserPersist(u) {
  localStorage.setItem(USER_KEY_PERSIST, JSON.stringify(u));
  sessionStorage.removeItem(USER_KEY_SESSION);
}

/* ---------- USERS DB (Demo) ---------- */
function getUsersDb() {
  try { return JSON.parse(localStorage.getItem(USERS_DB_KEY) || "[]"); }
  catch { return []; }
}
function setUsersDb(db) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
}

/* ---------- NAV VISIBILITY (Login vs Logout) ---------- */
function syncNavAuthState() {
  const u = getUser();
  const loginLink = qs("loginLink");
  const logoutLink = qs("logoutLink");

  // Wenn eingeloggt: nur Logout anzeigen
  if (u) {
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "inline-block";
  } else {
    // Wenn ausgeloggt: nur Login anzeigen
    if (loginLink) loginLink.style.display = "inline-block";
    if (logoutLink) logoutLink.style.display = "none";
  }

  // Logout klickbar machen, wenn vorhanden
  if (logoutLink && !logoutLink.dataset.bound) {
    logoutLink.dataset.bound = "1";
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      clearUser();
      toast("Abgemeldet");
      syncNavAuthState();
      // optional: wenn man auf login.html ist, Panels wieder freigeben
      if (location.pathname.endsWith("login.html")) renderLogin();
    });
  }
}

/* ---------- COUPONS ---------- */
function getCoupon(){ return (localStorage.getItem(COUPON_KEY) || "").trim(); }
function setCoupon(code){ localStorage.setItem(COUPON_KEY, (code||"").trim().toUpperCase()); }

function computeTotals(cart) {
  let subtotal = 0;
  for (const it of cart) {
    const p = findProduct(it.productId);
    if (!p) continue;
    subtotal += (Number(p.price)||0) * (Number(it.qty)||0);
  }

  const code = getCoupon().toUpperCase();
  const c = (window.COUPONS || {})[code];

  let discount = 0;
  if (c) {
    if (c.type === "percent") discount = subtotal * (Number(c.value)/100);
    if (c.type === "fixed") discount = Number(c.value)||0;
    if (discount > subtotal) discount = subtotal;
  }

  return { subtotal, discount, total: Math.max(0, subtotal-discount), codeValid: !!c, code };
}

/* ---------- PRODUCTS ---------- */
function findProduct(id) {
  return (window.PRODUCTS || []).find(p => p.id === id);
}

/* ---------- CART ---------- */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  const el = qs("cartCount");
  if (el) el.textContent = String(count);
}
function addToCart({ productId, color, size, qty }) {
  const cart = getCart();
  const key = `${productId}__${color}__${size}`;
  const existing = cart.find(x => x.key === key);
  const q = Math.max(1, Number(qty) || 1);

  if (existing) existing.qty += q;
  else cart.push({ key, productId, color, size, qty: q });

  saveCart(cart);
  toast("In den Warenkorb gelegt");
}

/* ---------- INDEX ---------- */
function renderIndex() {
  const grid = qs("grid");
  if (!grid) return;

  const search = qs("search");
  const categorySelect = qs("category");
  const products = window.PRODUCTS || [];

  const categories = ["Alle", ...new Set(products.map(p => p.category).filter(Boolean))];
  if (categorySelect) categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");

  function draw() {
    const q = (search?.value || "").trim().toLowerCase();
    const cat = categorySelect?.value || "Alle";

    const items = products.filter(p => {
      const matchCat = (cat === "Alle") || (p.category === cat);
      const txt = `${p.name||""} ${(p.description||"")} ${(p.category||"")}`.toLowerCase();
      const matchQ = !q || txt.includes(q);
      return matchCat && matchQ;
    });

    if (items.length === 0) {
      grid.innerHTML = `<div class="card"><div class="p">Keine Produkte gefunden.</div></div>`;
      return;
    }

    grid.innerHTML = items.map(p => `
      <div class="card">
        <a href="product.html?id=${encodeURIComponent(p.id)}">
          <img src="${(p.images && p.images[0]) || "https://via.placeholder.com/1200x800?text=Produktbild"}"
               alt="${p.name || "Produkt"}" loading="lazy">
          <div class="p">
            <div class="row">
              <h3>${p.name || "Produkt"}</h3>
              <div class="price">${money(p.price, p.currency || "EUR")}</div>
            </div>
            <div class="meta">
              <span class="pill">${p.category || "—"}</span>
              <span class="pill">${p.shippingTime || "Lieferzeit: —"}</span>
            </div>
          </div>
        </a>
      </div>
    `).join("");
  }

  search?.addEventListener("input", draw);
  categorySelect?.addEventListener("change", draw);
  draw();
}

/* ---------- PRODUCT PAGE ---------- */
function renderProduct() {
  const img = qs("img");
  if (!img) return;

  const id = new URL(location.href).searchParams.get("id");
  const p = findProduct(id);

  if (!p) {
    const main = document.querySelector("main");
    if (main) main.innerHTML = `<div class="panel">Produkt nicht gefunden. <a class="back" href="index.html">← Zurück</a></div>`;
    return;
  }

  img.src = (p.images && p.images[0]) || "https://via.placeholder.com/1200x800?text=Produktbild";
  img.alt = p.name || "Produkt";

  qs("name").textContent = p.name || "Produkt";
  qs("price").textContent = money(p.price, p.currency || "EUR");
  qs("categoryPill").textContent = p.category || "—";
  qs("desc").textContent = p.description || "";
  qs("ship").textContent = p.shippingTime || "Lieferzeit: —";

  const colorSel = qs("color");
  const sizeSel = qs("size");
  const qtySel = qs("qty");

  const colors = (p.options?.colors?.length) ? p.options.colors : ["Standard"];
  const sizes = (p.options?.sizes?.length) ? p.options.sizes : ["One size"];

  if (colorSel) colorSel.innerHTML = colors.map(c => `<option>${c}</option>`).join("");
  if (sizeSel) sizeSel.innerHTML = sizes.map(s => `<option>${s}</option>`).join("");

  const high = qs("high");
  const details = qs("details");
  if (high) high.innerHTML = (p.highlights || []).map(x => `<li>${x}</li>`).join("");
  if (details) details.innerHTML = (p.details || []).map(x => `<li>${x}</li>`).join("");

  qs("addBtn")?.addEventListener("click", () => {
    addToCart({
      productId: p.id,
      color: colorSel?.value || "Standard",
      size: sizeSel?.value || "One size",
      qty: Number(qtySel?.value || 1)
    });
  });

  qs("goCartBtn")?.addEventListener("click", () => (location.href = "cart.html"));
}

/* ---------- CART PAGE ---------- */
function renderCart() {
  const table = qs("cartTable");
  if (!table) return;

  const empty = qs("cartEmpty");
  const body = qs("cartBody");

  const couponInput = qs("couponInput");
  const couponMsg = qs("couponMsg");

  const subEl = qs("sub");
  const discEl = qs("disc");
  const totalEl = qs("total");

  function draw() {
    const cart = getCart().filter(it => findProduct(it.productId));

    if (!cart.length) {
      if (empty) empty.style.display = "block";
      table.style.display = "none";
      if (subEl) subEl.textContent = "—";
      if (discEl) discEl.textContent = "—";
      if (totalEl) totalEl.textContent = "—";
      return;
    }

    if (empty) empty.style.display = "none";
    table.style.display = "table";

    body.innerHTML = cart.map((it, index) => {
      const p = findProduct(it.productId);
      const unit = Number(p.price) || 0;
      const qty = Number(it.qty) || 1;
      const line = unit * qty;

      return `
        <tr>
          <td><strong>${p.name}</strong><div class="small">${p.category || ""}</div></td>
          <td>${it.color} / ${it.size}</td>
          <td class="right">${money(unit, p.currency || "EUR")}</td>
          <td class="right">
            <select data-index="${index}" class="qtySelect">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${n===qty?"selected":""}>${n}</option>`).join("")}
            </select>
          </td>
          <td class="right">${money(line, p.currency || "EUR")}</td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll(".qtySelect").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.index);
        const newQty = Number(e.target.value);
        const current = getCart();
        if (!current[idx]) return;
        current[idx].qty = newQty;
        saveCart(current);
        toast("Menge aktualisiert");
        draw();
      });
    });

    const t = computeTotals(cart);
    if (subEl) subEl.textContent = money(t.subtotal, "EUR");
    if (discEl) discEl.textContent = t.codeValid ? `- ${money(t.discount, "EUR")} (${t.code})` : money(0, "EUR");
    if (totalEl) totalEl.textContent = money(t.total, "EUR");
  }

  if (couponInput) couponInput.value = getCoupon();

  qs("applyCoupon")?.addEventListener("click", () => {
    const code = (couponInput?.value || "").trim().toUpperCase();
    setCoupon(code);

    const t = computeTotals(getCart());
    if (couponMsg) couponMsg.textContent = t.codeValid ? "Gutschein angewendet." : (code ? "Ungültiger Code." : "");
    toast(t.codeValid ? "Gutschein angewendet" : "Ungültiger Code");
    draw();
  });

  qs("payBtn")?.addEventListener("click", () => {
    const cart = getCart();
    if (!cart.length) return;

    const t = computeTotals(cart);
    const method = document.querySelector('input[name="pay"]:checked')?.value || "paypal";
    const payMsg = qs("payMsg");
    if (payMsg) payMsg.textContent = `Demo: Zahlung über ${method.toUpperCase()} würde starten. Gesamt: ${money(t.total, "EUR")}`;
    toast("Checkout (Demo) gestartet");
  });

  draw();
}

/* ---------- LOGIN PAGE LOGIC ---------- */
function renderLogin() {
  const tabLogin = qs("tabLogin");
  if (!tabLogin) return;

  const tabRegister = qs("tabRegister");
  const tabGuest = qs("tabGuest");
  const hint = qs("tabHint");

  const panelLogin = qs("panelLogin");
  const panelRegister = qs("panelRegister");
  const panelGuest = qs("panelGuest");

  const userState = qs("userState");
  const logoutBtn = qs("logoutBtn");

  function show(which) {
    if (panelLogin) panelLogin.style.display = which === "login" ? "block" : "none";
    if (panelRegister) panelRegister.style.display = which === "register" ? "block" : "none";
    if (panelGuest) panelGuest.style.display = which === "guest" ? "block" : "none";

    if (hint) {
      hint.textContent =
        which === "login" ? "Melde dich mit deinen Daten an." :
        which === "register" ? "Erstelle einen Account (Demo, lokal gespeichert)." :
        "Als Gast fortfahren, ohne Account.";
    }
  }

  function lockIfLoggedIn() {
    const u = getUser();
    if (userState) {
      userState.textContent = u
        ? `Eingeloggt: ${u.mode === "guest" ? "Gast" : u.email}`
        : "Nicht eingeloggt.";
    }

    const locked = !!u;

    // Wenn eingeloggt: KEINE Login/Register/Gast Panels zeigen – nur Logout
    if (locked) {
      if (panelLogin) panelLogin.style.display = "none";
      if (panelRegister) panelRegister.style.display = "none";
      if (panelGuest) panelGuest.style.display = "none";
      if (hint) hint.textContent = "Du bist eingeloggt. Du kannst dich nur abmelden.";
      if (tabLogin) tabLogin.disabled = true;
      if (tabRegister) tabRegister.disabled = true;
      if (tabGuest) tabGuest.disabled = true;
      if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
      if (tabLogin) tabLogin.disabled = false;
      if (tabRegister) tabRegister.disabled = false;
      if (tabGuest) tabGuest.disabled = false;
      if (logoutBtn) logoutBtn.style.display = "none";
      show("login");
    }
  }

  function askRememberAndStore(userObj) {
    const remember = confirm("Login für den nächsten Einkauf speichern?");
    if (remember) setUserPersist(userObj);
    else setUserSession(userObj);
  }

  // Login
  qs("loginBtn")?.addEventListener("click", () => {
    if (getUser()) return;

    const e = (qs("loginEmail")?.value || "").trim().toLowerCase();
    const p = (qs("loginPassword")?.value || "").trim();
    const msg = qs("loginMsg");

    if (!e.includes("@") || p.length < 4) {
      if (msg) msg.textContent = "Bitte gültige E-Mail und Passwort eingeben.";
      toast("Bitte Daten prüfen");
      return;
    }

    const db = getUsersDb();
    const found = db.find(x => x.email === e && x.password === p);
    if (!found) {
      if (msg) msg.textContent = "Falsche Daten (Demo).";
      toast("Falsche Daten");
      return;
    }

    askRememberAndStore({ mode:"user", email:e, ts:Date.now() });
    if (msg) msg.textContent = "Anmeldung erfolgreich.";
    toast("Angemeldet");
    lockIfLoggedIn();
    syncNavAuthState();
  });

  // Register
  qs("registerBtn")?.addEventListener("click", () => {
    if (getUser()) return;

    const e = (qs("regEmail")?.value || "").trim().toLowerCase();
    const p1 = (qs("regPassword")?.value || "").trim();
    const p2 = (qs("regPassword2")?.value || "").trim();
    const msg = qs("registerMsg");

    if (!e.includes("@")) { if (msg) msg.textContent = "Bitte gültige E-Mail."; toast("E-Mail prüfen"); return; }
    if (p1.length < 4) { if (msg) msg.textContent = "Passwort zu kurz (Demo)."; toast("Passwort zu kurz"); return; }
    if (p1 !== p2) { if (msg) msg.textContent = "Passwörter stimmen nicht überein."; toast("Passwörter prüfen"); return; }

    const db = getUsersDb();
    if (db.some(x => x.email === e)) { if (msg) msg.textContent = "E-Mail existiert schon (Demo)."; toast("E-Mail existiert"); return; }

    db.push({ email:e, password:p1 });
    setUsersDb(db);

    askRememberAndStore({ mode:"user", email:e, ts:Date.now() });
    if (msg) msg.textContent = "Registriert & eingeloggt.";
    toast("Registriert");
    lockIfLoggedIn();
    syncNavAuthState();
  });

  // Guest
  qs("guestBtn")?.addEventListener("click", () => {
    if (getUser()) return;
    askRememberAndStore({ mode:"guest", ts:Date.now() });
    const msg = qs("guestMsg");
    if (msg) msg.textContent = "Als Gast fortgefahren.";
    toast("Als Gast");
    lockIfLoggedIn();
    syncNavAuthState();
  });

  // Logout
  logoutBtn?.addEventListener("click", () => {
    clearUser();
    toast("Abgemeldet");
    lockIfLoggedIn();
    syncNavAuthState();
  });

  lockIfLoggedIn();
}

/* ---------- ADDRESS ---------- */
function getAddress() {
  try {
    const s = sessionStorage.getItem(ADDRESS_KEY_SESSION);
    if (s) return JSON.parse(s);
  } catch {}
  try {
    const p = localStorage.getItem(ADDRESS_KEY_PERSIST);
    if (p) return JSON.parse(p);
  } catch {}
  return null;
}
function setAddressSession(addr){
  sessionStorage.setItem(ADDRESS_KEY_SESSION, JSON.stringify(addr));
  localStorage.removeItem(ADDRESS_KEY_PERSIST);
}
function setAddressPersist(addr){
  localStorage.setItem(ADDRESS_KEY_PERSIST, JSON.stringify(addr));
  sessionStorage.removeItem(ADDRESS_KEY_SESSION);
}

function renderAddress() {
  const saveBtn = qs("saveAddress");
  if (!saveBtn) return;

  const country = qs("country");
  const zip = qs("zip");
  const city = qs("city");
  const street = qs("street");
  const msg = qs("addrMsg");

  const a = getAddress();
  if (a) {
    if (country) country.value = a.country || "DE";
    if (zip) zip.value = a.zip || "";
    if (city) city.value = a.city || "";
    if (street) street.value = a.street || "";
  }

  saveBtn.addEventListener("click", () => {
    const addr = {
      country: (country?.value || "DE"),
      zip: (zip?.value || "").trim(),
      city: (city?.value || "").trim(),
      street: (street?.value || "").trim()
    };

    if (!addr.zip || !addr.city || !addr.street) {
      if (msg) msg.textContent = "Bitte PLZ, Stadt und Straße ausfüllen.";
      toast("Adresse unvollständig");
      return;
    }

    const remember = confirm("Adresse für nächste Einkäufe speichern?");
    if (remember) {
      setAddressPersist(addr);
      if (msg) msg.textContent = "Adresse dauerhaft gespeichert.";
      toast("Adresse gespeichert");
    } else {
      setAddressSession(addr);
      if (msg) msg.textContent = "Adresse nur für diesen Besuch gespeichert.";
      toast("Adresse für Besuch gespeichert");
    }

    // anim feedback if btn-secondary success exists in css
    saveBtn.classList.add("success");
    setTimeout(() => saveBtn.classList.remove("success"), 900);
  });
}

/* ---------- OFFER POPUP (1x/day) ---------- */
function showOfferPopup() {
  const grid = qs("grid");
  if (!grid) return;

  const today = new Date().toISOString().slice(0, 10);
  const seen = localStorage.getItem(OFFER_KEY);
  if (seen === today) return;

  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h3>Heute im Angebot</h3>
      <p class="small">Spare <strong>10%</strong> mit dem Code <strong>WELCOME10</strong>.</p>
      <div class="modalActions">
        <button class="btn" id="offerGo">Jetzt shoppen</button>
        <button class="btn-secondary" id="offerClose">Schließen</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function close() {
    localStorage.setItem(OFFER_KEY, today);
    overlay.remove();
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  overlay.querySelector("#offerClose").addEventListener("click", close);
  overlay.querySelector("#offerGo").addEventListener("click", () => { close(); toast("Aktion sichtbar"); });
}

/* ---------- WELCOME POPUP (New customer) ---------- */
function showWelcomeAuthPopup() {
  const u = getUser();
  if (u) return; // logged in -> no popup
  const seen = localStorage.getItem(WELCOME_POP_KEY);
  if (seen === "1") return;

  // show only on index.html
  const grid = qs("grid");
  if (!grid) return;

  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h3>Neu hier?</h3>
      <p class="small">
        Registriere dich und sichere dir den Neukunden-Rabatt.
      </p>

      <div class="modalActions">
        <button class="btn" id="welcomeRegister">Registrieren & Rabatt sichern</button>
        <button class="btn-secondary" id="welcomeLogin">Oder anmelden (wenn du schon einen Account hast)</button>
        <button class="btn-secondary" id="welcomeGuest">Als Gast fortfahren</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function close(persistSeen = true) {
    if (persistSeen) localStorage.setItem(WELCOME_POP_KEY, "1");
    overlay.remove();
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(true); });

  overlay.querySelector("#welcomeRegister").addEventListener("click", () => {
    // Important: Do NOT auto-give discount unless they choose this path
    setCoupon("WELCOME10");
    toast("Neukunden-Code aktiviert: WELCOME10");
    close(true);
    location.href = "login.html#register";
  });

  overlay.querySelector("#welcomeLogin").addEventListener("click", () => {
    close(true);
    location.href = "login.html#login";
  });

  overlay.querySelector("#welcomeGuest").addEventListener("click", () => {
    close(true);
    toast("Als Gast fortgefahren");
  });
}

/* ---------- COOKIE BANNER ---------- */
function getCookieConsent(){ return (localStorage.getItem(COOKIE_CONSENT_KEY) || "").trim(); }
function setCookieConsent(v){ localStorage.setItem(COOKIE_CONSENT_KEY, v); }

function showCookieBanner() {
  const consent = getCookieConsent();
  if (consent === "necessary" || consent === "all") return;

  const wrap = document.createElement("div");
  wrap.className = "cookieBanner";
  wrap.innerHTML = `
    <div class="cookieCard" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
      <div class="cookieHeader">
        <div>
          <h3 class="cookieTitle">Cookies & Datenschutz</h3>
          <p class="cookieText">
            Wir nutzen notwendige Speicherfunktionen (Warenkorb, Login-Demo, Checkout-Status).
            Tracking ist in dieser Demo nicht aktiv.
          </p>
          <div class="cookieMini">
            Mehr Infos: <a href="cookies.html">Cookies</a> • <a href="datenschutz.html">Datenschutz</a> • <a href="agb.html">AGB</a> • <a href="impressum.html">Impressum</a>
          </div>
        </div>
        <div class="cookieActions">
          <button class="btn" id="cookieAcceptAll" type="button">Alle akzeptieren</button>
          <button class="btn-secondary" id="cookieNecessary" type="button">Nur notwendig</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  function close(){ wrap.remove(); }

  wrap.querySelector("#cookieAcceptAll").addEventListener("click", () => {
    setCookieConsent("all");
    toast("Cookie-Auswahl gespeichert");
    close();
  });

  wrap.querySelector("#cookieNecessary").addEventListener("click", () => {
    setCookieConsent("necessary");
    toast("Nur notwendige Cookies");
    close();
  });
}

/* ---------- BOOT ---------- */
setBrand();
updateCartCount();
renderIndex();
renderProduct();
renderCart();
renderLogin();
renderAddress();
showOfferPopup();
showWelcomeAuthPopup();
showCookieBanner();
syncNavAuthState();
