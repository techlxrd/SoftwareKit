const app = new Framework7({
  el: '#app',
  theme: 'ios',
  name: 'SoftwareKit',
  touch: { touchHighlight: true, tapHold: true },
  popup: { push: true, swipeToClose: 'to-bottom', destroyOnClose: true,},
  sheet: { push: true, swipeToClose: 'to-bottom' },
  colors: { primary: '#0071E3' },
  popover: { verticalPosition: 'auto' },
  serviceWorker: { path: './service-worker.js' },
});
let _popupTransitioning = false;
(function fixPopupStackingAndPush() {
  const root = app.el || document.body;
  let cleanupTimer = 0;

  const moveToFront = (el) => {
    if (!el || !el.parentElement) return;
    if (el.parentElement === root && el !== root.lastElementChild) {
      root.appendChild(el);
    }
  };

  const cleanupStuckPopupState = () => {
    requestAnimationFrame(() => {
      if (_popupTransitioning) return;
      const activePopups = root.querySelectorAll('.popup.modal-in, .popup.modal-out');
      if (activePopups.length === 0) {
        [document.documentElement, document.body, root].forEach((node) => {
          if (!node) return;
          node.classList.remove(
            'with-modal-popup',
            'with-modal-popup-push',
            'with-modal-popup-push-closing'
          );
        });
        root.querySelectorAll('.view, .views, .page-current').forEach((viewEl) => {
          viewEl.style.transform = '';
          viewEl.style.transitionDuration = '';
          viewEl.style.borderRadius = '';
        });
        root.querySelectorAll('.popup-backdrop.backdrop-in').forEach((bd) => {
          bd.classList.remove('backdrop-in');
        });
      }
    });
  };

  const origPopupOpen = app.popup.open.bind(app.popup);
  app.popup.open = function (target, animate) {
    let el = null;
    if (typeof target === 'string') el = document.querySelector(target);
    else if (target instanceof Element) el = target;
    else if (target && target.el) el = target.el;

    if (el && !el.classList.contains('modal-in')) {
      moveToFront(el);
    }
    return origPopupOpen(target, animate);
  };

  const origPopupCreate = app.popup.create.bind(app.popup);
  app.popup.create = function (...args) {
    const inst = origPopupCreate(...args);
    if (inst && typeof inst.open === 'function' && !inst.__skTopFix) {
      const origOpen = inst.open.bind(inst);
      inst.open = function (...openArgs) {
        if (inst.el && !inst.el.classList.contains('modal-in')) {
          moveToFront(inst.el);
        }
        return origOpen(...openArgs);
      };
      inst.__skTopFix = true;
    }
    return inst;
  };

  app.on('popupOpen', () => {
    clearTimeout(cleanupTimer);
  });

  app.on('popupClosed popupSwipeClose', () => {
    cleanupStuckPopupState();
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(cleanupStuckPopupState, 350);
  });
})();

const $ = Dom7;
const mainView = app.views.create('.view-main');

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const ESCAPE_TEST = /[&<>"']/;
const ESCAPE_G = /[&<>"']/g;
const escapeHtml = (val = '') => {
  const s = typeof val === 'string' ? val : String(val);
  return ESCAPE_TEST.test(s) ? s.replace(ESCAPE_G, c => ESCAPE_MAP[c]) : s;
};
const jsAttr = (val) => escapeHtml(JSON.stringify(val));
const wait = (ms = 350) => new Promise(r => setTimeout(r, ms));
const $id = (id) => document.getElementById(id);
const onIdle = window.requestIdleCallback
  ? (cb) => window.requestIdleCallback(cb, { timeout: 500 })
  : (cb) => setTimeout(cb, 16);

const _sharedRange = document.createRange();
const parseFrag = (html) => _sharedRange.createContextualFragment(html);

const ALLOWED_PROTOCOLS = /^(https?:|itms-services:|altstore:|sidestore:|feather:|scarlet:|esign:|trollstore:)/i;
const REL_PATH_RE = /^(\.\/|\/(?!\/)|assets\/|json\/)/i;
const FAST_HTTP_RE = /^https?:\/\/[^\s"'<>]+$/i;
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{3,8}$/;
const HEX6_RE = /^[0-9a-fA-F]{6}$/;
const HTTPS_RE = /^https:\/\//i;
const HTTP_OR_HTTPS_RE = /^https?:\/\//i;
const STRIP_PROTOCOL_RE = /^(https?:\/\/)+/i;
const TRAILING_SLASHES_RE = /\/+$/;
const NON_DIGIT_DOT_RE = /[^\d.]/g;
const NEWLINE_RE = /\n/g;
const HEAD_ELEM_SELECTOR = 'link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], link[rel="icon"]';
const POPOVER_MENU_SELECTOR = '.popover.popover-menu.modal-in, .popover.popover-menu.popover-in, .popover.popover-menu.active';

const _CACHE_MAX = 200;
const _REC_PH = '<!--SK:REC-->';
const _urlSanitizeCache = new Map();
const _libPopupTplCache = new Map();
const _repoPopupTplCache = new Map();
const _versionsSheetCache = new Map();
const _permsSheetCache = new Map();
const _permCache = new WeakMap();
const _mbCache = new Map();
const _repoDateCache = new Map();
const _normNewsLinkCache = new Map();
const _EMPTY_PERMS = Object.freeze({ privacy: [], entitlements: [], total: 0 });
const _INITIAL_LIST_CHUNK = 12;

const _dateFmt = typeof Intl !== 'undefined' && Intl.DateTimeFormat
  ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  : null;

function mountChunkedList(ulEl, itemsHtmlArray) {
  if (!ulEl || !itemsHtmlArray?.length) return;
  const total = itemsHtmlArray.length;
  let offset = _INITIAL_LIST_CHUNK;
  if (total <= offset) return;
  let rafId = 0;
  let timerId = 0;
  const pump = () => {
    if (!ulEl.isConnected) return;
    const end = Math.min(offset + 20, total);
    ulEl.appendChild(parseFrag(itemsHtmlArray.slice(offset, end).join('')));
    offset = end;
    if (offset < total) rafId = requestAnimationFrame(pump);
  };
  timerId = setTimeout(() => { rafId = requestAnimationFrame(pump); }, 32);
  return () => {
    clearTimeout(timerId);
    cancelAnimationFrame(rafId);
  };
}

function hydrateProgressive(popupEl, parts, getRecHtmlFn) {
  let cancelled = false;
  let raf1 = 0;
  let raf2 = 0;

  raf1 = requestAnimationFrame(() => {
    if (cancelled) return;
    const slot = popupEl?.querySelector('.deferred-body-slot');
    if (!slot || !slot.isConnected) return;

    const firstPass = (parts.screenshots || '') + (parts.desc || '') + '<div class="deferred-tail-slot"></div>';
    slot.replaceWith(parseFrag(firstPass));

    raf2 = requestAnimationFrame(() => {
      if (cancelled) return;
      const tail = popupEl?.querySelector('.deferred-tail-slot');
      if (!tail || !tail.isConnected) return;
      const secondPass = (parts.details || '') + (getRecHtmlFn ? getRecHtmlFn() : '');
      if (secondPass) tail.replaceWith(parseFrag(secondPass));
      else tail.remove();
    });
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
  };
}

function sanitizeUrl(raw, fallback = '#') {
  if (!raw) return fallback;
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (!s) return fallback;
  const cacheKey = `${s}|${fallback}`;
  const cached = _urlSanitizeCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let res = fallback;
  const c0 = s.charCodeAt(0);
  if ((c0 === 46 || c0 === 47) && REL_PATH_RE.test(s)) {
    res = s;
  } else if (FAST_HTTP_RE.test(s)) {
    res = s;
  } else if (REL_PATH_RE.test(s)) {
    res = s;
  } else {
    try {
      const u = new URL(s, window.location.origin);
      if (ALLOWED_PROTOCOLS.test(u.protocol)) res = u.href;
    } catch {}
  }

  if (_urlSanitizeCache.size > 1000) _urlSanitizeCache.clear();
  _urlSanitizeCache.set(cacheKey, res);
  return res;
}

const store = {
  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const val = JSON.parse(raw);
      return Array.isArray(fallback) ? (Array.isArray(val) ? val : fallback) : (val ?? fallback);
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
};

const showToast = (text, icon, closeTimeout = 1500, position = 'center') =>
  app.toast.create({ text, ...(icon && { icon: `<i class="f7-icons">${icon}</i>` }), position, closeTimeout }).open();

function safeShare(data) {
  if (navigator.share) {
    navigator.share(data).catch(() => {});
  } else if (navigator.clipboard && data?.url) {
    navigator.clipboard.writeText(data.url).then(() => showToast('Link copied!', null, 1500)).catch(() => {});
  }
}

const vlSearch = (key, cachedLowerKey) => (query, list) => {
  const q = (query || '').trim().toLowerCase();
  const len = list.length;
  if (!q) {
    const res = new Array(len);
    for (let i = 0; i < len; i++) res[i] = i;
    return res;
  }
  const res = [];
  for (let i = 0; i < len; i++) {
    const item = list[i];
    const target = cachedLowerKey && item?.[cachedLowerKey] !== undefined
      ? item[cachedLowerKey]
      : String(item?.[key] || '').toLowerCase();
    if (target.includes(q)) res.push(i);
  }
  return res;
};

function getRandomItems(pool, key, currentVal, limit = 5) {
  const len = pool?.length || 0;
  if (len <= 1) return [];
  const target = String(currentVal || '');
  const result = [];
  let count = 0;
  for (let i = 0; i < len; i++) {
    const item = pool[i];
    if (!item || item.skeleton || String(item[key] || '') === target) continue;
    if (count < limit) result.push(item);
    else {
      const j = (Math.random() * (count + 1)) | 0;
      if (j < limit) result[j] = item;
    }
    count++;
  }
  return result;
}

function getActiveSearchQuery(sb, sbEl, scopeEl) {
  if (sb?.query) {
    const q = String(sb.query).trim();
    if (q) return q.toLowerCase();
  }
  const root = scopeEl || sbEl?.closest('.page') || document;
  const inputs = root.querySelectorAll('.searchbar input[type="search"]');
  for (let i = 0; i < inputs.length; i++) {
    const v = inputs[i].value.trim();
    if (v) return v.toLowerCase();
  }
  return '';
}

function updateListSearch({ vl, listEl, notFoundEl, sb, sbEl, items, key, cachedLowerKey, queryOverride }) {
  if (!vl) return;
  const q = queryOverride !== undefined
    ? String(queryOverride || '').trim().toLowerCase()
    : getActiveSearchQuery(sb, sbEl, listEl?.closest('.page'));

  if (vl.items !== items) {
    vl.replaceAllItems(items);
  }

  let visible = items.length > 0;
  if (q) {
    const matched = [];
    for (let i = 0, len = items.length; i < len; i++) {
      const item = items[i];
      const val = cachedLowerKey && item?.[cachedLowerKey] !== undefined
        ? item[cachedLowerKey]
        : String(item?.[key] || '').toLowerCase();
      if (val.includes(q)) matched.push(i);
    }
    vl.filterItems(matched);
    visible = matched.length > 0;
  } else if (vl.filteredItems && vl.filteredItems.length !== items.length) {
    vl.resetFilter?.();
  }
  if (listEl) {
    const d = visible ? '' : 'none';
    if (listEl.style.display !== d) listEl.style.display = d;
  }
  if (notFoundEl) {
    const d = visible ? 'none' : 'block';
    if (notFoundEl.style.display !== d) notFoundEl.style.display = d;
  }
}

function normalizeCategory(val, fallback = 'Other') {
  if (!val) return fallback;
  const clean = typeof val === 'string' ? val.trim() : String(val).trim();
  if (!clean) return fallback;
  const c0 = clean.charCodeAt(0);
  return (c0 >= 97 && c0 <= 122) ? String.fromCharCode(c0 - 32) + clean.slice(1) : clean;
}

function renderCategoryPills(barEl, items, getCatFn, activeCategory, onSelect) {
  if (!barEl) return 'All';
  const counts = new Map();
  const displayNames = new Map();
  let validTotal = 0;

  for (let i = 0, len = items.length; i < len; i++) {
    const item = items[i];
    if (!item || item.skeleton) continue;
    validTotal++;
    const rawCat = item._normCat !== undefined && getCatFn === _defaultCatGetter
      ? item._normCat
      : normalizeCategory(getCatFn(item));
    const key = item._normCatLower !== undefined && getCatFn === _defaultCatGetter
      ? item._normCatLower
      : rawCat.toLowerCase();
    let label = displayNames.get(key);
    if (!label) {
      label = rawCat;
      displayNames.set(key, label);
    }
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  const sorted = [...counts.keys()].sort((a, b) =>
    a.toLowerCase() === 'other' ? 1 : b.toLowerCase() === 'other' ? -1 : a.localeCompare(b)
  );

  if (sorted.length <= 1) {
    if (barEl.style.display !== 'none') barEl.style.display = 'none';
    if (barEl.innerHTML !== '') barEl.innerHTML = '';
    return 'All';
  }

  const validActive = (activeCategory === 'All' || counts.has(activeCategory)) ? activeCategory : 'All';
  if (barEl.style.display !== 'flex') barEl.style.display = 'flex';

  const parts = new Array(sorted.length + 1);
  parts[0] = `<button type="button" class="category-pill ${validActive === 'All' ? 'active' : ''}" data-category="All"><span>All</span><span class="badge">${validTotal}</span></button>`;
  for (let i = 0; i < sorted.length; i++) {
    const cat = sorted[i];
    parts[i + 1] = `<button type="button" class="category-pill ${cat === validActive ? 'active' : ''}" data-category="${escapeHtml(cat)}"><span>${escapeHtml(cat)}</span><span class="badge">${counts.get(cat) || 0}</span></button>`;
  }
  const newHtml = parts.join('');
  if (barEl._lastHtml !== newHtml) {
    barEl.innerHTML = newHtml;
    barEl._lastHtml = newHtml;
  }

  if (!barEl.dataset.listenerAttached) {
    barEl.addEventListener('click', (e) => {
      const btn = e.target instanceof Element ? e.target.closest('.category-pill') : null;
      if (!btn || !barEl._onSelect) return;
      const selected = btn.dataset.category || 'All';
      const activePrev = barEl.querySelector('.category-pill.active');
      if (activePrev === btn) return;
      if (activePrev) activePrev.classList.remove('active');
      btn.classList.add('active');
      barEl.scrollTo({ left: Math.max(0, btn.offsetLeft - (barEl.clientWidth / 2) + (btn.offsetWidth / 2)), behavior: 'smooth' });
      barEl._onSelect(selected);
    });
    barEl.dataset.listenerAttached = 'true';
  }
  barEl._onSelect = onSelect;
  return validActive;
}
const _defaultCatGetter = (item) => item.category;

const cachedData = { favorites: null, favSet: null, favOrder: null, readLater: null };
const clearCache = (keys = ['favorites', 'favSet', 'favOrder', 'readLater']) => {
  for (let i = 0; i < keys.length; i++) cachedData[keys[i]] = null;
};

const locks = new Set();
const foundResizeObservers = new WeakMap();
const rootScrollHandlers = new WeakMap();
const repoDetailSwipeBackStates = new WeakMap();

const inAllowedArea = (t) =>
  t instanceof Element && !!t.closest('#searchTab, .category-filter, .category-filter-bar, .searchbar-found, .dialog, .popup, .sheet-modal, .popover, .searchbar, .searchbar-bottom-wrap, .subnavbar, .navbar');

const isRepoDetailPage = (p) =>
  p instanceof Element && p.matches('#repoDetailPage, #repo-detail, [data-name="repo-detail"], [data-page="repo-detail"], .page-repo-detail');

const getPageFromArg = (a) =>
  a instanceof Element ? a : (a?.el instanceof Element ? a.el : a?.pageEl instanceof Element ? a.pageEl : a?.currentPageEl instanceof Element ? a.currentPageEl : null);

const getSearchbarEnabled = (sb) =>
  sb ? (typeof sb.enabled === 'boolean' ? sb.enabled : typeof sb.active === 'boolean' ? sb.active : !!(sb.el?.classList.contains('searchbar-enabled') || sb.el?.classList.contains('searchbar-active'))) : false;

const preventBackgroundScroll = (e) => {
  if (e.cancelable && e.target instanceof Element && !inAllowedArea(e.target)) e.preventDefault();
};
const preventDialogScroll = (e) => {
  const t = e.target;
  if (e.cancelable && t instanceof Element && (t.classList.contains('dialog-backdrop') || t.closest('.dialog'))) e.preventDefault();
};

function toggleBodyLock(lock) {
  document.documentElement.classList.toggle('ui-scroll-locked', lock);
  document.body.classList.toggle('ui-scroll-locked', lock);
  const method = lock ? 'addEventListener' : 'removeEventListener';
  const opts = lock ? { passive: false, capture: true } : true;
  document[method]('touchmove', preventBackgroundScroll, opts);
  document[method]('wheel', preventBackgroundScroll, opts);
}

function syncRepoDetailSwipeBack(searchbar, enable) {
  const page = searchbar?.el?.closest('.page');
  if (!page || !isRepoDetailPage(page)) return;
  const view = page.view || app.views.current;
  if (!view) return;
  if (enable) {
    if (!repoDetailSwipeBackStates.has(view)) repoDetailSwipeBackStates.set(view, !!view.params?.iosSwipeBack);
    if (view.params) view.params.iosSwipeBack = false;
  } else {
    const prev = repoDetailSwipeBackStates.get(view);
    if (prev != null && view.params) {
      view.params.iosSwipeBack = prev;
      repoDetailSwipeBackStates.delete(view);
    }
  }
  if ('allowPageSwipeBack' in view) view.allowPageSwipeBack = !enable;
  view.el?.classList.toggle('repo-detail-swipeback-locked', enable);
}

function blockRepoDetailSwipeBack(...args) {
  let page = null;
  for (let i = 0; i < args.length; i++) {
    page = getPageFromArg(args[i]);
    if (page) break;
  }
  if (!page) page = document.querySelector('.page-current');
  if (!page || !isRepoDetailPage(page)) return;
  const sbEls = page.querySelectorAll('.searchbar');
  let anyEnabled = false;
  for (let i = 0; i < sbEls.length; i++) {
    if (getSearchbarEnabled(app.searchbar.get(sbEls[i]))) { anyEnabled = true; break; }
  }
  if (!anyEnabled) return;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (typeof a?.preventDefault === 'function') a.preventDefault();
    if (a && typeof a === 'object' && 'prevent' in a) a.prevent = true;
  }
  return false;
}

function syncSearchbarFound(searchbar, enable) {
  const page = searchbar?.el?.closest('.page');
  const found = page?.querySelector('.searchbar-found');
  if (!found) return;
  if (!found.closest('#searchTab') && !page.classList.contains('page-with-bottom-search')) {
    found.style.cssText = '';
    return;
  }

  found.classList.toggle('ptr-ignore', enable);
  found.classList.toggle('ptr-watch-scrollable', enable);

  if (enable) {
    Object.assign(found.style, {
      overflowY: 'auto',
      webkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain',
      touchAction: 'pan-y',
      minHeight: '0',
      maxHeight: ''
    });

    if (searchbar.el.classList.contains('searchbar-expandable')) {
      if (foundResizeObservers.has(found)) {
        requestAnimationFrame(() => {
          if (!found.isConnected) return;
          const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          found.style.maxHeight = `${Math.max(120, vh - found.getBoundingClientRect().top - 12)}px`;
        });
        return;
      }
      const updateHeight = () => {
        if (!found.isConnected) return;
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        found.style.maxHeight = `${Math.max(120, vh - found.getBoundingClientRect().top - 12)}px`;
      };
      const observer = new ResizeObserver(() => requestAnimationFrame(updateHeight));
      observer.observe(found);
      foundResizeObservers.set(found, observer);
      requestAnimationFrame(updateHeight);
    }
  } else {
    found.style.cssText = '';
    foundResizeObservers.get(found)?.disconnect();
    foundResizeObservers.delete(found);
  }
}

function syncSearchScrollRoot(searchbar, enable) {
  const root = searchbar?.el?.closest('.page')?.querySelector('#searchTab');
  if (!root) return;

  root.classList.toggle('ptr-ignore', enable);
  root.classList.toggle('ptr-watch-scrollable', enable);

  if (enable) {
    Object.assign(root.style, { overscrollBehavior: 'contain', touchAction: 'pan-y', webkitOverflowScrolling: 'touch' });
    if (rootScrollHandlers.has(root)) return;

    let startY = 0;
    const checkBounds = (e, delta) => {
      if (!(e.target instanceof Element) || !root.contains(e.target) || e.target.closest('.category-filter, .category-filter-bar')) return;
      const atTop = root.scrollTop <= 0;
      const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 1;
      if (((atTop && delta > 0) || (atBottom && delta < 0)) && e.cancelable) e.preventDefault();
    };
    const onTouchStart = (e) => { if (e.touches?.[0]) startY = e.touches[0].clientY; };
    const onTouchMove = (e) => { if (e.touches?.[0]) checkBounds(e, e.touches[0].clientY - startY); };
    const onWheel = (e) => checkBounds(e, -e.deltaY);

    root.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    root.addEventListener('wheel', onWheel, { passive: false, capture: true });
    rootScrollHandlers.set(root, { onTouchStart, onTouchMove, onWheel });
  } else {
    Object.assign(root.style, { overscrollBehavior: '', touchAction: '', webkitOverflowScrolling: '' });
    const h = rootScrollHandlers.get(root);
    if (h) {
      root.removeEventListener('touchstart', h.onTouchStart, true);
      root.removeEventListener('touchmove', h.onTouchMove, true);
      root.removeEventListener('wheel', h.onWheel, true);
      rootScrollHandlers.delete(root);
    }
  }
}

app.on('dialogOpen', () => {
  document.addEventListener('touchmove', preventDialogScroll, { passive: false, capture: true });
  document.addEventListener('wheel', preventDialogScroll, { passive: false, capture: true });
});
app.on('dialogClose', () => {
  if (!document.querySelector('.dialog.modal-in')) {
    document.removeEventListener('touchmove', preventDialogScroll, true);
    document.removeEventListener('wheel', preventDialogScroll, true);
  }
});

app.on('swipeback:beforechange', blockRepoDetailSwipeBack);

const handleSearchbarState = (sb, active) => {
  syncSearchbarFound(sb, active);
  syncSearchScrollRoot(sb, active);
  syncRepoDetailSwipeBack(sb, active);
};
app.on('searchbarEnable', (sb) => {
  handleSearchbarState(sb, true);
  locks.add('search');
  if (locks.size === 1) toggleBodyLock(true);
});

let _searchRAF = 0;
app.on('searchbarSearch', (sb, query) => {
  if (!sb?.el || sb.el.closest('[data-name="repo-detail"]')) return;
  if (_searchRAF) cancelAnimationFrame(_searchRAF);
  _searchRAF = requestAnimationFrame(() => {
    _searchRAF = 0;
    applyLibrarySearchAndFilter(libraryCategory, query);
  });
});
app.on('searchbarClear', (sb) => {
  if (sb?.el && !sb.el.closest('[data-name="repo-detail"]')) {
    applyLibrarySearchAndFilter(libraryCategory, '');
  }
});
app.on('searchbarDisable', (sb) => {
  handleSearchbarState(sb, false);
  locks.delete('search');
  if (!locks.size) toggleBodyLock(false);
  if (sb?.el && !sb.el.closest('[data-name="repo-detail"]')) {
    requestAnimationFrame(() => applyLibrarySearchAndFilter(libraryCategory, ''));
  }
});

let _currentLibraryAppTitles = null;
app.on('tabHide', (tabEl) => {
  if (tabEl.querySelector('.virtual-list') && _currentLibraryAppTitles) {
    store.set('seen_apps', _currentLibraryAppTitles);
    const badges = document.querySelectorAll('.tweaksnumber');
    for (let i = 0; i < badges.length; i++) badges[i].classList.add('display-none');
  }
});

const searchFab = $id('search-fab');
const addSourceFab = $id('add-source-fab');

const setFabState = (fab, show) => {
  if (!fab || fab._shown === show) return;
  fab._shown = show;
  const s = fab.style;
  s.opacity = show ? '1' : '0';
  s.transform = show ? 'scale(1)' : 'scale(0.8)';
  s.pointerEvents = show ? 'auto' : 'none';
};

let _currentActiveTabId = 'homeTab';
const updateFabs = () => {
  setFabState(searchFab, _currentActiveTabId === 'searchTab');
  setFabState(addSourceFab, _currentActiveTabId === 'sourcesTab');
};
const scheduleUpdateFabs = () => requestAnimationFrame(updateFabs);

function goToTab(tabId) {
  app.popup.close();
  app.tab.show(tabId);
}
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const applyDarkMode = (e) => document.documentElement.classList.toggle('dark', e.matches);
darkModeQuery.addEventListener('change', applyDarkMode);
applyDarkMode(darkModeQuery);

const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
const isiPad = isMac && navigator.maxTouchPoints > 1;
const isMacDesktop = isMac && !isiPad;

let cachedOSVersion = null;
function getIOSVersion() {
  if (cachedOSVersion !== null) return cachedOSVersion;
  const ua = navigator.userAgent;
  if (isiPad) {
    const m = ua.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/i);
    return (cachedOSVersion = 'iPadOS ' + (m ? m.slice(1).filter(Boolean).join('.') : 'Unknown'));
  }
  const ios = ua.match(/(iPhone|iPod|iPad).*? OS (\d+)_?(\d+)?_?(\d+)?/i);
  if (ios) return (cachedOSVersion = (ios[1] === 'iPad' ? 'iPadOS ' : 'iOS ') + ios.slice(2).filter(Boolean).join('.'));
  const mac = ua.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/i);
  return (cachedOSVersion = mac ? 'macOS ' + mac.slice(1).filter(Boolean).join('.') : 'Unknown');
}

const osVerEl = $id('os-version');
if (osVerEl) {
  const ver = getIOSVersion();
  osVerEl.textContent = ver === 'Unknown' ? '' : ver;
}

if (isMacDesktop) {
  document.documentElement.classList.add('device-mac-desktop');
  const hideEls = document.querySelectorAll('.macos-hide');
  for (let i = 0; i < hideEls.length; i++) hideEls[i].style.display = 'none';
  const showEls = document.querySelectorAll('.macos-show');
  for (let i = 0; i < showEls.length; i++) showEls[i].style.display = 'block';
  const installEls = document.querySelectorAll('.install');
  for (let i = 0; i < installEls.length; i++) installEls[i].classList.add('display-none');
} else if (navigator.standalone) {
  const preloaderDialog = app.dialog.preloader('Reloading data');
  preloaderDialog.open();
  setTimeout(() => preloaderDialog.close(), 1200);
  document.documentElement.classList.add('standalone');
} else {
  app.popup.open('#hs');
}

let pollTimer = null;
function postRequest() {
  const requestId = crypto.randomUUID
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('pendingRequestID', requestId);
  app.dialog.preloader('Waiting for registration…');
  window.location.href = `https://api.udid.swkit.app/get-profile?requestId=${encodeURIComponent(requestId)}`;
  startPolling(requestId);
}

function startPolling(id) {
  clearInterval(pollTimer);
  let attempts = 0;
  pollTimer = setInterval(async () => {
    if (++attempts > 60) {
      clearInterval(pollTimer);
      app.dialog.close();
      return;
    }
    try {
      const res = await fetch(`https://api.udid.swkit.app/retrieve?requestId=${encodeURIComponent(id)}`);
      const { deviceInfo } = await res.json();
      if (deviceInfo) {
        clearInterval(pollTimer);
        store.set('deviceInfo', deviceInfo);
        localStorage.removeItem('pendingRequestID');
        renderDeviceData(deviceInfo);
      }
    } catch {}
  }, 2000);
}

const formatLabel = (key) => {
  const k = String(key);
  const kl = k.toLowerCase();
  return (kl === 'bdid' || kl === 'cpid') ? k.toUpperCase() : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const SKIP_DEVICE_KEYS = new Set(['udid', 'registered', 'model', 'name', 'devicename', 'systemversion', 'version']);
function renderDeviceData(deviceInfo) {
  $id('udid-info-block')?.style.setProperty('display', 'none', 'important');
  const container = $id('device-container');
  if (!container || !deviceInfo) return;

  const udid = deviceInfo.udid || deviceInfo.UDID || '';
  const modelName = deviceInfo.name || deviceInfo.DeviceName || 'iPhone';
  const modelIdentifier = deviceInfo.model || 'Unknown';

  let extraRows = '';
  for (const k in deviceInfo) {
    const v = deviceInfo[k];
    if (!v || SKIP_DEVICE_KEYS.has(k.toLowerCase())) continue;
    extraRows += `<li><div class="item-content"><div class="item-inner"><div class="item-title">${escapeHtml(formatLabel(k))}</div><div class="item-after">${escapeHtml(v)}</div></div></div></li>`;
  }

  container.innerHTML = `
    <div class="list media-list list-strong list-dividers inset">
      <ul>
        <li>
          <div class="item-content">
            <div class="item-media"><i class="f7-icons" style="font-size:63px;">device_phone_portrait</i></div>
            <div class="item-inner">
              <div class="item-title">${escapeHtml(modelName)}</div>
              <div class="item-subtitle">${escapeHtml(getIOSVersion())}</div>
            </div>
          </div>
        </li>
        <li class="item-content item-input">
          <div class="item-inner">
            <div class="item-title item-label">UDID</div>
            <div class="item-input-wrap"><input type="text" id="udidInput" readonly value="${escapeHtml(udid)}"></div>
          </div>
          <a id="copyUdidBtn"><i class="f7-icons">doc_on_clipboard_fill</i></a>
        </li>
      </ul>
    </div>
    <div class="list list-strong list-dividers inset">
      <ul>
        <li><div class="item-content"><div class="item-inner"><div class="item-title">Model name</div><div class="item-after">${escapeHtml(modelIdentifier)}</div></div></div></li>
        ${extraRows}
      </ul>
    </div>
    <div class="block">
      <a class="button button-large button-fill button-round color-red" id="removeDeviceBtn">Remove Device Data</a>
    </div>`;

  $id('copyUdidBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(udid);
      showToast('UDID copied', null, 2000, 'bottom');
    } catch {
      $id('udidInput')?.select();
      document.execCommand('copy');
    }
  });

  $id('removeDeviceBtn')?.addEventListener('click', () => {
    app.dialog.confirm('Remove stored device data?', () => {
      localStorage.removeItem('deviceInfo');
      location.reload();
    });
  });

  app.dialog.close();
}

let themeColor = localStorage.getItem('ios-primary-color') || '#0071E3';
let colorPicker;

function setCustomColor(newColor) {
  if (!HEX_COLOR_RE.test(newColor)) return;
  themeColor = newColor;
  app.setColorTheme(newColor);
  const indicator = $id('accent-color');
  if (indicator) indicator.style.backgroundColor = newColor;
  localStorage.setItem('ios-primary-color', newColor);
}

function openReportPopup(appName) {
  const input = $id('report-app-name');
  if (!input) return;
  input.value = appName;
  app.popup.open('#report-app');
}

const FORM_COOLDOWN_MS = 60000;
const MIN_FILL_TIME_MS = 2800;
const MAX_STORED_HASHES = 15;
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getnada.com', 'maildrop.cc', 'throwawaymail.com', 'dispostable.com',
  'fakeinbox.com', 'mailnesia.com', 'mohmal.com', 'tempail.com',
  'emailondeck.com', 'burnermail.io', 'mytemp.email', 'tempmailo.com',
  'guerrillamailblock.com', 'grr.la', 'pokemail.net', 'spam4.me',
  'trashmail.net', 'mailcatch.com', 'mintemail.com', 'tempinbox.com'
]);

const EMAIL_RE = /^[a-zA-Z0-9._%+-]{2,64}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/;
const REPEATED_CHARS_RE = /(.)\1{4,}/i;
const CONSONANT_CLUSTER_RE = /[bcdfghjklmnpqrstvwxz]{6,}/i;
const KEYBOARD_MASH_RE = /(asdf|qwer|zxcv|hjkl|yuio|jkli|dfgh|cvbn|12345|abcde|poiuy|lkjhg|mnbvc)/i;
const URL_IN_TEXT_RE = /(https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,})/i;
const SPAM_PHRASES_RE = /\b(buy now|free money|crypto|bitcoin|casino|viagra|telegram|whatsapp|click here|earn fast|seo service)\b/i;

const formOpenTimestamps = new WeakMap();
const formInteracted = new WeakSet();

function isGibberishText(str, minLen = 2) {
  const clean = String(str || '').replace(/\s+/g, ' ').trim();
  if (clean.length < minLen || REPEATED_CHARS_RE.test(clean)) return true;

  const letters = clean.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 4) {
    if (CONSONANT_CLUSTER_RE.test(letters) || (KEYBOARD_MASH_RE.test(letters) && letters.length < 22)) return true;
    let vowels = 0;
    for (let i = 0; i < letters.length; i++) {
      const c = letters.charCodeAt(i) | 32;
      if (c === 97 || c === 101 || c === 105 || c === 111 || c === 117 || c === 121) vowels++;
    }
    const ratio = vowels / letters.length;
    if (letters.length >= 7 && (ratio < 0.13 || ratio > 0.85)) return true;
  }

  const words = clean.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const uniqueWords = new Set(words);
    if (uniqueWords.size === 1 || (words.length >= 6 && uniqueWords.size <= 2)) return true;
  }

  return clean.length >= 10 && new Set(clean.toLowerCase().replace(/\s/g, '')).size <= 3;
}

function isValidEmail(raw) {
  const email = String(raw || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.includes('..')) return false;
  const at = email.indexOf('@');
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain || local.startsWith('.') || local.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return false;
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${d}`)) return false;
  }
  if (/^(test|admin|user|asdf|qwer|none|null|fake|spam|1234|noemail|noreply|abc)+$/i.test(local)) return false;
  if (local.length >= 6 && isGibberishText(local, 3)) return false;
  return domain !== 'example.com' && domain !== 'test.com' && domain !== 'something.com' && domain !== 'domain.com' && domain !== 'email.com' && domain !== 'mail.com';
}

function isValidHttpUrl(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') &&
      u.hostname.includes('.') && !u.hostname.endsWith('.') &&
      !['example.com', 'test.com', 'localhost', '127.0.0.1'].includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function getFieldValue(form, data, name) {
  const fromData = data.get(name);
  if (fromData !== null && String(fromData).trim() !== '') return String(fromData).trim();
  const el = form.querySelector(`[name="${CSS.escape ? CSS.escape(name) : name}"]`);
  return el ? String(el.value || '').trim() : '';
}

function validateFormPayload(form, formId) {
  const honey = form.querySelector('input[name="_honey"], input[name="honeypot"], input[name="website"]');
  if (honey && honey.value.trim() !== '') {
    return { title: 'Spam Detected', message: 'Automated spam submission detected.' };
  }

  const data = new FormData(form);
  const email = getFieldValue(form, data, 'Email');

  if (!email) return { title: 'Missing Email', message: 'Please enter your email address before submitting.' };
  if (!isValidEmail(email)) return { title: 'Invalid Email', message: 'Please enter a valid, real email address (temporary or fake emails are not allowed).' };

  if (formId === 'report-form') {
    const appName = getFieldValue(form, data, 'iOS App Name');
    const reason = getFieldValue(form, data, 'Reason');
    const feedback = getFieldValue(form, data, 'Feedback');

    if (!appName) return { title: 'Missing App Name', message: 'The application name is missing. Please reopen the report popup from an app.' };
    if (isGibberishText(appName, 2)) return { title: 'Invalid App Name', message: 'The application name appears to be invalid.' };
    if (!reason) return { title: 'Missing Selection', message: 'Please select a report reason from the list.' };
    if (!['Malicious', 'Outdated', 'Not working', 'Takedown request', 'Other'].includes(reason)) return { title: 'Invalid Selection', message: 'Please select a valid report reason.' };
    if (!feedback) return { title: 'Missing Description', message: 'Please describe the issue with this application before submitting.' };
    if (feedback.length < 12 || feedback.split(/\s+/).filter(Boolean).length < 3) return { title: 'Description Too Short', message: 'Please provide a clearer description (at least 3 words and 12 characters).' };
    if (isGibberishText(feedback, 12) || SPAM_PHRASES_RE.test(feedback) || URL_IN_TEXT_RE.test(feedback)) {
      return { title: 'Spam Protection', message: 'Your report description contains invalid text, links, or recognizable spam patterns. Please write a clear description.' };
    }
  } else if (formId === 'feedback-form') {
    const type = getFieldValue(form, data, 'Feedback type');
    const feedback = getFieldValue(form, data, 'iOS Feedback');

    if (!type) return { title: 'Missing Selection', message: 'Please select a feedback type (Issue/Bug, Feature request, or Other).' };
    if (!['Issue/Bug', 'Feature request', 'Other'].includes(type)) return { title: 'Invalid Selection', message: 'Please select a valid feedback type.' };
    if (!feedback) return { title: 'Missing Feedback', message: 'Please write your feedback message before submitting.' };
    if (feedback.length < 12 || feedback.split(/\s+/).filter(Boolean).length < 3) return { title: 'Feedback Too Short', message: 'Please write a more detailed feedback message (at least 3 words and 12 characters).' };
    if (isGibberishText(feedback, 12) || SPAM_PHRASES_RE.test(feedback) || URL_IN_TEXT_RE.test(feedback)) {
      return { title: 'Spam Protection', message: 'Your feedback appears to contain random characters, links, or spam. Please write a clear message.' };
    }
  } else if (formId === 'appsubmit-form') {
    const appName = getFieldValue(form, data, 'iOS App Name');
    const appUrl = getFieldValue(form, data, 'App Name');
    const type = getFieldValue(form, data, 'Type');
    const platform = getFieldValue(form, data, 'Platform');
    const extra = getFieldValue(form, data, 'Additional info');

    if (!appName) return { title: 'Missing App Name', message: 'Please enter the name of the application you want to submit.' };
    if (appName.length < 2 || appName.length > 60 || isGibberishText(appName, 2)) return { title: 'Invalid App Name', message: 'Please enter a valid application name (between 2 and 60 characters).' };
    if (!appUrl) return { title: 'Missing Link', message: 'Please enter the application download or store URL.' };
    if (!isValidHttpUrl(appUrl)) return { title: 'Invalid Link', message: 'Please enter a valid URL starting with https:// or http://' };
    if (!type) return { title: 'Missing Selection', message: 'Please select the application type (App Store Application, iPA File, or Website).' };
    if (!['App Store Application', 'iPA File', 'Website'].includes(type)) return { title: 'Invalid Selection', message: 'Please select a valid application type.' };
    if (!platform) return { title: 'Missing Selection', message: 'Please select a target platform (iOS or macOS).' };
    if (!['iOS', 'macOS'].includes(platform)) return { title: 'Invalid Selection', message: 'Please select a valid platform (iOS or macOS).' };
    if (extra && (extra.length < 4 || isGibberishText(extra, 4) || SPAM_PHRASES_RE.test(extra))) {
      return { title: 'Invalid Additional Info', message: 'Additional info appears to contain random or invalid text.' };
    }
  }

  if (!formInteracted.has(form)) return { title: 'Verification Required', message: 'Please fill out the form fields directly before submitting.' };

  const openedAt = formOpenTimestamps.get(form) || 0;
  if (openedAt && (Date.now() - openedAt) < MIN_FILL_TIME_MS) return { title: 'Slow Down', message: 'You are submitting too fast. Please take a moment to review your entries.' };

  const lastSubmit = Number(localStorage.getItem('sk_last_form_submit') || 0);
  const remainingSec = Math.ceil((FORM_COOLDOWN_MS - (Date.now() - lastSubmit)) / 1000);
  if (lastSubmit && remainingSec > 0) return { title: 'Cooldown Active', message: `Please wait ${remainingSec} seconds before sending another submission.` };

  const sig = `${formId}|` + [...data.entries()]
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `${k}:${String(v).trim().toLowerCase()}`)
    .join('|');

  const recentHashes = store.get('sk_form_hashes', []);
  if (localStorage.getItem('sk_last_form_hash') === sig || recentHashes.includes(sig)) {
    return { title: 'Duplicate Submission', message: 'You have already sent this exact submission.' };
  }

  form._pendingSignature = sig;
  return null;
}

function attachAjaxForm({ formId, confirmMessage, successMessage, closePopup }) {
  const form = $id(formId);
  if (!form) return;

  form.setAttribute('novalidate', 'novalidate');
  form.noValidate = true;

  if (!form.querySelector('input[name="_honey"]')) {
    const honey = document.createElement('input');
    honey.type = 'text';
    honey.name = '_honey';
    honey.tabIndex = -1;
    honey.autocomplete = 'off';
    honey.setAttribute('aria-hidden', 'true');
    honey.style.cssText = 'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;';
    form.appendChild(honey);
  }

  const markInteracted = () => {
    formInteracted.add(form);
    if (!formOpenTimestamps.has(form)) formOpenTimestamps.set(form, Date.now());
  };
  const markOpts = { passive: true };
  ['pointerdown', 'keydown', 'touchstart', 'input', 'change'].forEach(evt => form.addEventListener(evt, markInteracted, markOpts));

  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (form._isSubmitting) return;

    const validationError = validateFormPayload(form, formId);
    if (validationError) {
      app.dialog.alert(validationError.message, validationError.title || 'Incomplete Form');
      return;
    }

    app.dialog.confirm(confirmMessage, 'Confirm Submission', async () => {
      form._isSubmitting = true;
      submitBtn?.classList.add('button-loading');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const cleanData = new FormData();
        for (const [k, v] of new FormData(form).entries()) {
          if (k === '_honey' && !String(v).trim()) continue;
          cleanData.append(k, typeof v === 'string' ? v.trim() : v);
        }
        const res = await fetch(form.getAttribute('action'), {
          method: 'POST',
          body: cleanData,
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(res.statusText);
        await res.json();

        localStorage.setItem('sk_last_form_submit', String(Date.now()));
        if (form._pendingSignature) {
          localStorage.setItem('sk_last_form_hash', form._pendingSignature);
          const hashes = store.get('sk_form_hashes', []);
          hashes.push(form._pendingSignature);
          store.set('sk_form_hashes', hashes.slice(-MAX_STORED_HASHES));
        }

        app.dialog.alert(successMessage, 'Success', () => {
          form.reset();
          form.querySelectorAll('.smart-select').forEach(ssEl => app.smartSelect.get(ssEl)?.setValue([]));
          formInteracted.delete(form);
          if (closePopup) app.popup.close(closePopup);
        });
      } catch {
        app.dialog.alert('Failed to send submission. Please check your internet connection and try again.', 'Error');
      } finally {
        form._isSubmitting = false;
        submitBtn?.classList.remove('button-loading');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

[
  { formId: 'report-form', confirmMessage: 'Are you sure you want to send this report?', successMessage: 'Thanks for the feedback!', closePopup: '#report-app' },
  { formId: 'feedback-form', confirmMessage: 'Are you sure you want to send this feedback?', successMessage: 'Thanks for the feedback!', closePopup: '#feedback' },
  { formId: 'appsubmit-form', confirmMessage: 'Are you sure you want to submit this application?', successMessage: 'Thanks for the submission! We will review it as soon as possible', closePopup: '#appsubmit' }
].forEach(attachAjaxForm);

let _activePhotoBrowser = null;
function openPhotoBrowser(screenshotUrls) {
  if (_activePhotoBrowser) return;

  if (typeof screenshotUrls === 'string') {
    try { screenshotUrls = JSON.parse(screenshotUrls); } catch { screenshotUrls = []; }
  }
  const photos = [];
  if (Array.isArray(screenshotUrls)) {
    for (let i = 0; i < screenshotUrls.length; i++) {
      const url = sanitizeUrl(screenshotUrls[i], '');
      if (url) photos.push({ url });
    }
  }
  if (!photos.length) return;

  const pb = app.photoBrowser.create({
    photos,
    type: 'popup',
    navbar: true,
    toolbar: false,
    swiper: { zoom: true },
    on: {
      close() {
        _activePhotoBrowser = null;
        setTimeout(() => { try { this.destroy(); } catch {} }, 0);
      }
    }
  });

  try {
    _activePhotoBrowser = pb;
    pb.open();
  } catch {
    _activePhotoBrowser = null;
    try { pb.destroy(); } catch {}
  }
}

const READ_LATER_KEY = 'idb_read_later';
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e2e2/666?text=No+Image';
const EMPTY_STATE_HTML = '<div class="nothing-to-see" style="font-weight:600;">Nothing to see here yet <i class="f7-icons icon-small">tray_fill</i></div>';
const NEWS_SKELETON_HTML = `<div class="card card-raised news-card skeleton-effect-pulse"><div class="card-content"><div class="card-image"><div class="skeleton-block" style="height:220px;width:100%;"></div><div class="news-actions"><span class="news-action skeleton-text"><i class="f7-icons">square_arrow_up</i></span><span class="news-action skeleton-text"><i class="f7-icons">clock</i></span><span class="news-action skeleton-text"><i class="f7-icons">book_fill</i></span></div><div class="news-overlay"><div class="news-title skeleton-text">Loading news title</div></div></div></div></div>`.repeat(3);
const UTM_RE = /^(utm_|fbclid$|gclid$|mc_|_ga|ref$|source$)/i;
const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;

function normalizeNewsLink(link) {
  if (!link) return '';
  const s = typeof link === 'string' ? link.trim() : String(link).trim();
  if (!s) return '';
  const cached = _normNewsLinkCache.get(s);
  if (cached !== undefined) return cached;

  let res;
  if (!s.includes('?') && !s.includes('#')) {
    res = s.replace(TRAILING_SLASHES_RE, '').toLowerCase();
  } else {
    try {
      const u = new URL(s, window.location.href);
      u.hash = '';
      for (const k of [...u.searchParams.keys()]) {
        if (UTM_RE.test(k)) u.searchParams.delete(k);
      }
      const pathname = u.pathname.length > 1 ? u.pathname.replace(TRAILING_SLASHES_RE, '') : u.pathname;
      const origin = u.origin && u.origin !== 'null' ? u.origin.toLowerCase() : '';
      res = (origin + pathname + u.search).toLowerCase();
    } catch {
      res = s.replace(TRAILING_SLASHES_RE, '').toLowerCase();
    }
  }
  if (_normNewsLinkCache.size > 500) _normNewsLinkCache.clear();
  _normNewsLinkCache.set(s, res);
  return res;
}

function readLaterMatches(item, link, title) {
  if (!item) return false;
  const targetLink = normalizeNewsLink(link);
  if (targetLink && normalizeNewsLink(item.link) === targetLink) return true;
  const t = String(title || '').trim();
  return !!(t && String(item.title || '').trim() === t);
}

const getReadLater = () => cachedData.readLater || (cachedData.readLater = store.get(READ_LATER_KEY, []));
function saveReadLater(items) {
  cachedData.readLater = items;
  store.set(READ_LATER_KEY, items);
  onIdle(renderReadLaterNews);
}

function shareArticle(title, url) {
  safeShare({ title, url });
}

function toggleEmptyState(container, isEmpty) {
  const tab = container.parentElement || container;
  const prev = tab._emptyState;
  if (prev === isEmpty) return;
  tab._emptyState = isEmpty;

  if (isEmpty) {
    if (!tab._posChecked) {
      tab._posChecked = true;
      if (getComputedStyle(tab).position === 'static') tab.style.position = 'relative';
    }
    container.style.display = 'none';
    tab.style.minHeight = '70vh';
    if (!tab.querySelector('.nothing-to-see')) {
      tab.insertAdjacentHTML('beforeend', EMPTY_STATE_HTML);
    }
  } else {
    tab.querySelectorAll('.nothing-to-see').forEach(el => el.remove());
    tab.style.minHeight = '';
    container.style.display = '';
  }
}

let _cachedSetsRef = null;
let _cachedSets = null;
function getSavedReadLaterSets() {
  const items = getReadLater();
  if (items === _cachedSetsRef) return _cachedSets;
  const links = new Set();
  const titles = new Set();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const l = normalizeNewsLink(it.link);
    if (l) links.add(l);
    const t = String(it.title || '').trim();
    if (t) titles.add(t);
  }
  _cachedSetsRef = items;
  return (_cachedSets = { links, titles });
}

function refreshReadLaterIcons() {
  const newsContainer = $id('news');
  if (!newsContainer) return;
  const { links, titles } = getSavedReadLaterSets();
  const btns = newsContainer.querySelectorAll('.news-action[data-read-later-link]');

  for (let i = 0; i < btns.length; i++) {
    const btn = btns[i];
    const linkKey = btn._nl !== undefined ? btn._nl : (btn._nl = normalizeNewsLink(btn.dataset.readLaterLink));
    const titleKey = btn._nt !== undefined ? btn._nt : (btn._nt = String(btn.dataset.readLaterTitle || '').trim());
    const saved = (linkKey && links.has(linkKey)) || (titleKey && titles.has(titleKey));
    btn.title = saved ? 'Remove from read later' : 'Add to read later';
    const icon = btn._icon || (btn._icon = btn.querySelector('i.f7-icons'));
    if (icon) icon.textContent = saved ? 'clock_fill' : 'clock';
  }
}

function addToReadLater(title, link, imgSrc = PLACEHOLDER_IMAGE) {
  const items = getReadLater().slice();
  const idx = items.findIndex(item => readLaterMatches(item, link, title));
  const exists = idx !== -1;

  if (exists) items.splice(idx, 1);
  else items.push({ title: String(title || ''), link: sanitizeUrl(link), imgSrc: sanitizeUrl(imgSrc, PLACEHOLDER_IMAGE) });

  saveReadLater(items);
  showToast(exists ? 'Removed from Read Later' : 'Added to Read Later', exists ? 'clock' : 'clock_fill');
  refreshReadLaterIcons();
}

function playDeleteNewsAnimation(cardEl) {
  if (!cardEl) return Promise.resolve();
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  cardEl.style.position = 'relative';
  const frag = document.createDocumentFragment();
  const particles = new Array(18);
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    const size = 4 + Math.random() * 5;
    p.style.cssText = `position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;margin:-2px 0 0 -2px;border-radius:999px;background:rgba(255,255,255,.95);box-shadow:0 0 10px rgba(255,255,255,.45)`;
    frag.appendChild(p);
    particles[i] = p;
  }
  layer.appendChild(frag);
  cardEl.appendChild(layer);
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * 110;
    particles[i].animate(
      [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0)`, opacity: 0 }],
      { duration: 650 + Math.random() * 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
    );
  }
  return cardEl.animate(
    [{ opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.88) rotate(2deg)', filter: 'blur(10px)' }],
    { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
  ).finished.then(() => layer.remove());
}

function removeFromReadLater(link, title, cardEl) {
  app.dialog.confirm(`Remove "${String(title)}" from Read Later?`, 'Confirm', () => {
    const doRemove = () => {
      saveReadLater(getReadLater().filter(item => !readLaterMatches(item, link, title)));
      refreshReadLaterIcons();
    };
    if (cardEl) playDeleteNewsAnimation(cardEl).then(doRemove);
    else {
      doRemove();
      showToast('Removed');
    }
  });
}

function buildNewsCardHtml({ title, link, imgSrc, isSaved, isReadLaterList }) {
  const escTitle = escapeHtml(title);
  const escLink = escapeHtml(link);
  const escImg = escapeHtml(imgSrc);
  const jsTitle = jsAttr(title);
  const jsLink = jsAttr(link);

  const middleBtn = isReadLaterList
    ? `<a class="news-action" href="#" onclick='removeFromReadLater(${jsLink}, ${jsTitle}, this.closest(".news-card")); return false;'><i class="f7-icons">trash</i></a>`
    : `<a class="news-action" href="#" title="${isSaved ? 'Remove from read later' : 'Add to read later'}" data-read-later-link="${escLink}" data-read-later-title="${escTitle}" onclick='addToReadLater(${jsTitle}, ${jsLink}, ${jsAttr(imgSrc)}); return false;'><i class="f7-icons">${isSaved ? 'clock_fill' : 'clock'}</i></a>`;

  return `
    <div class="card card-raised news-card">
      <div class="card-content">
        <div class="card-image">
          <img class="newsimg" src="${escImg}" loading="lazy" decoding="async" alt="${escTitle}">
          <div class="news-actions">
            <a class="news-action" href="#" onclick='shareArticle(${jsTitle}, ${jsLink}); return false;'><i class="f7-icons">square_arrow_up</i></a>
            ${middleBtn}
            <a class="news-action" href="#" onclick='openNewsReader(${jsTitle}, ${jsLink}); return false;'><i class="f7-icons">book_fill</i></a>
          </div>
          <div class="news-overlay"><div class="news-title">${escTitle}</div></div>
        </div>
      </div>
    </div>`;
}

function renderReadLaterNews() {
  const container = $id('read-later-news');
  if (!container) return;
  const items = getReadLater();
  toggleEmptyState(container, !items.length);
  if (!items.length) {
    container.textContent = '';
    return;
  }
  const parts = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    parts[i] = buildNewsCardHtml({
      title: String(item.title || ''),
      link: sanitizeUrl(item.link),
      imgSrc: sanitizeUrl(item.imgSrc, PLACEHOLDER_IMAGE),
      isReadLaterList: true
    });
  }
  container.innerHTML = parts.join('');
}

const getNodeText = (parent, tag) => parent.getElementsByTagName(tag)[0]?.textContent.trim() || '';

async function fetchAndLoadNews(delayMs = 300) {
  const newsContainer = $id('news');
  if (!newsContainer) return;
  newsContainer.innerHTML = NEWS_SKELETON_HTML;

  try {
    const [response] = await Promise.all([fetch('https://www.idownloadblog.com/feed/'), wait(delayMs)]);
    if (!response.ok) throw new Error('Feed request failed');
    const xml = new DOMParser().parseFromString(await response.text(), 'text/xml');
    const items = xml.getElementsByTagName('item');
    const { links, titles } = getSavedReadLaterSets();

    const parts = new Array(items.length);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = getNodeText(item, 'title');
      const link = sanitizeUrl(getNodeText(item, 'link'));
      const content = getNodeText(item, 'content:encoded') || getNodeText(item, 'description');
      const imgSrc = sanitizeUrl(content.match(IMG_SRC_RE)?.[1], PLACEHOLDER_IMAGE);
      const isSaved = (link && link !== '#' && links.has(normalizeNewsLink(link))) || (title && titles.has(title.trim()));
      parts[i] = buildNewsCardHtml({ title, link, imgSrc, isSaved, isReadLaterList: false });
    }
    newsContainer.innerHTML = parts.join('');
  } catch {
    newsContainer.innerHTML = '<div class="block">Failed to load news.</div>';
  }
}

window.currentArticle = null;
function openNewsReader(title, url) {
  if (typeof url !== 'string' || !HTTPS_RE.test(url)) return;
  window.currentArticle = { title: String(title || ''), url };
  const iframe = $id('news-reader-iframe');
  if (iframe) iframe.src = url;
  if (app?.popup?.open) app.popup.open('#news-reader-popup');
  else window.open(url, '_blank', 'noopener,noreferrer');
}

app.on('popupClose', (popup) => {
  if (popup?.el?.id !== 'news-reader-popup') return;
  const iframe = $id('news-reader-iframe');
  if (iframe) iframe.src = 'about:blank';
  window.currentArticle = null;
});

const makeFavKey = (type, id, sourceURL) => `${type || 'library'}|${id}|${type === 'repo' ? (sourceURL || '') : ''}`;

const getFavorites = () => cachedData.favorites || (cachedData.favorites = store.get('favorites', []));
const getFavSet = () => {
  if (cachedData.favSet) return cachedData.favSet;
  const set = new Set();
  const favs = getFavorites();
  for (let i = 0; i < favs.length; i++) {
    const f = favs[i];
    set.add(makeFavKey(f.type || 'library', f.id, f.sourceURL));
  }
  return (cachedData.favSet = set);
};
const setFavorites = (arr) => {
  cachedData.favorites = arr;
  cachedData.favSet = null;
  store.set('favorites', arr);
};
const getFavOrder = () => cachedData.favOrder || (cachedData.favOrder = store.get('favOrder', []));
const setFavOrder = (arr) => { cachedData.favOrder = arr; store.set('favOrder', arr); };

const isFavorited = (id) => getFavSet().has(makeFavKey('library', id, ''));
const isRepoAppFavorited = (bundleId, sourceURL) => getFavSet().has(makeFavKey('repo', bundleId, sourceURL));

function syncPopoverFavUI(favState) {
  const menu = document.querySelector(POPOVER_MENU_SELECTOR);
  const btn = menu?.querySelector('.favorite-toggle-item');
  if (!btn) return;
  const icon = btn.querySelector('.favorite-toggle-icon');
  const label = btn.querySelector('.favorite-toggle-label');
  if (icon) icon.textContent = favState ? 'heart_slash_fill' : 'heart_fill';
  if (label) label.textContent = favState ? 'Unfavorite' : 'Favorite';
}

function addToFavorites(item) {
  if (!item || item.id === undefined || item.id === null || item.id === '') return;

  const itemType = item.type || 'library';
  const itemId = String(item.id);
  const itemSource = String(item.sourceURL || '');
  const matchesItem = (fav) =>
    (fav.type || 'library') === itemType &&
    String(fav.id) === itemId &&
    (itemType !== 'repo' || String(fav.sourceURL || '') === itemSource);

  const favorites = getFavorites().slice();
  const favOrder = getFavOrder();
  const exists = favorites.some(matchesItem);

  if (exists) {
    const remaining = favorites.filter(f => !matchesItem(f));
    setFavorites(remaining);
    if (!remaining.some(f => String(f.id) === itemId)) {
      setFavOrder(favOrder.filter(id => String(id) !== itemId));
    }
  } else {
    favorites.push(item);
    setFavorites(favorites);
    setFavOrder([...favOrder, item.id]);
  }

  showToast(exists ? 'Removed from Favorites' : 'Added to Favorites', exists ? 'heart_slash_fill' : 'heart_fill');
  displayFavorites();
  syncPopoverFavUI(!exists);
}

function removeFromFavorites(id, type, sourceURL) {
  const favorites = getFavorites();
  const favType = type || 'library';
  const idStr = String(id);
  const sourceStr = String(sourceURL || '');
  const matches = (f) =>
    String(f.id) === idStr &&
    (f.type || 'library') === favType &&
    (favType !== 'repo' || String(f.sourceURL || '') === sourceStr);

  if (!favorites.some(matches)) return;

  const newFavs = favorites.filter(f => !matches(f));
  const remainingIds = new Set(newFavs.map(f => String(f.id)));
  setFavorites(newFavs);
  setFavOrder(getFavOrder().filter(fid => remainingIds.has(String(fid))));
  displayFavorites();
}

function displayFavorites() {
  const favList = $id('fav');
  const ul = favList?.querySelector('ul');
  if (!favList || !ul) return;

  const favorites = getFavorites();
  toggleEmptyState(favList, !favorites.length);
  if (!favorites.length) {
    ul.textContent = '';
    return;
  }

  const byId = new Map();
  const remaining = new Map();

  for (let i = 0; i < favorites.length; i++) {
    const f = favorites[i];
    const k = makeFavKey(f.type || 'library', f.id, f.sourceURL);
    remaining.set(k, f);
    const idStr = String(f.id);
    let arr = byId.get(idStr);
    if (!arr) byId.set(idStr, arr = []);
    arr.push([k, f]);
  }

  const orderedFavorites = [];
  const favOrder = getFavOrder();
  for (let i = 0; i < favOrder.length; i++) {
    const group = byId.get(String(favOrder[i]));
    if (!group) continue;
    for (let j = 0; j < group.length; j++) {
      const [k, f] = group[j];
      if (remaining.has(k)) {
        orderedFavorites.push(f);
        remaining.delete(k);
      }
    }
  }
  orderedFavorites.push(...remaining.values());

  const parts = new Array(orderedFavorites.length);
  for (let i = 0; i < orderedFavorites.length; i++) {
    const fav = orderedFavorites[i];
    const isRepo = (fav.type || 'library') === 'repo';
    const idStr = String(fav.id || '');
    const srcStr = String(fav.sourceURL || '');
    const jsId = jsAttr(idStr);
    const jsSrc = jsAttr(srcStr);
    const clickHandler = isRepo
      ? `openRepoApp(${jsId}, ${jsSrc})`
      : `openLibraryApp(${jsId})`;
    const iconHtml = isRepo ? '' : `<i style="font-size:17px;" class="f7-icons">${escapeHtml(fav.icon || '')}</i>`;
    const removeArgs = `${jsId}, ${jsAttr(fav.type || 'library')}, ${jsSrc}`;
    const liId = `fav-${escapeHtml(makeFavKey(fav.type || 'library', fav.id, fav.sourceURL))}`;
    parts[i] = `
    <li class="swipeout" id="${liId}" data-fav-id="${escapeHtml(idStr)}">
      <div class="swipeout-content">
        <a class="item-link" onclick="${clickHandler}">
          <div class="item-content">
            <div class="item-media"><img loading="lazy" decoding="async" src="${escapeHtml(sanitizeUrl(fav.image, ''))}"></div>
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title notranslate">${escapeHtml(fav.title)}${iconHtml}</div>
              </div>
              <div class="item-subtitle"><span class="badge">${escapeHtml(fav.subtitle)}</span></div>
            </div>
          </div>
        </a>
      </div>
      <div class="swipeout-actions-right">
        <a class="swipeout-delete" onclick="removeFromFavorites(${removeArgs})">Unfavorite <i class="f7-icons">heart_slash_fill</i></a>
      </div>
    </li>`;
  }
  ul.innerHTML = parts.join('');

  if (!ul.favSortableInitialized) {
    ul.addEventListener('sortable:sort', () => {
      setFavOrder([...ul.children].map(li => li.dataset.favId || '').filter(Boolean));
    });
    ul.favSortableInitialized = true;
  }
}

const LIBRARY_SKELETON_LI = `
  <li>
    <a class="item-link">
      <div class="item-content skeleton-effect-pulse">
        <div class="item-media"><div class="skeleton-block" style="width:58px;height:58px;border-radius:29%;"></div></div>
        <div class="item-inner">
          <div class="item-title-row"><div class="item-title skeleton-text notranslate">App Title</div></div>
          <div class="item-subtitle skeleton-text">Category</div>
          <div class="item-footer"></div>
        </div>
      </div>
    </a>
  </li>`;

const LIBRARY_SKELETON_ITEMS = Array.from({ length: 10 }, () => ({ skeleton: true }));
const LIBRARY_SKELETON_UL_HTML = `<ul>${LIBRARY_SKELETON_LI.repeat(10)}</ul>`;

const createItemHtml = (item) => {
  if (item?.skeleton) return LIBRARY_SKELETON_LI;
  if (item._rowHtml) return item._rowHtml;
  return (item._rowHtml = `
  <li>
    <a class="item-link" onclick="openLibraryApp(${jsAttr(String(item.id || ''))})">
      <div class="item-content">
        <div class="item-media"><img loading="lazy" decoding="async" src="${escapeHtml(sanitizeUrl(item.icon, './assets/default.png'))}"></div>
        <div class="item-inner">
          <div class="item-title-row"><div class="item-title notranslate">${escapeHtml(item.title)}</div></div>
          <div class="item-subtitle">${escapeHtml(item.category)}</div>
          <div class="item-footer"></div>
        </div>
      </div>
    </a>
  </li>`);
};

let libraryApps = [];
let libraryAppMap = new Map();
let libraryCategory = 'All';
let currentLibraryPopup = null;
let _pendingLibOpen = 0;
let _pendingRepoOpen = 0;

let _filteredLibCache = new Map();
let _filteredLibCacheFor = null;

function renderRecommendedBlock(items, onClickFnName, idKey, titleKey, subKey, iconKey, extraArgKey) {
  const len = items.length;
  if (!len) return '';
  const rows = new Array(len);
  for (let i = 0; i < len; i++) {
    const rec = items[i];
    const icon = escapeHtml(sanitizeUrl(rec[iconKey], './assets/default.png'));
    const title = escapeHtml(rec[titleKey]);
    const sub = escapeHtml(rec[subKey] || '');
    const arg1 = jsAttr(String(rec[idKey] || ''));
    const arg2 = extraArgKey ? `, ${jsAttr(String(rec[extraArgKey] || ''))}` : '';
    rows[i] = `
      <a class="rec-item" onclick="${onClickFnName}(${arg1}${arg2})">
        <img loading="lazy" decoding="async" src="${icon}" alt="${title}">
        <div class="rec-text">
          <div class="rec-name">${title}</div>
          <div class="rec-sub">${sub}</div>
        </div>
        <span class="rec-btn">View</span>
      </a>`;
  }
  return `<div class="block-title">Recommended</div><div class="rec-strip">${rows.join('')}</div>`;
}

function _getLibPopupTemplate(item) {
  const key = String(item.id || '');
  let tpl = _libPopupTplCache.get(key);
  if (tpl !== undefined) return tpl;

  const popupId = escapeHtml(item.id);
  const iconUrl = escapeHtml(sanitizeUrl(item.icon, './assets/default.png'));
  const titleText = escapeHtml(item.title);
  const categoryText = escapeHtml(item.category);
  const rawCompat = String(item.compatible || '').trim();
  const compatText = escapeHtml(rawCompat && rawCompat !== 'Unknown' && rawCompat !== 'N/A' ? rawCompat : 'All Versions');
  const typeText = escapeHtml(item.type && item.type !== 'Unknown' ? item.type : 'App');
  const deviceText = escapeHtml(item.device || (isMacDesktop ? 'Mac' : 'iPhone & iPad'));
  const downloadLink = escapeHtml(sanitizeUrl(item.get_link));
  const rawScreenshots = (Array.isArray(item.screenshots) ? item.screenshots : []).map(s => sanitizeUrl(s, '')).filter(Boolean);
  const screenshotsHtml = rawScreenshots.map((src, idx) => `<img loading="lazy" decoding="async" src="${escapeHtml(src)}" class="pb-target" data-index="${idx}">`).join('');

  const shareArg = jsAttr({ title: String(item.title || ''), url: sanitizeUrl(item.get_link, '') });
  const favArg = jsAttr({ id: item.id, icon: item.badge, image: item.icon, title: item.title, subtitle: item.category });
  const reportArg = jsAttr(String(item.title || ''));
  const descText = item._escLibDesc !== undefined ? item._escLibDesc : (item._escLibDesc = escapeHtml(item.description));

  const deferredParts = {
    screenshots: rawScreenshots.length ? `<div class="block-title">Preview</div><div class="screenshot deferred-chunk" onclick="openPhotoBrowser(${jsAttr(rawScreenshots)})">${screenshotsHtml}</div>` : '',
    desc: `<div class="block-title">About</div><div class="block block-strong inset desc-card deferred-chunk"><div class="desc-text">${descText}</div></div>`,
    details: ''
  };
  item._deferredParts = deferredParts;

  const shell = `
    <div class="popup popup-app-detail" id="${popupId}">
      <div class="page">
        <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
        <div class="page-content sheet-body">
          <div class="sheet-header">
            <img src="${iconUrl}" decoding="async" class="app-icon" alt="${titleText}">
            <div class="sheet-title-wrap">
              <div class="sheet-title">${titleText}</div>
              <div class="sheet-sub"><span class="badge">${categoryText}</span></div>
              <div class="sheet-actions">
                <a href="${downloadLink}" class="external button button-fill button-round get">GET</a>
                <a class="popover-open more" data-popover=".popover-menu"><i class="f7-icons">ellipsis_circle_fill</i></a>
              </div>
            </div>
          </div>
          <div class="meta-bar">
            <div class="meta-col"><span class="meta-top">TYPE</span><span class="meta-val">${typeText}</span></div>
            <div class="meta-col macos-hide"><span class="meta-top">COMPATIBILITY</span><span class="meta-val">${compatText}</span></div>
            <div class="meta-col"><span class="meta-top">PLATFORM</span><span class="meta-val">${deviceText}</span></div>
          </div>
          ${_REC_PH}
          <div class="popover popover-menu" data-vertical-position="bottom">
            <div class="popover-inner">
              <div class="list list-dividers" style="text-align:left!important;">
                <ul>
                  <li><a onclick="safeShare(${shareArg})" class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">square_arrow_up</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Share</div></div></div></a></li>
                  <li><a onclick="addToFavorites(${favArg})" class="item-link item-content external favorite-toggle-item"><div class="item-media"><i class="f7-icons favorite-toggle-icon">heart_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title favorite-toggle-label">Favorite</div></div></div></a></li>
                  <li><a class="item-link item-content popover-close" onclick="openReportPopup(${reportArg})"><div class="item-media"><i class="f7-icons">exclamationmark_triangle_fill</i></div><div class="item-inner"><div class="item-title">Report</div></div></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  tpl = { shell, deferredParts };
  if (_libPopupTplCache.size >= _CACHE_MAX) _libPopupTplCache.clear();
  _libPopupTplCache.set(key, tpl);
  return tpl;
}

function createStaticAppPopupHtml(item, allPool = libraryApps, deferHeavy = false) {
  const tpl = _getLibPopupTemplate(item);
  if (deferHeavy) return tpl.shell.replace(_REC_PH, '<div class="deferred-body-slot"></div>');
  const p = tpl.deferredParts;
  const recHtml = renderRecommendedBlock(getRandomItems(allPool, 'id', item.id, 5), 'openLibraryApp', 'id', 'title', 'category', 'icon');
  return tpl.shell.replace(_REC_PH, p.screenshots + p.desc + recHtml);
}

let _nextLibPopupFn = null;

function showLibraryPopup(item) {
  if (!item) return;
  clearTimeout(_pendingLibOpen);

  if (currentLibraryPopup) {
    const prev = currentLibraryPopup;
    const isPrevActive = prev.opened || prev.el?.classList.contains('modal-in') || prev.el?.classList.contains('modal-out');
    if (isPrevActive) {
      _popupTransitioning = true;
      _nextLibPopupFn = () => showLibraryPopup(item);
      _pendingLibOpen = setTimeout(() => {
        if (_nextLibPopupFn) {
          const fn = _nextLibPopupFn;
          _nextLibPopupFn = null;
          if (currentLibraryPopup === prev) currentLibraryPopup = null;
          try { prev.destroy(); } catch {}
          prev.el?.remove();
          _popupTransitioning = false;
          fn();
        }
      }, 400);
      try { prev.close(); } catch {}
      return;
    } else {
      currentLibraryPopup = null;
      try { prev.destroy(); } catch {}
      prev.el?.remove();
    }
  }

  _popupTransitioning = false;
  const tpl = _getLibPopupTemplate(item);
  let cancelHydrate = null;
  currentLibraryPopup = app.popup.create({
    content: tpl.shell.replace(_REC_PH, '<div class="deferred-body-slot"></div>'),
    swipeToClose: 'to-bottom',
    push: true,
    on: {
      opened(p) {
        cancelHydrate = hydrateProgressive(
          p.el,
          tpl.deferredParts,
          () => renderRecommendedBlock(getRandomItems(libraryApps, 'id', item.id, 5), 'openLibraryApp', 'id', 'title', 'category', 'icon')
        );
      },
      close() {
        if (cancelHydrate) cancelHydrate();
      },
      closed(p) {
        clearTimeout(_pendingLibOpen);
        if (currentLibraryPopup === p) currentLibraryPopup = null;
        try { p.destroy(); } catch {}
        p.el?.remove();
        if (_nextLibPopupFn) {
          const fn = _nextLibPopupFn;
          _nextLibPopupFn = null;
          setTimeout(() => {
            _popupTransitioning = false;
            fn();
          }, 20);
        } else {
          _popupTransitioning = false;
        }
      }
    }
  });
  currentLibraryPopup.open();
}

function openLibraryApp(targetId) {
  if (!targetId) return;
  const raw = String(targetId).trim();
  const cleanId = raw.charCodeAt(0) === 35 ? raw.slice(1) : raw;
  const item = libraryAppMap.get(cleanId) || libraryAppMap.get(raw) || libraryAppMap.get(`#${cleanId}`);
  if (!item) return;
  showLibraryPopup(item);
}

function getFilteredLibraryItems(category = libraryCategory) {
  if (!category || category === 'All') return libraryApps;
  if (_filteredLibCacheFor !== libraryApps) {
    _filteredLibCache.clear();
    _filteredLibCacheFor = libraryApps;
  }
  let cached = _filteredLibCache.get(category);
  if (cached) return cached;
  const target = category.toLowerCase();
  const result = [];
  for (let i = 0; i < libraryApps.length; i++) {
    const a = libraryApps[i];
    if (a._normCatLower === target) result.push(a);
  }
  _filteredLibCache.set(category, result);
  return result;
}

let _libListElCache = null;
const getLibraryListEl = () => {
  if (_libListElCache?.isConnected) return _libListElCache;
  return (_libListElCache = document.querySelector('#searchTab .virtual-list') || document.querySelector('.virtual-list'));
};

let _libNotFoundElCache = null;
const getLibraryNotFoundEl = () => {
  if (_libNotFoundElCache?.isConnected) return _libNotFoundElCache;
  return (_libNotFoundElCache = document.querySelector('#searchTab .searchbar-not-found'));
};

let _navbarSearchbarElCache = null;
const getNavbarSearchbarEl = () => {
  if (_navbarSearchbarElCache?.isConnected) return _navbarSearchbarElCache;
  return (_navbarSearchbarElCache = document.querySelector('.navbar .searchbar') || document.querySelector('#searchTab .searchbar'));
};

function applyLibrarySearchAndFilter(category = libraryCategory, queryOverride = undefined) {
  libraryCategory = category;
  const listEl = getLibraryListEl();
  const vl = app.virtualList.get(listEl);
  if (!vl) return;

  const sbEl = getNavbarSearchbarEl();
  updateListSearch({
    vl,
    listEl,
    notFoundEl: getLibraryNotFoundEl(),
    sb: sbEl ? app.searchbar.get(sbEl) : null,
    sbEl,
    items: getFilteredLibraryItems(category),
    key: 'title',
    cachedLowerKey: '_searchTitle',
    queryOverride
  });
}

function initVirtualList(containerSelector, items) {
  app.virtualList.get(containerSelector)?.destroy();
  const vl = app.virtualList.create({
    el: containerSelector,
    items,
    renderItem: createItemHtml,
    searchAll: vlSearch('title', '_searchTitle'),
    height: 90
  });

  const mainPage = document.querySelector('#app .view-main > .page') || document;
  mainPage.querySelectorAll('.searchbar').forEach((el) => {
    if (el.closest('[data-name="repo-detail"]') || el._libBound) return;
    el._libBound = true;
    let sbInstance = app.searchbar.get(el);
    if (!sbInstance) {
      sbInstance = app.searchbar.create({
        el,
        customSearch: true,
        searchContainer: containerSelector
      });
    } else {
      sbInstance.params.customSearch = true;
    }
    const input = el.querySelector('input[type="search"]');
    if (input) {
      input.addEventListener('input', () => {
        applyLibrarySearchAndFilter(libraryCategory, input.value);
      });
    }
  });
  return vl;
}

async function fetchAndLoadApps(delayMs = 300) {
  const container = getLibraryListEl();
  const filterBar = $id('library-category-filters');
  const existingVl = container ? app.virtualList.get(container) : null;

  if (existingVl) {
    existingVl.resetFilter?.();
    existingVl.replaceAllItems(LIBRARY_SKELETON_ITEMS);
    if (container) container.style.display = '';
    const notFoundEl = getLibraryNotFoundEl();
    if (notFoundEl) notFoundEl.style.display = 'none';
  } else if (container) {
    container.innerHTML = LIBRARY_SKELETON_UL_HTML;
  }

  try {
    const jsonFile = isMacDesktop ? 'json/macos.json' : 'json/ios.json';
    const [response] = await Promise.all([fetch(jsonFile), wait(delayMs)]);
    if (!response.ok) throw new Error(`Failed to load ${jsonFile}`);
    const rawApps = await response.json();

    _libPopupTplCache.clear();

    const apps = rawApps.map(a => {
      const cat = normalizeCategory(a.category);
      return {
        ...a,
        category: cat,
        _normCat: cat,
        _normCatLower: cat.toLowerCase(),
        _searchTitle: String(a.title || '').toLowerCase()
      };
    }).sort((a, b) => a._searchTitle < b._searchTitle ? -1 : a._searchTitle > b._searchTitle ? 1 : 0);

    libraryApps = apps;
    libraryAppMap = new Map();
    const currentAppIds = new Array(apps.length);
    for (let i = 0; i < apps.length; i++) {
      const a = apps[i];
      libraryAppMap.set(String(a.id), a);
      currentAppIds[i] = a.title;
    }

    _currentLibraryAppTitles = currentAppIds;

    const seenSet = new Set(store.get('seen_apps', []));
    let newAppsCount = 0;
    for (let i = 0; i < currentAppIds.length; i++) {
      if (!seenSet.has(currentAppIds[i])) newAppsCount++;
    }

    const appBadges = document.querySelectorAll('.appsnumber');
    for (let i = 0; i < appBadges.length; i++) {
      const badge = appBadges[i];
      badge.textContent = newAppsCount || '';
      badge.classList.toggle('display-none', newAppsCount <= 0);
    }

    libraryCategory = renderCategoryPills(filterBar, apps, _defaultCatGetter, libraryCategory, (cat) => applyLibrarySearchAndFilter(cat));
    if (!existingVl) {
      if (container) container.innerHTML = '';
      initVirtualList('#searchTab .virtual-list', getFilteredLibraryItems(libraryCategory));
    }
    applyLibrarySearchAndFilter(libraryCategory);

    onIdle(() => {
      const limit = Math.min(apps.length, 8);
      for (let i = 0; i < limit; i++) {
        try { _getLibPopupTemplate(apps[i]); } catch {}
      }
    });
  } catch (err) {
    console.error(err);
    existingVl?.destroy();
    if (container) container.innerHTML = '<div class="block">Error loading apps.</div>';
  }
}

function shareURL() {
  safeShare({ title: 'SoftwareKit', text: 'Take your iDevice experience to the next level with my awesome app!', url: 'https://swkit.app/' });
}
function shareSource() {
  safeShare({ title: 'SoftwareKit', text: 'Official AltStore source provided by SoftwareKit', url: 'https://swkit.app/ios/altstore.json' });
}
function copySource() {
  navigator.clipboard.writeText('https://swkit.app/ios/altstore.json')
    .then(() => showToast('Source link copied!', null, 2000))
    .catch(() => showToast('Failed to copy!', null, 2000));
}
function reset() {
  const defaultColor = '#0071E3';
  app.dialog.create({
    title: 'Reset',
    verticalButtons: true,
    buttons: [
      {
        text: 'Reset Accent Color',
        onClick() {
          setCustomColor(defaultColor);
          colorPicker?.setValue({ hex: defaultColor });
          showToast('Accent color restored!', null, 2000, 'bottom');
        }
      },
      {
        text: 'Erase all data',
        onClick() {
          app.dialog.confirm(
            'This will delete all your settings and data including added sources, favorites read later. This action cannot be undone.',
            'Confirm reset',
            () => {
              app.preloader.show();
              setTimeout(() => {
                document.cookie.split(';').forEach(c => {
                  const name = c.split('=')[0].trim();
                  if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                });
                localStorage.clear();
                clearCache();
                app.preloader.hide();
                window.location.href = 'app.html';
              }, 1200);
            }
          );
        }
      },
      { text: 'Cancel', close: true, cssClass: 'color-red' }
    ]
  }).open();
}

const APP_ICON_KEY = 'sk_app_icon';
const DEFAULT_ICON_ID = 'default';
const APP_ICONS_JSON_URL = 'json/icons.json';

let iconCache = null;
let iconBaseUrl = null;

function parseLenientJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const cleaned = String(rawText || '')
      .replace(/^\uFEFF/, '')
      .replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*$/gm, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/}\s*{/g, '},{');
    return JSON.parse(cleaned);
  }
}

async function fetchIconsJson() {
  const res = await fetch(APP_ICONS_JSON_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`icons.json HTTP ${res.status}`);
  const parsed = parseLenientJson(await res.text());
  const data = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.icons) ? parsed.icons : []);
  if (!data.length) throw new Error('No icons in icons.json');
  iconCache = data;
  iconBaseUrl = new URL(APP_ICONS_JSON_URL, window.location.href).href;
  return data;
}

const resolveIconUrl = (raw) => {
  try { return new URL(raw, iconBaseUrl).href; } catch { return raw; }
};

function applyAppIcon(url, id) {
  const cleanUrl = sanitizeUrl(url, '');
  if (!cleanUrl) return;
  document.querySelectorAll(HEAD_ELEM_SELECTOR).forEach(el => el.remove());

  const bust = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
  const frag = document.createDocumentFragment();
  const rels = ['apple-touch-icon', 'apple-touch-icon-precomposed', 'icon'];
  for (let i = 0; i < rels.length; i++) {
    const link = document.createElement('link');
    link.rel = rels[i];
    if (rels[i] !== 'icon') link.setAttribute('sizes', '180x180');
    link.href = bust;
    frag.appendChild(link);
  }
  document.head.appendChild(frag);

  localStorage.setItem(APP_ICON_KEY, id || DEFAULT_ICON_ID);
  const img = $id('settings-app-icon');
  if (img) img.src = cleanUrl;
  const sidebarImg = document.querySelector('.sidebar-header .app-icon');
  if (sidebarImg) sidebarImg.src = cleanUrl;
}

async function loadAppIcons() {
  const listEl = document.querySelector('#app-icons-list ul');
  if (!listEl) return;
  try {
    const icons = iconCache || await fetchIconsJson();
    const currentId = localStorage.getItem(APP_ICON_KEY) || DEFAULT_ICON_ID;
    const parts = new Array(icons.length);
    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];
      const isActive = icon.id === currentId;
      const resolvedUrl = resolveIconUrl(icon.url || icon.icon || '');
      parts[i] = `
        <li>
          <a class="item-link app-icon-choice" data-id="${escapeHtml(icon.id)}" data-url="${escapeHtml(resolvedUrl)}">
            <div class="item-content">
              <div class="item-media"><img src="${escapeHtml(resolvedUrl)}" alt="${escapeHtml(icon.name)}" loading="lazy" decoding="async" style="width:58px;height:58px;border-radius:29.9%;object-fit:cover;"></div>
              <div class="item-inner">
                <div class="item-title-row">
                  <div class="item-title notranslate">${escapeHtml(icon.name)}${isActive ? ' <i class="f7-icons color-blue" style="font-size:16px;">checkmark_circle_fill</i>' : ''}</div>
                </div>
                ${icon.subtitle ? `<div class="item-subtitle">${escapeHtml(icon.subtitle)}</div>` : ''}
              </div>
            </div>
          </a>
        </li>`;
    }
    listEl.innerHTML = parts.join('');
  } catch (err) {
    listEl.innerHTML = `<li><div class="item-content"><div class="item-inner"><div class="item-title color-red">Failed to load icons: ${escapeHtml(err.message)}</div></div></div></li>`;
  }
}

async function restoreAppIconFromStorage() {
  try {
    const icons = iconCache || await fetchIconsJson();
    const id = localStorage.getItem(APP_ICON_KEY) || DEFAULT_ICON_ID;
    const icon = icons.find(i => i.id === id) || icons.find(i => i.id === DEFAULT_ICON_ID) || icons[0];
    if (icon) applyAppIcon(resolveIconUrl(icon.url || icon.icon || ''), icon.id);
  } catch {}
}

app.on('popupOpen', (popup) => {
  if (popup?.el?.id === 'app-icons-popup') loadAppIcons();
  const form = popup?.el?.querySelector('form');
  if (form) formOpenTimestamps.set(form, Date.now());
});

(function checkConnection() {
  let dialogInstance = null;
  const showDialog = () => {
    if (dialogInstance) return;
    dialogInstance = app.dialog.create({
      title: 'No Internet Connection',
      text: `<div style="display:flex;align-items:center;"><i class="icon f7-icons color-red" style="font-size:32px;margin-right:12px;">wifi_slash</i><div><div style="font-weight:bold;">Some features will not be available.</div><div style="margin-top:4px;">Please check your internet connection and try again.</div></div></div>`,
      buttons: [{ text: 'Dismiss', close: true }],
      closeByBackdropClick: false,
      closeByOutsideClick: false,
      destroyOnClose: true,
      on: { closed: () => { dialogInstance = null; } }
    }).open();
  };
  const hideDialog = () => { dialogInstance?.close(); dialogInstance = null; };
  window.addEventListener('online', hideDialog);
  window.addEventListener('offline', showDialog);
  if (!navigator.onLine) showDialog();
})();

document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const popupLink = target.closest('.popup-open[data-popup]');
  if (popupLink) {
    const targetPopupSel = popupLink.getAttribute('data-popup');
    if (targetPopupSel && targetPopupSel.charCodeAt(0) === 35 && !$id(targetPopupSel.slice(1))) {
      const appId = targetPopupSel.slice(1);
      if (libraryAppMap.has(appId)) {
        e.preventDefault();
        e.stopPropagation();
        openLibraryApp(appId);
        return;
      }
    }
  }

  if (target.closest('.tab-link')) scheduleUpdateFabs();

  const choice = target.closest('.app-icon-choice');
  if (choice) {
    e.preventDefault();
    applyAppIcon(choice.dataset.url, choice.dataset.id);
    showToast('Icon updated.', null, 900);
    app.popup.close('#app-icons-popup');
    setTimeout(() => location.reload(), 900);
    return;
  }

  const sidebarLink = target.closest('.sidebar-list .item-link');
  if (sidebarLink) {
    app.popup.close();
    app.dialog.close();
    if (document.querySelector('.page-current[data-name="repo-detail"]')) app.views.main.router.back();
    const activeSidebarLinks = document.querySelectorAll('.sidebar-list .item-link.tab-link-active');
    for (let i = 0; i < activeSidebarLinks.length; i++) {
      activeSidebarLinks[i].classList.remove('tab-link-active');
    }
    sidebarLink.classList.add('tab-link-active');
  }

  const opener = target.closest('.popover-open[data-popover=".popover-menu"]');
  if (opener) {
    let currentlyFav = false;
    if (opener.dataset.repoBundle) {
      currentlyFav = isRepoAppFavorited(opener.dataset.repoBundle, opener.dataset.repoSource || '');
    } else {
      const popup = opener.closest('.popup');
      if (popup?.id) currentlyFav = isFavorited(popup.id);
    }
    const sync = () => syncPopoverFavUI(currentlyFav);
    sync();
    requestAnimationFrame(sync);
  }
});

window.addEventListener('error', (event) => {
  const img = event.target;
  if (img instanceof HTMLImageElement && !img.dataset.fallbackApplied && !img.closest('.screenshots')) {
    img.dataset.fallbackApplied = 'true';
    img.src = './assets/default.png';
  }
}, true);

Object.assign(window, {
  goToTab, toggleDarkMode, postRequest, openReportPopup, openPhotoBrowser,
  addToReadLater, removeFromReadLater, shareArticle, safeShare, openNewsReader,
  addToFavorites, removeFromFavorites, displayFavorites,
  shareURL, shareSource, copySource, reset, applyLibrarySearchAndFilter,
  openLibraryApp
});

document.addEventListener('DOMContentLoaded', () => {
  [searchFab, addSourceFab].forEach(fab => {
    if (fab) Object.assign(fab.style, { transition: 'opacity 0.2s ease, transform 0.2s ease', transformOrigin: 'center', willChange: 'transform, opacity' });
  });
  _currentActiveTabId = document.querySelector('#app .view-main > .page > .tabs > .tab.tab-active')?.id || 'homeTab';
  updateFabs();
  document.addEventListener('tab:show', scheduleUpdateFabs);
  window.addEventListener('load', scheduleUpdateFabs);

let _navbarLargeCache = null;
let _navbarTitleEl = null;
let _navbarLargeTitleEl = null;

function updateActiveNavbarTitle() {
  const id = _currentActiveTabId;
  if (!id) return;
  const activeTabLink = document.querySelector(`.tab-link[href="#${id}"]`);
  const title = activeTabLink?.querySelector('.tabbar-label, .item-title')?.textContent?.trim() || activeTabLink?.dataset.tabTitle || '';
  if (!title) return;
  if (!_navbarLargeCache || !_navbarLargeCache.isConnected) {
    _navbarLargeCache = document.querySelector('.navbar.navbar-large');
    _navbarTitleEl = _navbarLargeCache?.querySelector('.title');
    _navbarLargeTitleEl = _navbarLargeCache?.querySelector('.title-large-text');
  }
  if (_navbarTitleEl) _navbarTitleEl.textContent = title;
  if (_navbarLargeTitleEl) _navbarLargeTitleEl.textContent = title;
}
window.__updateActiveNavbarTitle = updateActiveNavbarTitle;

app.on('tabShow', (tabEl) => {
  _currentActiveTabId = tabEl?.id || '';
  updateActiveNavbarTitle();
});
  const coverflowBase = {
    effect: 'coverflow',
    grabCursor: true,
    preventClicks: true,
    preventClicksPropagation: false,
    centeredSlides: false,
    threshold: 5,
    slidesPerView: 'auto',
    coverflowEffect: { rotate: 0, stretch: 0, depth: 120, modifier: 1.5, slideShadows: false },
    on: { init() { this.wrapperEl.style.willChange = 'transform'; } }
  };
  const initCoverflow = (sel, extra) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.add('no-swipeback');
    new Swiper(el, { ...coverflowBase, ...extra });
  };
  initCoverflow('.swiper.guides-swiper', { spaceBetween: 26, nested: true });
  initCoverflow('.swiper.featured-swiper', { spaceBetween: 27, autoplay: { delay: 4000, disableOnInteraction: true } });
  initCoverflow('.featured-macos', { spaceBetween: 27, autoplay: { delay: 4000, disableOnInteraction: true } });

  const savedDevice = store.get('deviceInfo', null);
  if (savedDevice) renderDeviceData(savedDevice);

  setCustomColor(themeColor);
  let colorTimeout;
  colorPicker = app.colorPicker.create({
    targetEl: '#accent-color',
    value: { hex: themeColor },
    on: {
      change(_, value) {
        clearTimeout(colorTimeout);
        colorTimeout = setTimeout(() => {
          if (themeColor !== value.hex) setCustomColor(value.hex);
        }, 16);
      }
    }
  });

  $id('news-reader-share')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.currentArticle) shareArticle(window.currentArticle.title, window.currentArticle.url);
  });

  restoreAppIconFromStorage();
  fetchAndLoadNews(250);
  renderReadLaterNews();
  fetchAndLoadApps(250);
  displayFavorites();

  const STORAGE_KEY = 'altstore_repos_v3';
  const LOCAL_REPO_URL = './altstore.json';
  const CUSTOM_PROXY = 'https://sw-alt.techlxrd.workers.dev/?url=';
  const FETCH_TIMEOUT = 10000;
  const NSFW_PREF_PREFIX = 'source_nsfw_pref:';
  const NSFW_REGEX = /\b(porn|nsfw|xxx|18\+|climax|cl1m4x|adult|erotic|vidlist)\b/i;
  const SKIP_KEYS = new Set([
    'bundleIdentifier', 'identifier', 'sourceURL', 'downloadURL',
    'iconURL', 'screenshotURLs', 'appPermissions', 'versions',
    'versionDate', 'size', 'date', 'url'
  ]);

  if (!window.repoView) window.repoView = app.views.create('#repository-view', { name: 'repoView' });

  let reposCache = null;
  let reposByUrlCache = null;
  let appsCache = null;
  let appsByCompositeKey = null;
  let appsByBundleKey = null;

  const invalidateRepoCache = () => {
    reposCache = null;
    reposByUrlCache = null;
    appsCache = null;
    appsByCompositeKey = null;
    appsByBundleKey = null;
  };

  let _cachedProxy = localStorage.getItem('custom_cors_proxy') || CUSTOM_PROXY;
  const getProxy = () => _cachedProxy;
  const normalizeSourceUrl = (raw) => {
    const cleaned = String(raw || '').trim().replace(STRIP_PROTOCOL_RE, '').trim();
    return cleaned ? `https://${cleaned}` : '';
  };

  const getSourcePref = (url) => localStorage.getItem(`${NSFW_PREF_PREFIX}${url}`) || '';
  const setSourcePref = (url, pref) => localStorage.setItem(`${NSFW_PREF_PREFIX}${url}`, pref);
  const removeSourcePref = (url) => localStorage.removeItem(`${NSFW_PREF_PREFIX}${url}`);

  const containsNsfwText = (v) => v ? NSFW_REGEX.test(String(v)) : false;
  function deepContainsNsfw(obj, depth = 0) {
    if (depth > 10 || !obj) return false;
    if (typeof obj === 'string') return NSFW_REGEX.test(obj);
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) if (deepContainsNsfw(obj[i], depth + 1)) return true;
      return false;
    }
    if (typeof obj === 'object') {
      for (const k in obj) {
        if (!SKIP_KEYS.has(k) && deepContainsNsfw(obj[k], depth + 1)) return true;
      }
    }
    return false;
  }

  function extractScreenshotURLs(screenshots) {
    if (!screenshots) return [];
    if (typeof screenshots === 'string') {
      const u = sanitizeUrl(screenshots, '');
      return u ? [u] : [];
    }
    if (Array.isArray(screenshots)) {
      const res = [];
      for (let i = 0; i < screenshots.length; i++) {
        const item = screenshots[i];
        const u = sanitizeUrl(typeof item === 'string' ? item : (item?.imageURL || item?.url), '');
        if (u) res.push(u);
      }
      return res;
    }
    if (typeof screenshots === 'object') {
      const res = [];
      for (const k in screenshots) {
        const val = screenshots[k];
        if (Array.isArray(val)) {
          const nested = extractScreenshotURLs(val);
          for (let j = 0; j < nested.length; j++) res.push(nested[j]);
        } else {
          const u = sanitizeUrl(val?.imageURL || val?.url, '');
          if (u) res.push(u);
        }
      }
      return res;
    }
    return [];
  }

  const parseSize = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') return parseFloat(v.replace(NON_DIGIT_DOT_RE, '')) || 0;
    return 0;
  };

  const isNsfwApp = (a) =>
    !!a && (containsNsfwText(a.name) || containsNsfwText(a.developerName) || containsNsfwText(a.localizedDescription) || containsNsfwText(a.category));

  function sanitizeRepo(json, url) {
    const repoName = json.name || 'Untitled Repo';
    const rawApps = Array.isArray(json.apps) ? json.apps
      : [json.packages, json.items, json.entries, json.data, json.apps_v2, json.app, json.applications, json].find(Array.isArray) || [];
    const sanitizedApps = [];

    for (let i = 0; i < rawApps.length; i++) {
      const entry = rawApps[i];
      if (!entry) continue;
      const rawVersions = Array.isArray(entry.versions) ? entry.versions : [];
      const versions = [];
      for (let j = 0; j < rawVersions.length; j++) {
        const v = rawVersions[j];
        if (!v) continue;
        const dl = sanitizeUrl(v.downloadURL || v.downloadUrl || v.url || entry.downloadURL || entry.downloadUrl || entry.url || '', '');
        if (!dl) continue;
        versions.push({
          version: String(v.version || entry.version || '1.0'),
          buildVersion: String(v.buildVersion || ''),
          date: v.date || v.versionDate || entry.versionDate || entry.date || null,
          localizedDescription: String(v.localizedDescription || v.versionDescription || v.notes || v.changelog || ''),
          downloadURL: dl,
          size: parseSize(v.size || entry.size || 0),
          minOSVersion: String(v.minOSVersion || entry.minOSVersion || '')
        });
      }

      const v0 = versions[0] || {};
      const rv0 = rawVersions[0];
      const bundleId = entry.bundleIdentifier || entry.bundleID || entry.id || rv0?.bundleIdentifier || rv0?.id || '';
      const downloadUrl = v0.downloadURL || sanitizeUrl(entry.downloadURL || entry.downloadUrl || entry.url || '', '');
      if (!bundleId || !downloadUrl) continue;

      if (!versions.length) {
        versions.push({
          version: String(entry.version || '1.0'),
          buildVersion: String(entry.buildVersion || ''),
          date: entry.versionDate || entry.date || null,
          localizedDescription: String(entry.versionDescription || ''),
          downloadURL: downloadUrl,
          size: parseSize(entry.size || 0),
          minOSVersion: String(entry.minOSVersion || '')
        });
      }

      const appName = entry.name || entry.title || rv0?.name || 'Unknown App';
      const categoryNorm = normalizeCategory(entry.category || entry.type || rv0?.category || rv0?.type, 'Other');

      sanitizedApps.push({
        name: appName,
        _searchName: String(appName).toLowerCase(),
        subtitle: entry.subtitle || rv0?.subtitle || '',
        version: v0.version || entry.version || '1.0',
        versionDate: v0.date || entry.versionDate || entry.date || null,
        versionDescription: v0.localizedDescription || entry.versionDescription || '',
        minOSVersion: v0.minOSVersion || entry.minOSVersion || '',
        downloadURL: downloadUrl,
        size: v0.size || parseSize(entry.size || 0),
        iconURL: sanitizeUrl(entry.iconURL || entry.icon || entry.iconUrl || rv0?.iconURL || rv0?.icon || rv0?.iconUrl, ''),
        tintColor: entry.tintColor || rv0?.tintColor || json.tintColor || '',
        bundleIdentifier: String(bundleId),
        developerName: entry.developerName || entry.developer || entry.author || rv0?.developerName || rv0?.author || '',
        localizedDescription: entry.localizedDescription || entry.description || entry.summary || rv0?.localizedDescription || rv0?.description || rv0?.summary || entry.subtitle || '',
        category: categoryNorm,
        _normCat: categoryNorm,
        _normCatLower: categoryNorm.toLowerCase(),
        repoName,
        sourceURL: url,
        appPermissions: entry.appPermissions || entry.permissions || rv0?.appPermissions || rv0?.permissions || {},
        screenshotURLs: extractScreenshotURLs(entry.screenshots || entry.screenshotURLs || entry.screenshotUrls || rv0?.screenshots || rv0?.screenshotURLs || rv0?.screenshotUrls),
        versions
      });
    }

    const sanitizedNews = Array.isArray(json.news) ? json.news.map(n => ({
      title: n?.title || 'News',
      caption: n?.caption || '',
      date: n?.date || new Date().toISOString(),
      imageURL: sanitizeUrl(n?.imageURL, ''),
      url: sanitizeUrl(n?.url)
    })) : [];

    return {
      name: repoName,
      subtitle: json.subtitle || '',
      description: json.description || '',
      identifier: json.identifier || url,
      sourceURL: url,
      iconURL: sanitizeUrl(json.iconURL || json.icon || json.iconUrl, ''),
      tintColor: json.tintColor || '',
      apps: sanitizedApps,
      news: sanitizedNews,
      isSystem: url === LOCAL_REPO_URL
    };
  }

  const stripNsfwApps = (repo) => ({
    ...repo,
    apps: Array.isArray(repo.apps) ? repo.apps.filter(a => !isNsfwApp(a)) : []
  });

  const applySavedNsfwPreference = (repo) =>
    repo?.sourceURL && getSourcePref(repo.sourceURL) === 'without' ? stripNsfwApps(repo) : repo;

  function getRepos() {
    if (reposCache) return reposCache;
    const repos = store.get(STORAGE_KEY, []);
    if (!repos.some(r => r?.sourceURL === LOCAL_REPO_URL)) {
      repos.unshift({ sourceURL: LOCAL_REPO_URL, name: 'SoftwareKit', apps: [], news: [], isSystem: true });
    }
    reposByUrlCache = new Map();
    reposCache = [];
    for (let i = 0; i < repos.length; i++) {
      const rawRepo = repos[i];
      if (!rawRepo) continue;
      const prefRepo = applySavedNsfwPreference(rawRepo);
      const srcUrl = prefRepo.sourceURL;
      const rawApps = Array.isArray(prefRepo.apps) ? prefRepo.apps : [];
      const hydratedApps = new Array(rawApps.length);
      for (let j = 0; j < rawApps.length; j++) {
        const a = rawApps[j];
        if (a.sourceURL && a._searchName !== undefined && a._normCatLower !== undefined) {
          if (!a._normCat) a._normCat = a.category;
          hydratedApps[j] = a;
        } else {
          const cat = a.category ? normalizeCategory(a.category, 'Other') : 'Other';
          hydratedApps[j] = {
            ...a,
            sourceURL: a.sourceURL || srcUrl,
            repoName: a.repoName || prefRepo.name,
            category: cat,
            _normCat: cat,
            _normCatLower: a._normCatLower || cat.toLowerCase(),
            _searchName: a._searchName ?? String(a.name || '').toLowerCase()
          };
        }
      }
      const finalRepo = { ...prefRepo, apps: hydratedApps };
      reposCache.push(finalRepo);
      if (srcUrl) reposByUrlCache.set(srcUrl, finalRepo);
    }
    return reposCache;
  }

  const getRepoByUrl = (url) => {
    if (!url) return null;
    if (!reposByUrlCache) getRepos();
    return reposByUrlCache.get(url) || null;
  };

  function saveRepos(repos) {
    store.set(STORAGE_KEY, repos);
    invalidateRepoCache();
    _repoPopupTplCache.clear();
    _versionsSheetCache.clear();
    _permsSheetCache.clear();
  }

  function getAllApps() {
    if (appsCache) return appsCache;
    const repos = getRepos();
    const all = [];
    appsByCompositeKey = new Map();
    appsByBundleKey = new Map();
    for (let i = 0; i < repos.length; i++) {
      const r = repos[i];
      const rApps = r.apps || [];
      for (let j = 0; j < rApps.length; j++) {
        const a = rApps[j];
        all.push(a);
        appsByCompositeKey.set(`${a.bundleIdentifier}|${a.sourceURL || ''}`, a);
        if (!appsByBundleKey.has(a.bundleIdentifier)) {
          appsByBundleKey.set(a.bundleIdentifier, a);
        }
      }
    }
    return (appsCache = all);
  }

  function findRepoApp(bundleId, sourceURL) {
    if (!bundleId) return null;
    if (!appsCache) getAllApps();
    if (sourceURL) {
      const exact = appsByCompositeKey.get(`${bundleId}|${sourceURL}`);
      if (exact) return exact;
    }
    return appsByBundleKey.get(bundleId) || null;
  }

  async function fetchRepo(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const fetchUrl = url === LOCAL_REPO_URL ? url : getProxy() + encodeURIComponent(url);
      const res = await fetch(fetchUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return applySavedNsfwPreference(sanitizeRepo(await res.json(), url));
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const ICON_COLOR_STORAGE_KEY = 'sk_icon_colors_v1';
  const iconColorCache = new Map(Object.entries(store.get(ICON_COLOR_STORAGE_KEY, {})));
  const pendingColorExtractions = new Map();
  const sharedColorCanvas = document.createElement('canvas');
  sharedColorCanvas.width = 16;
  sharedColorCanvas.height = 16;
  const sharedColorCtx = sharedColorCanvas.getContext('2d', { willReadFrequently: true });
  let colorCacheSaveTimer = null;

  function scheduleSaveIconColorCache() {
    if (colorCacheSaveTimer) return;
    colorCacheSaveTimer = setTimeout(() => {
      colorCacheSaveTimer = null;
      store.set(ICON_COLOR_STORAGE_KEY, Object.fromEntries(iconColorCache));
    }, 600);
  }

  function hexToRgbString(hex) {
    if (!hex) return null;
    const clean = String(hex).replace('#', '').trim();
    if (!HEX6_RE.test(clean)) return null;
    const num = parseInt(clean, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }

  function sampleDominantRgbFromImage(img) {
    sharedColorCtx.clearRect(0, 0, 16, 16);
    sharedColorCtx.drawImage(img, 0, 0, 16, 16);
    const data = sharedColorCtx.getImageData(0, 0, 16, 16).data;

    let rSum = 0, gSum = 0, bSum = 0, totalWeight = 0;

    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] < 128) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < 22 || luma > 242) continue;

      const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const weight = (sat * sat * 4) + 0.15;
      rSum += r * weight;
      gSum += g * weight;
      bSum += b * weight;
      totalWeight += weight;
    }

    if (totalWeight <= 0) return null;
    let r = Math.round(rSum / totalWeight);
    let g = Math.round(gSum / totalWeight);
    let b = Math.round(bSum / totalWeight);

    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    if (max < 95 && max > 0) {
      const boost = 95 / max;
      r = Math.min(255, Math.round(r * boost));
      g = Math.min(255, Math.round(g * boost));
      b = Math.min(255, Math.round(b * boost));
    }
    return `${r}, ${g}, ${b}`;
  }

  function extractIconRgb(rawUrl, fallbackTintHex = '') {
    const cleanUrl = sanitizeUrl(rawUrl, '');
    const presetRgb = hexToRgbString(fallbackTintHex);
    if (!cleanUrl || cleanUrl.endsWith('default.png')) return Promise.resolve(presetRgb);
    if (iconColorCache.has(cleanUrl)) return Promise.resolve(iconColorCache.get(cleanUrl));
    if (pendingColorExtractions.has(cleanUrl)) return pendingColorExtractions.get(cleanUrl);

    const tryLoad = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const rgb = sampleDominantRgbFromImage(img);
          if (rgb) resolve(rgb);
          else reject(new Error('No color'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = src;
    });

    const promise = tryLoad(cleanUrl)
      .catch(() => {
        if (HTTP_OR_HTTPS_RE.test(cleanUrl)) return tryLoad(getProxy() + encodeURIComponent(cleanUrl));
        throw new Error('Local load failed');
      })
      .then((rgb) => {
        const finalRgb = rgb || presetRgb;
        if (finalRgb) {
          iconColorCache.set(cleanUrl, finalRgb);
          scheduleSaveIconColorCache();
        }
        pendingColorExtractions.delete(cleanUrl);
        return finalRgb;
      })
      .catch(() => {
        pendingColorExtractions.delete(cleanUrl);
        return presetRgb;
      });

    pendingColorExtractions.set(cleanUrl, promise);
    return promise;
  }

  function hydrateRepoItemColors(containerEl) {
    if (!containerEl) return;
    const items = containerEl.querySelectorAll('li[data-icon-url]:not([data-color-hydrated])');
    const uncachedQueue = [];

    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      li.dataset.colorHydrated = '1';
      const iconUrl = li.dataset.iconUrl;
      const tintHex = li.dataset.tintHex || '';
      const cached = iconColorCache.get(sanitizeUrl(iconUrl, '')) || hexToRgbString(tintHex);
      if (cached) {
        li.style.setProperty('--repo-tint-rgb', cached);
        li.classList.add('repo-tinted');
      } else {
        uncachedQueue.push({ li, iconUrl, tintHex });
      }
    }

    if (uncachedQueue.length) {
      onIdle(() => {
        for (let i = 0; i < uncachedQueue.length; i++) {
          const { li, iconUrl, tintHex } = uncachedQueue[i];
          extractIconRgb(iconUrl, tintHex).then((rgb) => {
            if (rgb && li.isConnected) {
              li.style.setProperty('--repo-tint-rgb', rgb);
              li.classList.add('repo-tinted');
            }
          });
        }
      });
    }
  }

  let currentRepoPopup = null;
  let currentRepoPool = [];
  let currentRepoFromAllSources = false;

  const formatRepoDate = (raw) => {
    if (!raw) return '';
    const cached = _repoDateCache.get(raw);
    if (cached !== undefined) return cached;
    const d = new Date(raw);
    const t = d.getTime();
    const result = Number.isNaN(t)
      ? String(raw).slice(0, 10)
      : (_dateFmt ? _dateFmt.format(d) : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
    if (_repoDateCache.size > _CACHE_MAX) _repoDateCache.clear();
    _repoDateCache.set(raw, result);
    return result;
  };

  const formatBytesMb = (bytes) => {
    const n = parseSize(bytes);
    if (!n) return '';
    const cached = _mbCache.get(n);
    if (cached !== undefined) return cached;
    const result = n > 10240 ? `${(n / 1048576).toFixed(1)} MB` : `${n.toFixed(1)} MB`;
    if (_mbCache.size > 500) _mbCache.clear();
    _mbCache.set(n, result);
    return result;
  };

  function formatPermissionTitle(raw) {
    const str = String(raw || '').trim();
    if (!str) return '';
    const stripped = str
      .replace(/^NS([A-Z].*?)UsageDescription$/i, '$1')
      .replace(/^(com\.apple\.developer\.|com\.apple\.security\.|com\.apple\.|aps-environment)/i, (m) =>
        m.toLowerCase() === 'aps-environment' ? 'Push Notifications' : ''
      );
    const base = stripped || str;
    return base
      .replace(/[._-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function extractAppPermissions(perms) {
    if (!perms || typeof perms !== 'object') return _EMPTY_PERMS;
    let hasKeys = false;
    for (const _ in perms) { hasKeys = true; break; }
    if (!hasKeys) return _EMPTY_PERMS;

    const cached = _permCache.get(perms);
    if (cached) return cached;

    const privacy = [];
    const rawPrivacy = perms.privacy;
    if (Array.isArray(rawPrivacy)) {
      for (let i = 0; i < rawPrivacy.length; i++) {
        const p = rawPrivacy[i];
        if (!p) continue;
        if (typeof p === 'string') {
          privacy.push({ name: formatPermissionTitle(p), key: p, usageDescription: '' });
        } else if (typeof p === 'object') {
          const rawKey = String(p.name || p.key || p.permission || p.title || '').trim();
          const desc = String(p.usageDescription || p.description || p.reason || '').trim();
          const name = formatPermissionTitle(rawKey) || desc || 'Privacy Permission';
          privacy.push({ name, key: rawKey, usageDescription: desc });
        }
      }
    } else if (rawPrivacy && typeof rawPrivacy === 'object') {
      for (const k in rawPrivacy) {
        const v = rawPrivacy[k];
        const desc = typeof v === 'string' ? v.trim() : String(v?.usageDescription || v?.description || '').trim();
        privacy.push({ name: formatPermissionTitle(k) || k, key: k, usageDescription: desc });
      }
    }

    const entitlements = [];
    const rawEnts = perms.entitlements;
    if (Array.isArray(rawEnts)) {
      for (let i = 0; i < rawEnts.length; i++) {
        const e = rawEnts[i];
        if (!e) continue;
        const rawName = typeof e === 'string' ? e.trim() : String(e.name || e.key || e.entitlement || '').trim();
        const desc = typeof e === 'object' ? String(e.description || e.usageDescription || '').trim() : '';
        if (rawName) {
          entitlements.push({ name: formatPermissionTitle(rawName) || rawName, raw: rawName, description: desc });
        }
      }
    } else if (rawEnts && typeof rawEnts === 'object') {
      for (const k in rawEnts) {
        const v = rawEnts[k];
        const desc = typeof v === 'string' ? v.trim() : '';
        entitlements.push({ name: formatPermissionTitle(k) || k, raw: k, description: desc });
      }
    }

    const result = { privacy, entitlements, total: privacy.length + entitlements.length };
    _permCache.set(perms, result);
    return result;
  }

  window.openRepoVersionsSheet = (bundleId, sourceURL) => {
    const item = findRepoApp(bundleId, sourceURL);
    if (!item || !Array.isArray(item.versions) || !item.versions.length) return;
    const key = `${item.bundleIdentifier}|${item.sourceURL || ''}|${item.version || ''}`;
    let cachedEntry = _versionsSheetCache.get(key);
    if (cachedEntry === undefined) {
      const versions = item.versions;
      const parts = new Array(versions.length);
      for (let idx = 0; idx < versions.length; idx++) {
        const v = versions[idx];
        const verStr = escapeHtml(v.version || '1.0');
        const buildStr = v.buildVersion && v.buildVersion !== v.version ? ` (${escapeHtml(v.buildVersion)})` : '';
        const dateStr = escapeHtml(formatRepoDate(v.date));
        const sizeStr = escapeHtml(formatBytesMb(v.size));
        const metaParts = [dateStr, sizeStr, v.minOSVersion ? `iOS ${escapeHtml(v.minOSVersion)}+` : ''].filter(Boolean).join(' • ');
        const notesHtml = v.localizedDescription
          ? `<div class="item-text" style="margin-top:6px;white-space:pre-line;font-size:13px;opacity:0.85;max-height:none;-webkit-line-clamp:unset;">${escapeHtml(v.localizedDescription)}</div>`
          : '';
        const dlUrl = escapeHtml(v.downloadURL);
        parts[idx] = `<li style="content-visibility:auto;contain-intrinsic-size:auto 100px;"><div class="item-content"><div class="item-inner"><div class="item-title-row" style="display:flex;align-items:center;justify-content:space-between;"><div><div class="item-title notranslate" style="font-weight:600;">v${verStr}${buildStr} ${idx === 0 ? '<span class="badge color-blue" style="margin-left:4px;">Latest</span>' : ''}</div>${metaParts ? `<div class="item-subtitle" style="font-size:12px;opacity:0.65;">${metaParts}</div>` : ''}</div><a href="${dlUrl}" class="external button button-fill button-round button-small">GET</a></div>${notesHtml}</div></div></li>`;
      }
      const initialHtml = parts.slice(0, _INITIAL_LIST_CHUNK).join('');
      const shell = `<div class="sheet-modal no-push" data-push="false"><div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div><div class="page"><div class="page-content"><div class="list media-list list-strong list-dividers inset"><ul class="versions-ul">${initialHtml}</ul></div></div></div></div>`;
      cachedEntry = { shell, parts };
      if (_versionsSheetCache.size >= _CACHE_MAX) _versionsSheetCache.clear();
      _versionsSheetCache.set(key, cachedEntry);
    }
    let cancelMount = null;
    app.sheet.create({
      swipeToClose: true,
      backdrop: true,
      push: false,
      destroyOnClose: true,
      content: cachedEntry.shell,
      on: {
        opened(sheet) {
          if (cachedEntry.parts.length > _INITIAL_LIST_CHUNK) {
            cancelMount = mountChunkedList(sheet.el?.querySelector('.versions-ul'), cachedEntry.parts);
          }
        },
        close() {
          if (cancelMount) cancelMount();
        }
      }
    }).open();
  };

  window.openRepoPermissionsSheet = (bundleId, sourceURL) => {
    const item = findRepoApp(bundleId, sourceURL);
    if (!item) return;
    const { privacy, entitlements, total } = extractAppPermissions(item.appPermissions);
    if (!total) return;

    const key = `${item.bundleIdentifier}|${item.sourceURL || ''}|${item.version || ''}`;
    let cachedEntry = _permsSheetCache.get(key);
    if (cachedEntry === undefined) {
      let privacyHtml = '';
      let privItems = [];
      if (privacy.length) {
        privItems = new Array(privacy.length);
        for (let i = 0; i < privacy.length; i++) {
          const p = privacy[i];
          const title = escapeHtml(p.name || p.key || 'Permission');
          const showSubKey = p.key && p.key.toLowerCase() !== (p.name || '').toLowerCase();
          const subHtml = showSubKey ? `<div class="item-subtitle" style="font-size:12px;opacity:0.65;">${escapeHtml(p.key)}</div>` : '';
          const descHtml = p.usageDescription
            ? `<div class="item-text" style="margin-top:4px;white-space:pre-line;font-size:13px;opacity:0.85;max-height:none;-webkit-line-clamp:unset;">${escapeHtml(p.usageDescription)}</div>`
            : '';
          privItems[i] = `<li style="content-visibility:auto;contain-intrinsic-size:auto 80px;"><div class="item-content"><div class="item-media"><i class="f7-icons color-blue" style="font-size:22px;">hand_raised_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title notranslate" style="font-weight:600;">${title}</div></div>${subHtml}${descHtml}</div></div></li>`;
        }
        privacyHtml = `<div class="block-title">Privacy (${privacy.length})</div><div class="list media-list list-strong list-dividers inset"><ul class="priv-ul">${privItems.slice(0, _INITIAL_LIST_CHUNK).join('')}</ul></div>`;
      }
      let entitlementsHtml = '';
      let entItems = [];
      if (entitlements.length) {
        entItems = new Array(entitlements.length);
        for (let i = 0; i < entitlements.length; i++) {
          const e = entitlements[i];
          const title = escapeHtml(e.name || e.raw || 'Entitlement');
          const showRaw = e.raw && e.raw.toLowerCase() !== (e.name || '').toLowerCase();
          const subHtml = showRaw ? `<div class="item-subtitle" style="font-size:12px;opacity:0.65;word-break:break-all;">${escapeHtml(e.raw)}</div>` : '';
          const descHtml = e.description
            ? `<div class="item-text" style="margin-top:4px;white-space:pre-line;font-size:13px;opacity:0.85;max-height:none;-webkit-line-clamp:unset;">${escapeHtml(e.description)}</div>`
            : '';
          entItems[i] = `<li style="content-visibility:auto;contain-intrinsic-size:auto 80px;"><div class="item-content"><div class="item-media"><i class="f7-icons color-orange" style="font-size:22px;">checkmark_shield_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title notranslate" style="font-weight:600;word-break:break-word;">${title}</div></div>${subHtml}${descHtml}</div></div></li>`;
        }
        entitlementsHtml = `<div class="block-title">Entitlements (${entitlements.length})</div><div class="list media-list list-strong list-dividers inset"><ul class="ent-ul">${entItems.slice(0, _INITIAL_LIST_CHUNK).join('')}</ul></div>`;
      }
      const shell = `<div class="sheet-modal"><div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div><div class="page"><div class="page-content">${privacyHtml}${entitlementsHtml}</div></div></div>`;
      cachedEntry = { shell, privItems, entItems };
      if (_permsSheetCache.size >= _CACHE_MAX) _permsSheetCache.clear();
      _permsSheetCache.set(key, cachedEntry);
    }
    let cancelPriv = null;
    let cancelEnt = null;
    app.sheet.create({
      swipeToClose: true,
      backdrop: true,
      push: false,
      destroyOnClose: true,
      content: cachedEntry.shell,
      on: {
        opened(sheet) {
          if (cachedEntry.privItems.length > _INITIAL_LIST_CHUNK) {
            cancelPriv = mountChunkedList(sheet.el?.querySelector('.priv-ul'), cachedEntry.privItems);
          }
          if (cachedEntry.entItems.length > _INITIAL_LIST_CHUNK) {
            cancelEnt = mountChunkedList(sheet.el?.querySelector('.ent-ul'), cachedEntry.entItems);
          }
        },
        close() {
          if (cancelPriv) cancelPriv();
          if (cancelEnt) cancelEnt();
        }
      }
    }).open();
  };

  window.openRepoSourceFromPopup = (sourceURL) => {
    if (!sourceURL) return;
    const repo = getRepoByUrl(sourceURL);
    if (!repo) return;

    if (currentRepoPopup) {
      try { currentRepoPopup.close(); } catch {}
      currentRepoPopup = null;
    }

    const currentPage = document.querySelector('.page-current[data-name="repo-detail"]');
    if (currentPage) {
      app.views.main.router.back({ animate: false });
      setTimeout(() => openRepoPage(repo), 60);
    } else {
      openRepoPage(repo);
    }
  };

  function _getRepoPopupTemplate(item, fromAllSources) {
    const key = `${item.bundleIdentifier}|${item.sourceURL || ''}|${item.version || ''}|${fromAllSources ? 1 : 0}`;
    let tpl = _repoPopupTplCache.get(key);
    if (tpl !== undefined) return tpl;

    const appName = escapeHtml(item.name);
    const subtitleText = escapeHtml(item.subtitle || '');
    const developerText = escapeHtml(item.developerName || item.repoName || 'Developer');
    const categoryText = escapeHtml(normalizeCategory(item.category, 'Apps'));
    const descriptionText = item._escDesc !== undefined
      ? item._escDesc
      : (item._escDesc = escapeHtml(item.localizedDescription || 'No description available.').replace(NEWLINE_RE, '<br>'));
    const downloadLink = escapeHtml(sanitizeUrl(item.downloadURL));
    const iconUrl = escapeHtml(sanitizeUrl(item.iconURL, './assets/default.png'));
    const bundleId = escapeHtml(item.bundleIdentifier);
    const versionText = escapeHtml(item.version || '1.0');
    const rawScreenshots = Array.isArray(item.screenshotURLs) ? item.screenshotURLs : [];
    const screenshotsHtml = rawScreenshots.map(s => `<img loading="lazy" decoding="async" src="${escapeHtml(s)}">`).join('');
    const sizeMb = formatBytesMb(item.size) || '0.0 MB';

    const repoSourceAttr = escapeHtml(String(item.sourceURL || ''));
    const bundleIdJsAttr = jsAttr(String(item.bundleIdentifier));
    const sourceUrlJsAttr = jsAttr(String(item.sourceURL || ''));
    const shareArg = jsAttr({ title: String(item.name || ''), url: sanitizeUrl(item.downloadURL, '') });
    const reportArg = jsAttr(String(item.name || ''));
    const showReport = item.sourceURL === LOCAL_REPO_URL;
    const repoFavArg = jsAttr({
      id: item.bundleIdentifier,
      type: 'repo',
      sourceURL: item.sourceURL || '',
      icon: '',
      image: item.iconURL || '',
      title: item.name || '',
      subtitle: item.developerName || item.repoName || ''
    });

    const versionsList = Array.isArray(item.versions) ? item.versions : [];
    const latestNotes = item._escNotes !== undefined
      ? item._escNotes
      : (item._escNotes = escapeHtml(String(item.versionDescription || versionsList[0]?.localizedDescription || '').trim()).replace(NEWLINE_RE, '<br>'));
    const updatedDate = formatRepoDate(item.versionDate || versionsList[0]?.date);
    const minOS = escapeHtml(item.minOSVersion || versionsList[0]?.minOSVersion || '');

    const whatsNewHtml = (latestNotes || versionsList.length > 1) ? `
      <div class="block-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span>What's new?</span>
        ${versionsList.length > 1 ? `<a class="link" style="font-size:13px;" onclick="openRepoVersionsSheet(${bundleIdJsAttr}, ${sourceUrlJsAttr}); return false;">Version History (${versionsList.length})</a>` : ''}
      </div>
      <div class="block block-strong inset desc-card">
        <div style="display:flex;justify-content:space-between;font-size:12px;opacity:0.65;margin-bottom:${latestNotes ? '6px' : '0'};">
          <span>Version ${versionText}</span>
          ${updatedDate ? `<span>${escapeHtml(updatedDate)}</span>` : ''}
        </div>
        ${latestNotes ? `<div class="desc-text">${latestNotes}</div>` : ''}
      </div>` : '';

    const sourceRepo = fromAllSources && item.sourceURL ? getRepoByUrl(item.sourceURL) : null;
    const sourceName = escapeHtml(sourceRepo?.name || item.repoName || 'Source');
    const sourceIconUrl = escapeHtml(sanitizeUrl(sourceRepo?.iconURL, './assets/default.png'));
    const sourceRowHtml = (fromAllSources && item.sourceURL) ? `
      <li>
        <a class="item-link" onclick="openRepoSourceFromPopup(${sourceUrlJsAttr}); return false;" style="display:flex;align-items:center;justify-content:space-between;width:100%;color:inherit;text-decoration:none;">
          <span>Source</span>
          <span class="size-12" style="display:inline-flex;align-items:center;gap:6px;">
            <img src="${sourceIconUrl}" alt="${sourceName}" loading="lazy" decoding="async" style="width:20px;height:20px;border-radius:25%;object-fit:cover;">
            <span class="notranslate">${sourceName}</span>
            <i class="f7-icons" style="font-size:12px;opacity:0.5;">chevron_right</i>
          </span>
        </a>
      </li>` : '';

    const { total: totalPerms } = extractAppPermissions(item.appPermissions);
    const permissionsRowHtml = totalPerms ? `
      <li>
        <a class="item-link" onclick="openRepoPermissionsSheet(${bundleIdJsAttr}, ${sourceUrlJsAttr}); return false;" style="display:flex;align-items:center;justify-content:space-between;width:100%;color:inherit;text-decoration:none;">
          <span>Permissions</span>
          <span class="size-12" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${totalPerms} declared</span>
            <i class="f7-icons" style="font-size:12px;opacity:0.5;">chevron_right</i>
          </span>
        </a>
      </li>` : '';

    const detailsHtml = `
      <div class="block-title">Details</div>
      <div class="list simple-list list-strong list-dividers inset deferred-chunk">
        <ul>
          <li><span>BundleID</span><span class="size-12">${bundleId}</span></li>
          ${sourceRowHtml}       
          ${updatedDate ? `<li><span>Updated</span><span class="size-12">${escapeHtml(updatedDate)}</span></li>` : ''}
          ${minOS ? `<li><span>Compatibility</span><span class="size-12">iOS ${minOS}+</span></li>` : ''}
          ${permissionsRowHtml}
        </ul>
      </div>`;

    const deferredParts = {
      screenshots: rawScreenshots.length ? `<div class="block-title">Preview</div><div class="screenshot deferred-chunk" onclick="openPhotoBrowser(${jsAttr(rawScreenshots)})">${screenshotsHtml}</div>` : '',
      desc: `<div class="block-title">About</div><div class="block block-strong inset desc-card deferred-chunk"><div class="desc-text">${descriptionText}</div></div>`,
      details: detailsHtml
    };

    const shell = `
      <div class="popup popup-app-detail" id="popup-${bundleId}">
        <div class="page">
          <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
          <div class="page-content sheet-body">
            <div class="sheet-header">
              <img src="${iconUrl}" decoding="async" class="app-icon" alt="${appName}">
              <div class="sheet-title-wrap">
                <div class="sheet-title">${appName}</div>
                <div class="sheet-sub">${subtitleText ? `<div style="font-size:12px;opacity:0.75;margin-bottom:4px;">${subtitleText}</div>` : ''}<span class="badge">${developerText}</span></div>
                <div class="sheet-actions">
                  <a href="${downloadLink}" class="external button button-fill button-round get">GET</a>
                  <a class="popover-open more" data-popover=".popover-menu" data-repo-bundle="${bundleId}" data-repo-source="${repoSourceAttr}"><i class="f7-icons">ellipsis_circle_fill</i></a>
                </div>
              </div>
            </div>
            <div class="meta-bar">
              <div class="meta-col"><span class="meta-top">VERSION</span><span class="meta-val">${versionText}</span></div>
              <div class="meta-col"><span class="meta-top">SIZE</span><span class="meta-val">${escapeHtml(sizeMb)}</span></div>
              <div class="meta-col"><span class="meta-top">CATEGORY</span><span class="meta-val">${categoryText}</span></div>
            </div>
            ${whatsNewHtml}
            ${_REC_PH}
            <div class="popover popover-menu" data-vertical-position="bottom">
              <div class="popover-inner">
                <div class="list list-dividers" style="text-align:left!important;">
                  <ul>
                    <li><a onclick="safeShare(${shareArg})" class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">square_arrow_up</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Share</div></div></div></a></li>
                    <li><a onclick="addToFavorites(${repoFavArg})" class="item-link item-content external favorite-toggle-item"><div class="item-media"><i class="f7-icons favorite-toggle-icon">heart_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title favorite-toggle-label">Favorite</div></div></div></a></li>
                    ${showReport ? `<li><a class="item-link item-content popover-close" onclick="openReportPopup(${reportArg})"><div class="item-media"><i class="f7-icons">exclamationmark_triangle_fill</i></div><div class="item-inner"><div class="item-title">Report</div></div></a></li>` : ''}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    tpl = { shell, deferredParts };
    if (_repoPopupTplCache.size >= _CACHE_MAX) _repoPopupTplCache.clear();
    _repoPopupTplCache.set(key, tpl);
    return tpl;
  }

  let _nextRepoPopupFn = null;

  function createRepoPopupHtml(item, pool = currentRepoPool, fromAllSources = false, deferRec = false) {
    const tpl = _getRepoPopupTemplate(item, fromAllSources);
    if (deferRec) return tpl.shell.replace(_REC_PH, '<div class="deferred-body-slot"></div>');
    const p = tpl.deferredParts;
    const recHtml = renderRecommendedBlock(
      getRandomItems(pool, 'bundleIdentifier', item.bundleIdentifier, 5),
      'openRepoApp', 'bundleIdentifier', 'name', 'developerName', 'iconURL', 'sourceURL'
    );
    return tpl.shell.replace(_REC_PH, p.screenshots + p.desc + p.details + recHtml);
  }

  function showRepoPopup(appItem, pool = currentRepoPool, fromAllSources = null) {
    if (!appItem) return;
    clearTimeout(_pendingRepoOpen);

    const nextPool = Array.isArray(pool) && pool.length ? pool : getAllApps();
    const nextFromAll = typeof fromAllSources === 'boolean'
      ? fromAllSources
      : !!document.querySelector('.page-current[data-all-sources="true"]');

    if (currentRepoPopup) {
      const prev = currentRepoPopup;
      const isPrevActive = prev.opened || prev.el?.classList.contains('modal-in') || prev.el?.classList.contains('modal-out');
      if (isPrevActive) {
        _popupTransitioning = true;
        _nextRepoPopupFn = () => showRepoPopup(appItem, nextPool, nextFromAll);
        _pendingRepoOpen = setTimeout(() => {
          if (_nextRepoPopupFn) {
            const fn = _nextRepoPopupFn;
            _nextRepoPopupFn = null;
            if (currentRepoPopup === prev) currentRepoPopup = null;
            try { prev.destroy(); } catch {}
            prev.el?.remove();
            _popupTransitioning = false;
            fn();
          }
        }, 400);
        try { prev.close(); } catch {}
        return;
      } else {
        currentRepoPopup = null;
        try { prev.destroy(); } catch {}
        prev.el?.remove();
      }
    }

    _popupTransitioning = false;
    currentRepoPool = nextPool;
    currentRepoFromAllSources = nextFromAll;
    const targetPool = currentRepoPool;
    const isAll = currentRepoFromAllSources;
    const tpl = _getRepoPopupTemplate(appItem, isAll);
    let cancelHydrate = null;

    currentRepoPopup = app.popup.create({
      content: tpl.shell.replace(_REC_PH, '<div class="deferred-body-slot"></div>'),
      swipeToClose: 'to-bottom',
      push: true,
      on: {
        opened(p) {
          cancelHydrate = hydrateProgressive(
            p.el,
            tpl.deferredParts,
            () => renderRecommendedBlock(
              getRandomItems(targetPool, 'bundleIdentifier', appItem.bundleIdentifier, 5),
              'openRepoApp', 'bundleIdentifier', 'name', 'developerName', 'iconURL', 'sourceURL'
            )
          );
        },
        close() {
          if (cancelHydrate) cancelHydrate();
        },
        closed(p) {
          clearTimeout(_pendingRepoOpen);
          if (currentRepoPopup === p) currentRepoPopup = null;
          try { p.destroy(); } catch {}
          p.el?.remove();
          if (_nextRepoPopupFn) {
            const fn = _nextRepoPopupFn;
            _nextRepoPopupFn = null;
            setTimeout(() => {
              _popupTransitioning = false;
              fn();
            }, 20);
          } else {
            _popupTransitioning = false;
          }
        }
      }
    });
    currentRepoPopup.open();
  }

  window.openRepoApp = (bundleId, sourceURL) => {
    if (!bundleId) return;
    let nextItem = null;
    let pool = null;

    if (sourceURL) {
      const repo = getRepoByUrl(sourceURL);
      pool = repo?.apps || getAllApps();
      nextItem = findRepoApp(bundleId, sourceURL);
    }
    if (!nextItem) {
      pool = currentRepoPool?.length ? currentRepoPool : getAllApps();
      nextItem = pool.find(a => a.bundleIdentifier === bundleId) || findRepoApp(bundleId);
    }
    if (!nextItem) return;

    const fromAllSources = currentRepoPopup
      ? currentRepoFromAllSources
      : !!document.querySelector('.page-current[data-all-sources="true"]');

    showRepoPopup(nextItem, pool, fromAllSources);
  };

  const SKELETON_LI = `<li><div class="item-content skeleton-effect-pulse"><div class="item-media"><div class="skeleton-block" style="width:58px;height:58px;border-radius:28%"></div></div><div class="item-inner"><div class="item-title-row"><div class="item-title skeleton-text notranslat ">Loading</div></div><div class="item-subtitle skeleton-text">Loading</div></div></div></li>`;
  const REPO_DETAIL_SKELETON_ITEMS = Array.from({ length: 6 }, () => ({ skeleton: true }));

  const renderRepoAppItem = (item) => {
    if (item?.skeleton) return SKELETON_LI;
    if (item._repoRowHtml) return item._repoRowHtml;
    const iconUrl = sanitizeUrl(item.iconURL, './assets/default.png');
    return (item._repoRowHtml = `<li><a class="item-link item-content app-item-trigger" data-id="${escapeHtml(item.bundleIdentifier)}" data-source="${escapeHtml(item.sourceURL || '')}"><div class="item-media"><img src="${escapeHtml(iconUrl)}" loading="lazy" decoding="async"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${escapeHtml(item.name)}</div></div><div class="item-subtitle"><span class="badge">${escapeHtml(item.developerName || normalizeCategory(item.category) || '')}</span></div></div></a></li>`);
  };

  function buildRepoCategoryResolver(apps) {
    let nonGeneric = false;
    for (let i = 0; i < apps.length; i++) {
      const a = apps[i];
      const c = a?._normCatLower || String(a?.category || '').trim().toLowerCase();
      if (c && c !== 'apps' && c !== 'other') { nonGeneric = true; break; }
    }
    return nonGeneric
      ? _defaultCatGetter
      : (item) => normalizeCategory(item?.category || item?.repoName || item?.developerName, 'Other');
  }

  function createAppListPage(pageId, title, apps, isAllSources = false, sourceURL = null) {
    const pageName = escapeHtml(pageId);
    const sourceUrl = escapeHtml(sourceURL || '');
    const rightContent = !isAllSources
      ? `<div class="right"><a onclick="safeShare(${jsAttr({ url: sourceURL || '' })})" class="link icon-only"><i class="icon f7-icons">square_arrow_up</i></a></div>`
      : '';

    const pageHtml = `
      <div class="page page-with-bottom-search page-with-subnavbar" data-name="repo-detail" data-url="${sourceUrl}" data-id="${pageName}" ${isAllSources ? 'data-all-sources="true"' : ''}>
        <div class="searchbar-backdrop"></div>
        <div class="searchbar-bottom-wrap">
          <form class="searchbar"><div class="searchbar-inner"><div class="searchbar-input-wrap"><input type="search" placeholder="Search"><i class="searchbar-icon"></i><span class="input-clear-button"></span></div><span class="searchbar-disable-button"><i class="icon icon-close"></i></span></div></form>
        </div>
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner">
            <div class="subnavbar">
              <form class="searchbar" data-search-container=".virtual-list-${pageName}" data-search-item="li" data-search-in=".item-title">
                <div class="searchbar-inner"><div class="searchbar-input-wrap"><input type="search" placeholder="Search"><i class="searchbar-icon"></i><span class="input-clear-button"></span></div><span class="searchbar-disable-button"><i class="icon icon-close"></i></span></div>
              </form>
            </div>
            <div class="left searchbar-hide-on-enable"><a class="link back"><i class="icon icon-back"></i></a></div>
            <div class="title">${escapeHtml(title)}</div>
            ${rightContent}
          </div>
        </div>
        <div class="page-content repo-page ptr-content ptr-repo-detail">
          <div class="ptr-preloader"><div class="preloader"></div><div class="ptr-arrow"></div></div>
          <div id="repo-filters-${pageName}" class="category-filter repo-filter ptr-ignore"></div>
          <div class="list media-list separated inset virtual-list virtual-list-${pageName} searchbar-found repo-apps"></div>
          <div class="block text-align-center searchbar-not-found ptr-ignore">
            <i class="f7-icons" style="font-size:96px;color:#ff3b30;">bin_xmark_fill</i>
            <h2 style="margin-top:20px;">Nothing was found</h2>
            <p>Check your spelling or try searching something else.</p>
          </div>
        </div>
      </div>`;

    app.views.main.router.navigate({
      url: `/repo-detail/${pageId}/`,
      route: {
        path: `/repo-detail/${pageId}/`,
        content: pageHtml,
        on: {
          pageInit(_, page) {
            page.allRepoApps = Array.isArray(apps) ? apps : [];
            page.activeCategory = 'All';
            page.currentFilteredApps = page.allRepoApps;
            page.currentResolver = buildRepoCategoryResolver(page.allRepoApps);

            const listEl = page.el.querySelector(`.virtual-list-${pageId}`);
            const notFoundEl = page.el.querySelector('.searchbar-not-found');
            const filterBarEl = page.el.querySelector(`#repo-filters-${pageName}`);
            const appMap = new Map();

            const vl = app.virtualList.create({
              el: listEl,
              items: page.allRepoApps,
              searchAll: vlSearch('name', '_searchName'),
              height: 90,
              renderItem: renderRepoAppItem
            });
            page.vl = vl;
            page.el.vl = vl;

            const sbEls = [...page.el.querySelectorAll('.searchbar')];
            const sbInstances = [];

            const applyRepoFilterAndSearch = (selectedCat, resolver = page.currentResolver, queryOverride = undefined) => {
              if (selectedCat !== page.activeCategory || !page.currentFilteredApps) {
                page.activeCategory = selectedCat;
                const target = selectedCat.toLowerCase();
                if (selectedCat === 'All') {
                  page.currentFilteredApps = page.allRepoApps;
                } else {
                  const filtered = [];
                  const isDef = resolver === _defaultCatGetter;
                  for (let i = 0; i < page.allRepoApps.length; i++) {
                    const a = page.allRepoApps[i];
                    const catLower = isDef && a._normCatLower !== undefined
                      ? a._normCatLower
                      : normalizeCategory(resolver(a)).toLowerCase();
                    if (catLower === target) filtered.push(a);
                  }
                  page.currentFilteredApps = filtered;
                }
              }

              updateListSearch({
                vl,
                listEl,
                notFoundEl,
                sb: sbInstances.find(s => s.query) || sbInstances[0] || null,
                sbEl: sbEls[0] || null,
                items: page.currentFilteredApps,
                key: 'name',
                cachedLowerKey: '_searchName',
                queryOverride
              });
            };

            sbEls.forEach((el) => {
              const inst = app.searchbar.create({
                el,
                customSearch: true,
                searchContainer: `.virtual-list-${pageName}`,
                searchIn: '.item-title',
                on: {
                  search(sbInst, query) {
                    sbEls.forEach((otherEl) => {
                      if (otherEl !== el) {
                        const otherInput = otherEl.querySelector('input[type="search"]');
                        if (otherInput && otherInput.value !== query) otherInput.value = query;
                      }
                    });
                    applyRepoFilterAndSearch(page.activeCategory, page.currentResolver, query);
                  },
                  clear() {
                    sbEls.forEach((otherEl) => {
                      const otherInput = otherEl.querySelector('input[type="search"]');
                      if (otherInput) otherInput.value = '';
                    });
                    applyRepoFilterAndSearch(page.activeCategory, page.currentResolver, '');
                  },
                  disable() {
                    sbEls.forEach((otherEl) => {
                      const otherInput = otherEl.querySelector('input[type="search"]');
                      if (otherInput) otherInput.value = '';
                    });
                    requestAnimationFrame(() => applyRepoFilterAndSearch(page.activeCategory, page.currentResolver, ''));
                  }
                }
              });
              sbInstances.push(inst);
            });

            page.el.updateRepoFilters = (newApps) => {
              page.allRepoApps = Array.isArray(newApps) ? newApps : [];
              page.currentFilteredApps = null;
              appMap.clear();
              for (let i = 0; i < page.allRepoApps.length; i++) {
                const a = page.allRepoApps[i];
                appMap.set(`${a.bundleIdentifier}|${a.sourceURL || ''}`, a);
                if (!appMap.has(a.bundleIdentifier)) appMap.set(a.bundleIdentifier, a);
              }
              page.currentResolver = buildRepoCategoryResolver(page.allRepoApps);
              page.activeCategory = renderCategoryPills(
                filterBarEl,
                page.allRepoApps,
                page.currentResolver,
                page.activeCategory || 'All',
                (selectedCat) => applyRepoFilterAndSearch(selectedCat, page.currentResolver)
              );
              applyRepoFilterAndSearch(page.activeCategory, page.currentResolver);
            };

            page.el.updateRepoFilters(page.allRepoApps);

            page.$el.on('click', '.app-item-trigger', function () {
              const id = this.dataset.id;
              const src = this.dataset.source || '';
              const appItem = appMap.get(`${id}|${src}`) || appMap.get(id);
              if (appItem) showRepoPopup(appItem, page.allRepoApps, isAllSources);
            });

            onIdle(() => {
              const limit = Math.min(page.allRepoApps.length, 8);
              for (let i = 0; i < limit; i++) {
                try { _getRepoPopupTemplate(page.allRepoApps[i], isAllSources); } catch {}
              }
            });
          },
          pageBeforeRemove(_, page) {
            const found = page.el?.querySelector('.searchbar-found');
            if (found) {
              foundResizeObservers.get(found)?.disconnect();
              foundResizeObservers.delete(found);
            }
          }
        }
      }
    });
  }

  const openRepoPage = (repo) => createAppListPage(`repo-${Date.now()}`, repo.name, repo.apps, false, repo.sourceURL);
  const openAllSourcesPage = () => createAppListPage(`all-${Date.now()}`, 'All Sources', getAllApps(), true, null);

  function renderSourcesList(repos) {
    const listEl = $id('sources-list');
    if (!listEl) return;

    const order = store.get('sourcesListOrder', []);
    let sig = `${getAllApps().length}|${order.join(',')}|`;
    for (let i = 0; i < repos.length; i++) {
      const r = repos[i];
      sig += `${r.name || ''}|${r.sourceURL || ''}|${(r.apps || []).length}|${r.iconURL || ''}|${r.tintColor || ''}|${r.isSystem ? 1 : 0};`;
    }
    if (listEl._renderSig === sig && listEl.childElementCount > 0) {
      hydrateRepoItemColors(listEl);
      return;
    }
    listEl._renderSig = sig;

    const allSourcesHtml = `<li id="all-sources" class="repo-color-item repo-tinted" style="--repo-tint-rgb: 0, 122, 255;"><div><a class="item-link all-sources-link"><div class="item-content"><div class="item-media"><i class="f7-icons" style="color: rgb(var(--repo-tint-rgb));">tray_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">All Sources</div></div><div class="item-subtitle"><span class="badge repo-tint-badge">${getAllApps().length} Total Apps</span></div></div></div></a></div></li>`;

    let orderedRepos = repos;
    if (order.length > 1) {
      const orderMap = new Map();
      for (let i = 0; i < order.length; i++) orderMap.set(order[i], i);
      orderedRepos = repos.slice().sort((a, b) => {
        const idA = a.name || a.sourceURL || '';
        const idB = b.name || b.sourceURL || '';
        const idxA = orderMap.has(idA) ? orderMap.get(idA) : 999999;
        const idxB = orderMap.has(idB) ? orderMap.get(idB) : 999999;
        return idxA - idxB;
      });
    }

    const parts = new Array(orderedRepos.length);
    for (let i = 0; i < orderedRepos.length; i++) {
      const repo = orderedRepos[i];
      const repoId = escapeHtml(repo.name || repo.sourceURL || '');
      const sourceUrl = escapeHtml(repo.sourceURL);
      const iconUrl = sanitizeUrl(repo.iconURL, './assets/default.png');
      const escIconUrl = escapeHtml(iconUrl);
      const cachedRgb = iconColorCache.get(iconUrl) || hexToRgbString(repo.tintColor);
      const styleAttr = cachedRgb ? ` style="--repo-tint-rgb: ${cachedRgb};"` : '';
      const tintedClass = cachedRgb ? ' repo-tinted' : '';
      parts[i] = `
        <li id="${repoId}" class="repo-color-item${tintedClass} ${repo.isSystem ? '' : 'swipeout'}" data-icon-url="${escIconUrl}" data-tint-hex="${escapeHtml(repo.tintColor || '')}"${styleAttr}>
          <div class="swipeout-content">
            <a class="item-link repo-link" href="#" data-url="${sourceUrl}">
              <div class="item-content">
                <div class="item-media"><img src="${escIconUrl}" loading="lazy" decoding="async"></div>
                <div class="item-inner">
                  <div class="item-title-row"><div class="item-title notranslate">${escapeHtml(repo.name)}</div></div>
                  <div class="item-subtitle"><span class="badge repo-tint-badge">${Array.isArray(repo.apps) ? repo.apps.length : 0} Apps</span></div>
                </div>
              </div>
            </a>
          </div>
          ${repo.isSystem ? '' : `<div class="swipeout-actions-right"><a onclick="safeShare(${jsAttr({ url: repo.sourceURL || '' })})">Share</a><a class="delete-source color-red" data-url="${sourceUrl}">Remove <i class="f7-icons" style="color:white;">trash</i></a></div>`}
        </li>`;
    }

    const allInOrderIdx = order.indexOf('all-sources');
    if (allInOrderIdx > 0 && allInOrderIdx < parts.length + 1) {
      parts.splice(allInOrderIdx, 0, allSourcesHtml);
      listEl.innerHTML = parts.join('');
    } else {
      listEl.innerHTML = allSourcesHtml + parts.join('');
    }
    listEl.classList.add('sortable');

    if (!listEl.dataset.sortableInitialized) {
      listEl.addEventListener('sortable:sort', () => {
        store.set('sourcesListOrder', [...listEl.children].map(li => li.id));
      });
      listEl.dataset.sortableInitialized = 'true';
    }

    hydrateRepoItemColors(listEl);
  }

  function renderNews(repos) {
    const allNews = [];
    for (let i = 0; i < repos.length; i++) {
      const r = repos[i];
      const rNews = r.news || [];
      for (let j = 0; j < rNews.length; j++) {
        const n = rNews[j];
        allNews.push({ ...n, source: r.name, _ts: Date.parse(n.date) || 0 });
      }
    }
    const wrapper = $id('news-swiper-wrapper');
    const section = $id('news-section');
    if (!wrapper || !section) return;
    if (!allNews.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    allNews.sort((a, b) => b._ts - a._ts);

    const parts = new Array(allNews.length);
    for (let i = 0; i < allNews.length; i++) {
      const news = allNews[i];
      parts[i] = `
      <div class="swiper-slide swiper-slide-news">
        <div class="card repo-news-card">
          <div class="card-content card-content-padding">
            <div class="size-12 notranslate">${escapeHtml(news.source)}</div>
            <div class="text-weight-bold">${escapeHtml(String(news.title || '').slice(0, 34))}</div>
            <a class="news-read-more link" data-caption="${escapeHtml(encodeURIComponent(news.caption || ''))}">Read more</a>
          </div>
        </div>
      </div>`;
    }
    wrapper.innerHTML = parts.join('');

    const swiperContainer = $id('news-swiper-container');
    if (swiperContainer && !swiperContainer.swiper) {
      app.swiper.create('#news-swiper-container', {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: '1',
        grabCursor: true,
        coverflowEffect: { rotate: 0, stretch: 0, depth: 120, modifier: 1.5, slideShadows: false },
        on: { init() { this.wrapperEl.style.willChange = 'transform'; } }
      });
    } else {
      swiperContainer?.swiper?.update();
    }
  }

  $id('news-swiper-wrapper')?.addEventListener('click', (e) => {
    const btn = e.target instanceof Element && e.target.closest('.news-read-more');
    if (!btn) return;
    let caption = '';
    try { caption = decodeURIComponent(btn.dataset.caption || ''); } catch { caption = btn.dataset.caption || ''; }
    app.sheet.create({
      swipeToClose: true,
      backdrop: true,
      push: true,
      destroyOnClose: true,
      content: `<div class="sheet-modal news-sheet"><div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div><div class="page"><div class="page-content"><div class="block"><p>${escapeHtml(caption)}</p></div></div></div></div>`
    }).open();
  });

  const openNsfwDialog = () => new Promise(resolve => {
    app.dialog.create({
      title: 'NSFW warning',
      text: 'This source may contain NSFW(18+) content. Add it at your own risk.',
      verticalButtons: true,
      buttons: [
        { text: 'Add anyway', cssClass: 'color-red', onClick: () => resolve('with') },
        { text: 'Add without NSFW apps', cssClass: 'color-green', onClick: () => resolve('without') },
        { text: "Don't add", onClick: () => resolve('cancel') }
      ]
    }).open();
  });

  async function addSourceFlow(url) {
    const raw = (url || '').trim();
    if (!raw) return app.dialog.alert('Please enter a source link.', 'Error');
    const normalizedUrl = normalizeSourceUrl(raw);
    if (!normalizedUrl) return app.dialog.alert('Please enter a valid source link.', 'Error');
    if (getRepoByUrl(normalizedUrl)) return app.dialog.alert('Already added.', 'Error');

    app.dialog.preloader('Fetching source');
    try {
      let [fetchedRepo] = await Promise.all([fetchRepo(normalizedUrl), wait(400)]);
      app.dialog.close();

      if (!fetchedRepo) {
        const choice = await new Promise(resolve => {
          app.dialog.create({
            title: 'Fetch failed',
            text: 'Could not fetch this source. You can still add it if you have the JSON content.',
            buttons: [
              { text: 'Paste JSON', onClick: () => resolve('paste') },
              { text: 'Cancel', onClick: () => resolve('cancel') }
            ]
          }).open();
        });
        if (choice === 'cancel') return;
        const jsonStr = await new Promise(resolve => app.dialog.prompt('Paste the full repository JSON', 'Manual add', resolve));
        if (!jsonStr) return;
        try {
          fetchedRepo = sanitizeRepo(JSON.parse(jsonStr), normalizedUrl);
        } catch {
          return app.dialog.alert('Invalid JSON. Please check the content.', 'Error');
        }
      }

      let repo = { ...fetchedRepo, sourceURL: normalizedUrl, apps: fetchedRepo.apps || [], news: fetchedRepo.news || [] };
      if (deepContainsNsfw({ repoName: repo.name, apps: repo.apps, news: repo.news })) {
        const choice = await openNsfwDialog();
        if (choice === 'cancel') return;
        if (choice === 'without') {
          setSourcePref(normalizedUrl, 'without');
          repo = stripNsfwApps(repo);
        } else {
          removeSourcePref(normalizedUrl);
        }
      } else {
        removeSourcePref(normalizedUrl);
      }

      saveRepos([...getRepos(), repo]);
      await refreshData(true);
    } catch {
      app.dialog.close();
      app.dialog.alert('An error occurred while adding the source. Please try again.', 'Error');
    }
  }

  addSourceFab?.addEventListener('click', () => {
    app.dialog.prompt('Enter the source link.', 'Add source', addSourceFlow);
  });

  $id('sources-list')?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    if (target.closest('.all-sources-link')) {
      e.preventDefault();
      openAllSourcesPage();
      return;
    }

    const delBtn = target.closest('.delete-source');
    if (delBtn) {
      const url = delBtn.dataset.url;
      const listItem = delBtn.closest('li');
      app.dialog.confirm(
        'Are you sure you want to remove this source?',
        'Remove source',
        () => {
          saveRepos(getRepos().filter(r => r.sourceURL !== url));

          const currentFavs = getFavorites();
          const remainingFavs = currentFavs.filter(f => !(f.type === 'repo' && String(f.sourceURL || '') === String(url)));
          if (remainingFavs.length !== currentFavs.length) {
            const remainingIds = new Set(remainingFavs.map(f => String(f.id)));
            setFavorites(remainingFavs);
            setFavOrder(getFavOrder().filter(id => remainingIds.has(String(id))));
            displayFavorites();
          }

          app.swipeout.delete(listItem);
          refreshData(true);
        },
        () => app.swipeout.close(listItem)
      );
      return;
    }

    const link = target.closest('.repo-link');
    if (link) {
      e.preventDefault();
      const repo = getRepoByUrl(link.dataset.url);
      if (repo) openRepoPage(repo);
    }
  });

  async function syncAllRepos(repos, delayMs = 300) {
    const [updates] = await Promise.all([
      Promise.all(repos.map(r => fetchRepo(r.sourceURL))),
      wait(delayMs)
    ]);
    const synced = updates.map((newRepo, i) => applySavedNsfwPreference(newRepo || repos[i])).filter(Boolean);
    saveRepos(synced);
    return synced;
  }

  const REPO_SOURCE_SKELETON_UNIT = `<li class="skeleton-effect-pulse"><div class="swipeout-content"><div class="item-content"><div class="item-media"><div class="skeleton-block" style="width:58px;height:58px;border-radius:28%;"></div></div><div class="item-inner"><div class="item-title-row"><div class="item-title skeleton-text notranslate">Loading Repo</div></div><div class="item-subtitle skeleton-text">Loading Apps</div></div></div></div></li>`;
  const REPO_NEWS_SKELETON_HTML = `<div class="swiper-slide swiper-slide-news skeleton-effect-pulse"><div class="card repo-news-card"><div class="card-content card-content-padding"><div class="size-12 skeleton-text">Source</div><div class="text-weight-bold skeleton-text">Loading news</div><a class="news-read-more skeleton-text">Read more</a></div></div></div>`.repeat(3);

  async function refreshData(force = false) {
    let repos = getRepos();
    const listEl = $id('sources-list');
    const newsWrapper = $id('news-swiper-wrapper');

    if (listEl) {
      listEl.innerHTML = REPO_SOURCE_SKELETON_UNIT.repeat(repos.length || 3);
      listEl._renderSig = null;
    }
    if (newsWrapper) {
      newsWrapper.innerHTML = REPO_NEWS_SKELETON_HTML;
      $id('news-swiper-container')?.swiper?.update();
    }

    if (force) app.dialog.preloader('Refreshing Sources');
    try {
      repos = await syncAllRepos(repos, force ? 500 : 250);
    } finally {
      if (force) app.dialog.close();
    }
    renderSourcesList(repos);
    renderNews(repos);
  }

  app.on('ptrRefresh', async (el) => {
    try {
      if (el.classList.contains('ptr-news')) {
        await fetchAndLoadNews(600);
      } else if (el.classList.contains('ptr-apps')) {
        await fetchAndLoadApps(600);
      } else if (el.classList.contains('ptr-repos')) {
        await refreshData(true);
      } else if (el.classList.contains('ptr-repo-detail')) {
        const pageEl = el.closest('.page');
        const isAllSources = pageEl.dataset.allSources === 'true';
        const repoUrl = pageEl.dataset.url;
        const listSelector = `.virtual-list-${pageEl.dataset.id}`;
        const vl = pageEl.vl || app.virtualList.get(listSelector);
        const replaceItems = (items) => {
          if (items[0]?.skeleton) {
            if (vl?.replaceAllItems) vl.replaceAllItems(items);
            else {
              const c = pageEl.querySelector(listSelector);
              if (c) c.innerHTML = `<ul>${items.map(renderRepoAppItem).join('')}</ul>`;
            }
          } else {
            pageEl.updateRepoFilters?.(items);
          }
        };

        replaceItems(REPO_DETAIL_SKELETON_ITEMS);

        if (isAllSources) {
          const allRepos = await syncAllRepos(getRepos(), 500);
          replaceItems(getAllApps());
          renderSourcesList(allRepos);
          renderNews(allRepos);
        } else {
          const [newRepoData] = await Promise.all([fetchRepo(repoUrl), wait(500)]);
          if (newRepoData) {
            const allRepos = getRepos().slice();
            const finalRepo = applySavedNsfwPreference(newRepoData);
            const idx = allRepos.findIndex(r => r.sourceURL === repoUrl);
            if (idx !== -1) { allRepos[idx] = finalRepo; saveRepos(allRepos); }
            replaceItems(finalRepo.apps || []);
          } else {
            replaceItems(getRepoByUrl(repoUrl)?.apps || []);
          }
        }
      }
    } finally {
      app.ptr.done(el);
    }
  });

  refreshData(false);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

