const app = new Framework7({
  el: '#app',
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
    primary: '#007AFF'
  },
  popover: {
    verticalPosition: 'bottom',
  },
  serviceWorker: {
    path: "./service-worker.js",
  }, 
});

var $ = Dom7;
const mainView = app.views.create(".view-main");

const locks = new Set();
const foundResizeObservers = new WeakMap();
const rootScrollHandlers = new WeakMap();
const repoDetailSwipeBackStates = new WeakMap();

function inAllowedArea(target) {
  if (!(target instanceof Element)) return false;
  return !!target.closest('#searchTab, .searchbar-found, .dialog, .popup, .sheet-modal, .popover');
}

function isRepoDetailPage(page) {
  if (!(page instanceof Element)) return false;
  return page.matches(
    '#repoDetailPage, #repo-detail, [data-name="repo-detail"], [data-page="repo-detail"], .page-repo-detail'
  );
}

function getPageFromArg(arg) {
  if (arg instanceof Element) return arg;
  if (arg && arg.el instanceof Element) return arg.el;
  if (arg && arg.pageEl instanceof Element) return arg.pageEl;
  if (arg && arg.currentPageEl instanceof Element) return arg.currentPageEl;
  return null;
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

function syncRepoDetailSwipeBack(searchbar, enable) {
  const page = searchbar.el.closest('.page');
  if (!page || !isRepoDetailPage(page)) return;
  const view = page.view || app.views.current;
  if (!view) return;
  if (enable) {
    if (!repoDetailSwipeBackStates.has(view)) {
      repoDetailSwipeBackStates.set(view, !!(view.params && view.params.iosSwipeBack));
    }
    if (view.params) view.params.iosSwipeBack = false;
    if ('allowPageSwipeBack' in view) view.allowPageSwipeBack = false;
    if (view.el) view.el.classList.add('repo-detail-swipeback-locked');
  } else {
    const prev = repoDetailSwipeBackStates.get(view);
    if (prev != null && view.params) {
      view.params.iosSwipeBack = prev;
      repoDetailSwipeBackStates.delete(view);
    }
    if ('allowPageSwipeBack' in view) view.allowPageSwipeBack = true;
    if (view.el) view.el.classList.remove('repo-detail-swipeback-locked');
  }
}

function blockRepoDetailSwipeBack(...args) {
  const page = args.map(getPageFromArg).find(Boolean) || document.querySelector('.page-current');
  if (!page || !isRepoDetailPage(page)) return;
  const sbEl = page.querySelector('.searchbar');
  const sb = sbEl ? app.searchbar.get(sbEl) : null;
  if (!getSearchbarEnabled(sb)) return;
  const evt = args.find(arg => arg && typeof arg.preventDefault === 'function');
  if (evt) evt.preventDefault();
  const data = args.find(arg => arg && typeof arg === 'object' && 'prevent' in arg);
  if (data) data.prevent = true;
  return false;
}

function syncSearchbarFound(searchbar, enable) {
  const page = searchbar.el.closest('.page');
  if (!page) return;
  const found = page.querySelector('.searchbar-found');
  if (!found) return;
  const isSearchTab = !!found.closest('#searchTab');
  const isBottomSearchPage = page.classList.contains('page-with-bottom-search');
  const isExpandable = searchbar.el.classList.contains('searchbar-expandable');

  if (!isSearchTab && !isBottomSearchPage) {
    found.style.cssText = '';
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

      if (foundResizeObservers.has(found)) {
        foundResizeObservers.get(found).disconnect();
      }
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(updateHeight);
      });
      observer.observe(found);
      foundResizeObservers.set(found, observer);
      requestAnimationFrame(updateHeight);
    } else {
      found.style.maxHeight = '';
    }
  } else {
    found.style.cssText = '';
    const observer = foundResizeObservers.get(found);
    if (observer) {
      observer.disconnect();
      foundResizeObservers.delete(found);
    }
  }
}

function syncSearchScrollRoot(searchbar, enable) {
  const page = searchbar.el.closest('.page');
  if (!page) return;
  const root = page.querySelector('#searchTab');
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
app.on('swipeback:beforechange', blockRepoDetailSwipeBack);

app.on('searchbarEnable', (searchbar) => {
  syncSearchbarFound(searchbar, true);
  syncSearchScrollRoot(searchbar, true);
  syncRepoDetailSwipeBack(searchbar, true);
  locks.add('search');
  if (locks.size === 1) lockBody();
});

app.on('searchbarSearch', (searchbar) => {
  syncSearchbarFound(searchbar, true);
  syncSearchScrollRoot(searchbar, true);
  syncRepoDetailSwipeBack(searchbar, true);
});

app.on('searchbarDisable', (searchbar) => {
  syncSearchbarFound(searchbar, false);
  syncSearchScrollRoot(searchbar, false);
  syncRepoDetailSwipeBack(searchbar, false);
  locks.delete('search');
  if (locks.size === 0) unlockBody();
});

app.on('init', async () => {
  const repos = getRepos();
  if (!repos || !repos.length) return;
  const updatedRepos = [];
  for (const repo of repos) {
    try {
      const refreshed = await fetchRepo(repo.sourceURL);
      if (refreshed) updatedRepos.push(refreshed);
      else updatedRepos.push(repo);
    } catch (e) {
      updatedRepos.push(repo);
    }
  }
  saveRepos(updatedRepos);
  renderSourcesList(updatedRepos);
});

const searchFab = document.getElementById('search-fab');
const addSourceFab = document.getElementById('add-source-fab');

function getMainPage() {
  return document.querySelector('#app .view-main > .page');
}

function getActiveMainTabId() {
  const mainPage = getMainPage();
  if (!mainPage) return '';
  const activeTab = mainPage.querySelector(':scope > .tabs > .tab.tab-active');
  return activeTab ? activeTab.id : '';
}

function setFabState(fab, show) {
  if (!fab) return;
  fab.style.opacity = show ? '1' : '0';
  fab.style.transform = show ? 'scale(1)' : 'scale(0.8)';
  fab.style.pointerEvents = show ? 'auto' : 'none';
}

function updateFabs() {
  const tabId = getActiveMainTabId();
  setFabState(searchFab, tabId === 'searchTab');
  setFabState(addSourceFab, tabId === 'sourcesTab');
}

function scheduleUpdateFabs() {
  requestAnimationFrame(updateFabs);
}

document.addEventListener('DOMContentLoaded', () => {
  if (searchFab) {
    searchFab.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    searchFab.style.transformOrigin = 'center';
    searchFab.style.willChange = 'transform, opacity';
    searchFab.style.opacity = '0';
    searchFab.style.transform = 'scale(0.8)';
    searchFab.style.pointerEvents = 'none';
  }
  if (addSourceFab) {
    addSourceFab.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    addSourceFab.style.transformOrigin = 'center';
    addSourceFab.style.willChange = 'transform, opacity';
    addSourceFab.style.opacity = '0';
    addSourceFab.style.transform = 'scale(0.8)';
    addSourceFab.style.pointerEvents = 'none';
  }
  updateFabs();
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tab-link')) {
      scheduleUpdateFabs();
    }
  });
  document.addEventListener('tab:show', scheduleUpdateFabs);
  window.addEventListener('load', scheduleUpdateFabs);
});

document.addEventListener("DOMContentLoaded", () => {
  new Swiper(".guides", {
    effect: "coverflow",
    grabCursor: true,
    preventClicks: true,
    centeredSlides: false,
    slidesPerView: "auto",
    spaceBetween: 26,
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 120,
      modifier: 1.5,
      slideShadows: false
    },
    on: {
      init: function () {
        this.wrapperEl.style.willChange = 'transform';
      }
    }
  });
});

var swiperFeaturedMac = new Swiper(".featured-macos", {
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: false,
  preventClicks: true,
  slidesPerView: "auto",
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
  },
  on: {
    init: function () {
      this.wrapperEl.style.willChange = 'transform';
    }
  }
});

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
  for (const link of allLinks) {
    link.classList.remove('tab-link-active');
  }
  clickedLink.classList.add('tab-link-active');
});

window.addEventListener('error', function (event) {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.closest('.screenshots')) return;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = 'true';
  img.src = './assets/default.png';
}, true);

document.addEventListener('DOMContentLoaded', () => {
  app.on('tabShow', (tabEl) => {
    const tabId = `#${tabEl.id}`;
    if (!tabEl.id) return;
    const tabLink = document.querySelector(`.tab-link[href="${tabId}"]`);
    if (!tabLink) return;
    const title = tabLink.dataset.tabTitle;
    if (!title) return;
    const navbar = document.querySelector('.navbar.navbar-large');
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

function toggleDarkMode() {
  document.querySelector("html").classList.toggle("dark");
}

function applyDarkModeSetting() {
  const htmlElement = document.querySelector("html");
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const applyDarkMode = e => {
    htmlElement.classList.toggle("dark", e.matches);
  };
  darkModeQuery.addEventListener('change', applyDarkMode);
  applyDarkMode(darkModeQuery);
}
applyDarkModeSetting();

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('deviceInfo');
  if (saved) {
    renderDeviceData(JSON.parse(saved));
  }
});

function postRequest() {
  const requestId = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('pendingRequestID', requestId);
  app.dialog.preloader('Waiting for registration…');
  window.location.href = `https://api.udid.swkit.app/get-profile?requestId=${requestId}`;
  startPolling(requestId);
}

function startPolling(id) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`https://api.udid.swkit.app/retrieve?requestId=${id}`);
      const { deviceInfo } = await res.json();
      if (deviceInfo) {
        clearInterval(interval);
        localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
        localStorage.removeItem('pendingRequestID');
        renderDeviceData(deviceInfo);
      }
    } catch (_) {}
  }, 2000);
}

function getIOSVersion() {
  const ua = navigator.userAgent;
  if (ua.includes("Macintosh") && navigator.maxTouchPoints > 1) {
    const macosMatch = ua.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/i);
    const version = macosMatch ? macosMatch.slice(1).filter(Boolean).join('.') : "Unknown";
    return 'iPadOS ' + version;
  }
  const iosMatch = ua.match(/(iPhone|iPod|iPad).*? OS (\d+)_?(\d+)?_?(\d+)?/i);
  if (iosMatch) {
    const type = iosMatch[1] === 'iPad' ? 'iPadOS ' : 'iOS ';
    const version = iosMatch.slice(2).filter(Boolean).join('.');
    return type + version;
  }
  const macosMatch = ua.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/i);
  if (macosMatch) {
    return 'macOS ' + macosMatch.slice(1).filter(Boolean).join('.');
  }
  return 'Unknown';
}

function renderDeviceData(deviceInfo) {
  const container = document.getElementById('device-container');
  const targetEl = document.getElementById('udid-info-block');
  if (targetEl) {
    targetEl.style.setProperty('display', 'none', 'important');
  }
  if (!container) return;
  const udid = deviceInfo.udid || deviceInfo.UDID || '';
  const modelName = deviceInfo.name || deviceInfo.DeviceName || 'iPhone';
  const modelIdentifier = deviceInfo.model || 'Unknown';
  const sysVer = getIOSVersion();

  container.innerHTML = `
<div class="list media-list list-strong list-dividers inset">
            <ul>
                <li>
                    <div class="item-content">
                        <div class="item-media">
                           <i class="f7-icons" style="font-size:63px;">device_phone_portrait</i>
                        </div>
                        <div class="item-inner">
                            <div class="item-title">
                                ${modelName}
                            </div>
                            <div class="item-subtitle">${sysVer}                            
                            </div>
                        </div>
                    </div>
                </li>
                                        <li class="item-content item-input">
                            <div class="item-inner">
                                <div class="item-title item-label">UDID</div>
                                <div class="item-input-wrap">
                                    <input type="text" id="udidInput" readonly value="${udid}">
                                </div>
                            </div>
                          <a id="copyUdidBtn">
                    <i class="f7-icons">doc_on_clipboard_fill</i>
                </a>   
                        </li>
            </ul>
        </div>           

        <div class="list list-strong list-dividers   inset">
            <ul>
                <li>
                    <div class="item-content">
                        <div class="item-inner">
                            <div class="item-title">Model name</div>
                            <div class="item-after  ">${modelIdentifier}</div>
                        </div>
                    </div>
                </li>              
                ${Object.entries(deviceInfo)
                    .filter(([k, v]) => 
                        v && 
                        !['udid', 'registered', 'model', 'name', 'devicename', 'systemversion', 'version'].includes(k.toLowerCase())
                    )
                    .map(([key, value]) => `
                        <li>
                            <div class="item-content">
                                <div class="item-inner">
                                    <div class="item-title">
                                        ${formatLabel(key)}
                                    </div>
                                    <div class="item-after  ">
                                        ${value}
                                    </div>
                                </div>
                            </div>
                        </li>
                    `).join('')}
            </ul>
        </div>

        <div class="block">
            <a class="button button-large button-fill button-round color-red" id="removeDeviceBtn">
                Remove Device Data
            </a>
        </div>
    `;

  const copyBtn = document.getElementById('copyUdidBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(udid);
        app.toast.create({ text: 'UDID copied', closeTimeout: 2000 }).open();
      } catch (err) {
        const input = document.getElementById('udidInput');
        input.select();
        document.execCommand('copy');
      }
    });
  }

  document.getElementById('removeDeviceBtn').onclick = () => {
    app.dialog.confirm(
      'Remove stored device data?',
      () => {
        localStorage.removeItem('deviceInfo');
        location.reload();
      }
    );
  };

  app.dialog.close();
}

function formatLabel(key) {
  const upperKeys = ['bdid', 'cpid'];
  if (upperKeys.includes(key.toLowerCase())) {
    return key.toUpperCase();
  }
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

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
      app.dialog.alert('Thanks for the feedback!', 'Success', function() {
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

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'altstore_repos_v3';
  const LOCAL_REPO_URL = './altstore.json';
  const PROXY_LIST = [
    'https://api.allorigins.win/raw?url=',
    'https://cors.eu.org/',
  'https://api.codetabs.com/v1/proxy?quest=',
    'https://proxy.techzbots1.workers.dev/?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://cors.bridged.cc/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://corsproxy.io/?url='
  ];

  function getUserProxy() {
    return localStorage.getItem('custom_cors_proxy');
  }

  function getProxies() {
    const custom = getUserProxy();
    if (custom) return [custom, ...PROXY_LIST];
    return PROXY_LIST;
  }

  // Increase timeout for slower proxies
  const FETCH_TIMEOUT = 8000; // ms

  const NSFW_PREF_PREFIX = 'source_nsfw_pref:';
  const NSFW_TERMS_REGEX = [
    /\b(porn|nsfw|xxx|18\+)\b/i,
    /\b(climax|cl1m4x)\b/i,
    /\b(adult|erotic)\b/i,
    /\bVidList\b/i
  ];
  const SKIP_KEYS = new Set([
    'bundleIdentifier', 'identifier', 'sourceURL', 'downloadURL',
    'iconURL', 'screenshotURLs', 'appPermissions', 'versions',
    'versionDate', 'size', 'date', 'url'
  ]);

  if (!window.repoView) {
    window.repoView = app.views.create('#repository-view', { name: 'repoView' });
  }

  let _cachedRepos = null;
  let _cachedAllApps = null;
  function invalidateCache() {
    _cachedRepos = null;
    _cachedAllApps = null;
  }

  function normalizeSourceUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    let normalizedUrl = value.replace(/^(https?:\/\/)+/i, '').trim();
    if (!normalizedUrl) return '';
    return `https://${normalizedUrl}`;
  }

  function sourcePrefKey(sourceURL) {
    return `${NSFW_PREF_PREFIX}${sourceURL}`;
  }
  function getSourcePref(sourceURL) {
    return localStorage.getItem(sourcePrefKey(sourceURL)) || '';
  }
  function setSourcePref(sourceURL, pref) {
    localStorage.setItem(sourcePrefKey(sourceURL), pref);
  }
  function removeSourcePref(sourceURL) {
    localStorage.removeItem(sourcePrefKey(sourceURL));
  }

  function containsNsfwText(value) {
    const str = String(value || '');
    for (const regex of NSFW_TERMS_REGEX) {
      if (regex.test(str)) return true;
    }
    return false;
  }

  function deepContainsNsfw(obj, depth = 0) {
    if (depth > 10) return false;
    if (typeof obj === 'string') return containsNsfwText(obj);
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (deepContainsNsfw(item, depth + 1)) return true;
      }
      return false;
    }
    if (obj && typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        if (SKIP_KEYS.has(key)) continue;
        if (deepContainsNsfw(val, depth + 1)) return true;
      }
      return false;
    }
    return false;
  }

  function deepClone(value) {
    return typeof structuredClone === 'function'
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }

  function extractScreenshotURLs(screenshots) {
    const urls = [];
    if (!screenshots) return urls;
    if (typeof screenshots === 'string') {
      urls.push(screenshots);
      return urls;
    }
    if (Array.isArray(screenshots)) {
      for (const item of screenshots) {
        if (typeof item === 'string') {
          urls.push(item);
        } else if (item && typeof item === 'object') {
          if (item.imageURL) urls.push(item.imageURL);
          else if (item.url) urls.push(item.url);
        }
      }
      return urls;
    }
    if (screenshots && typeof screenshots === 'object') {
      for (const value of Object.values(screenshots)) {
        if (Array.isArray(value)) {
          urls.push(...extractScreenshotURLs(value));
        } else if (value && typeof value === 'object') {
          if (value.imageURL) urls.push(value.imageURL);
          else if (value.url) urls.push(value.url);
        }
      }
    }
    return urls;
  }

  function parseSize(value) {
    if (value == null) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.]/g, '');
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : 0;
    }
    return 0;
  }

  function isNsfwApp(app) {
    if (!app) return false;
    return containsNsfwText(app.name) ||
           containsNsfwText(app.developerName) ||
           containsNsfwText(app.localizedDescription) ||
           containsNsfwText(app.category);
  }

  function sanitizeRepo(json, url) {
    if (!json.identifier) {
      json.identifier = url;
    }
    let rawApps = [];
    if (json.apps && Array.isArray(json.apps)) {
      rawApps = json.apps;
    } else if (json.packages && Array.isArray(json.packages)) {
      rawApps = json.packages;
    } else if (json.items && Array.isArray(json.items)) {
      rawApps = json.items;
    } else if (json.entries && Array.isArray(json.entries)) {
      rawApps = json.entries;
    } else if (json.data && Array.isArray(json.data)) {
      rawApps = json.data;
    } else if (json.apps_v2 && Array.isArray(json.apps_v2)) {
      rawApps = json.apps_v2;
    } else if (json.app && Array.isArray(json.app)) {
      rawApps = json.app;
    } else if (json.applications && Array.isArray(json.applications)) {
      rawApps = json.applications;
    } else if (Array.isArray(json)) {
      rawApps = json;
    } else {
      rawApps = [];
    }
    const sanitizedApps = [];
    for (const appEntry of rawApps) {
      try {
        const versions = Array.isArray(appEntry?.versions) ? appEntry.versions : [];
        const v0 = versions[0] || {};
        const appName = appEntry?.name || appEntry?.title || v0?.name || 'Unknown App';
        let bundleId = appEntry?.bundleIdentifier || appEntry?.bundleID || appEntry?.id ||
                       v0?.bundleIdentifier || v0?.id || '';
        if (!bundleId) continue;
        const appIcon = appEntry?.iconURL || appEntry?.icon || appEntry?.iconUrl ||
                        v0?.iconURL || v0?.icon || v0?.iconUrl || '';
        let downloadUrl = appEntry?.downloadURL || appEntry?.downloadUrl || v0?.downloadURL || v0?.downloadUrl || appEntry?.url || v0?.url || '';
        if (!downloadUrl && versions.length > 0 && versions[0].downloadURL) {
          downloadUrl = versions[0].downloadURL;
        }
        if (!downloadUrl) continue;
        const screenshotField = appEntry?.screenshots ||
                                appEntry?.screenshotURLs ||
                                appEntry?.screenshotUrls ||
                                v0?.screenshots ||
                                v0?.screenshotURLs ||
                                v0?.screenshotUrls;
        const screenshotURLs = extractScreenshotURLs(screenshotField);
        sanitizedApps.push({
          name: appName,
          version: appEntry?.version || v0?.version || '1.0',
          versionDate: appEntry?.versionDate || appEntry?.date || v0?.date || null,
          downloadURL: downloadUrl,
          size: parseSize(appEntry?.size || v0?.size || 0),
          iconURL: appIcon,
          bundleIdentifier: bundleId,
          developerName: appEntry?.developerName || appEntry?.developer || appEntry?.author ||
                         v0?.developerName || v0?.author || '',
          localizedDescription: appEntry?.localizedDescription || appEntry?.subtitle ||
                                appEntry?.description || appEntry?.summary ||
                                v0?.localizedDescription || v0?.subtitle ||
                                v0?.description || v0?.summary || '',
          category: appEntry?.category || appEntry?.type || 'apps',
          appPermissions: appEntry?.appPermissions || {},
          screenshotURLs,
          versions
        });
      } catch (e) {
        continue;
      }
    }

    const sanitizedNews = Array.isArray(json.news) ? json.news.map(n => ({
      title: n?.title || 'News',
      caption: n?.caption || '',
      date: n?.date || new Date().toISOString(),
      imageURL: n?.imageURL || '',
      url: n?.url || '#'
    })) : [];

    return {
      name: json.name || 'Untitled Repo',
      identifier: json.identifier || url,
      sourceURL: url,
      iconURL: json.iconURL || json.icon || json.iconUrl || '',
      apps: sanitizedApps,
      news: sanitizedNews,
      isSystem: url === LOCAL_REPO_URL
    };
  }

  function cloneRepo(repo) {
    return deepClone(repo);
  }

  function stripNsfwApps(repo) {
    const copy = cloneRepo(repo);
    copy.apps = Array.isArray(copy.apps)
      ? copy.apps.filter(app => !isNsfwApp(app))
      : [];
    return copy;
  }

  function repoLooksNsfw(repo, sourceURL) {
    const combined = {
      repoName: repo?.name,
      apps: repo?.apps,
      news: repo?.news
    };
    return deepContainsNsfw(combined);
  }

  function applySavedNsfwPreference(repo) {
    if (!repo || !repo.sourceURL) return repo;
    const pref = getSourcePref(repo.sourceURL);
    if (pref === 'without') {
      return stripNsfwApps(repo);
    }
    return repo;
  }

  function getRepos() {
    if (_cachedRepos) return _cachedRepos;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      let repos = data ? JSON.parse(data) : [];
      if (!repos.some(r => r.sourceURL === LOCAL_REPO_URL)) {
        repos.unshift({
          sourceURL: LOCAL_REPO_URL,
          name: 'SoftwareKit',
          apps: [],
          news: [],
          isSystem: true
        });
      }
      repos = repos.filter(Boolean).map(applySavedNsfwPreference);
      _cachedRepos = repos;
      return repos;
    } catch {
      return [];
    }
  }

  function saveRepos(repos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
    invalidateCache();
  }

  function getAllApps() {
    if (_cachedAllApps) return _cachedAllApps;
    const repos = getRepos();
    const allApps = [];
    for (const repo of repos) {
      if (repo.apps && Array.isArray(repo.apps)) {
        allApps.push(...repo.apps);
      }
    }
    _cachedAllApps = allApps;
    return allApps;
  }

  function createFetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal })
      .then(response => {
        clearTimeout(id);
        return response;
      })
      .catch(err => {
        clearTimeout(id);
        throw err;
      });
  }

  // Race all proxies – first successful JSON wins
  async function tryProxiesRace(url) {
    const fetchJson = async (proxy) => {
      const proxyUrl = proxy + encodeURIComponent(url);
      const res = await createFetchWithTimeout(proxyUrl, FETCH_TIMEOUT);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    };

    const proxies = getProxies();
    const tasks = proxies.map(p => fetchJson(p).catch(() => Promise.reject(p)));
    try {
      return await Promise.any(tasks);
    } catch {
      return null;
    }
  }

  async function fetchRepo(url) {
    if (url === LOCAL_REPO_URL) {
      try {
        const res = await createFetchWithTimeout(url, FETCH_TIMEOUT);
        const json = await res.json();
        const repo = sanitizeRepo(json, url);
        return applySavedNsfwPreference(repo);
      } catch (e) {
        return null;
      }
    }
    try {
      const jsonData = await tryProxiesRace(url);
      if (!jsonData) return null;
      const repo = sanitizeRepo(jsonData, url);
      return applySavedNsfwPreference(repo);
    } catch (e) {
      return null;
    }
  }

  window.openPhotoBrowser = function (screenshotUrls) {
    if (typeof screenshotUrls === 'string') {
      try {
        screenshotUrls = JSON.parse(screenshotUrls);
      } catch {
        screenshotUrls = [];
      }
    }
    const list = Array.isArray(screenshotUrls) ? screenshotUrls : [];
    const pb = app.photoBrowser.create({
      photos: list.map(url => ({ url })),
      type: 'standalone',
      navbar: true,
      toolbar: true,
      swiper: { zoom: true }
    });
    pb.open();
  };

  const popupCache = new WeakMap();

  function createPopupHtml(item) {
    if (popupCache.has(item)) return popupCache.get(item);

    const screenshotsJson = JSON.stringify(item.screenshotURLs).replace(/"/g, '&quot;');
    const screenshotsHtml = item.screenshotURLs.map(src =>
      `<img loading="lazy" src="${src}" onclick="openPhotoBrowser(['${src}'])">`
    ).join('');
    const safeName = item.name || '';
    const safeDeveloper = item.developerName || '';
    const safeDescription = String(item.localizedDescription || '').replace(/\n/g, '<br>');
    const safeDownload = item.downloadURL || '#';
    const safeIcon = item.iconURL || '';

    const html = `
        <div class="popup popup-app-detail" id="popup-${item.bundleIdentifier}">
            <div class="view">
                <div class="page">
                    <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
                    <div class="page-content">
                        <div style="margin-top: 40px; padding: 0px;">
                            <div class="block" style="margin-top: 27px; margin-bottom: 20px;">
                                <div style="display: flex; gap: 15px; align-items: flex-start; overflow: hidden;">
                                    <img src="${safeIcon}" class="app-icon" style="flex-shrink: 0;">
                                    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                                        <div style="font-size: 22px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${safeName}
                                        </div>
                                        <div style="font-size: 15px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${safeDeveloper}
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                            <a href="${safeDownload}" class="external button button-fill button-round get">GET</a>
                                            <a onclick="navigator.share({url: '${safeDownload}' })" class="more">
                                                <i class="f7-icons">square_arrow_up</i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${item.screenshotURLs.length > 0 ? `
                        <div class="block-title" style="font-size: 20px; margin-top: 25px;">Preview</div>
                        <div class="screenshot" onclick="openPhotoBrowser(${screenshotsJson})">${screenshotsHtml}</div>` : ''}
                        <div class="block block-strong inset margin-top">
                            <div style="font-size: 15px; line-height: 1.5;">${safeDescription}</div>
                        </div>
                        <div class="list simple-list list-strong list-dividers inset">
                            <ul>
                                <li><span>Version</span><span>${item.version || ''}</span></li>
                                <li><span>Size</span><span>${item.size ? (item.size / 1024 / 1024).toFixed(1) : '0.0'} MB</span></li>
                                <li><span>BundleID</span><span class="size-12">${item.bundleIdentifier || ''}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    popupCache.set(item, html);
    return html;
  }

  function createAppListPage(pageId, title, apps, isAllSources = false, sourceURL = null) {
    const rightContent = !isAllSources
      ? `<div class="right"><a onclick="navigator.share({url: '${sourceURL}' })" class="link icon-only"><i class="icon f7-icons">square_arrow_up</i></a></div>`
      : '';
    const pageHtml = `
            <div class="page page-with-bottom-search page-with-subnavbar" data-name="repo-detail" data-url="${sourceURL || ''}" data-id="${pageId}" ${isAllSources ? 'data-all-sources="true"' : ''}>
                <div class="searchbar-backdrop"></div>
                <div class="searchbar-bottom-wrap">
                    <form class="searchbar">
                        <div class="searchbar-inner">
                            <div class="searchbar-input-wrap">
                                <input type="search" placeholder="Search">
                                <i class="searchbar-icon"></i>
                                <span class="input-clear-button"></span>
                            </div>
                            <span class="searchbar-disable-button"><i class="icon icon-close"></i></span>
                        </div>
                    </form>
                </div>
                <div class="navbar">
                    <div class="navbar-bg"></div>
                    <div class="navbar-inner">
                        <div class="subnavbar">
                            <form class="searchbar searchbar-init" data-search-container=".virtual-list-${pageId}" data-search-item="li" data-search-in=".item-title">
                                <div class="searchbar-inner">
                                    <div class="searchbar-input-wrap">
                                        <input type="search" placeholder="Search" />
                                        <i class="searchbar-icon"></i>
                                        <span class="input-clear-button"></span>
                                    </div>
                                    <span class="searchbar-disable-button"><i class="icon icon-close"></i></span>
                                </div>
                            </form>
                        </div>
                        <div class="left searchbar-hide-on-enable"><a class="link back"><i class="icon icon-back"></i></a></div>
                        <div class="title">${title}</div>
                        ${rightContent}
                    </div>
                </div>
                <div class="page-content repo-page ptr-content ptr-repo-detail">
                    <div class="ptr-preloader">
                        <div class="preloader"></div>
                        <div class="ptr-arrow"></div>
                    </div>
                    <div class="list media-list separated inset virtual-list virtual-list-${pageId} searchbar-found"></div>
                    <div class="block text-align-center searchbar-not-found ptr-ignore">
                        <i class="f7-icons" style="font-size:96px;color:#ff3b30;">bin_xmark_fill</i>
                        <h2 style="margin-top:20px;">Nothing was found</h2>
                        <p>Check your spelling or try searching again</p>
                    </div>
                </div>
            </div>`;
    app.views.main.router.navigate({
      url: `/repo-detail/${pageId}/`,
      route: {
        path: `/repo-detail/${pageId}/`,
        content: pageHtml,
        on: {
          pageInit: function (e, page) {
            const vl = app.virtualList.create({
              el: `.virtual-list-${pageId}`,
              items: apps,
              searchAll: (query, items) => {
                const q = (query || '').toLowerCase();
                const indices = [];
                for (let i = 0; i < items.length; i++) {
                  if (!q || (items[i].name || '').toLowerCase().includes(q)) indices.push(i);
                }
                return indices;
              },
              height: 90,
              renderItem: (item) => {
                if (item && item.skeleton) {
                  return `<li><div class="item-content skeleton-effect-pulse"><div class="item-media"><div class="skeleton-block" style="width:58px;height:58px;border-radius:28%"></div></div><div class="item-inner"><div class="item-title-row"><div class="item-title skeleton-text">Loading</div></div><div class="item-subtitle skeleton-text">Loading</div></div></div></li>`;
                }
                return `<li><a class="item-link item-content app-item-trigger" data-id="${item.bundleIdentifier}"><div class="item-media"><img src="${item.iconURL || ''}" loading="lazy"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${item.name || ''}</div></div><div class="item-subtitle">${item.developerName || ''}</div></div></a></li>`;
              }
            });
            page.vl = vl;
            app.searchbar.create({
              el: page.el.querySelector('.searchbar'),
              searchContainer: `.virtual-list-${pageId}`,
              searchIn: '.item-title',
              on: {
                search(sb, query) {
                  vl.search(query);
                }
              }
            });
            page.$el.on('click', '.app-item-trigger', function () {
              const appItem = apps.find(a => a.bundleIdentifier === this.dataset.id);
              if (appItem) {
                app.popup.create({
                  content: createPopupHtml(appItem),
                  swipeToClose: true,
                  on: {
                    closed: (p) => p.destroy()
                  }
                }).open();
              }
            });
          }
        }
      }
    });
  }

  function openRepoPage(repo) {
    const pageId = `repo-${Date.now()}`;
    createAppListPage(pageId, repo.name, repo.apps, false, repo.sourceURL);
  }

  function openAllSourcesPage() {
    const allApps = getAllApps();
    const pageId = `all-${Date.now()}`;
    createAppListPage(pageId, 'All Sources', allApps, true, null);
  }

  function renderSourcesList(repos) {
    const listEl = document.getElementById('sources-list');
    if (!listEl) return;
    listEl.textContent = '';
    const frag = document.createDocumentFragment();
    const totalApps = getAllApps().length;
    const allSourcesLi = document.createElement('li');
    allSourcesLi.id = 'all-sources';
    allSourcesLi.innerHTML = `<div><a class="item-link all-sources-link"><div class="item-content"><div class="item-media"><i class="f7-icons">tray_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">All Sources</div></div><div class="item-subtitle"><span class="badge">${totalApps} Total Apps</span></div></div></div></a></div>`;
    frag.appendChild(allSourcesLi);

    for (const repo of repos) {
      const li = document.createElement('li');
      li.id = repo.name || repo.sourceURL;
      li.classList.toggle('swipeout', !repo.isSystem);
      const iconSrc = repo.iconURL || './assets/default.png';
      const appsCount = Array.isArray(repo.apps) ? repo.apps.length : 0;
      li.innerHTML = `<div class="swipeout-content"><a class="item-link repo-link" href="#" data-url="${repo.sourceURL}"><div class="item-content"><div class="item-media"><img src="${iconSrc}"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${repo.name}</div></div><div class="item-subtitle"><span class="badge">${appsCount} Apps</span></div></div></div></a></div>${!repo.isSystem ? `<div class="swipeout-actions-right"><a onclick="navigator.share({ url: '${repo.sourceURL}' })">Share</a><a class="delete-source color-red" data-url="${repo.sourceURL}">Remove <i class="f7-icons" style="color:white;">trash</i></a></div>` : ''}`;
      frag.appendChild(li);
    }

    listEl.appendChild(frag);
    if (!listEl.classList.contains('sortable')) {
      listEl.classList.add('sortable');
    }
    const savedOrder = JSON.parse(localStorage.getItem('sourcesListOrder') || '[]');
    if (savedOrder.length) {
      for (const id of savedOrder) {
        const item = document.getElementById(id);
        if (item && item.parentNode === listEl) {
          listEl.appendChild(item);
        }
      }
    }
    if (!listEl.dataset.sortableInitialized) {
      listEl.addEventListener('sortable:sort', () => {
        const order = [...listEl.children].map(li => li.id);
        localStorage.setItem('sourcesListOrder', JSON.stringify(order));
      });
      listEl.dataset.sortableInitialized = 'true';
    }
    const allSourcesLink = listEl.querySelector('.all-sources-link');
    if (allSourcesLink) {
      allSourcesLink.addEventListener('click', (e) => {
        e.preventDefault();
        openAllSourcesPage();
      });
    }
    for (const link of listEl.querySelectorAll('.repo-link')) {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = link.dataset.url;
        const repo = repos.find(r => r.sourceURL === url);
        if (repo) openRepoPage(repo);
      });
    }
  }

  function renderNews(repos) {
    let allNews = [];
    for (const r of repos) {
      if (r.news) {
        for (const n of r.news) {
          allNews.push({ ...n, source: r.name });
        }
      }
    }
    const wrapper = document.getElementById('news-swiper-wrapper');
    const section = document.getElementById('news-section');
    if (!wrapper || !section) return;
    if (allNews.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    wrapper.textContent = '';
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const news of allNews) {
      wrapper.insertAdjacentHTML('beforeend', `
                <div class="swiper-slide swiper-slide-news">
                    <div class="card repo-news-card">
                        <div class="card-content card-content-padding">
                            <div class="size-12">${news.source}</div>
                            <div class="text-weight-bold">${String(news.title || '').substring(0, 34)}</div>
                            <a class="news-read-more link" data-caption="${encodeURIComponent(news.caption || '')}">Read more</a>
                        </div>
                    </div>
                </div>
            `);
    }
    const swiperContainer = document.getElementById('news-swiper-container');
    if (swiperContainer && !swiperContainer.swiper) {
      app.swiper.create('#news-swiper-container', {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: '1',
        grabCursor: true,
        coverflowEffect: {
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 1.5,
          slideShadows: false
        },
        on: {
          init: function () {
            this.wrapperEl.style.willChange = 'transform';
          }
        }
      });
    } else if (swiperContainer && swiperContainer.swiper) {
      swiperContainer.swiper.update();
    }
    for (const btn of wrapper.querySelectorAll('.news-read-more')) {
      btn.addEventListener('click', function () {
        const caption = decodeURIComponent(this.dataset.caption || '');
        const sheet = app.sheet.create({
          swipeToClose: true,
          backdrop: true,
          push: true,
          content: `
                        <div class="sheet-modal news-sheet">
                            <div class="swipe-nav">
                                <div><i class="f7-icons">minus</i></div>
                            </div>
                            <div class="page">
                                <div class="page-content">
                                    <div class="block">
                                        <p>${caption}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
        });
        sheet.open();
      });
    }
  }

  function openNsfwDialog() {
    return new Promise((resolve) => {
      const dialog = app.dialog.create({
        title: 'NSFW warning',
        text: 'This source may contain NSFW(18+) content. Add it at your own risk.',
        verticalButtons: true,
        buttons: [
          { text: 'Add anyway', cssClass: 'color-red', onClick: () => resolve('with') },
          { text: 'Add without NSFW apps', cssClass:'color-green', onClick: () => resolve('without') },
          { text: "Don't add", onClick: () => resolve('cancel') }
        ]
      });
      dialog.open();
    });
  }

  async function addSourceFlow(url) {
    const raw = (url || '').trim();
    if (!raw) {
      app.dialog.alert('Please enter a source link.', 'Error');
      return;
    }
    const normalizedUrl = normalizeSourceUrl(raw);
    if (!normalizedUrl) {
      app.dialog.alert('Please enter a valid source link.', 'Error');
      return;
    }
    const repos = getRepos();
    if (repos.find(r => r.sourceURL === normalizedUrl)) {
      app.dialog.alert('Already added.', 'Error');
      return;
    }

    app.dialog.preloader('Fetching source');
    const startTime = Date.now();
    const minDelay = 2000;

    try {
      let [fetchedRepo] = await Promise.all([
        fetchRepo(normalizedUrl),
        new Promise(resolve => {
          const remaining = minDelay - (Date.now() - startTime);
          setTimeout(resolve, Math.max(0, remaining));
        })
      ]);
      app.dialog.close();
      
      if (!fetchedRepo) {
        const choice = await new Promise(resolve => {
          app.dialog.create({
            title: 'All proxies failed',
            text: 'None of the CORS proxies could fetch this source. You can still add it if you have its JSON content.',
            buttons: [
              { text: 'Paste JSON manually', onClick: () => resolve('paste') },
              { text: 'Cancel', onClick: () => resolve('cancel') }
            ]
          }).open();
        });
        if (choice === 'cancel') return;
        const jsonStr = await new Promise(resolve => {
          app.dialog.prompt('Paste the full repository JSON', 'Manual add', resolve);
        });
        if (!jsonStr) return;
        try {
          const parsed = JSON.parse(jsonStr);
          fetchedRepo = sanitizeRepo(parsed, normalizedUrl);
        } catch {
          app.dialog.alert('Invalid JSON. Please check the content.', 'Error');
          return;
        }
        if (!fetchedRepo) {
          app.dialog.alert('Could not parse a valid repository from the JSON.', 'Error');
          return;
        }
      }
      // =================================================================

      let repo = fetchedRepo;
      repo.sourceURL = normalizedUrl;
      if (!repo.apps || !Array.isArray(repo.apps)) {
        repo.apps = [];
      }
      if (!repo.news || !Array.isArray(repo.news)) {
        repo.news = [];
      }
      const looksNsfw = repoLooksNsfw(repo, normalizedUrl);
      if (looksNsfw) {
        const choice = await openNsfwDialog();
        if (choice === 'cancel') {
          return;
        }
        if (choice === 'without') {
          setSourcePref(normalizedUrl, 'without');
          repo = stripNsfwApps(repo);
        } else {
          removeSourcePref(normalizedUrl);
        }
      } else {
        removeSourcePref(normalizedUrl);
      }
      const updatedRepos = getRepos();
      updatedRepos.push(repo);
      saveRepos(updatedRepos);
      await refreshData(true);
    } catch (error) {
      app.dialog.close();
      app.dialog.alert('An error occurred while adding the source. Please try again.', 'Error');
    }
  }

  document.getElementById('add-source-fab').addEventListener('click', () => {
    app.dialog.prompt('Enter the source link.', 'Add source', addSourceFlow);
  });

  document.getElementById('sources-list').addEventListener('click', (e) => {
    const delBtn = e.target.closest('.delete-source');
    if (delBtn) {
      const url = delBtn.dataset.url;
      const listItem = delBtn.closest('li');
      app.dialog.confirm(
        'Are you sure you want to remove this source?',
        'Remove source',
        function () {
          saveRepos(getRepos().filter(r => r.sourceURL !== url));
          app.swipeout.delete(listItem);
          refreshData(true);
        },
        function () {
          app.swipeout.close(listItem);
        }
      );
      return;
    }
    const link = e.target.closest('.repo-link');
    if (link) {
      e.preventDefault();
      const url = link.dataset.url;
      const repo = getRepos().find(r => r.sourceURL === url);
      if (repo) openRepoPage(repo);
    }
  });

  app.on('ptrRefresh', async (el) => {
    if (el.classList.contains('ptr-repos')) {
      await refreshData(true);
      app.ptr.done(el);
      return;
    }
    if (!el.classList.contains('ptr-repo-detail')) return;
    const pageEl = el.closest('.page');
    const isAllSources = pageEl.dataset.allSources === 'true';
    const repoUrl = pageEl.dataset.url;
    const pageId = pageEl.dataset.id;
    const listSelector = `.virtual-list-${pageId}`;
    const start = Date.now();
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const makeSkeletonItems = (n = 6) => new Array(n).fill(null).map(() => ({ skeleton: true }));
    const skeletonLi = `<li><div class="item-content skeleton-effect-pulse"><div class="item-media"><div class="skeleton-block" style="width:58px;height:58px;border-radius:28%"></div></div><div class="item-inner"><div class="item-title-row"><div class="item-title skeleton-text">Loading</div></div><div class="item-subtitle skeleton-text">Loading</div></div></div></li>`;
    const vl = pageEl.vl || app.virtualList.get(listSelector);
    if (vl && typeof vl.replaceAllItems === 'function') {
      vl.replaceAllItems(makeSkeletonItems(6));
    } else {
      const listContainer = pageEl.querySelector(listSelector);
      if (listContainer) listContainer.innerHTML = `<ul>${skeletonLi.repeat(6)}</ul>`;
    }
    const ensureMinDelay = async () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);
      if (remaining > 0) await wait(remaining);
    };

    try {
      if (isAllSources) {
        let allRepos = getRepos();
        const updates = await Promise.all(allRepos.map(r => fetchRepo(r.sourceURL).catch(() => null)));
        allRepos = updates.map((newRepo, i) => applySavedNsfwPreference(newRepo || allRepos[i])).filter(Boolean);
        saveRepos(allRepos);
        const allApps = getAllApps();
        await ensureMinDelay();
        if (vl && typeof vl.replaceAllItems === 'function') {
          vl.replaceAllItems(allApps);
        } else {
          const listContainer = pageEl.querySelector(listSelector);
          if (listContainer) {
            const html = allApps.map(item => `<li><a class="item-link item-content app-item-trigger" data-id="${item.bundleIdentifier}"><div class="item-media"><img src="${item.iconURL || ''}" loading="lazy" alt="${item.name || ''}"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${item.name || ''}</div></div><div class="item-subtitle">${item.developerName || ''}</div></div></a></li>`).join('');
            listContainer.innerHTML = `<ul>${html}</ul>`;
          }
        }
        renderSourcesList(allRepos);
        renderNews(allRepos);
      } else {
        const [newRepoData] = await Promise.all([fetchRepo(repoUrl), ensureMinDelay()]);
        if (newRepoData) {
          let allRepos = getRepos();
          const finalRepo = applySavedNsfwPreference(newRepoData);
          const index = allRepos.findIndex(r => r.sourceURL === repoUrl);
          if (index !== -1) {
            allRepos[index] = finalRepo;
            saveRepos(allRepos);
          }
          if (vl && typeof vl.replaceAllItems === 'function') {
            vl.replaceAllItems(finalRepo.apps || []);
          } else {
            const listContainer = pageEl.querySelector(listSelector);
            if (listContainer) {
              const html = (finalRepo.apps || []).map(item => `<li><a class="item-link item-content app-item-trigger" data-id="${item.bundleIdentifier}"><div class="item-media"><img src="${item.iconURL || ''}" loading="lazy" alt="${item.name || ''}"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${item.name || ''}</div></div><div class="item-subtitle">${item.developerName || ''}</div></div></a></li>`).join('');
              listContainer.innerHTML = `<ul>${html}</ul>`;
            }
          }
        }
      }
    } catch (error) {
      try {
        if (isAllSources) {
          const allApps = getAllApps();
          if (vl && typeof vl.replaceAllItems === 'function') {
            vl.replaceAllItems(allApps);
          } else {
            const listContainer = pageEl.querySelector(listSelector);
            if (listContainer) {
              const html = allApps.map(item => `<li><a class="item-link item-content app-item-trigger" data-id="${item.bundleIdentifier}"><div class="item-media"><img src="${item.iconURL || ''}" loading="lazy" alt="${item.name || ''}"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${item.name || ''}</div></div><div class="item-subtitle">${item.developerName || ''}</div></div></a></li>`).join('');
              listContainer.innerHTML = `<ul>${html}</ul>`;
            }
          }
        } else {
          const allRepos = getRepos();
          const cached = allRepos.find(r => r.sourceURL === repoUrl);
          if (cached) {
            if (vl && typeof vl.replaceAllItems === 'function') {
              vl.replaceAllItems(cached.apps || []);
            } else {
              const listContainer = pageEl.querySelector(listSelector);
              if (listContainer) {
                const html = (cached.apps || []).map(item => `<li><a class="item-link item-content app-item-trigger" data-id="${item.bundleIdentifier}"><div class="item-media"><img src="${item.iconURL || ''}" loading="lazy" alt="${item.name || ''}"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">${item.name || ''}</div></div><div class="item-subtitle">${item.developerName || ''}</div></div></a></li>`).join('');
                listContainer.innerHTML = `<ul>${html}</ul>`;
              }
            }
          }
        }
      } catch (e) {}
    } finally {
      app.ptr.done(el);
    }
  });

  async function refreshData(force = false) {
    let repos = getRepos();
    if (!repos || repos.length === 0) {
      repos = [{
        sourceURL: LOCAL_REPO_URL,
        name: 'SoftwareKit',
        apps: [],
        news: [],
        isSystem: true
      }];
      saveRepos(repos);
    }

    const listEl = document.getElementById('sources-list');
    const newsWrapper = document.getElementById('news-swiper-wrapper');

    if (listEl) {
      listEl.textContent = '';
      const repoSkeleton = `<li class="skeleton-effect-pulse"><div class="swipeout-content"><div class="item-content"><div class="item-media"><div class="skeleton-block" style="width: 58px; height: 58px; border-radius: 28%;"></div></div><div class="item-inner"><div class="item-title-row"><div class="item-title skeleton-text">Loading Repo</div></div><div class="item-subtitle skeleton-text">Loading Apps</div></div></div></div></li>`;
      listEl.innerHTML = repoSkeleton.repeat(repos.length || 3);
    }

    if (newsWrapper) {
      newsWrapper.textContent = '';
      const newsSkeleton = `<div class="swiper-slide swiper-slide-news skeleton-effect-pulse"><div class="card repo-news-card"><div class="card-content card-content-padding"><div class="size-12 skeleton-text">Source</div><div class="text-weight-bold skeleton-text">Loading news</div><a class="news-read-more skeleton-text">Read more</a></div></div></div>`;
      newsWrapper.innerHTML = newsSkeleton.repeat(3);
      const newsSwiperContainer = document.getElementById('news-swiper-container');
      if (newsSwiperContainer && newsSwiperContainer.swiper) {
        newsSwiperContainer.swiper.update();
      }
    }

    if (force) app.dialog.preloader('Refreshing Sources');

    try {
      const delay = new Promise(resolve => setTimeout(resolve, 2000));
      const [updates] = await Promise.all([
        Promise.all(repos.map(r => fetchRepo(r.sourceURL).catch(() => null))),
        delay
      ]);
      repos = updates.map((newRepo, i) => applySavedNsfwPreference(newRepo || repos[i])).filter(Boolean);
      saveRepos(repos);
    } catch (error) {
    } finally {
      if (force) app.dialog.close();
    }

    renderSourcesList(repos);
    renderNews(repos);
  }

  refreshData(false);
});

const READ_LATER_KEY = 'idb_read_later';
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e2e2/666?text=No+Image';

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
  requestIdleCallback(renderReadLaterNews);
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
  container.textContent = '';
  if (!items.length) {
    container.insertAdjacentHTML('beforeend', '<h2 class="empty-read-later">Nothing to see here yet <i class="f7-icons icon-small">tray_fill</i></h2>');
    return;
  }
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const title = String(item.title || '');
    const link = String(item.link || '');
    const imgSrc = String(item.imgSrc || PLACEHOLDER_IMAGE);
    const div = document.createElement('div');
    div.className = 'card card-raised news-card';
    div.innerHTML = `
        <div class="card-content">
          <div class="card-image">
            <img class="newsimg" src="${escapeHtml(imgSrc)}" loading="lazy" alt="${escapeHtml(title)}">
            <div class="news-actions">
              <a class="news-action" href="#" onclick='shareArticle(${JSON.stringify(title)}, ${JSON.stringify(link)}); return false;'>
                <i class="f7-icons">square_arrow_up</i>
              </a>
              <a class="news-action" href="#" onclick='removeFromReadLater(${JSON.stringify(link)}, ${JSON.stringify(title)}, this.closest(".news-card")); return false;'>
                <i class="f7-icons">trash</i>
              </a>
              <a class="news-action external" href="${escapeHtml(link)}" target="_blank" rel="noopener">
                <i class="f7-icons">book_fill</i>
              </a>
            </div>
            <div class="news-overlay">
              <div class="news-title">${escapeHtml(title)}</div>
            </div>
          </div>
        </div>
      `;
    frag.appendChild(div);
  }
  container.appendChild(frag);
}

function getNodeText(parent, tagName) {
  const node = parent.getElementsByTagName(tagName)[0];
  return node ? node.textContent.trim() : '';
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
            <span class="news-action skeleton-text"><i class="f7-icons">square_arrow_up</i></span>
            <span class="news-action skeleton-text"><i class="f7-icons">clock</i></span>
            <span class="news-action skeleton-text"><i class="f7-icons">book_fill</i></span>
          </div>
          <div class="news-overlay">
            <div class="news-title skeleton-text">Loading news title</div>           
          </div>
        </div>
      </div>
    </div>
  `.repeat(3);

  try {
    const [response] = await Promise.all([
      fetch('https://www.idownloadblog.com/feed/'),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);
    if (!response.ok) throw new Error('Feed request failed');
    const data = await response.text();
    const xml = new window.DOMParser().parseFromString(data, 'text/xml');
    const items = xml.getElementsByTagName('item');
    newsContainer.textContent = '';
    const frag = document.createDocumentFragment();
    for (const item of items) {
      const title = getNodeText(item, 'title');
      const link = getNodeText(item, 'link');
      const content = getNodeText(item, 'content:encoded') || getNodeText(item, 'description');
      const imgDoc = new window.DOMParser().parseFromString(content, 'text/html');
      const imgElement = imgDoc.querySelector('img');
      const imgSrc = imgElement?.getAttribute('src') || PLACEHOLDER_IMAGE;

      const card = document.createElement('div');
      card.classList.add('card', 'card-raised', 'news-card');
      card.innerHTML = `
        <div class="card-content">
          <div class="card-image">
            <img class="newsimg" src="${escapeHtml(imgSrc)}" loading="lazy" alt="${escapeHtml(title)}">
            <div class="news-actions">
              <a class="news-action" href="#" onclick='shareArticle(${JSON.stringify(title)}, ${JSON.stringify(link)}); return false;'>
                <i class="f7-icons">square_arrow_up</i>
              </a>
              <a class="news-action" href="#" onclick='addToReadLater(${JSON.stringify(title)}, ${JSON.stringify(link)}, ${JSON.stringify(imgSrc)}); return false;'>
                <i class="f7-icons">clock</i>
              </a>
              <a class="news-action external" href="${escapeHtml(link)}" target="_blank" rel="noopener">
                <i class="f7-icons">book_fill</i>
              </a>
            </div>
            <div class="news-overlay">
              <div class="news-title">${escapeHtml(title)}</div>
            </div>
          </div>
        </div>
      `;
      frag.appendChild(card);
    }
    newsContainer.appendChild(frag);
  } catch (error) {
    newsContainer.textContent = '';
    newsContainer.insertAdjacentHTML('beforeend', '<div class="block">Failed to load news.</div>');
  }
}

app.on('ptrRefresh', (el) => {
  if (el.classList.contains('ptr-news')) {
    fetchAndLoadNews().then(() => {
      app.ptr.done(el);
    });
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
    p.style.cssText = `
      position:absolute;
      left:50%;
      top:50%;
      width:${4 + Math.random() * 5}px;
      height:${4 + Math.random() * 5}px;
      margin:-2px 0 0 -2px;
      border-radius:999px;
      background:rgba(255,255,255,.95);
      box-shadow:0 0 10px rgba(255,255,255,.45);
    `;
    layer.appendChild(p);
    p.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0)`, opacity: 0 }
      ],
      { duration: 650 + Math.random() * 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
    );
  }
  return cardEl.animate(
    [
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
      { opacity: 0, transform: 'scale(.88) rotate(2deg)', filter: 'blur(10px)' }
    ],
    { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
  ).finished.then(() => layer.remove());
}

function checkConnection() {
  let dialogInstance = null;
  const showDialog = () => {
    if (!dialogInstance) {
      dialogInstance = app.dialog.create({
        title: 'No Internet Connection',
        text: `
          <div style="display:flex;align-items:center;">
            <i class="icon f7-icons color-red" style="font-size:32px;margin-right:12px;">wifi_slash</i>
            <div>
              <div style="font-weight:bold;">Some features will not be available.</div>
              <div style="margin-top:4px;">Please check your internet connection and try again.</div>
            </div>
          </div>
        `,
        buttons: [{ text: 'Dismiss', close: true }],
        closeByBackdropClick: false,
        closeByOutsideClick: false,
        destroyOnClose: true,
        on: {
          closed: () => { dialogInstance = null; }
        }
      });
      dialogInstance.open();
    }
  };
  const hideDialog = () => {
    if (dialogInstance) {
      dialogInstance.close();
      dialogInstance = null;
    }
  };
  window.addEventListener('online', hideDialog);
  window.addEventListener('offline', showDialog);
  if (!navigator.onLine) showDialog();
}

checkConnection();

const SignerEngine = {
  workerBase: 'https://api.cococloud.swkit.app',
  files: { ipa: null, p12: null, prov: null },
  appInfo: null,
  currentMode: 'custom',
  _hasCertResults: false,

  log: function(msg, color = 'var(--f7-theme-color)', escapeHtml = true) {
    const el = document.getElementById('signer-logs');
    if (!el) return;
    const safe = escapeHtml ? this._escapeHtml(String(msg)) : String(msg);
    el.insertAdjacentHTML('beforeend', `<div style="color:${color}; margin-bottom:4px;">> ${safe}</div>`);
    el.scrollTop = el.scrollHeight;
  },

  _escapeHtml: function(unsafe) {
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  _setHtml: function(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  },

  _setText: function(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  _alert: function(message, title = 'Error') {
    try {
      if (window.app && app.dialog && typeof app.dialog.alert === 'function') {
        app.dialog.alert(message, title);
      } else {
        alert(`${title}: ${message}`);
      }
    } catch (e) {}
  },

  _arrayBufferToBinaryString: function(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let result = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      result += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return result;
  },

  _parseResponse: async function(response) {
    const text = await response.text();
    const trimmed = text.trim();
    const ct = (response.headers.get('content-type') || '').toLowerCase();
    const tryJson = (value) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    };
    if (ct.includes('application/json')) {
      const json = tryJson(trimmed);
      if (json !== null) {
        return { type: 'json', data: json, text, status: response.status, headers: response.headers };
      }
    }
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const json = tryJson(trimmed);
      if (json !== null) {
        return { type: 'json', data: json, text, status: response.status, headers: response.headers };
      }
    }
    return {
      type: 'text',
      text,
      snippet: text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<\/?[^>]+(>|$)/g, '').slice(0, 1200),
      status: response.status,
      headers: response.headers
    };
  },

  _normalizeRevocationStatus: function(payload) {
    if (!payload || typeof payload !== 'object') return 'unknown';
    const pick = (obj, path) =>
      path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    const candidates = [
      pick(payload, 'p12_certificate.certificate_status.status'),
      pick(payload, 'certificate_status.status'),
      pick(payload, 'data.p12_certificate.certificate_status.status'),
      pick(payload, 'data.certificate_status.status'),
      pick(payload, 'data.status'),
      pick(payload, 'status'),
      pick(payload, 'message')
    ]
      .filter(v => v !== undefined && v !== null)
      .map(v => String(v).trim().toLowerCase());
    for (const value of candidates) {
      if (value.includes('revoked')) return 'revoked';
    }
    for (const value of candidates) {
      if (value.includes('signed') || value.includes('valid') || value.includes('good')) return 'good';
    }
    const text = JSON.stringify(payload).toLowerCase();
    if (text.includes('"status":"revoked"')) return 'revoked';
    if (text.includes('"status":"signed"') || text.includes('"status":"valid"')) return 'good';
    return 'unknown';
  },

  _hideCertUI: function() {
    const block = document.getElementById('cert-info-list');
    if (block) block.style.display = 'none';
  },

  _showCertUI: function() {
    const block = document.getElementById('cert-info-list');
    if (block) block.style.display = 'block';
  },

  _syncCertUIVisibility: function() {
    const block = document.getElementById('cert-info-list');
    if (!block) return;
    block.style.display = (this.currentMode === 'check' && this._hasCertResults) ? 'block' : 'none';
  },

  _clearCertValues: function() {
    const ids = [
      'cert-subject',
      'cert-status',
      'cert-expiry',
      'cert-issuer',
      'cert-serial',
      'prov-name',
      'prov-status',
      'prov-expiry',
      'prov-bundle',
      'revocation-status'
    ];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    }
  },

  _markCertDataDirty: function() {
    this._hasCertResults = false;
    this._hideCertUI();
  },

  showModeFiles: function(mode) {
    const allItems = document.querySelectorAll('#upload-list [data-modes]');
    for (const item of allItems) {
      const modes = item.getAttribute('data-modes').split(',');
      item.style.display = modes.includes(mode) ? '' : 'none';
    }
  },

  initModeSegmented: function() {
    const container = document.getElementById('mode-segmented');
    if (!container) return;
    const buttons = container.querySelectorAll('.button');
    const setActive = (mode) => {
      for (const btn of buttons) {
        if (btn.getAttribute('data-mode') === mode) btn.classList.add('button-active');
        else btn.classList.remove('button-active');
      }
      this.currentMode = mode;
      this.showModeFiles(mode);
      const signingBlock = document.getElementById('signing-options-block');
      const appInfoBlock = document.getElementById('app-info-block');
      const signBtn = document.getElementById('sign-button');
      const checkBtn = document.getElementById('check-button');
      if (mode !== 'check') {
        this._hideCertUI();
      } else {
        this._syncCertUIVisibility();
      }
      if (signingBlock) signingBlock.style.display = (mode === 'check' || !this.files.ipa) ? 'none' : 'block';
      if (appInfoBlock) appInfoBlock.style.display = (mode === 'check' || !this.files.ipa) ? 'none' : 'block';
      if (mode === 'check') {
        if (signBtn) signBtn.style.display = 'none';
        if (checkBtn) checkBtn.style.display = 'block';
      } else {
        if (signBtn) signBtn.style.display = 'block';
        if (checkBtn) checkBtn.style.display = 'none';
      }
    };
    for (const btn of buttons) {
      btn.onclick = (e) => {
        e.preventDefault();
        setActive(btn.getAttribute('data-mode'));
      };
    }
    setActive('custom');
  },

  onFile: function(input, type) {
    if (!input.files || !input.files[0]) return;
    this.files[type] = input.files[0];
    this.log(`${type.toUpperCase()} loaded: ${this.files[type].name}`);
    if (type === 'p12' || type === 'prov') {
      this._markCertDataDirty();
      this._clearCertValues();
      this._syncCertUIVisibility();
    }
  },

  onIPASelected: async function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    this.files.ipa = file;
    this.log(`IPA selected: ${file.name}`, '#ff9500');
    const appInfoBlock = document.getElementById('app-info-block');
    const signingBlock = document.getElementById('signing-options-block');
    if (appInfoBlock) appInfoBlock.style.display = 'none';
    if (signingBlock) signingBlock.style.display = 'none';
    try {
      if (window.app && app.dialog) app.dialog.preloader('Parsing app... ');
      const parser = new AppInfoParser(file);
      const info = await parser.parse();
      this.appInfo = info;
      this.log(`Parsed: ${info.CFBundleName || info.name || 'Unknown'}`, '#34c759');
      this.updateAppInfoUI(info);
      if (appInfoBlock && this.currentMode !== 'check') appInfoBlock.style.display = 'block';
      if (signingBlock && this.currentMode !== 'check') signingBlock.style.display = 'block';
      if (window.app && app.toggle && typeof app.toggle.init === 'function') app.toggle.init(signingBlock);
    } catch (err) {
      const msg = err && err.message ? err.message : 'IPA parsing failed';
      this.log(`Parsing failed: ${msg}`, '#ff3b30');
      this._alert(msg, 'IPA Parsing Failed');
    } finally {
      if (window.app && app.dialog) app.dialog.close();
    }
  },

  updateAppInfoUI: function(info) {
    const iconEl = document.getElementById('app-icon');
    const nameEl = document.getElementById('app-name');
    const versionEl = document.getElementById('app-version');
    const bundleEl = document.getElementById('app-bundle');
    if (nameEl) nameEl.innerText = info.CFBundleName || info.name || 'Unknown';
    if (versionEl) versionEl.innerText = `Version ${info.CFBundleShortVersionString || info.version || '?'}`;
    if (bundleEl) bundleEl.innerText = info.CFBundleIdentifier || '?';
    if (iconEl) {
      if (info.icon) {
        iconEl.src = info.icon;
        iconEl.style.display = 'block';
      } else {
        iconEl.style.display = 'none';
      }
    }
  },

  _loadScript: function(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if ((src.includes('forge.min.js') && window.forge) || (src.includes('plist.js') && window.plist)) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  },

  _readFileAsArrayBuffer: function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File read failed'));
      reader.readAsArrayBuffer(file);
    });
  },

  _parseMobileProvisionAccurate: function(data) {
    const text = new TextDecoder('utf-8').decode(data);
    const start = text.indexOf('<?xml');
    const end = text.lastIndexOf('</plist>');
    if (start === -1 || end === -1) {
      throw new Error('Invalid mobileprovision file');
    }
    if (typeof window.plist === 'undefined') {
      throw new Error('plist parser not available');
    }
    const plistText = text.slice(start, end + 8);
    const parsed = window.plist.parse(plistText) || {};
    const entitlements = parsed.Entitlements || {};
    return {
      name: parsed.Name || parsed.AppIDName || 'Unnamed',
      bundleId: entitlements['application-identifier']
        ? entitlements['application-identifier'].split('.').slice(1).join('.')
        : 'Unknown',
      teamIdentifier: parsed.TeamIdentifier || [],
      expirationDate: parsed.ExpirationDate ? new Date(parsed.ExpirationDate) : null,
      entitlements,
      uuid: parsed.UUID || '',
      provisionsAllDevices: !!parsed.ProvisionsAllDevices
    };
  },

  _parseP12CertificateAccurate: async function(data, password) {
    const forgeLib = window.forge || globalThis.forge;
    if (!forgeLib) throw new Error('Forge not available');
    try {
      const binary = this._arrayBufferToBinaryString(data);
      const p12Asn1 = forgeLib.asn1.fromDer(binary);
      const p12 = forgeLib.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');
      const certBags = p12.getBags({ bagType: forgeLib.pki.oids.certBag });
      const bagList = certBags[forgeLib.pki.oids.certBag] || [];
      if (!bagList.length) throw new Error('No certificate found in P12');
      const cert = bagList[0].cert;
      if (!cert) throw new Error('Invalid certificate data in P12');
      const subject = {};
      const issuer = {};
      for (const attr of (cert.subject.attributes || [])) {
        const key = attr.shortName || attr.name || attr.type || '';
        if (key) subject[key] = attr.value;
      }
      for (const attr of (cert.issuer.attributes || [])) {
        const key = attr.shortName || attr.name || attr.type || '';
        if (key) issuer[key] = attr.value;
      }
      const notBefore = cert.validity && cert.validity.notBefore ? new Date(cert.validity.notBefore) : null;
      const notAfter = cert.validity && cert.validity.notAfter ? new Date(cert.validity.notAfter) : null;
      if (!notBefore || !notAfter) throw new Error('Certificate validity data is missing');
      return { cert, subject, issuer, validity: { notBefore, notAfter }, serialNumber: cert.serialNumber || '' };
    } catch (err) {
      const msg = err && err.message ? err.message : 'P12 parsing failed';
      if (msg.includes('PKCS#12 MAC') || msg.includes('mac could not be verified') || msg.toLowerCase().includes('password')) {
        throw new Error('Invalid P12 password – please check and try again.');
      }
      throw new Error(msg);
    }
  },

  checkCert: async function() {
    if (this.currentMode !== 'check') {
      const msg = 'Certificate check is only available in Check mode.';
      this.log(msg, '#ff3b30');
      this._alert(msg, 'Mode Error');
      return;
    }
    const provFile = this.files.prov;
    const p12File = this.files.p12;
    if (!provFile && !p12File) {
      const msg = 'Upload at least a P12 or mobileprovision file.';
      this.log(msg, '#ff3b30');
      this._alert(msg, 'Missing Files');
      return;
    }
    this.log('Starting certificate validation...', '#ff9500');
    this._hasCertResults = false;
    this._clearCertValues();
    try {
      if (!window.forge) await this._loadScript('https://cdn.jsdelivr.net/npm/node-forge@1.3.1/dist/forge.min.js');
      if (!window.plist) await this._loadScript('https://cdn.jsdelivr.net/npm/plist@3.0.5/dist/plist.js');
      const forgeLib = window.forge || globalThis.forge;
      if (!forgeLib) throw new Error('Forge failed to load');
      let certData = null;
      let provInfo = null;
      if (p12File) {
        const p12Pass = document.getElementById('p12-pass')?.value || '';
        const p12Data = await this._readFileAsArrayBuffer(p12File);
        certData = await this._parseP12CertificateAccurate(p12Data, p12Pass);
      }
      if (provFile) {
        const provData = await this._readFileAsArrayBuffer(provFile);
        provInfo = this._parseMobileProvisionAccurate(provData);
      }
      if (certData) {
        const { subject, issuer, validity, serialNumber } = certData;
        const now = new Date();
        const isValid = validity.notBefore <= now && validity.notAfter >= now;
        this._setText('cert-subject', subject.CN || 'Unknown');
        this._setHtml('cert-status', isValid ? '<span class="badge color-green">Valid</span>' : '<span class="badge color-red">Expired</span>');
        this._setText('cert-expiry', validity.notAfter.toLocaleString());
        this._setText('cert-issuer', issuer.CN || 'Unknown');
        this._setText('cert-serial', serialNumber || 'Unknown');
      }
      if (provInfo) {
        const isProvValid = provInfo.expirationDate && provInfo.expirationDate > new Date();
        this._setText('prov-name', provInfo.name || 'Unnamed');
        this._setHtml('prov-status', isProvValid ? '<span class="badge color-green">Valid</span>' : '<span class="badge color-red">Expired</span>');
        this._setText('prov-expiry', provInfo.expirationDate ? provInfo.expirationDate.toLocaleString() : 'Unknown');
        this._setText('prov-bundle', provInfo.bundleId || 'Unknown');
      }
      const revEl = document.getElementById('revocation-status');
      if (revEl) revEl.innerHTML = '<span class="badge color-orange">Checking</span>';
      this._hasCertResults = true;
      this._showCertUI();
      this.log('Checking revocation status...', '#ff9500');
      const fd = new FormData();
      if (p12File) fd.append('file', p12File);
      if (provFile) fd.append('file', provFile);
      const res = await fetch(`${this.workerBase}/certchecker`, { method: 'POST', body: fd });
      const parsed = await this._parseResponse(res);
      if (parsed.type === 'json') {
        const root = parsed.data;
        const status = this._normalizeRevocationStatus(root);
        if (!root || root.success === false || root.status === 'error' || root.error) {
          const msg = root?.message || root?.error || 'Server returned an error.';
          this.log('Error: ' + msg, '#ff3b30');
          if (revEl) revEl.innerHTML = '<span class="badge color-gray">Error</span>';
          this._alert(msg, 'Certificate Check Failed');
          return;
        }
        this.log('Raw response:', '#8e8e93');
        this.log(JSON.stringify(root, null, 2), '#8e8e93');
        if (revEl) {
          if (status === 'revoked') revEl.innerHTML = '<span class="badge color-red">Revoked</span>';
          else if (status === 'good') revEl.innerHTML = '<span class="badge color-green">Signed</span>';
          else revEl.innerHTML = '<span class="badge color-gray">Unknown</span>';
        }
        this.log('Certificate check completed.', '#34c759');
      } else {
        const msg = 'Unexpected response from the server.';
        this.log('Server non-JSON response:', '#ff3b30');
        this.log(parsed.snippet || '(empty)', '#ff3b30');
        if (revEl) revEl.innerHTML = '<span class="badge color-gray">Error</span>';
        this._alert(msg, 'Certificate Check Failed');
      }
    } catch (err) {
      const msg = err && err.message ? err.message : 'Unknown error';
      this.log('Check failed: ' + msg, '#ff3b30');
      const revEl = document.getElementById('revocation-status');
      if (revEl) revEl.innerHTML = '<span class="badge color-gray">Error</span>';
      this._alert(msg, 'Certificate Check Failed');
    } finally {
      if (window.app && app.dialog) app.dialog.close();
      this._syncCertUIVisibility();
    }
  },

  sign: async function() {
    const mode = this.currentMode || 'custom';
    if (!this.files.ipa) {
      const msg = 'Please select an IPA file first.';
      this.log(msg, '#ff3b30');
      this._alert(msg, 'Missing IPA');
      return;
    }
    if (mode === 'custom' && (!this.files.p12 || !this.files.prov)) {
      const msg = 'Custom mode needs both P12 and MobileProvision files.';
      this.log(msg, '#ff3b30');
      this._alert(msg, 'Missing Files');
      return;
    }
    const endpoint = mode === 'free' ? 'free-enterprise-sign' : 'customsign';
    const fd = new FormData();
    fd.append('ipa', this.files.ipa);
    if (mode === 'custom') {
      fd.append('cert', this.files.p12);
      fd.append('provision', this.files.prov);
      const pass = document.getElementById('p12-pass')?.value || '';
      if (pass) fd.append('password', pass);
    }
    this.log(`Starting ${mode} signing...`, '#ff9500');
    try {
      if (window.app && app.dialog) app.dialog.preloader('Signing...');
      const res = await fetch(`${this.workerBase}/${endpoint}`, { method: 'POST', body: fd });
      const parsed = await this._parseResponse(res);
      if (parsed.type === 'json') {
        const j = parsed.data;
        if (j && (j.success || j.status === 'success')) {
          this.log('Signed successfully', '#34c759');
          const link = j.itmsServicesUrl || j.manifestUrl || j.downloadUrl || j.download_url || j.manifest_url || j.itms_services_url || (j.data && (j.data.itmsServicesUrl || j.data.manifestUrl || j.data.downloadUrl || j.data.download_url));
          if (link) {
            this.log('Install link: ' + link, 'var(--f7-theme-color)');
            window.location.href = link;
          } else if (j.downloadUrl || j.download_url) {
            const url = j.downloadUrl || j.download_url;
            this.log('Download link: ' + url, 'var(--f7-theme-color)');
            window.location.href = url;
          } else {
            this.log('Signed but no install URL returned.', '#ffa500');
            this.log(JSON.stringify(j, null, 2), '#ffa500');
            this._alert('Signed but no install link was returned. Check logs.', 'Signing Completed');
          }
        } else {
          const msg = j?.message || JSON.stringify(j);
          this.log('Signing failed: ' + msg, '#ff3b30');
          this._alert(msg, 'Signing Failed');
        }
      } else if (parsed.type === 'binary') {
        const blob = parsed.blob;
        const cd = parsed.headers.get('content-disposition') || 'attachment; filename="signed.ipa"';
        const fnMatch = cd.match(/filename="?([^"]+)"?/);
        const filename = fnMatch ? fnMatch[1] : 'signed.ipa';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.log('Downloaded signed IPA: ' + filename, 'var(--f7-theme-color)');
        this._alert('Downloaded signed IPA.', 'Signing Completed');
      } else {
        this.log('Signing returned non-JSON.', '#ff3b30');
        this.log(parsed.snippet || '(empty)', '#ff3b30');
        this._alert('Signing returned an unexpected response. Check logs.', 'Signing Failed');
      }
    } catch (e) {
      const msg = e && e.message ? e.message : 'Network/Worker error';
      this.log('Signing failed: ' + msg, '#ff3b30');
      this._alert(msg, 'Signing Failed');
    } finally {
      if (window.app && app.dialog) app.dialog.close();
    }
  }
};

function openSignerPopup() {
  if (window.app) app.popup.open('#signer-popup');
  SignerEngine.initModeSegmented();
  const signBtn = document.getElementById('sign-button');
  const checkBtn = document.getElementById('check-button');
  if (signBtn) signBtn.onclick = () => SignerEngine.sign();
  if (checkBtn) checkBtn.onclick = () => SignerEngine.checkCert();
}

function toggleSignerMode() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'custom';
  for (const el of document.querySelectorAll('.custom-only')) {
    el.style.display = (mode === 'custom') ? '' : 'none';
  }
}

function updateFileLabel(input) {
  const box = input.parentElement.querySelector('.file-box');
  if (!box) return;
  if (input.files && input.files[0]) {
    box.classList.add('loaded');
    const name = input.files[0].name;
    const span = box.querySelector('span');
    span.textContent = name.length > 25 ? name.slice(0, 22) + '...' : name;
  }
}

window.SignerEngine = SignerEngine;

const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(window.navigator.userAgent);
const isiPad = isMac && (navigator.maxTouchPoints > 1);

if (isMac && !isiPad) {
  for (const el of document.querySelectorAll('.macos-hide')) el.style.display = 'none';
  for (const el of document.querySelectorAll('.macos-show')) el.style.display = 'block';
  for (const el of document.querySelectorAll('.install')) el.classList.add('display-none');
} else {
  if (window.navigator.standalone) {
    const preloaderDialog = app.dialog.preloader("Reloading data");
    preloaderDialog.open();
    setTimeout(() => preloaderDialog.close(), 2000);
    document.documentElement.classList.add('standalone');
  } else {
    app.popup.open("#hs");
  }
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
  return screenshots.map((src, index) => `<img loading="lazy" src="${src}" class="pb-target" data-index="${index}">`).join('');
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
              <div class="item-title">${item.title}</div>
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
          <div class="list simple-list list-strong list-dividers inset">
            <ul>
              <li><span>Category</span><span>${item.category}</span></li>
              <li class="macos-hide"><span>Compatibility</span><span>${item.compatible}</span></li>
              <li><span>Type</span><span>${item.type}</span></li>
            </ul>
          </div> 
           <div class="popover popover-menu">
    <div class="popover-inner">
      <div class="list" style="text-align: left!important;">
        <ul>
         <li><a onclick="navigator.share({ title: '${item.title}', url: '${item.get_link}' })" class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">square_arrow_up </i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Share</div></div></div></a></li>
         <li><a onclick="addToFavorites({ id: '${item.id}', icon: '${item.badge}', image: '${item.icon}', title: '${item.title}', subtitle: '${item.category}' })" class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">heart_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Favorite</div></div></div></a></li>
         <li><a class="item-link item-content popover-close" onclick="openReportPopup('${item.title.replace(/'/g, "\\'")}')"><div class="item-media"><i class="f7-icons">exclamationmark_triangle_fill</i></div><div class="item-inner"><div class="item-title">Report</div></div></a></li> 
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
    renderItem: createItemHtml,
    searchAll: (query, items) => {
      const results = [];
      const q = query.toLowerCase();
      for (let i = 0; i < items.length; i++) {
        if (items[i].title.toLowerCase().includes(q) || query.trim() === "") {
          results.push(i);
        }
      }
      return results;
    },
    height: 90,
  });
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const temp = document.createElement('template');
    temp.innerHTML = createPopupHtml(item);
    frag.appendChild(temp.content.firstChild);
  }
  document.body.appendChild(frag);
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
    const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(window.navigator.userAgent) && (navigator.maxTouchPoints <= 1);
    const jsonFile = isMac ? "json/macos.json" : "json/ios.json";
    if (isMac) document.documentElement.classList.add('device-mac-desktop');
    const [response] = await Promise.all([
      fetch(jsonFile),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);
    if (!response.ok) throw new Error(`Failed to load ${jsonFile}`);
    const apps = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
    const currentAppIds = apps.map(app => app.title);
    const seenAppIds = JSON.parse(localStorage.getItem('seen_apps') || '[]');
    const newApps = currentAppIds.filter(id => !seenAppIds.includes(id));
    const badges = document.querySelectorAll(".tweaksnumber");
    for (const badge of badges) {
      if (newApps.length > 0) {
        badge.textContent = newApps.length;
        badge.classList.remove('display-none');
      } else {
        badge.classList.add('display-none');
      }
    }
    app.off('tabHide');
    app.on('tabHide', (tabEl) => {
      if (tabEl.querySelector('.virtual-list')) {
        localStorage.setItem('seen_apps', JSON.stringify(currentAppIds));
        for (const badge of document.querySelectorAll(".tweaksnumber")) {
          badge.classList.add('display-none');
        }
      }
    });
    if (container) container.innerHTML = '';
    initVirtualList(".virtual-list", apps);
  } catch (error) {
    if (container) container.innerHTML = '<div class="block">Error loading apps.</div>';
  }
}

app.on('ptrRefresh', (el) => {
  if (el.classList.contains('ptr-apps')) {
    fetchAndLoadApps().then(() => app.ptr.done(el));
  }
});

fetchAndLoadApps();

function addToFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let favOrder = JSON.parse(localStorage.getItem("favOrder")) || [];
  if (favorites.some(fav => fav.id === item.id)) {
    app.dialog.alert("This app is already in your favorites.", 'Error');
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
  favList.textContent = '';
  if (favorites.length === 0) {
    if (favEmptyElement) favEmptyElement.style.display = "block";
    return;
  }
  if (favEmptyElement) favEmptyElement.style.display = "none";
  const favMap = new Map(favorites.map(f => [f.id, f]));
  const orderedFavorites = [];
  for (const id of savedOrder) {
    if (favMap.has(id)) {
      orderedFavorites.push(favMap.get(id));
      favMap.delete(id);
    }
  }
  orderedFavorites.push(...favMap.values());
  for (const fav of orderedFavorites) {
    favList.insertAdjacentHTML("beforeend", `
      <li class="swipeout" id="fav-${fav.id}">
        <div class="swipeout-content">
          <a class="item-link popup-open" data-popup="#${fav.id}">
            <div class="item-content">
              <div class="item-media">
                <img loading="lazy" src="${fav.image}">
              </div>
              <div class="item-inner">
                <div class="item-title-row">
                  <div class="item-title">${fav.title}<i style="font-size:17px;" class="f7-icons">${fav.icon}</i></div>
                </div>
                <div class="item-subtitle">${fav.subtitle}</div>
              </div>
            </div>
          </a>
        </div>
        <div class="swipeout-actions-right">
          <a class="swipeout-delete" onclick="removeFromFavorites('${fav.title}')">Unfavorite <i class="f7-icons">heart_slash_fill</i></a>
        </div>
      </li>`);
  }
  if (!favList.favSortableInitialized) {
    favList.addEventListener("sortable:sort", () => {
      const order = [...favList.children].map(li => li.id.replace("fav-", ""));
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
  },
  on: {
    init: function () {
      this.wrapperEl.style.willChange = 'transform';
    }
  }
});

function shareURL() {
  if (navigator.share) {
    navigator.share({
      title: "SoftwareKit",
      text: "Take your iDevice experience to the next level with our awesome app!",
      url: "https://swkit.app/"
    });
  }
}

function shareSource() {
  if (navigator.share) {
    navigator.share({
      title: "SoftwareKit",
      text: "Official AltStore source provided by SoftwareKit",
      url: "https://swkit.app/ios/altstore.json"
    });
  }
}

function copySource() {
  navigator.clipboard.writeText('https://swkit.app/ios/altstore.json')
    .then(() => {
      app.toast.create({ text: 'Source link copied!', position: 'center', closeTimeout: 2000 }).open();
    })
    .catch(() => {
      app.toast.create({ text: 'Failed to copy!', position: 'center', closeTimeout: 2000 }).open();
    });
}

function reset() {
  const defaultColor = '#007AFF';
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
          if (indicator) indicator.style.backgroundColor = defaultColor;
          if (colorPicker) colorPicker.setValue({ hex: defaultColor });
          app.toast.create({ text: 'Accent color restored!', closeTimeout: 2000 }).open();
        }
      },
      {
        text: 'Erase all data',
        onClick: function () {
          app.dialog.confirm(
            'This will delete all your settings and data including added sources, favorites read later. This action cannot be undone.',
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
    (function() {
      var e = document.getElementById('os-version');
      if (e) {
        var t, n = navigator.userAgent;
        if ((t = n.match(/(iPhone|iPad|iPod).*? OS (\d+)_?(\d+)?_?(\d+)?/i))) e.textContent = t[1] + ' ' + t.slice(2)
          .filter(Boolean).join('.');
        else if ((t = n.match(/iPad.*? OS (\d+)_?(\d+)?_?(\d+)?/i))) e.textContent = 'iPadOS ' + t.slice(1).filter(
          Boolean).join('.');
        else if ((t = n.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/i))) e.textContent = 'macOS ' + t.slice(1).filter(
          Boolean).join('.');
        else e.textContent = '';
      }
    })();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (!registration) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  });
}
