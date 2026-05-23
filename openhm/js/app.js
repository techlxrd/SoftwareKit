const app = new Framework7({
  el: "#app",
  theme: "ios",
  name: "SoftwareKit",
  id: "com.techlxrd.SoftwareKit",
  touch: {
    touchHighlight: true,
    tapHold: true,
  },
  popup: {
    push: true,
    swipeToClose: 'to-bottom',
  },
  sheet: {
    push: true,
    swipeToClose: 'to-bottom',
  },
  colors: {
    primary: '#0a58f7'
  },
  popover: {
    verticalPosition: 'bottom',
  },
  serviceWorker: {
    path: "./service-worker.js"
  },
});

var $ = Dom7;
const mainView = app.views.create(".view-main");
function isSafariOrAppleDevice() {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    const isSafariBrowser = /Safari/.test(ua) && !/Chrome|CriOS|Edg/.test(ua);
    return isIOS || isSafariBrowser;
}

(function initLiquidGlass() {
    const TARGET_CLASS_SELECTOR = '.liquid-glass';

    if (isSafariOrAppleDevice()) {
        const elements = document.querySelectorAll(TARGET_CLASS_SELECTOR);
        elements.forEach(el => {
            const blurStyles = `
                background: rgba(255, 255, 255, 0.15) !important;
                backdrop-filter: blur(20px) saturate(200%) contrast(1.1) !important;
                -webkit-backdrop-filter: blur(20px) saturate(200%) contrast(1.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.3)!important;
                filter: none !important;
            `;
            el.style.cssText += blurStyles.trim();
        });
        return;
    }

    const SVG_FILTER_ID = 'liquid-filter';
    if (document.getElementById(SVG_FILTER_ID)) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    svg.style.position = "absolute";
    svg.style.top = "-10000px";
    svg.style.left = "-10000px";
    svg.style.width = "1px";
    svg.style.height = "1px";
    svg.style.overflow = "hidden";

    svg.innerHTML = `
      <defs>
        <filter id="${SVG_FILTER_ID}" x="-50%" y="-50%" width="200%" height="200%"
                filterUnits="objectBoundingBox"
                primitiveUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB">

          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="3" seed="1" result="noise" stitchTiles="stitch" />

          <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />

          <feGaussianBlur in="displaced" stdDeviation="1.5" result="blurred" />

          <feColorMatrix in="blurred" type="saturate" values="1.4" result="saturated" />

          <feComponentTransfer in="saturated">
            <feFuncA type="discrete" tableValues="0 0.7 0.85 1 1" />
          </feComponentTransfer>

        </filter>
      </defs>
    `;

    document.body.appendChild(svg);

})();
const locks = new Set();
const foundResizeHandlers = new WeakMap();
const rootScrollHandlers = new WeakMap();

function inAllowedArea(target) {
  if (!(target instanceof Element)) return false;
  return !!target.closest('#browseTab, .searchbar-found, .dialog, .popup, .sheet-modal, .popover');
}

function getSearchbarEnabled(searchbar) {
  if (!searchbar) return false;
  if (typeof searchbar.enabled === 'boolean') return searchbar.enabled;
  if (typeof searchbar.active === 'boolean') return searchbar.active;
  if (searchbar.el instanceof Element) {
    return searchbar.el.classList.contains('searchbar-enabled') ||
           searchbar.el.classList.contains('searchbar-active');
  }
  return false;
}

function preventBackgroundScroll(e) {
  const target = e.target;
  if (!(target instanceof Element)) return;

  if (inAllowedArea(target)) return;

  if (e.cancelable) e.preventDefault();
}

function preventDialogScroll(e) {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const isDialog = target.closest('.dialog');
  const isBackdrop = target.classList.contains('dialog-backdrop');

  if (!isDialog && !isBackdrop) return;

  if (e.cancelable) e.preventDefault();
}

function lockBody() {
  document.documentElement.classList.add('ui-scroll-locked');
  document.body.classList.add('ui-scroll-locked');

  document.addEventListener('touchmove', preventBackgroundScroll, { passive: false, capture: true });
  document.addEventListener('wheel', preventBackgroundScroll, { passive: false, capture: true });
}

function unlockBody() {
  document.documentElement.classList.remove('ui-scroll-locked');
  document.body.classList.remove('ui-scroll-locked');

  document.removeEventListener('touchmove', preventBackgroundScroll, true);
  document.removeEventListener('wheel', preventBackgroundScroll, true);
}

function syncSearchbarFound(searchbar, enable) {
  const page = searchbar.el.closest('.page');
  if (!page) return;

  const found = page.querySelector('.searchbar-found');
  if (!found) return;

  const isSearchTab = !!found.closest('#browseTab');
  const isBottomSearchPage = page.classList.contains('page-with-bottom-search');
  const isExpandable = searchbar.el.classList.contains('searchbar-expandable');

  if (!isSearchTab && !isBottomSearchPage) {
    found.style.overflowY = '';
    found.style.webkitOverflowScrolling = '';
    found.style.overscrollBehavior = '';
    found.style.touchAction = '';
    found.style.minHeight = '';
    found.style.maxHeight = '';
    return;
  }

  found.classList.toggle('ptr-ignore', enable);
  found.classList.toggle('ptr-watch-scrollable', enable);

  if (enable) {
    found.style.overflowY = 'auto';
    found.style.webkitOverflowScrolling = 'touch';
    found.style.overscrollBehavior = 'contain';
    found.style.touchAction = 'pan-y';
    found.style.minHeight = '0';

    if (isExpandable) {
      const updateHeight = () => {
        if (!found.isConnected) return;

        const vv = window.visualViewport;
        const vh = vv ? vv.height : window.innerHeight;
        const top = found.getBoundingClientRect().top;

        found.style.maxHeight = Math.max(120, vh - top - 12) + 'px';
      };

      const old = foundResizeHandlers.get(found);
      if (old) {
        window.removeEventListener('resize', old);
        window.visualViewport?.removeEventListener('resize', old);
        window.visualViewport?.removeEventListener('scroll', old);
      }

      foundResizeHandlers.set(found, updateHeight);
      window.addEventListener('resize', updateHeight);
      window.visualViewport?.addEventListener('resize', updateHeight);
      window.visualViewport?.addEventListener('scroll', updateHeight);

      requestAnimationFrame(updateHeight);
      setTimeout(updateHeight, 0);
    } else {
      found.style.maxHeight = '';
    }
  } else {
    found.style.overflowY = '';
    found.style.webkitOverflowScrolling = '';
    found.style.overscrollBehavior = '';
    found.style.touchAction = '';
    found.style.minHeight = '';
    found.style.maxHeight = '';

    const old = foundResizeHandlers.get(found);
    if (old) {
      window.removeEventListener('resize', old);
      window.visualViewport?.removeEventListener('resize', old);
      window.visualViewport?.removeEventListener('scroll', old);
      foundResizeHandlers.delete(found);
    }
  }
}

function syncSearchScrollRoot(searchbar, enable) {
  const page = searchbar.el.closest('.page');
  if (!page) return;

  const root = page.querySelector('#browseTab');
  if (!root) return;

  root.classList.toggle('ptr-ignore', enable);
  root.classList.toggle('ptr-watch-scrollable', enable);

  if (enable) {
    root.style.overscrollBehavior = 'contain';
    root.style.touchAction = 'pan-y';
    root.style.webkitOverflowScrolling = 'touch';

    if (rootScrollHandlers.has(root)) return;

    let startY = 0;

    const onTouchStart = (e) => {
      if (!e.touches || !e.touches.length) return;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!(e.target instanceof Element)) return;
      if (!root.contains(e.target)) return;

      const touch = e.touches && e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - startY;
      const atTop = root.scrollTop <= 0;
      const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 1;

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const onWheel = (e) => {
      if (!(e.target instanceof Element)) return;
      if (!root.contains(e.target)) return;

      const atTop = root.scrollTop <= 0;
      const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 1;

      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        if (e.cancelable) e.preventDefault();
      }
    };

    root.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    root.addEventListener('wheel', onWheel, { passive: false, capture: true });

    rootScrollHandlers.set(root, { onTouchStart, onTouchMove, onWheel });
  } else {
    root.style.overscrollBehavior = '';
    root.style.touchAction = '';
    root.style.webkitOverflowScrolling = '';

    const handlers = rootScrollHandlers.get(root);
    if (!handlers) return;

    root.removeEventListener('touchstart', handlers.onTouchStart, true);
    root.removeEventListener('touchmove', handlers.onTouchMove, true);
    root.removeEventListener('wheel', handlers.onWheel, true);

    rootScrollHandlers.delete(root);
  }
}

document.addEventListener('touchmove', preventDialogScroll, { passive: false, capture: true });
document.addEventListener('wheel', preventDialogScroll, { passive: false, capture: true });

app.on('searchbarEnable', (searchbar) => {
  syncSearchbarFound(searchbar, true);
  syncSearchScrollRoot(searchbar, true);

  locks.add('search');
  if (locks.size === 1) lockBody();
});

app.on('searchbarSearch', (searchbar) => {
  syncSearchbarFound(searchbar, true);
  syncSearchScrollRoot(searchbar, true);
});

app.on('searchbarDisable', (searchbar) => {
  syncSearchbarFound(searchbar, false);
  syncSearchScrollRoot(searchbar, false);

  locks.delete('search');
  if (locks.size === 0) unlockBody();
});

const searchFab = document.getElementById('search-fab');
const tabsEl = document.querySelector('.tabs');

let fabTimeout = null;

function disableAllFabs() {
  if (searchFab) searchFab.style.pointerEvents = 'none';
}

function enableCurrentFab(tabId) {
  const currentFab = (tabId === 'browseTab') ? searchFab : null;

  if (currentFab) {
    currentFab.style.pointerEvents = 'auto';
  }
}

if (searchFab) {
  searchFab.style.visibility = 'hidden';
}

if (tabsEl) {
  tabsEl.addEventListener('tab:show', (e) => {
    const tabId = e.target?.id || e.detail?.tab?.id;

    if (!tabId || !searchFab) return;

    searchFab.style.visibility = (tabId === 'browseTab') ? 'visible' : 'hidden';

    if (fabTimeout) clearTimeout(fabTimeout);

    disableAllFabs();

    fabTimeout = setTimeout(() => {
      enableCurrentFab(tabId);
      fabTimeout = null;
    }, 750);
  });
}

document.addEventListener('click', function (e) {
  const clickedLink = e.target.closest('.sidebar-list .item-link');
  if (!clickedLink) return;

  app.popup.close();
  app.dialog.close();
  const currentPage = document.querySelector('.page-current[data-name="repo-detail"]');

  if (currentPage) {
    app.views.main.router.back();
  }
  const allLinks = document.querySelectorAll('.sidebar-list .item-link');
  allLinks.forEach(link => {
    link.classList.remove('tab-link-active');
  });
  clickedLink.classList.add('tab-link-active');
});

window.addEventListener('error', function (event) {
  const img = event.target;

  if (!(img instanceof HTMLImageElement)) return;

  if (img.closest('.screenshots')) return;

  if (img.dataset.fallbackApplied) return;

  img.dataset.fallbackApplied = 'true';
  img.src = '../ios/assets/default.png';
}, true);

document.addEventListener('DOMContentLoaded', () => {
  app.on('tabShow', (tabEl) => {
    const tabId = `#${tabEl.id}`;
    if (!tabEl.id) return;

    const tabLink = document.querySelector(
      `.tab-link[href="${tabId}"]`
    );
    if (!tabLink) return;

    const title = tabLink.dataset.tabTitle;
    if (!title) return;

    const navbar = document.querySelector(
      '.navbar.navbar-large'
    );
    if (!navbar) return;

    const titleEl = navbar.querySelector('.title');
    const largeTitleEl = navbar.querySelector('.title-large-text');

    if (titleEl) titleEl.textContent = title;
    if (largeTitleEl) largeTitleEl.textContent = title;
  });

  window.goToTab = function (tabId) {
    app.popup.close();
    app.tab.show(tabId);
  };
});

const READ_LATER_KEY = 'hw_read_later';
const FEED_CACHE_KEY = 'rss_feed_cache';
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e2e2/666?text=No+Image';
const FEED_URL = 'https://www.huaweicentral.com/feed/';
const CACHE_DURATION_MS = 600000;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getReadLater() {
  try {
    const stored = localStorage.getItem(READ_LATER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveReadLater(items) {
  localStorage.setItem(READ_LATER_KEY, JSON.stringify(items));
  renderReadLaterNews();
}

function shareArticle(title, url) {
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
    return;
  }
  if (navigator.clipboard && url) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
}

function addToReadLater(title, link, imgSrc = PLACEHOLDER_IMAGE) {
  const items = getReadLater();
  if (items.some(item => item.link === link)) {
    app.dialog.alert('Already in your Read Later list.', 'Error');
    return;
  }
  items.push({
    title: String(title || ''),
    link: String(link || ''),
    imgSrc: String(imgSrc || PLACEHOLDER_IMAGE)
  });
  saveReadLater(items);
  app.toast.show({ text: 'Added to Read Later', position: 'center', closeTimeout: 1500 });
}

function removeFromReadLater(link, title, cardEl) {
  app.dialog.confirm(`Remove "${title}" from Read Later?`, 'Confirm', () => {
    if (cardEl) {
      playDeleteNewsAnimation(cardEl).then(() => {
        const items = getReadLater().filter(item => item.link !== link);
        saveReadLater(items);
      });
    } else {
      const items = getReadLater().filter(item => item.link !== link);
      saveReadLater(items);
      app.toast.show({ text: 'Removed', position: 'center', closeTimeout: 1500 });
    }
  });
}

function renderReadLaterNews() {
  const container = document.getElementById('read-later-news');
  if (!container) return;
  const items = getReadLater();
  if (!items.length) {
    container.innerHTML = ' <h2 class="empty-read-later">No saved articles </h2>';
    return;
  }
  container.innerHTML = items.map(item => {
    const title = String(item.title || '');
    const link = String(item.link || '');
    const imgSrc = String(item.imgSrc || PLACEHOLDER_IMAGE);
    return `
      <div class="card card-raised news-card">
        <div class="card-content">
          <div class="card-image">
            <img class="newsimg" src="${escapeHtml(imgSrc)}" loading="lazy" alt="${escapeHtml(title)}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="news-actions">
              <a class="news-action" href="#" onclick='shareArticle(${JSON.stringify(title)}, ${JSON.stringify(link)}); return false;'>
                <i class="hm-icons hm-share-filled"></i>
              </a>
              <a class="news-action" href="#" onclick='removeFromReadLater(${JSON.stringify(link)}, ${JSON.stringify(title)}, this.closest(".news-card")); return false;'>
                <i class="hm-icons hm-public-clean-filled"></i>
              </a>
              <a class="news-action external" href="${escapeHtml(link)}" target="_blank" rel="noopener">
                <i class="hm-icons hm-public-file-filled"></i>
              </a>
            </div>
            <div class="news-overlay">
              <div class="news-title">${escapeHtml(title)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getNodeText(parent, tagName) {
  const node = parent.getElementsByTagName(tagName)[0];
  return node ? node.textContent.trim() : '';
}

function extractImageFromItem(item) {
  const mediaContent = item.querySelector('media\\:content, content');
  const mediaThumb = item.querySelector('media\\:thumbnail, thumbnail');
  if (mediaContent) return mediaContent.getAttribute('url') || '';
  if (mediaThumb) return mediaThumb.getAttribute('url') || '';
  const enclosure = item.querySelector('enclosure');
  if (enclosure) return enclosure.getAttribute('url') || '';
  const contentEncoded = getNodeText(item, 'content:encoded') || getNodeText(item, 'description');
  if (contentEncoded) {
    const imgDoc = new window.DOMParser().parseFromString(contentEncoded, 'text/html');
    const imgElement = imgDoc.querySelector('img');
    if (imgElement) return imgElement.getAttribute('src') || '';
  }
  return PLACEHOLDER_IMAGE;
}

async function fetchFeedText() {
  const cachedData = localStorage.getItem(FEED_CACHE_KEY);
  if (cachedData) {
    try {
      const { timestamp, xmlText } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_DURATION_MS) {
        return xmlText;
      }
    } catch (e) {}
  }

  const cacheMinute = Math.floor(Date.now() / 60000);
  const cacheBusterUrl = `${FEED_URL}?t=${cacheMinute}`;
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cacheBusterUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cacheBusterUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(cacheBusterUrl)}`
  ];

  const fetchAndValidate = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error();
      const text = await res.text();
      if (text.includes('<rss') || text.includes('<feed') || text.includes('<item')) {
        return text;
      }
      throw new Error();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  try {
    const fastestXmlText = await Promise.any(proxies.map(url => fetchAndValidate(url)));
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      xmlText: fastestXmlText
    }));
    return fastestXmlText;
  } catch (err) {
    if (cachedData) return JSON.parse(cachedData).xmlText;
    throw new Error('Offline or Connection Timeout');
  }
}

async function fetchAndLoadNews() {
  const newsContainer = document.getElementById('news');
  if (!newsContainer) return;

  newsContainer.innerHTML = `
    <div class="card card-raised news-card skeleton-effect-pulse">
      <div class="card-content">
        <div class="card-image">
          <div class="skeleton-block" style="height:220px;width:100%;"></div>
          <div class="news-actions">
            <span class="news-action skeleton-text"><i class="hm-share-filled"></i></span>
            <span class="news-action skeleton-text"><i class="hm-public-time-filled"></i></span>
            <span class="news-action skeleton-text"><i class="hm-public-file-filled"></i></span>
          </div>
          <div class="news-overlay">
            <div class="news-title skeleton-text">Loading news title</div>
          </div>
        </div>
      </div>
    </div>
  `.repeat(3);

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const data = await fetchFeedText();
    const xml = new window.DOMParser().parseFromString(data, 'text/xml');
    const items = xml.getElementsByTagName('item');
    if (!items.length) throw new Error();

    newsContainer.innerHTML = '';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = getNodeText(item, 'title');
      const link = getNodeText(item, 'link');
      const imgSrc = extractImageFromItem(item);
      const card = document.createElement('div');
      card.classList.add('card', 'card-raised', 'news-card');
      card.innerHTML = `
        <div class="card-content">
          <div class="card-image">
            <img class="newsimg" src="${escapeHtml(imgSrc)}" loading="lazy" alt="${escapeHtml(title)}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="news-actions">
              <a class="news-action" href="#" onclick='shareArticle(${JSON.stringify(title)}, ${JSON.stringify(link)}); return false;'>
                <i class="hm-share-filled"></i>
              </a>
              <a class="news-action" href="#" onclick='addToReadLater(${JSON.stringify(title)}, ${JSON.stringify(link)}, ${JSON.stringify(imgSrc)}); return false;'>
                <i class="hm-public-time-filled"></i>
              </a>
              <a class="news-action external" href="${escapeHtml(link)}" target="_blank" rel="noopener">
                <i class="hm-public-file-filled"></i>
              </a>
            </div>
            <div class="news-overlay">
              <div class="news-title">${escapeHtml(title)}</div>
            </div>
          </div>
        </div>
      `;
      newsContainer.appendChild(card);
    }
  } catch (error) {
    newsContainer.innerHTML = '<div class="block">Unable to load news. Pull down to retry.</div>';
  }
}

app.on('ptrRefresh', (el) => {
  if (el.classList.contains('ptr-news')) {
    localStorage.removeItem(FEED_CACHE_KEY);
    fetchAndLoadNews().then(() => app.ptr.done(el)).catch(() => app.ptr.done(el));
  }
});

fetchAndLoadNews();
renderReadLaterNews();

window.addToReadLater = addToReadLater;
window.removeFromReadLater = removeFromReadLater;
window.shareArticle = shareArticle;

function playDeleteNewsAnimation(cardEl) {
  if (!cardEl) return Promise.resolve();
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  cardEl.style.position = 'relative';
  cardEl.appendChild(layer);

  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * 110;
    p.style.cssText = `position:absolute;left:50%;top:50%;width:${4 + Math.random() * 5}px;height:${4 + Math.random() * 5}px;margin:-2px 0 0 -2px;border-radius:999px;background:rgba(255,255,255,.95);box-shadow:0 0 10px rgba(255,255,255,.45);`;
    layer.appendChild(p);
    p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0)`, opacity: 0 }], { duration: 650 + Math.random() * 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  }

  return cardEl.animate([{ opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.88) rotate(2deg)', filter: 'blur(10px)' }], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished.then(() => layer.remove());
}

window.addEventListener('error', function (event) {
  const img = event.target;

  if (!(img instanceof HTMLImageElement)) return;

  if (img.closest('.screenshot')) return;

  if (img.dataset.fallbackApplied) return;

  img.dataset.fallbackApplied = 'true';
  img.src = './assets/default.png';
}, true);

const failedImages = new Set();

window.addEventListener('error', function (event) {
  const img = event.target;

  if (!(img instanceof HTMLImageElement)) return;
  if (img.closest('.screenshot')) return;

  const src = img.getAttribute('src');
  if (!src || failedImages.has(src)) return;

  failedImages.add(src);
  img.src = './assets/default.png';
}, true);

document.addEventListener('DOMContentLoaded', () => {
  app.on('tabShow', (tabEl) => {
    const tabId = `#${tabEl.id}`;
    if (!tabEl.id) return;

    const tabLink = document.querySelector(
      `.tab-link[href="${tabId}"]`
    );
    if (!tabLink) return;

    const title = tabLink.dataset.tabTitle;
    if (!title) return;

    const navbar = document.querySelector(
      '.navbar.navbar-large'
    );
    if (!navbar) return;

    const titleEl = navbar.querySelector('.title');
    const largeTitleEl = navbar.querySelector('.title-large-text');

    if (titleEl) titleEl.textContent = title;
    if (largeTitleEl) largeTitleEl.textContent = title;
  });

  document.querySelectorAll('.tab-link').forEach(tabLink => {
    tabLink.addEventListener('click', function () {
      // Function updateNavbarTitleFromTab was not defined; keeping original click behavior intact.
    });
  });

  window.goToTab = function (tabId) {
    app.popup.close();
    app.tab.show(tabId);
    // Original called updateNavbarTitleFromTab(tabId) which doesn't exist, so removed to prevent error.
  };
});

function openReportPopup(appName) {
  const input = document.getElementById('report-app-name');
  input.value = appName;
  app.popup.open('#report-app');
}

const reportForm = document.getElementById('report-form');
const submitBtn = document.getElementById('submit-btn');

reportForm.addEventListener('submit', function (e) {
  e.preventDefault();
  app.dialog.confirm('Are you sure you want to send this report?', 'Confirm Submission', function () {
    submitBtn.classList.add('button-loading');
    submitBtn.disabled = true;

    const formData = new FormData(reportForm);
    const actionUrl = reportForm.getAttribute('action');

    fetch(actionUrl, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
      .then(response => response.json())
      .then(data => {
        submitBtn.classList.remove('button-loading');
        submitBtn.disabled = false;

        app.dialog.alert('Thanks for the feedback!', 'Success', function () {
          reportForm.reset();
          app.popup.close('#report-app');
        });
      })
      .catch(error => {
        submitBtn.classList.remove('button-loading');
        submitBtn.disabled = false;
        app.dialog.alert('Failed to send report. Please check your connection.', 'Error');
        console.error('Submission Error:', error);
      });
  });
});

(function () {
  const feedbackForm = document.getElementById('feedback-form');
  const submitBtn = feedbackForm.querySelector('button[type="submit"]');

  feedbackForm.addEventListener('submit', function (e) {
    e.preventDefault();

    app.dialog.confirm('Are you sure you want to send this feedback?', 'Confirm Submission', function () {
      submitBtn.classList.add('button-loading');
      submitBtn.disabled = true;

      const formData = new FormData(feedbackForm);
      const actionUrl = feedbackForm.getAttribute('action');

      fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(response => response.json())
        .then(data => {
          submitBtn.classList.remove('button-loading');
          submitBtn.disabled = false;

          app.dialog.alert('Thanks for the feedback!', 'Success', function () {
            feedbackForm.reset();
            app.popup.close('#feedback');
          });
        })
        .catch(error => {
          submitBtn.classList.remove('button-loading');
          submitBtn.disabled = false;
          app.dialog.alert('Failed to send report. Please check your connection.', 'Error');
          console.error('Submission Error:', error);
        });
    });
  });
})();

(function () {
  const appSubmitForm = document.getElementById('appsubmit-form');
  const submitBtn = appSubmitForm.querySelector('button[type="submit"]');

  appSubmitForm.addEventListener('submit', function (e) {
    e.preventDefault();

    app.dialog.confirm('Are you sure you want to submit this application?', 'Confirm Submission', function () {
      submitBtn.classList.add('button-loading');
      submitBtn.disabled = true;

      const formData = new FormData(appSubmitForm);
      const actionUrl = appSubmitForm.getAttribute('action');

      fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(response => response.json())
        .then(data => {
          submitBtn.classList.remove('button-loading');
          submitBtn.disabled = false;

          app.dialog.alert('Thanks for the submission! We will review it as soon as possible', 'Success', function () {
            appSubmitForm.reset();
            app.popup.close('#appsubmit');
          });
        })
        .catch(error => {
          submitBtn.classList.remove('button-loading');
          submitBtn.disabled = false;
          app.dialog.alert('Failed to send report. Please check your connection.', 'Error');
          console.error('Submission Error:', error);
        });
    });
  });
})();

function toggleDarkMode() {
  document.querySelector("html").classList.toggle("dark");
}

function applyDarkModeSetting() {
  const htmlElement = document.querySelector("html");
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const applyDarkMode = (e) => {
    if (e.matches) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  };

  darkModeQuery.addListener(applyDarkMode);
  applyDarkMode(darkModeQuery);
}

applyDarkModeSetting();

let notificationShown = false;

function checkConnection() {
  setInterval(() => {
    if (navigator.onLine) {
      if (notificationShown) {
        notificationShown = false;
      }
    } else if (!notificationShown) {
      notificationShown = true;
      app.notification.create({
        icon: '<i class="icon f7-icons color-red">wifi_slash</i>',
        title: "No Internet Connection",
        titleRightText: "now",
        subtitle: "Unable to connect to the server.",
        text: "Check your internet connection and try again."
      }).open();
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ptr-apps").forEach(element => {
    element.addEventListener("ptr:refresh", () => {
      fetchAndLoadApps();
    });
  });
  checkConnection();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (!registration) {
      navigator.serviceWorker.register("service-worker.js").then(() => {}).catch(() => {});
    }
  });
}

if (window.navigator.standalone) {
  const preloaderDialog = app.dialog.preloader("Reloading data");
  preloaderDialog.open();
  setTimeout(() => {
    preloaderDialog.close();
  }, 2000);
} else {
  app.popup.open("#hs");
}

function initPhotoBrowser(urls) {
  const photos = urls.map(url => ({ url }));
  return app.photoBrowser.create({
    photos,
    type: "standalone",
    navbar: true,
    toolbar: false,
    swiper: { zoom: true },
    on: {
      closed: () => { app.photoBrowserPopup = null; }
    }
  });
}

function generateScreenshotElements(screenshots) {
  return screenshots.map((src, index) => {
    return `<img loading="lazy" src="${src}" class="pb-target" data-index="${index}">`;
  }).join('');
}

function openPhotoBrowser(urls) {
  initPhotoBrowser(urls).open();
}

function createItemHtml(item) {
  return `
    <li>
      <a class="item-link" href="#">
        <div class="item-content popup-open" data-popup="#${item.id}">
          <div class="item-media">
            <img loading="lazy" src="${item.icon}">
          </div>
          <div class="item-inner">
            <div class="item-title-row">
              <div class="item-title">
                ${item.title}
              </div>
            </div>
            <div class="item-subtitle">${item.category}</div>
            <div class="item-footer"></div>
          </div>
        </div>
      </a>
    </li>
  `;
}

function createPopupHtml(item) {
  return `
 <div class="popup" id="${item.id}">
      <div class="page">
        <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
        <div class="page-content">
          <div style="margin-top: 40px; padding: 0px;">
<div class="block" style="margin-top: 27px; margin-bottom: 20px;">
  <div style="display: flex; gap: 15px; align-items: flex-start; overflow: hidden;">
    <img src="${item.icon}" class="app-icon" style="flex-shrink: 0;">

    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">

      <div style="font-size: 22px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${item.title}
      </div>

      <div style="font-size: 15px; margin-top: 6px; line-height: 1.3;">
        ${item.category}
      </div>

      <div style="display: flex; margin-top: 12px; align-items: center;">
        <a href="${item.get_link}" class="external button button-fill button-round get">GET</a>

        <a class="popover-open more" data-popover=".popover-menu">
          <i class="f7-icons">ellipsis_circle_fill</i>
        </a>
      </div>

    </div>
  </div>
</div>

          ${item.screenshots && item.screenshots.length > 0 ? `
    <div class="block-title">Preview</div>
    <div class="screenshot" onclick="openPhotoBrowser(${JSON.stringify(item.screenshots).replace(/"/g, "&quot;")})">
        ${generateScreenshotElements(item.screenshots)}
    </div>
` : ''}

            </div>

          <div class="block block-strong inset">
             <div style="font-size: 15px; line-height: 1.5;">
              ${item.description}
             </div>
          </div>

           <div class="popover popover-menu">
    <div class="popover-inner">
      <div class="list list-dividers" style="text-align: left!important;">
        <ul>

         <li><a onclick="navigator.share({ title: '${item.title}', url: '${item.get_link}' })" class="item-link item-content external popover-close"><div class="item-media"><i class="hm-share-filled"></i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Share</div></div></div></a></li><li><a onclick="addToFavorites({
                  id: '${item.id}',
                  icon: '${item.badge}',
                  image: '${item.icon}',
                  title: '${item.title}',
                  subtitle: '${item.category}',
                })"  class="item-link item-content external popover-close"><div class="item-media"><i class="hm-public-favorites-filled"></i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Favorite</div></div></div></a></li><li><a
  class="item-link item-content popover-close"
  onclick="openReportPopup('${item.title.replace(/'/g, "\\'")}')"
>
  <div class="item-media"><i class="hm-fail-filled"></i></div>
  <div class="item-inner">
    <div class="item-title">Report</div>
  </div>
</a> </li>
        </ul>
      </div>
      </div>
    </div>
  `;
}

function initVirtualList(containerSelector, items) {
  app.virtualList.create({
    el: containerSelector,
    items,
    renderItem: (item, index) => createItemHtml(item),
    searchAll: (query, items) => {
      const results = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].title.toLowerCase().includes(query.toLowerCase()) || query.trim() === "") {
          results.push(i);
        }
      }
      return results;
    },
    height: 90,
  });
  items.forEach(item => {
    const popupHtml = createPopupHtml(item);
    document.body.insertAdjacentHTML("beforeend", popupHtml);
  });
}

async function fetchAndLoadApps() {
  const container = document.querySelector(".virtual-list");

  if (container) {
    const skeletonItem = `
      <li>
        <a class="item-link">
          <div class="item-content skeleton-effect-pulse">
            <div class="item-media">
              <div class="skeleton-block" style="width: 58px; height: 58px; border-radius: 29%;"></div>
            </div>
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title skeleton-text">App Title</div>
              </div>
              <div class="item-subtitle skeleton-text">Category</div>
              <div class="item-footer"></div>
            </div>
          </div>
        </a>
      </li>`;
    container.innerHTML = `<ul>${skeletonItem.repeat(10)}</ul>`;
  }

  try {
    const [response] = await Promise.all([
      fetch("apps.json"),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);

    if (!response.ok) throw new Error(`Failed to load apps.json`);

    const apps = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
    const currentAppIds = apps.map(app => app.title);
    const seenAppIds = JSON.parse(localStorage.getItem('seen_apps') || '[]');
    const newApps = currentAppIds.filter(id => !seenAppIds.includes(id));

    const badges = document.querySelectorAll(".tweaksnumber");

    badges.forEach(badge => {
      if (newApps.length > 0) {
        badge.textContent = newApps.length;
        badge.classList.remove('display-none');
      } else {
        badge.classList.add('display-none');
      }
    });

    app.off('tabHide');
    app.on('tabHide', (tabEl) => {
      if (tabEl.querySelector('.virtual-list')) {
        localStorage.setItem('seen_apps', JSON.stringify(currentAppIds));
        document.querySelectorAll(".tweaksnumber").forEach(badge => {
          badge.classList.add('display-none');
        });
      }
    });

    if (container) container.innerHTML = '';
    initVirtualList(".virtual-list", apps);

  } catch (error) {
    console.error("Critical Error:", error);
    if (container) container.innerHTML = '<div class="block">Error loading apps.</div>';
  }
}

app.on('ptrRefresh', (el) => {
  if (el.classList.contains('ptr-apps')) {
    fetchAndLoadApps().then(() => {
      app.ptr.done(el);
    });
  }
});

fetchAndLoadApps();

function addToFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let favOrder = JSON.parse(localStorage.getItem("favOrder")) || [];

  if (favorites.some(fav => fav.id === item.id)) {
    app.dialog.alert("This app is already in your favorites.", "Error");
    return;
  }

  favorites.push(item);
  favOrder.push(item.id);

  localStorage.setItem("favorites", JSON.stringify(favorites));
  localStorage.setItem("favOrder", JSON.stringify(favOrder));

  app.toast.create({
    icon: '<i class="f7-icons">heart_fill</i>',
    text: "Added to Favorites",
    position: "center",
    closeTimeout: 1500,
  }).open();

  displayFavorites();
}

function displayFavorites() {
  const favContainer = document.getElementById("fav");
  if (!favContainer) return;

  const favList = favContainer.querySelector("ul");
  if (!favList) return;

  const favEmptyElement = document.getElementById("favempty");

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const savedOrder = JSON.parse(localStorage.getItem("favOrder")) || [];

  favList.innerHTML = "";

  if (favorites.length === 0) {
    if (favEmptyElement) favEmptyElement.style.display = "block";
    return;
  }

  if (favEmptyElement) favEmptyElement.style.display = "none";

  const favMap = new Map(favorites.map(f => [f.id, f]));
  const orderedFavorites = [];

  savedOrder.forEach(id => {
    if (favMap.has(id)) {
      orderedFavorites.push(favMap.get(id));
      favMap.delete(id);
    }
  });

  orderedFavorites.push(...favMap.values());

  orderedFavorites.forEach(fav => {
    favList.insertAdjacentHTML(
      "beforeend",
      `
      <li class="swipeout" id="fav-${fav.id}">
        <div class="swipeout-content">
          <a class="item-link popup-open" data-popup="#${fav.id}">
            <div class="item-content">
              <div class="item-media">
                <img loading="lazy" src="${fav.image}">
              </div>
              <div class="item-inner">
                <div class="item-title-row">
                  <div class="item-title">
                    ${fav.title}
                    <i style="font-size:17px;" class="f7-icons">${fav.icon}</i>
                  </div>
                </div>
                <div class="item-subtitle">${fav.subtitle}</div>
              </div>
            </div>
          </a>
        </div>
        <div class="swipeout-actions-right">
          <a class="swipeout-delete"
             onclick="removeFromFavorites('${fav.title}')">
            Unfavorite <i class="f7-icons">heart_slash_fill</i>
          </a>
        </div>
      </li>`
    );
  });

  if (!favList.favSortableInitialized) {
    favList.addEventListener("sortable:sort", () => {
      const order = Array.from(favList.children).map(li =>
        li.id.replace("fav-", "")
      );
      localStorage.setItem("favOrder", JSON.stringify(order));
    });

    favList.favSortableInitialized = true;
  }
}

function removeFromFavorites(title) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let favOrder = JSON.parse(localStorage.getItem("favOrder")) || [];

  const removed = favorites.find(f => f.title === title);
  if (!removed) return;

  favorites = favorites.filter(f => f.title !== title);
  favOrder = favOrder.filter(id => id !== removed.id);

  localStorage.setItem("favorites", JSON.stringify(favorites));
  localStorage.setItem("favOrder", JSON.stringify(favOrder));

  displayFavorites();

  if (favorites.length === 0) {
    const favEmptyElement = document.getElementById("favempty");
    if (favEmptyElement) favEmptyElement.style.display = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAndLoadApps();
  displayFavorites();
});

let themeColor = localStorage.getItem("ios-primary-color") || "#007AFF";
let colorPicker;

const setCustomColor = (newColor) => {
  themeColor = newColor;

  app.setColorTheme(newColor);

  const indicator = document.getElementById('accent-color');
  if (indicator) {
    indicator.style.backgroundColor = newColor;
  }

  localStorage.setItem("ios-primary-color", newColor);
};

document.addEventListener("DOMContentLoaded", () => {
  setCustomColor(themeColor);

  let timeout;
  colorPicker = app.colorPicker.create({
    targetEl: '#accent-color',
    popupPush: true,
    value: {
      hex: themeColor,
    },
    on: {
      change(cp, value) {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          if (themeColor === value.hex) return;
          setCustomColor(value.hex);
        }, 1);
      },
    },
  });
});

var swiperFeatured = new Swiper(".featured", {
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: false,
  slidesPerView: "auto",
  preventClicks: true,
  spaceBetween: 27,
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 120,
    modifier: 1.5,
    slideShadows: false
  },
  autoplay: {
    delay: 4000,
    disableOnInteraction: true
  }
});

function shareURL() {
  if (navigator.share) {
    navigator.share({
      title: "SoftwareKit",
      url: "https://softwarekit.pages.dev/"
    });
  }
}

function reset() {
  const defaultColor = '#0a58f7';

  app.dialog.create({
    title: 'Reset',
    verticalButtons: true,
    buttons: [
      {
        text: 'Reset Accent Color',
        onClick: function () {
          app.setColorTheme(defaultColor);
          localStorage.setItem("ios-primary-color", defaultColor);

          const indicator = document.getElementById('accent-color');
          if (indicator) {
            indicator.style.backgroundColor = defaultColor;
          }

          if (colorPicker) {
            colorPicker.setValue({ hex: defaultColor });
          }

          app.toast.create({
            text: 'Accent color restored!',
            closeTimeout: 2000,
          }).open();
        }
      },
      {
        text: 'Erase all data',
        onClick: function () {
          app.dialog.confirm(
            'This will delete all your settings and data including added sources, favorites read later . This action cannot be undone.',
            'Confirm reset',
            () => {
              app.preloader.show();

              setTimeout(() => {
                document.cookie.split(';').forEach(cookie => {
                  const eqPos = cookie.indexOf('=');
                  const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                });
                localStorage.clear();

                app.preloader.hide();

                window.location.href = 'app.html';
              }, 1500);
            }
          );
        }
      },
      {
        text: 'Cancel',
        close: true,
        cssClass: 'color-red',
      }
    ]
  }).open();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (!registration) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  });
}
