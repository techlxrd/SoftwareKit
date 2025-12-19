const app = new Framework7({
  el: "#app",
  theme: "ios",
  name: "AppRealm",
  id: "com.techlxrd.AppRealm",
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
  sheet: {
    push: true,
    swipeToClose: true,
  },
  dialog: {
    backdrop: true,
    closeByBackdropClick: false,
  },
  serviceWorker: {
    path: "./service-worker.js",
  },
  routes: [
  
   {
  path: "/trustcert/",
  content: `
    <div class="page" data-name="other">
      <div class="navbar">
        <div class="navbar-bg"></div>
        <div class="navbar-inner">
          <div class="left">
            <a  class="link back">
              <i class="icon icon-back"></i>
            </a>
          </div>
          <div class="title">Untrusted Enterprise Developer</div>
        </div>
      </div>
      <div class="page-content">
        <div class="block inset">
          <center>
            <img loading="lazy" src="https://i.imgur.com/YQxY1aO.png" style="max-width:340px;width:97%;border-radius:20px;margin-bottom:18px;">
          </center>
          <strong>How to Trust an Enterprise Certificate</strong>
          <ol style="margin-top:14px;padding-left:20px;">
            <li>Open <b>Settings</b> on your device.</li>
            <li>Go to <b>General</b> &rarr; <b>VPN & Device Management</b>.</li>
            <li>Find the relevant <b>Enterprise App</b> profile under "Enterprise App" or "Device Management".</li>
            <li>Tap the profile, then tap <b>Trust</b> and confirm your choice.</li>
            <li>After trusting, you can open the app as normal.</li>
          </ol>
          <p style="margin-top:10px;color:#888;">Trusting the certificate ensures the app is authenticated and can run on your device securely.</p>
        </div>
        <div class="list separated inset">
          <ul>
            <li>
              <a href="com.apple.Preferences://" class="item-link item-content external">
                <div class="item-media"><i class="f7-icons">gear</i></div>
                <div class="item-inner"><div class="item-title-row"><div class="item-title">Open Settings</div></div></div>
              </a>
            </li>
          </ul>
        </div>
        <br><br>
      </div>
    </div>
  `,
  options: { transition: "f7-cover" },
},
{
  path: "/verifyintegrity/",
  content: `
    <div class="page">
      <div class="navbar">
        <div class="navbar-bg"></div>
        <div class="navbar-inner">
          <div class="left">
            <a " class="link back"><i class="icon icon-back"></i></a>
          </div>
          <div class="title">Unable to install application</div>
        </div>
      </div>
      <div class="page-content">
        <div class="block inset">
          <center>
            <img loading="lazy" src="https://i.imgur.com/tETxFue.png" style="max-width:340px;width:97%;border-radius:20px;margin-bottom:18px;">
          </center>
          <strong>How to Fix "Unable to Verify App" or "Integrity Could Not Be Verified"</strong>
          <ol style="margin-top:14px;padding-left:20px;">
            <li>This error often means the certificate has been revoked or blacklisted.</li>
            <li>First, try deleting the app completely and reinstalling it.</li>
            <li>If the issue persists, <b>backup your data</b> and <b>reset your device to factory settings</b>:</li>
            <ul>
              <li>Go to <b>Settings &rarr; General &rarr; Transfer or Reset iPhone &rarr; Erase All Content and Settings</b>.</li>
            </ul>
            <li>After reset, restore your backup and try installing again.</li>
          </ol>
          <p style="margin-top:10px;color:#888;">Note: Always ensure your data is backed up before performing a factory reset.</p>
        </div>
        <div class="list separated inset">
          <ul>
            <li>
              <a href="com.apple.Preferences://" class="item-link item-content external">
                <div class="item-media"><i class="f7-icons">gear</i></div>
                <div class="item-inner"><div class="item-title-row"><div class="item-title">Open Settings</div></div></div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  options: { transition: "f7-cover" },
},
{
  path: "/truststore/",
  content: `
    <div class="page" data-name="other">
      <div class="navbar">
        <div class="navbar-bg"></div>
        <div class="navbar-inner">
          <div class="left"><a class="link back"><i class="icon icon-back"></i></a></div>
          <div class="title">Allow Marketplace from (eg. AltStore)</div>
        </div>
      </div>
      <div class="page-content">
        <div class="block">
          <center>
            <img loading="lazy" src="https://i.imgur.com/UQTwAyS.jpeg" style="max-width:340px;width:97%;border-radius:20px;margin-bottom:18px;">
          </center>
          <strong>How to Allow a 3rd Party App Store</strong>
          <ol style="margin-top:14px;padding-left:20px;">
            <li>When prompted, tap <b>OK</b> to allow installation.<br>
              <img loading="lazy" src="https://i.imgur.com/6B57i5A.jpeg" style="max-width:340px;width:97%;border-radius:20px;margin:10px 0;">
            </li>
            <li>Open <b>Settings</b>, go to <b>General &rarr; Device Management</b>, and trust the store profile.<br>
              <img loading="lazy" src="https://i.imgur.com/QAFnPr1.jpeg" style="max-width:340px;width:97%;border-radius:20px;margin:10px 0;">
            </li>
            <li>Return to the website and tap <b>Install App Marketplace</b>.<br>
              <img loading="lazy" src="https://i.imgur.com/WclZ4so.jpeg" style="max-width:340px;width:97%;border-radius:20px;margin:10px 0;">
            </li>
          </ol>
          <p style="margin-top:10px;color:#888;">You can now use the 3rd party marketplace on your device.</p>
        </div>
        <div class="list separated inset">
          <ul>
            <li>
              <a href="com.apple.Preferences://" class="item-link item-content external">
                <div class="item-media"><i class="f7-icons">gear</i></div>
                <div class="item-inner"><div class="item-title-row"><div class="item-title">Open Settings</div></div></div>
              </a>
            </li>
          </ul>
        </div>
        <br><br>
      </div>
    </div>
    <div class="popup" id="devmode">
      <div class="page">
        <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
        <div class="page-content">
          <div class="block-title block-title">Developer Mode required</div>
          <div class="block inset">
            <center>
              <img loading="lazy" src="https://i.imgur.com/qLbsliJ.png" style="max-width:340px;width:97%;border-radius:20px;margin-bottom:18px;">
            </center>
            <strong>How to Enable Developer Mode</strong>
            <ol style="margin-top:14px;padding-left:20px;">
              <li>Open <b>Settings</b> on your device.</li>
              <li>Go to <b>Privacy & Security</b>.</li>
              <li>Scroll down and enable <b>Developer Mode</b>.</li>
            </ol>
          </div>
          <div class="list separated inset">
            <ul>
              <li>
                <a href="com.apple.Preferences://" class="item-link item-content external">
                  <div class="item-media"><i class="f7-icons">gear</i></div>
                  <div class="item-inner"><div class="item-title-row"><div class="item-title">Open Settings</div></div></div>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  options: { transition: "f7-cover" },
},
{
  path: "/devmode/",
  content: `
    <div class="page">
      <div class="navbar">
        <div class="navbar-bg"></div>
        <div class="navbar-inner">
          <div class="left"><a class="link back"><i class="icon icon-back"></i></a></div>
          <div class="title">Developer Mode required</div>
        </div>
      </div>
      <div class="page-content">
        <div class="block inset">
          <center>
            <img loading="lazy" src="https://i.imgur.com/qLbsliJ.png" style="max-width:340px;width:97%;border-radius:20px;margin-bottom:18px;">
          </center>
          <strong>How to Enable Developer Mode</strong>
          <ol style="margin-top:14px;padding-left:20px;">
            <li>Open <b>Settings</b> on your device.</li>
            <li>Go to <b>Privacy & Security</b>.</li>
            <li>Scroll down and toggle <b>Developer Mode</b> ON.</li>
            <li>Follow any on-screen prompts to confirm.</li>
          </ol>
        </div>
        <div class="list separated inset">
          <ul>
            <li>
              <a href="com.apple.Preferences://" class="item-link item-content external">
                <div class="item-media"><i class="f7-icons">gear</i></div>
                <div class="item-inner"><div class="item-title-row"><div class="item-title">Open Settings</div></div></div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  options: { transition: "f7-cover" },
},
  ],
});
const mainView = app.views.create(".view-main");
window.addEventListener('error', function (event) {
    const img = event.target;

  
    if (img.tagName !== 'IMG' || img.closest('.screenshots')) return;

   
    if (img.src.includes('fallback=true')) return;

   
    img.onerror = null;
    img.removeAttribute('onerror');

    
    img.src = './assets/default.png?fallback=true';
}, true);

document.addEventListener('DOMContentLoaded', () => {

  function updateNavbarTitleFromTab(tabId) {
    if (!tabId) return;

    const tabLink = document.querySelector(
      `.tab-link[href="${tabId}"]`
    );
    if (!tabLink) return;

    const tabTitle = tabLink.getAttribute('data-tab-title');
    if (!tabTitle) return;

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const navbarTitle = navbar.querySelector('.title');
    const navbarLargeTitle = navbar.querySelector('.title-large-text');

    if (navbarTitle) navbarTitle.textContent = tabTitle;
    if (navbarLargeTitle) navbarLargeTitle.textContent = tabTitle;
  }

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
const CACHE_KEY = 'bingWallpapers';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const WALLPAPER_COUNT = 8; 

function fadeInBg(el) {
  el.style.opacity = 0;
  el.style.transition = 'opacity 1s';
  void el.offsetWidth;
  el.style.opacity = 1;
}

async function setRandomBingWallpaperBgImg() {
  let cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  const now = Date.now();

  if (!cached.images || !cached.timestamp || (now - cached.timestamp) > CACHE_TTL) {
    try {
      const res = await fetch('https://corsproxy.io/?https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US');
      const data = await res.json();
      const images = data.images.map(img => "https://www.bing.com" + img.url);
      cached = { images, timestamp: now };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (e) {
      console.error("Failed to fetch Bing wallpapers!", e);
    
      if (!cached.images) cached.images = [];
    }
  }
  const urls = cached.images || [];
  const randomUrl = urls.length ? urls[Math.floor(Math.random() * urls.length)] : null;

  document.querySelectorAll('.bg-img').forEach(el => {
    if (randomUrl) {
  el.style.backgroundImage = `url('${randomUrl}')`;
  fadeInBg(el);
} else {
  el.style.backgroundImage = "url('./assets/background.png')";
  fadeInBg(el);
}
  });
}

setRandomBingWallpaperBgImg();
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
                repos.unshift({ sourceURL: LOCAL_REPO_URL, name: "AppRealm", apps: [], isSystem: true });
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
            type: 'standalone',
            navbar: true,
            toolbar: false,
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
                <div class="page">
                    <div class="swipe-nav"><div><i class="f7-icons">minus</i></div></div>
                    <div class="page-content">
                         <div style="margin-top: 40px; padding: 0px;">
          <div class="block" style="margin-top: 27px; margin-bottom: 20px;">
            <div style="display: flex; gap: 15px;">
                                    <img src="${item.iconURL}" style="width: 110px; height: 110px; border-radius: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); object-fit:cover;">
                                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                        <div style="font-size: 22px; font-weight: 700; line-height: 1.2;">${item.name}</div>
                                        <div style="font-size: 15px; color: #8e8e93; margin-top: 4px;"">${item.developerName}</div>
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
                            <div class="block block-strong inset margin-top">
                                <div style="font-size: 15px; line-height: 1.5;">${item.localizedDescription.replace(/\n/g, '<br>')}</div>
                            </div>
                            <div class="list simple-list inset list-separated">
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
              <img src="${iconSrc}" width="45" height="45">
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
        repos.forEach(r => { if(r.news) allNews.push(...r.news.map(n => ({...n, source: r.name}))); });
        
        const wrapper = document.getElementById('news-swiper-wrapper');
        const section = document.getElementById('news-section');
        
        if (allNews.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        wrapper.innerHTML = '';
        allNews.sort((a,b) => new Date(b.date) - new Date(a.date));

        allNews.forEach(news => {
            wrapper.insertAdjacentHTML('beforeend', `
              <div class="swiper-slide swiper-slide-news">
  <div class="card card-outline repo-news-card">
    <div class="card-content card-content-padding">
      <div class="size-12">${news.source}</div>
      <div class="text-weight-bold ">
        ${news.title}
      </div>
      <div class="size-12">
        ${news.caption.substring(0, 80)}...
      </div>
    </div>

    <div class="card-footer">
      <a href="${news.url}" class="link external">Open link</a>
    </div>
  </div>
</div> 
            `);
        });

        if (!document.getElementById('news-swiper-container').swiper) {
            app.swiper.create('#news-swiper-container', { slidesPerView: 1 });
        }
    }

    function openRepoPage(repo) {
        const pageId = `repo-${Date.now()}`;
        const pageHtml = `
            <div class="page page-with-subnavbar" data-name="repo-detail">
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
                <div class="page-content">                         
                    <div class="list media-list separated inset virtual-list virtual-list-${pageId} searchbar-found"></div>
                     <div class="list list-strong simple-list searchbar-not-found inset">
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
                            height: 75,
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

    document.getElementById('add-source-fab').addEventListener('click', () => {
        app.dialog.prompt('Enter source link','Add source', async (url) => {
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
    for (let i = 0; i < items.length; i++) {
      const title = items[i].getElementsByTagName("title")[0].textContent;
      const link = items[i].getElementsByTagName("link")[0].textContent;
      const content = items[i].getElementsByTagName("content:encoded")[0].textContent;
      const imgElement = new window.DOMParser().parseFromString(content, "text/html").querySelector("img");
      const imgSrc = imgElement ? imgElement.getAttribute("src") : "#";
      const card = document.createElement("div");
      card.classList.add("card", "card-raised", "liquid-glass", "news-card");
      card.innerHTML = `
        <div class="card-content">
  <div class="card-image">
    <img class="newsimg" src="${imgSrc}" loading="lazy">
  </div>

  <div class="card-header">${title}</div>

  <div class="card-footer">
    <a onclick="navigator.share({ title: '${title}', url: '${link}' })">
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
              <div style="font-weight:bold;">Connection to the server could not be established.</div>
              <div style="margin-top:4px;">Please check your internet connection and try again.</div>
            </div>
          </div>
        `,
        buttons: [{
          text: 'Dismiss',
          close: true,
          cssClass: 'color-red'
        }],
        closeByBackdropClick: false,
        closeByOutsideClick: false,
        destroyOnClose: true,
        cssClass: 'connection-dialog'
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

window.addEventListener("load", loadIcon);

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
                ${item.title} <i style="font-size: 17px; color: ${item.badgeColor};" class="f7-icons">${item.badge}</i>
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
            <div style="display: flex; gap: 15px;">
              <img src="${item.icon}" style="width: 110px; height: 110px; border-radius: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);">
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: 22px; font-weight: 700; line-height: 1.2;">${item.title}</div>
                <div style="font-size: 15px; color: #8e8e93; margin-top: 4px;">${item.category}</div>
                
                <div style="display: flex; gap: 10px; margin-top: auto; align-items: center;">
                  <a href="${item.get_link}" class="external button button-fill button-round" style="padding: 0 24px;">GET</a>
                  <a class="popover-open more" data-popover=".popover-menu">
                    <i class="f7-icons">ellipsis_circle_fill</i>
                  </a>
                  
                </div>
              </div>
            </div>
                      </div>
                      
             
          <div class="block-title" style="font-size: 20px; color: #000; margin-top: 25px;">Preview</div>
         <center>
                <div class="screenshot" onclick="openPhotoBrowser(${JSON.stringify(item.screenshots).replace(/"/g, "&quot;")})">
                  ${generateScreenshotElements(item.screenshots)}          
              </center>
            </div>
          

          <div class="block block-strong inset">
             <div style="font-size: 15px; line-height: 1.5;">
              ${item.description}
             </div>
          </div>

          <div class="list simple-list inset">
            <ul>
              <li>
                <span>Category</span>
                <span style="color: #8e8e93;">${item.category}</span>
              </li>
              <li>
                <span>Compatibility</span>
                <span style="color: #8e8e93;">${item.compatible}</span>
              </li>
              <li>
                <span>Type</span>
                <span style="color: #8e8e93;">${item.type}</span>
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
                  color: '${item.badgecolor}'
                })"  class="item-link item-content external popover-close"><div class="item-media"><i class="f7-icons">heart_fill</i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">Favorite</div></div></div></a></li><li><a
  class="item-link item-content popover-close"
  onclick="openReportPopup('${item.title.replace(/'/g, "\\'")}')"
>
  <div class="item-media"><i class="f7-icons">exclamationmark_bubble_fill</i></div>
  <div class="item-inner">
    <div class="item-title">Report</div>
  </div>
</a>  
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
                <img loading="lazy" src="${fav.image}">
              </div>
              <div class="item-inner">
                <div class="item-title-row">
                  <div class="item-title">
                    ${fav.title}
                    <i style="font-size:17px;color:${fav.color}" class="f7-icons">${fav.icon}</i>
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
                    <i style="font-size:17px;color:${fav.color}" class="f7-icons">${fav.icon}</i>
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
      title: "AppRealm",
      text: "Take your iDevice experience to the next level with our awesome app!",
      url: "https://apprealm.pages.dev/"
    });
  }
}

function shareSource() {
  if (navigator.share) {
    navigator.share({
      title: "AppRealm",
      text: "Official AltStore source provided by AppRealm",
      url: "https://apprealm.pages.dev/ios/altstore.json"
    });
  }
}

function copySource() {
  navigator.clipboard.writeText('https://apprealm.pages.dev/ios/altstore.json')
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
        color: 'red',
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
