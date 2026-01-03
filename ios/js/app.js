const app = new Framework7({
  el: "#app",
  theme: "ios",
  name: "SoftwareKit",
  id: "com.techlxrd.SoftwareKit",
  touch: {touchHighlight: true, 
  tapHold: true, 
  },
  popup: {
    push: true,
    swipeToClose: true,
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
routes: [
    {
      path: '/index/',
      url: 'index.html',
    },
  ],
});
const mainView = app.views.create(".view-main");
function updateAppUI(isEnabled) {
  const selectors = '.glass, .liquid-glass, [data-removed-classes]';
  const glassElements = document.querySelectorAll(selectors);

  glassElements.forEach(el => {
    if (isEnabled) {
      const savedClasses = el.getAttribute('data-removed-classes');
      if (savedClasses) {
        const classArray = savedClasses.split(' ');
        classArray.forEach(cls => el.classList.add(cls));
        el.removeAttribute('data-removed-classes');
      }
    } else {
      let removed = [];
      if (el.classList.contains('glass')) removed.push('glass');
      if (el.classList.contains('liquid-glass')) removed.push('liquid-glass');

      if (removed.length > 0) {
        el.setAttribute('data-removed-classes', removed.join(' '));
        removed.forEach(cls => el.classList.remove(cls));
      }
    }
  });

  const contents = document.querySelectorAll('.bg-img');
  contents.forEach(el => {
    if (isEnabled) {
      el.style.removeProperty('background-image');
    } else {
      el.style.setProperty('background-image', 'none', 'important');
    }
  });
}

function setGlassUI(isChecked) {
  localStorage.setItem('glassUI_Enabled', isChecked);
  updateAppUI(isChecked);
}
document.addEventListener('DOMContentLoaded', () => {
  const savedPref = localStorage.getItem('glassUI_Enabled');
  const isEnabled = savedPref === null ? true : savedPref === 'true';

  updateAppUI(isEnabled);

  const toggleEl = document.getElementById('toggle-glassUI');
  if (toggleEl) {
    toggleEl.checked = isEnabled;
    
    setTimeout(() => {        
        try {
            const f7Toggle = app.toggle.get(toggleEl.closest('.toggle'));
            if (f7Toggle) {
                f7Toggle.on('change', (self) => setGlassUI(self.checked));
            } else {
                toggleEl.addEventListener('change', (e) => setGlassUI(e.target.checked));
            }
        } catch (err) {
            toggleEl.addEventListener('change', (e) => setGlassUI(e.target.checked));
        }
    }, 300);
  }

  const f7Events = ['page:init', 'popup:open', 'sheet:open'];
  f7Events.forEach(eventType => {
    document.addEventListener(eventType, (e) => {
      const currentPref = localStorage.getItem('glassUI_Enabled');
      const currentlyEnabled = currentPref === null ? true : currentPref === 'true';

      if (!currentlyEnabled) {
        const container = e.target;
        container.querySelectorAll('.glass, .liquid-glass').forEach(el => {
          let removed = [];
          if (el.classList.contains('glass')) removed.push('glass');
          if (el.classList.contains('liquid-glass')) removed.push('liquid-glass');
          el.setAttribute('data-removed-classes', removed.join(' '));
          removed.forEach(cls => el.classList.remove(cls));
        });
        container.querySelectorAll('.bg-img ').forEach(el => {
          el.style.setProperty('background-image', 'none', 'important');
        });
      }
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  new Swiper(".guides", {
    slidesPerView: "auto",
    spaceBetween: 10
  });
});
document.addEventListener('click', function (e) {
  const clickedLink = e.target.closest('.sidebar-list .item-link');
  
  if (!clickedLink) return;

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
    img.src = './assets/default.png';
}, true);
const failedImages = new Set();

window.addEventListener('error', function (event) {
    const img = event.target;

    if (!(img instanceof HTMLImageElement)) return;
    if (img.closest('.screenshots')) return;

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
      updateNavbarTitleFromTab(this.getAttribute('href'));
    });
  });
  window.goToTab = function (tabId) {
    app.popup.close();
    app.tab.show(tabId);
    updateNavbarTitleFromTab(tabId);
  };

});

function toggleDarkMode() {
  document.querySelector("html").classList.toggle("dark");
}

function applyDarkModeSetting() {
  const htmlElement = document.querySelector("html");
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const applyDarkMode = e => {
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
    window.location.href = `https://softwarekit-udid.shadvlxrd.workers.dev/get-profile?requestId=${requestId}`;
    startPolling(requestId);
}

function startPolling(id) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`https://softwarekit-udid.shadvlxrd.workers.dev/retrieve?requestId=${id}`);
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
<div class="list media-list list-strong list-dividers inset glass">
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
                          <a class="" id="copyUdidBtn">
                    <i class="f7-icons">doc_on_clipboard_fill</i>
                </a>   
                        </li>
            </ul>
        </div>           

        <div class="list list-strong glass inset">
            <ul>
                <li>
                    <div class="item-content">
                        <div class="item-inner">
                            <div class="item-title">Name</div>
                            <div class="item-after">${modelIdentifier}</div>
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
                                    <div class="item-after">
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
        }, 200);
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

    if (!window.repoView) {
        window.repoView = app.views.create('#repository-view', { name: 'repoView' });
    }

    function sanitizeRepo(json, url) {
        return {
            name: json.name ?? "Untitled Repo",
            identifier: json.identifier ?? url,
            sourceURL: url,
            iconURL: json.iconURL ?? "",
            apps: (json.apps ?? []).map(app => {
                const latest = (app.versions && app.versions.length > 0) ? app.versions[0] : app;
                return {
                    name: app.name ?? "Unknown App",
                    bundleIdentifier: app.bundleIdentifier ?? Math.random().toString(36).substring(7),
                    developerName: app.developerName ?? "Unknown",
                    iconURL: app.iconURL ?? "",
                    subtitle: app.subtitle ?? "",
                    localizedDescription: latest.localizedDescription ?? app.localizedDescription ?? app.description ?? "No description available.",
                    screenshots: app.screenshots ?? app.screenshotURLs ?? [],
                    downloadURL: latest.downloadURL ?? app.downloadURL ?? "#",
                    version: latest.version ?? app.version ?? "1.0",
                    size: latest.size ?? app.size ?? 0
                };
            }),
            news: (json.news ?? []).map(n => ({
                title: n.title ?? "News",
                caption: n.caption ?? "",
                date: n.date ?? new Date().toISOString(),
                imageURL: n.imageURL ?? "",
                url: n.url ?? "#"
            })),
            isSystem: url === LOCAL_REPO_URL
        };
    }

    function getRepos() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            let repos = data ? JSON.parse(data) : [];
            if (!repos.some(r => r.sourceURL === LOCAL_REPO_URL)) {
                repos.unshift({ sourceURL: LOCAL_REPO_URL, name: "SoftwareKit", apps: [], isSystem: true });
            }
            return repos;
        } catch { return []; }
    }

    function saveRepos(repos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
    }

    async function fetchRepo(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error();
            const json = await res.json();
            return sanitizeRepo(json, url);
        } catch {
            return null;
        }
    }

    window.openPhotoBrowser = function(screenshotUrls) {
        if (typeof screenshotUrls === 'string') screenshotUrls = JSON.parse(screenshotUrls);
        const pb = app.photoBrowser.create({
            photos: screenshotUrls.map(url => ({ url })),
            type: 'popup',
            navbar: true,
            toolbar: true,
            swiper: { zoom: true }
        });
        pb.open();
    };

    function createPopupHtml(item) {
        const screenshotsJson = JSON.stringify(item.screenshots).replace(/"/g, "&quot;");
        const screenshotsHtml = item.screenshots.map(src => 
            `<img loading="lazy" src="${src}" onclick="openPhotoBrowser(['${src}'])">`
        ).join('');

        return `
        <div class="popup popup-app-detail" id="popup-${item.bundleIdentifier}">
            <div class="view">
                <div class="page bg-img">
                    <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
                    <div class="page-content">
                         <div style="margin-top: 40px; padding: 0px;">
          <div class="block" style="margin-top: 27px; margin-bottom: 20px;">
            <div style="display: flex; gap: 15px;">
                                    <img src="${item.iconURL}" class="app-icon">
                                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                        <div style="font-size: 22px; font-weight: 700; line-height: 1.2;">${item.name}</div>
                                        <div style="font-size: 15px;margin-top: 4px;"">${item.developerName}</div>
                                        <div style="display: flex; gap: 10px; margin-top: auto; align-items: center;">
                                            <a href="${item.downloadURL}" class="external button button-fill button-round" style="padding: 0 24px; font-weight:bold;">GET</a>
                                            <a onclick="navigator.share({url: '${item.downloadURL}' })" class="more"><i class="f7-icons">square_arrow_up</i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ${item.screenshots.length > 0 ? `
                            <div class="block-title" style="font-size: 20px; margin-top: 25px;">Preview</div>
                            <div class="screenshot" onclick="openPhotoBrowser(${screenshotsJson})">${screenshotsHtml}</div>` : ''}
                            <div class="block block-strong inset margin-top liquid-glass">
                                <div style="font-size: 15px; line-height: 1.5;">${item.localizedDescription.replace(/\n/g, '<br>')}</div>
                            </div>
                            <div class="list simple-list list-strong list-dividers inset glass">
                                <ul>
                                    <li><span>Version</span><span>${item.version}</span></li>
                                    <li><span>Size</span><span>${(item.size / 1024 / 1024).toFixed(1)} MB</span></li>
                                    <li><span>BundleID</span><span>${item.bundleIdentifier}</span></li>
                                </ul>
                            </div>                           
        </div>
      </div>
    </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

function renderSourcesList(repos) {
  const listEl = document.getElementById('sources-list');
  listEl.innerHTML = '';
  const frag = document.createDocumentFragment();

  repos.forEach(repo => {
    const li = document.createElement('li');
    li.id = repo.name;
    li.className = repo.isSystem ? '' : 'swipeout';

    const iconSrc = repo.iconURL || './assets/default.png';

    li.innerHTML = `
      <div class="swipeout-content">
        <a class="item-link repo-link" href="#" data-url="${repo.sourceURL}">
          <div class="item-content">
            <div class="item-media">
              <img src="${iconSrc}">
            </div>
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title">${repo.name}</div>
              </div>
              <div class="item-subtitle">${repo.apps.length} Apps</div>
            </div>
          </div>
        </a>
      </div>

      ${!repo.isSystem ? `
      <div class="swipeout-actions-right">
        <a onclick="navigator.share({ url: '${repo.sourceURL}' })">Share</a>
        <a class="swipeout-delete" data-url="${repo.sourceURL}">
          Remove <i class="f7-icons">trash</i>
        </a>
      </div>
      ` : ''}
    `;

    frag.appendChild(li);
  });

  listEl.appendChild(frag);


    const savedOrder = JSON.parse(localStorage.getItem('sourcesListOrder') || '[]');
    if (savedOrder.length) {
        savedOrder.forEach(id => {
            const item = document.getElementById(id);
            if (item && item.parentNode === listEl) {
                listEl.appendChild(item);
            }
        });
    }

    if (!listEl.sortableInitialized) {
        listEl.addEventListener('sortable:sort', () => {
            const order = Array.from(listEl.children).map(li => li.id);
            localStorage.setItem('sourcesListOrder', JSON.stringify(order));
        });
        listEl.sortableInitialized = true; 
    }
}
function renderNews(repos) {
    let allNews = [];
    repos.forEach(r => { 
        if(r.news) allNews.push(...r.news.map(n => ({...n, source: r.name}))); 
    });
    
    const wrapper = document.getElementById('news-swiper-wrapper');
    const section = document.getElementById('news-section');
    
    if (allNews.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = 'block';
    wrapper.innerHTML = '';
    allNews.sort((a,b) => new Date(b.date) - new Date(a.date));

    const savedPref = localStorage.getItem('glassUI_Enabled');
    const isGlassEnabled = savedPref === null ? true : savedPref === 'true';

    allNews.forEach(news => {
                const slideHtml = `
            <div class="swiper-slide swiper-slide-news">
                <div class="card repo-news-card liquid-glass">
                    <div class="card-content card-content-padding">
                        <div class="size-12">${news.source}</div>
                        <div class="text-weight-bold">${news.title}</div>
                        <div class="size-12">${news.caption.substring(0, 80)}...</div>
                    </div>
                    <div class="card-footer">
                        <a href="${news.url}" class="link external">Open link</a>
                    </div>
                </div>
            </div>`;
        
        wrapper.insertAdjacentHTML('beforeend', slideHtml);
    });
    if (!isGlassEnabled) {
        const newCards = wrapper.querySelectorAll('.liquid-glass, .glass');
        newCards.forEach(el => {
            let removed = [];
            if (el.classList.contains('glass')) removed.push('glass');
            if (el.classList.contains('liquid-glass')) removed.push('liquid-glass');
            
            el.setAttribute('data-removed-classes', removed.join(' '));
            removed.forEach(cls => el.classList.remove(cls));
        });
    }

    const swiperContainer = document.getElementById('news-swiper-container');
    if (swiperContainer && !swiperContainer.swiper) {
        app.swiper.create('#news-swiper-container', { slidesPerView: 1 });
    } else if (swiperContainer && swiperContainer.swiper) {
        swiperContainer.swiper.update();
    }
}    function openRepoPage(repo) {
        const pageId = `repo-${Date.now()}`;
        const pageHtml = `
           <div class="page page-with-subnavbar bg-img" data-name="repo-detail">
                <div class="navbar">
                    <div class="navbar-bg"></div>
                    <div class="navbar-inner">
                        <div class="subnavbar"><div class="searchbar-backdrop"></div>
                    <form class="searchbar">
                        <div class="searchbar-inner">
                            <div class="searchbar-input-wrap">
                                <input type="search" placeholder="Search" />
                                <i class="searchbar-icon"></i>
                                <span class="input-clear-button"></span>
                            </div> 
                             <span class="searchbar-disable-button">
            <i class="icon icon-close"></i>
          </span>                                     
                        </div>
                    </form></div>
                        <div class="left"><a class="link back"><i class="icon icon-back"></i></a></div>
                        <div class="title">${repo.name}</div>
                        <div class="right"> <a onclick="navigator.share({url: '${repo.sourceURL}' })" class="link icon-only"><i class="icon f7-icons">square_arrow_up</i></a></div>
                    </div>
                </div>
                <div class="page-content repo-page">                         
                    <div class="list media-list separated inset virtual-list virtual-list-${pageId} searchbar-found glass"></div>
                     <div class="list list-strong simple-list searchbar-not-found inset glass">
                <ul><li>Unfortunately, no items were found.</li></ul>
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
                            items: repo.apps,
                            searchAll: function (query, items) {
                                const q = query.toLowerCase();
                                return items.reduce((acc, item, index) => {
                                    if (item.name.toLowerCase().includes(q) || !q) acc.push(index);
                                    return acc;
                                }, []);
                            },
                            height: 90,
                            renderItem: function (item) {
                                return `
                                <li>
                                    <a class="item-link item-content app-item-trigger" data-id="${item.bundleIdentifier}">
                                        <div class="item-media"><img src="${item.iconURL}"  loading="lazy"></div>
                                        <div class="item-inner">
                                            <div class="item-title-row"><div class="item-title">${item.name}</div></div>
                                            <div class="item-subtitle">${item.developerName}</div>
                                        </div>
                                    </a>
                                </li>`;
                            }
                        });

                        app.searchbar.create({
                            el: page.el.querySelector('.searchbar'),
                            searchContainer: `.virtual-list-${pageId}`,
                            searchIn: '.item-title',
                            on: { search(sb, query) { vl.search(query); } }
                        });

                        page.$el.on('click', '.app-item-trigger', function () {
                            const appItem = repo.apps.find(a => a.bundleIdentifier === this.dataset.id);
                            if (appItem) {
                                app.popup.create({
                                    content: createPopupHtml(appItem),
                                    swipeToClose: true,
                                    on: { closed: function (p) { p.destroy(); } }
                                }).open();
                            }
                        });
                    }
                }
            }
        });
    }

    async function refreshData(force = false) {
        let repos = getRepos();
        if (force) app.dialog.preloader('Refreshing Sources');

        try {
            if (force || repos.some(r => !r.apps || r.apps.length === 0)) {
                const waitPromise = force ? new Promise(resolve => setTimeout(resolve, 2000)) : Promise.resolve();
                const fetchPromise = Promise.all(repos.map(r => fetchRepo(r.sourceURL)));
                
                const [_, updates] = await Promise.all([waitPromise, fetchPromise]);
                repos = updates.map((newRepo, i) => newRepo || repos[i]);
                saveRepos(repos);
            }
        } finally {
            if (force) app.dialog.close();
        }

        renderSourcesList(repos);
        renderNews(repos);
    }
app.on('pageInit', () => {
    refreshData(false);
});
    document.getElementById('add-source-fab').addEventListener('click', () => {
        app.dialog.prompt('Add a new source by entering the link below. SoftwareKit is designed to work exclusively with <strong>AltStore</strong> format sources.','Add source', async (url) => {
            if (!url) return;                  
            const repos = getRepos();
            const existingRepo = repos.find(r => r.sourceURL === url);
            
            if (existingRepo) {
                app.dialog.alert('This source has already been added.', 'Error');
                return;
            }           

            app.dialog.preloader('Fetching source data');
            const repo = await fetchRepo(url);
            app.dialog.close();

            if (repo) {             
                repos.push(repo);
                saveRepos(repos);
                renderSourcesList(repos);
                app.toast.create({text: 'Repository Added', closeTimeout: 1100}).open();
            } else {
                app.dialog.alert('Invalid URL or JSON');
            }
        });
    });

    document.getElementById('sources-list').addEventListener('click', (e) => {
        const delBtn = e.target.closest('.swipeout-delete');
        if (delBtn) {
            const url = delBtn.dataset.url;
            saveRepos(getRepos().filter(r => r.sourceURL !== url));
            app.swipeout.delete(delBtn.closest('li'));
            return;
        }

        const link = e.target.closest('.repo-link');
        if (link) {
            const repo = getRepos().find(r => r.sourceURL === link.dataset.url);
            if (repo) openRepoPage(repo);
        }
    });

    document.querySelector('.ptr-repos').addEventListener('ptr:refresh', async (e) => {
        await refreshData(true);
        app.ptr.done(e.target);
    });

    refreshData(false);
});
fetch("https://www.idownloadblog.com/feed/")
  .then(response => response.text())
  .then(data => {
    const items = new window.DOMParser().parseFromString(data, "text/xml").getElementsByTagName("item");
    const newsContainer = document.getElementById("news");
    const savedPref = localStorage.getItem('glassUI_Enabled');
    const isGlassEnabled = savedPref === null ? true : savedPref === 'true';

    for (let i = 0; i < items.length; i++) {
      const title = items[i].getElementsByTagName("title")[0].textContent;
      const link = items[i].getElementsByTagName("link")[0].textContent;
      const content = items[i].getElementsByTagName("content:encoded")[0].textContent;
      const imgElement = new window.DOMParser().parseFromString(content, "text/html").querySelector("img");
      const imgSrc = imgElement ? imgElement.getAttribute("src") : "#";
      
      const card = document.createElement("div");
           
      card.classList.add("card", "card-raised", "news-card");
      
      if (isGlassEnabled) {
        card.classList.add("liquid-glass");
      } else {        card.setAttribute('data-removed-classes', 'liquid-glass');
        
      }

      card.innerHTML = `
        <div class="card-content">
          <div class="card-image">
            <img class="newsimg" src="${imgSrc}" loading="lazy">
          </div>
          <div class="card-header">${title}</div>
          <div class="card-footer">
            <a onclick="navigator.share({ title: '${title.replace(/'/g, "\\'")}', url: '${link}' })">
              <i class="f7-icons">square_arrow_up</i>
            </a>
            <a href="${link}" class="external">
              <i class="f7-icons">book_fill</i>
            </a>
          </div>
        </div>`;
        
      newsContainer.appendChild(card);
    }
  }); 
function checkConnection() {
  let dialogShown = false;
  let dialogInstance = null;
  setInterval(() => {
    if (navigator.onLine) {
      if (dialogShown && dialogInstance) {
        dialogInstance.close();
        dialogInstance = null;
        dialogShown = false;
      }
    } else if (!dialogShown) {
      dialogShown = true;
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
        buttons: [{
          text: 'Dismiss',
          close: true,        
        }],
        closeByBackdropClick: false,
        closeByOutsideClick: false,
        destroyOnClose: true,
      });
      dialogInstance.open();
    }
  }, 1000);
}

function updateIcon(url) {
  document.querySelectorAll("#favicon").forEach(favicon => favicon.href = url);
  document.querySelectorAll("#faviconimg").forEach(faviconImg => faviconImg.src = url);
  localStorage.setItem("customicon", url);
}

function customicon(e, t) {
  app.preloader.show();
  updateIcon(t);
  setTimeout(() => {
    app.preloader.hide();
    window.location.reload();
  }, 2000);
}

function loadIcon() {
  const customIcon = localStorage.getItem("customicon");
  if (customIcon) updateIcon(customIcon);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ptr-tab").forEach(element => {
    element.addEventListener("ptr:refresh", () => window.location.reload());
  });
  checkConnection();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (!registration) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  });
}

var SignerEngine = {
  workerBase: 'https://cococloud-api.shadvlxrd.workers.dev',
  files: { ipa: null, p12: null, prov: null },
  processing: false,

  log: function(msg, color = '#ccc', escapeHtml = true) {
    const el = document.getElementById('signer-logs');
    const s = escapeHtml ? this._escapeHtml(String(msg)) : String(msg);
    if (el) el.innerHTML += `<div style="color:${color}; margin-bottom:4px;">> ${s}</div>`;
    console.log('[SignerEngine]', msg);
    if (el) { el.scrollTop = el.scrollHeight; }
  },

  _escapeHtml: function (unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  setProcessing: function(state) {
    this.processing = state;
    const btns = document.querySelectorAll('.signer-popup .button');
    btns.forEach(b => b.disabled = state);
    if (!state) {
      try { app.dialog.close(); } catch(e) {}
    }
  },

  onFile: function(input, type) {
    if (!input.files || !input.files[0]) return;
    this.files[type] = input.files[0];
    this.log(`${type.toUpperCase()} loaded: ${this.files[type].name}`, 'var(--f7-theme-color)');
  },

  _parseResponse: async function(response) {
    const ct = (response.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      try { return { type:'json', data: await response.json(), status: response.status }; }
      catch(e) { /* fallthrough */ }
    }
    if (ct.includes('application/octet-stream') || ct.includes('application/zip') || ct.includes('application/vnd.apple.pkpass') || ct.includes('application/x-')) {
      const blob = await response.blob();
      return { type:'binary', blob: blob, headers: response.headers, status: response.status };
    }
    const text = await response.text();
    const stripped = text.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<\/?[^>]+(>|$)/g,'');
    const snippet = stripped.slice(0, 1200);
    return { type:'text', text: text, snippet: snippet, status: response.status, headers: response.headers };
  },

  checkCert: async function() {
    if (!this.files.p12 && !this.files.prov) return app.dialog.alert('Upload P12 or Provision first');
    const fd = new FormData();
    if (this.files.p12) fd.append('file', this.files.p12);
    if (this.files.prov) fd.append('file', this.files.prov);

    this.setProcessing(true);
    app.dialog.preloader('Checking certificate status...');

    try {
      const res = await fetch(`${this.workerBase}/certchecker`, { method: 'POST', body: fd });
      const parsed = await this._parseResponse(res);
      this.setProcessing(false);
      app.dialog.close();

      if (parsed.type === 'json') {
        const j = parsed.data;
        if (j.success || j.status === 'success') {
          this.log('The Certificate is valid', '#4cd964');
          this.log(JSON.stringify(j.data || j, null, 2), '#0f0');
          app.dialog.alert(j.message || 'Valid certificate');
        } else {
          this.log('Cert check failed: ' + (j.message || JSON.stringify(j)), '#ff3b30');
          app.dialog.alert('Cert check failed: ' + (j.message || 'See logs'));
        }
      } else {
        this.log('Cert checker returned non-JSON. Snippet:', '#ff3b30');
        this.log(parsed.snippet || '(no body)', '#ff3b30');
        app.dialog.alert('Cert checker returned non-JSON. Check logs for snippet.');
      }
    } catch (e) {
      this.setProcessing(false);
      app.dialog.close();
      this.log('Network error: ' + (e.message || e), '#ff3b30');
      app.dialog.alert('Network/CORS/Worker error: ' + (e.message || e));
    }
  },

  
  sign: async function() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'custom';
    if (!this.files.ipa) return app.dialog.alert('Select an IPA first');

    const fd = new FormData();
    fd.append('ipa', this.files.ipa);

    if (mode === 'custom') {
      if (!this.files.p12 || !this.files.prov) return app.dialog.alert('Custom mode needs P12 + Provision');
      fd.append('cert', this.files.p12);
      fd.append('provision', this.files.prov);
      const pass = document.getElementById('p12-pass')?.value;
      if (pass) fd.append('password', pass);
    }

    
    this.setProcessing(true);
    app.dialog.preloader('Signing...');

    try {
      const endpoint = (mode === 'custom') ? 'customsign' : 'free-enterprise-sign';
      const res = await fetch(`${this.workerBase}/${endpoint}`, { method: 'POST', body: fd });
      const parsed = await this._parseResponse(res);
      this.setProcessing(false);
      app.dialog.close();

      if (parsed.type === 'json') {
        const j = parsed.data;
        if (j.success || j.status === 'success') {
          this.log('Signed', '#4cd964');
          const link = j.itmsServicesUrl || j.manifestUrl || j.downloadUrl || j.download_url || j.manifest_url || j.itms_services_url;
          if (link) {
            this.log('Install link: ' + link, 'var(--f7-theme-color)');
          
            window.location.href = link;
          } else {
            this.log('Signed but no install URL returned. See full response:', '#ffa500');
            this.log(JSON.stringify(j, null, 2), '#ffa500');
            app.dialog.alert('Signed but no install link returned. Check logs.');
          }
        } else {
          this.log('Signing failed: ' + (j.message || JSON.stringify(j)), '#ff3b30');
          app.dialog.alert('Signing failed: ' + (j.message || 'See logs'));
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
        app.dialog.alert('Downloaded signed IPA.');
      } else {
        this.log('Signing returned non-JSON. Snippet:', '#ff3b30');
        this.log(parsed.snippet || '(no body)', '#ff3b30');
        app.dialog.alert('Signing returned non-JSON. See logs for snippet.');
      }
    } catch (e) {
      this.setProcessing(false);
      app.dialog.close();
      this.log('Network error: ' + (e.message || e), '#ff3b30');
      app.dialog.alert('Network/Worker error: ' + (e.message || e));
    }
  }
};
function openSignerPopup() {
  app.popup.create({
    content: `
<div class="popup signer-popup">
 <div class="page">
    <div class="navbar"><div class="navbar-bg"></div><div class="navbar-inner">
      <div class="title">Signer</div>
      <div class="right"><a class="link popup-close"><i class="icon-close"></i></a></div>
    </div></div>

    <div class="page-content bg-img">
      <div class="block-title glass">Mode</div>
      <div class="list separated inset glass">
        <ul>
          <li>
            <label class="item-radio item-content">
              <input type="radio" name="mode" value="custom" checked onchange="toggleSignerMode()">
              <i class="icon icon-radio"></i>
              <div class="item-inner"><div class="item-title">Custom certificate</div></div>
            </label>
          </li>
          <li>
            <label class="item-radio item-content">
              <input type="radio" name="mode" value="free" onchange="toggleSignerMode()">
              <i class="icon icon-radio"></i>
              <div class="item-inner"><div class="item-title">Free Enterprise (platform cert)</div></div>
            </label>
          </li>
        </ul>
      </div>

      <div class="block-title glass">Upload files</div>
      <div class="list list-strong list-dividers inset glass">
        <ul>
          <li class="item-content item-input">
            <div class="item-inner">
              <div class="item-title item-label">iPA</div>
              <input type="file" accept=".ipa" onchange="SignerEngine.onFile(this,'ipa')">
            </div>
          </li>

          <li class="item-content item-input custom-only">
            <div class="item-inner">
              <div class="item-title item-label">MobileProvision</div>
              <input type="file" accept=".mobileprovision" onchange="SignerEngine.onFile(this,'prov')">
            </div>
          </li>

          <li class="item-content item-input custom-only">
            <div class="item-inner">
              <div class="item-title item-label">P12 Certificate</div>
              <input type="file" accept=".p12" onchange="SignerEngine.onFile(this,'p12')">
            </div>
          </li>

          <li class="item-content item-input custom-only">
            <div class="item-inner">
              <div class="item-title item-label">P12 Password</div>
              <input type="password" id="p12-pass" placeholder="******">
            </div>
          </li>
        </ul>
      </div>

      <div class="block">      
       <button class="button button-fill button-large button-round" onclick="SignerEngine.sign()">Sign & Install</button>
       <br>
        <button class="button button-outline button-large button-fill button-round color-green" onclick="SignerEngine.checkCert()">Check certificate status</button>
      </div>
<div class="list separated inset accordion-list glass">
      <ul>
        <li class="accordion-item">
            
          <a class="item-link item-content">
               <div class="item-media"><i class="f7-icons">ellipsis_circle_fill</i></div>
            <div class="item-inner">
              <div class="item-title">Logs</div>
            </div>
          </a>
          <div class="accordion-item-content">
            <div class="block" id="signer-logs" style="font-family:monospace;">
           <span >
          Ready to Sign. 
        </span>   
            </div>
          </div>
        </li>     
       </ul>
      </div>
    </div>
  </div>
 </div>
</div>`
  }).open();

  toggleSignerMode();
}

function toggleSignerMode() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'custom';
  document.querySelectorAll('.custom-only').forEach(el => el.style.display = (mode === 'custom') ? '' : 'none');
}

if (window.navigator.standalone) {
  const preloaderDialog = app.dialog.preloader("Reloading data");
  preloaderDialog.open();
  setTimeout(() => preloaderDialog.close(), 2000);
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
  return screenshots.map(src => `<img loading="lazy" src="${src}">`).join('');
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
        <div class="page-content bg-img">
          <div style="margin-top: 40px; padding: 0px;">
          
          <div class="block" style="margin-top: 27px; margin-bottom: 20px;">
            <div style="display: flex; gap: 15px;">
              <img src="${item.icon}" class="app-icon">
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: 22px; font-weight: 700; line-height: 1.2;">${item.title}</div>
                <div style="font-size: 15px; margin-top: 4px;">${item.category}</div>
                
                <div style="display: flex; gap: 10px; margin-top: auto; align-items: center;">
                  <a href="${item.get_link}" class="external button button-fill button-round" style="padding: 0 24px;">GET</a>
                  <a class="popover-open more" data-popover=".popover-menu">
                    <i class="f7-icons">ellipsis_circle_fill</i>
                  </a>
                  
                </div>
              </div>
            </div>
                      </div>
                      
             
          <div class="block-title">Preview</div>
         <center>
                <div class="screenshot" onclick="openPhotoBrowser(${JSON.stringify(item.screenshots).replace(/"/g, "&quot;")})">
                  ${generateScreenshotElements(item.screenshots)}          
              </center>
            </div>
          

          <div class="block block-strong inset liquid-glass">
             <div style="font-size: 15px; line-height: 1.5;">
              ${item.description}
             </div>
          </div>

          <div class="list simple-list list-strong list-dividers inset glass">
            <ul>
              <li>
                <span>Category</span>
                <span>${item.category}</span>
              </li>
              <li>
                <span>Compatibility</span>
                <span>${item.compatible}</span>
              </li>
              <li>
                <span>Type</span>
                <span>${item.type}</span>
              </li>
            </ul>
          </div> 
           <div class="popover popover-menu">
    <div class="popover-inner">
      <div class="list" style="text-align: left!important;">
        <ul>
         
         <li><a onclick="navigator.share({ title: '${item.title}', url: '${item.get_link}' })" class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">square_arrow_up </i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Share</div></div></div></a></li><li><a onclick="addToFavorites({
                  id: '${item.id}',
                  icon: '${item.badge}',
                  image: '${item.icon}',
                  title: '${item.title}',
                  subtitle: '${item.category}',               
                })"  class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">heart_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Favorite</div></div></div></a></li><li><a
  class="item-link item-content popover-close"
  onclick="openReportPopup('${item.title.replace(/'/g, "\\'")}')"
>
  <div class="item-media"><i class="f7-icons">exclamationmark_bubble_fill</i></div>
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
  try {
    const response = await fetch("apps.json");
    const apps = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
    const appsCountElement = document.getElementById("tweaksnumber");
    if (appsCountElement) appsCountElement.textContent = apps.length;
    initVirtualList(".virtual-list", apps);
  } catch (error) {
    console.error("Could not load apps:", error);
  }
}

function addToFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];


  if (favorites.some(fav => fav.id === item.id)) {
    app.dialog.alert("This app is already in your favorites.", 'Error');
    return;
  }

  favorites.push(item);
  localStorage.setItem("favorites", JSON.stringify(favorites));

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

  favList.innerHTML = "";

  if (favorites.length === 0) {
    if (favEmptyElement) favEmptyElement.style.display = "block";
    return;
  }

  if (favEmptyElement) favEmptyElement.style.display = "none";

  favorites.forEach(fav => {
    favList.insertAdjacentHTML(
      "beforeend",
      `
      <li class="swipeout">
        <div class="swipeout-content">
          <a class="item-link popup-open" data-popup="#${fav.id}">
            <div class="item-content">
              <div class="item-media">
                <img decoding="async" loading="lazy" src="${fav.image}">
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
}

function removeFromFavorites(title) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(fav => fav.title !== title);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayFavorites();
  if (favorites.length === 0) {
    const favEmptyElement = document.getElementById("favempty");
    if (favEmptyElement) favEmptyElement.style.display = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  fetchAndLoadApps();
  displayFavorites();
});
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
 
var swiperFeatured = new Swiper(".featured", {
  slidesPerView: "auto",
  spaceBetween: 10,
  pagination: { el: ".swiper-pagination" },
  autoplay: {
    delay: 4000,
    disableOnInteraction: true
  }
});
                        
function shareURL() {
  if (navigator.share) {
    navigator.share({
      title: "SoftwareKit",
      text: "Take your iDevice experience to the next level with our awesome app!",
      url: "https://softwarekit.pages.dev/"
    });
  }
}

function shareSource() {
  if (navigator.share) {
    navigator.share({
      title: "SoftwareKit",
      text: "Official AltStore source provided by SoftwareKit",
      url: "https://softwarekit.pages.dev/ios/altstore.json"
    });
  }
}

function copySource() {
  navigator.clipboard.writeText('https://softwarekit.pages.dev/ios/altstore.json')
    .then(() => {
      app.toast.create({
        text: 'Source link copied!',
        position: 'center',
        closeTimeout: 2000,
      }).open();
    })
    .catch(err => {
      app.toast.create({
        text: 'Failed to copy!',
        position: 'center',
        closeTimeout: 2000,
      }).open();
      console.error('Copy failed:', err);
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
            'This will delete all your settings and data including added sources and favorites. This action cannot be undone.',
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
