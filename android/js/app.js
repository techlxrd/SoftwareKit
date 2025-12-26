const app = new Framework7({
  el: "#app",
  theme: "md",
  name: "SoftwareKit",
  id: "com.techlxrd.SoftwareKit",
  touch: {
    touchHighlight: true,
    tapHold: true,
  },
  popup: {
    push: false,
    swipeToClose: true,
  },
  colors: {
    primary: '#007AFF',
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

const mainView = app.views.create('.view-main');

const debounce = (func, wait, immediate) => {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const failedImages = new Set();
window.addEventListener('error', function (event) {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.closest('.screenshots') || img.dataset.fallbackApplied) return;
  
  const src = img.getAttribute('src');
  if (!src || failedImages.has(src)) return;
  
  failedImages.add(src);
  img.dataset.fallbackApplied = 'true';
  img.src = './assets/default.png';
}, true);

let themeColor = localStorage.getItem("md-primary-color") || "#007AFF";
let mdVibrant = localStorage.getItem("md-vibrant") === "true";
let mdMonochrome = localStorage.getItem("md-monochrome") === "true";

const setCustomColor = (newColor) => {
  themeColor = newColor;
  app.setColorTheme(newColor);
  const indicator = document.getElementById("accent-color");
  if (indicator) indicator.style.backgroundColor = newColor;
  localStorage.setItem("md-primary-color", newColor);
};

const applyMdColorScheme = () => {
  if (mdVibrant) {
    app.setMdColorScheme("vibrant");
  } else if (mdMonochrome) {
    app.setMdColorScheme("monochrome");
  } else {
    app.setMdColorScheme("default");
  }
};

const syncToggles = () => {
  const vibrant = document.getElementById("toggle-vibrant");
  const mono = document.getElementById("toggle-monochrome");

  if (vibrant) vibrant.checked = mdVibrant;
  if (mono) mono.checked = mdMonochrome;
};

const setMdColorSchemeVibrant = (value) => {
  mdVibrant = value;

  if (value) {
    mdMonochrome = false;
    localStorage.setItem("md-monochrome", "false");
  }

  localStorage.setItem("md-vibrant", value);
  applyMdColorScheme();
  syncToggles();
};

const setMdColorSchemeMonochrome = (value) => {
  mdMonochrome = value;

  if (value) {
    mdVibrant = false;
    localStorage.setItem("md-vibrant", "false");
  }

  localStorage.setItem("md-monochrome", value);
  applyMdColorScheme();
  syncToggles();
};

document.addEventListener("DOMContentLoaded", () => {
  setCustomColor(themeColor);
  applyMdColorScheme();
  syncToggles();
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
function applyDarkModeSetting() {
  const htmlElement = document.querySelector("html");
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  
  const applyDarkMode = (e) => {
    htmlElement.classList.toggle("dark", e.matches);
  };
  

  darkModeQuery.addEventListener('change', applyDarkMode);
  applyDarkMode(darkModeQuery);
}

function updateNavbarTitleFromTab(tabId) {
  if (!tabId) return;
  const tabLink = document.querySelector(`.tab-link[href="${tabId}"]`);
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

window.goToTab = function (tabId) {
  app.popup.close();
  app.tab.show(tabId);
  updateNavbarTitleFromTab(tabId);
};

function generateScreenshotElements(screenshots) {
  return screenshots.map(src => `<img loading="lazy" src="${src}">`).join('');
}

function initPhotoBrowser(urls) {
  const photos = urls.map(url => ({ url }));
  return app.photoBrowser.create({
    photos,
    type: "popup",
    navbar: true,
    toolbar: true,
    swiper: { zoom: true },
    on: {
      closed: () => { app.photoBrowserPopup = null; }
    }
  });
}

function openPhotoBrowser(urls) {
  initPhotoBrowser(urls).open();
}

function createItemHtml(item) {
  return `
    <li>
      <a class="item-link" href="#">
        <div class="item-content popup-open" data-popup="#${item.id}">
          <div class="item-media"><img loading="lazy" src="${item.icon}"></div>
          <div class="item-inner">
            <div class="item-title-row">
              <div class="item-title">${item.title}</div>
            </div>
            <div class="item-subtitle">${item.category}</div>
          </div>
        </div>
      </a>
    </li>`;
}

function createPopupHtml(item) {
  return `
    <div class="popup" id="${item.id}">
      <div class="page">
        <div class="swipe-nav"><div><i class="material-icons" style="border-radius:100%;">remove</i></div></div>
        <div class="page-content">
          <div style="margin-top: 20px;">
            <div class="list separated media-list no-chevron inset">
              <ul>
                <li style="background:none !important;">
                  <div class="item-content">
                    <div class="item-media">
                      <img loading="lazy" src="${item.icon}" style="width: 100px; height: 100px;">
                    </div>
                    <div class="item-inner">
                      <div class="item-title-row" style="font-size: 21px;">
                        <div class="item-title">${item.title}</div>
                      </div>
                      <div class="item-subtitle"><span class="badge">${item.category}</span></div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div class="block inset"><a href="${item.get_link}" class="button button-tonal button-round external">Open</a></div>
            <div class="block block-strong inset">
              <h2>About</h2>
              <p>${item.description}</p>
              <center>
                <div class="screenshot" onclick='openPhotoBrowser(${JSON.stringify(item.screenshots)})'>
                  ${generateScreenshotElements(item.screenshots)}
                </div>
              </center>
            </div>
            <div class="list media-list list-strong inset">
              <ul>
                <li>
                  <a onclick='addToFavorites(${JSON.stringify(item).replace(/'/g, "&apos;")})' class="item-link item-content">
                    <div class="item-media"><i class="icon material-icons">favorite</i></div>
                    <div class="item-inner"><div class="item-title">Add to Favorites</div></div>
                  </a>
                </li>
                <li>
                  <a onclick="navigator.share({ title: '${item.title}', url: '${item.get_link}' })" class="item-link item-content external">
                    <div class="item-media"><i class="material-icons">share</i></div>
                    <div class="item-inner"><div class="item-title">Share</div></div>
                  </a>
                </li>
                <li>
                  <a class="item-link item-content" onclick="openReportPopup('${item.title.replace(/'/g, "\\'")}')">
                    <div class="item-media"><i class="material-icons">report</i></div>
                    <div class="item-inner"><div class="item-title">Report</div></div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadApps() {
  try {
    const response = await fetch("apps.json");
    const apps = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
    
    const tweaksNumberElement = document.getElementById("tweaksnumber");
    if (tweaksNumberElement) tweaksNumberElement.textContent = apps.length;

    app.virtualList.create({
      el: ".virtual-list",
      items: apps,
      renderItem: (item) => createItemHtml(item),
      searchAll: (query, items) => {
        const results = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].title.toLowerCase().includes(query.toLowerCase()) || query.trim() === "") results.push(i);
        }
        return results;
      },
      height: 90
    });

    apps.forEach(item => {
      document.body.insertAdjacentHTML("beforeend", createPopupHtml(item));
    });
  } catch (error) {
    console.error("Could not load apps:", error);
  }
}

function addToFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let favOrder = JSON.parse(localStorage.getItem("favOrder")) || [];

  if (favorites.some(fav => fav.id === item.id)) {
    app.dialog.alert("This app is already in your favorites.", "Error");
    return;
  }

  const favoriteItem = { ...item, image: item.icon }; 
  
  favorites.push(favoriteItem);
  favOrder.push(item.id);
  
  localStorage.setItem("favorites", JSON.stringify(favorites));
  localStorage.setItem("favOrder", JSON.stringify(favOrder));

  app.toast.create({
    icon: '<i class="material-icons">favorite</i>',
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
  const orderedFavorites = savedOrder.map(id => favMap.get(id)).filter(Boolean);
 
  favorites.forEach(f => {
    if (!savedOrder.includes(f.id)) orderedFavorites.push(f);
  });

  orderedFavorites.forEach(fav => {
    favList.insertAdjacentHTML("beforeend", `
      <li class="swipeout" id="fav-${fav.id}">
        <div class="swipeout-content">
          <a class="item-link popup-open" data-popup="#${fav.id}">
            <div class="item-content">
              <div class="item-media"><img loading="lazy" src="${fav.image}"></div>
              <div class="item-inner">
                <div class="item-title-row">
                  <div class="item-title">${fav.title}</div>
                </div>
                <div class="item-subtitle">${fav.category || fav.subtitle}</div>
              </div>
            </div>
          </a>
        </div>
        <div class="swipeout-actions-right">
          <a class="swipeout-delete" onclick="removeFromFavorites('${fav.id}')">Unfavorite</a>
        </div>
      </li>`);
  });
}

function removeFromFavorites(id) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let favOrder = JSON.parse(localStorage.getItem("favOrder")) || [];

  favorites = favorites.filter(f => f.id !== id);
  favOrder = favOrder.filter(fid => fid !== id);

  localStorage.setItem("favorites", JSON.stringify(favorites));
  localStorage.setItem("favOrder", JSON.stringify(favOrder));
  displayFavorites();
}

let notificationShown = false;
function checkConnection() {
  const toggleNotification = (online) => {
    if (online) {
      notificationShown = false;
    } else if (!notificationShown) {
      notificationShown = true;
      app.notification.create({
        icon: '<i class="icon material-icons color-red">wifi_off</i>',
        title: "No Internet Connection",
        subtitle: "Unable to establish a connection.",
        text: "Check your connection and try again.",
        closeTimeout: 3000
      }).open();
    }
  };

  window.addEventListener('online', () => toggleNotification(true));
  window.addEventListener('offline', () => toggleNotification(false));
  toggleNotification(navigator.onLine);
}

async function fetchNews() {
  try {
    const response = await fetch("https://www.androidauthority.com/feed/");
    const data = await response.text();
    const items = (new DOMParser()).parseFromString(data, "text/xml").getElementsByTagName("item");
    const newsContainer = document.getElementById("news");
    if (!newsContainer) return;

    for (let i = 0; i < Math.min(items.length, 10); i++) {
      const title = items[i].getElementsByTagName("title")[0].textContent;
      const link = items[i].getElementsByTagName("link")[0].textContent;
      const description = items[i].getElementsByTagName("description")[0]?.textContent || "";
      
      const card = document.createElement("div");
      card.className = "card card-raised";
      card.innerHTML = `
        <div class="card-content">
          <div class="card-header">${title}</div>
          <div class="card-body">${description}</div>
          <div class="card-footer"><a onclick="navigator.share({url: '${link}' })" class="external">Share article</a><a href="${link}" class="external">Read full article</a></div>
        </div>`;
      newsContainer.appendChild(card);
    }
  } catch (error) {
    console.error('Error fetching RSS:', error);
  }
}

function openReportPopup(appName) {
  const input = document.getElementById('report-app-name');
  if (input) input.value = appName;
  app.popup.open('#report-app');
}

const handleFormSubmit = (formId, popupId) => {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    
    app.dialog.confirm('Confirm Submission?', 'Confirm', () => {
      submitBtn.classList.add('button-loading');
      submitBtn.disabled = true;

      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
      .then(() => {
        app.dialog.alert('Success!', 'Success', () => {
          form.reset();
          app.popup.close(popupId);
        });
      })
      .catch(() => app.dialog.alert('Failed to send.', 'Error'))
      .finally(() => {
        submitBtn.classList.remove('button-loading');
        submitBtn.disabled = false;
      });
    });
  });
};

function reset() {
  const defaultColor = '#007AFF';
  app.dialog.create({
    title: 'Reset',
    verticalButtons: true,
    buttons: [
      {
        text: 'Reset Accent Color',
        onClick: () => {
          setCustomColor(defaultColor);
          if (colorPicker) colorPicker.setValue({ hex: defaultColor });
          app.toast.create({ text: 'Color restored!', closeTimeout: 2000 }).open();
        }
      },
      {
        text: 'Erase all data',       
        onClick: () => {
          app.dialog.confirm('This will delete all your data including favorites. Continue?', 'Confirm Reset', () => {
            app.preloader.show();
            localStorage.clear();
            setTimeout(() => window.location.reload(), 1000);
          });
        }
      },
      { text: 'Cancel', close: true, color: 'red',}
    ]
  }).open();
}

document.addEventListener('DOMContentLoaded', () => {
  setCustomColor(themeColor);
  applyDarkModeSetting();
  loadApps();
  displayFavorites();
  checkConnection();
  fetchNews();
  handleFormSubmit('report-form', '#report-app');
  handleFormSubmit('feedback-form', '#feedback');


  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', function() {
      updateNavbarTitleFromTab(this.getAttribute('href'));
    });
  });
  document.querySelectorAll(".ptr-content").forEach(el => {
    el.addEventListener("ptr:refresh", () => window.location.reload());
  });

  let cpTimeout;
  colorPicker = app.colorPicker.create({
    targetEl: '#accent-color',
    value: { hex: themeColor },
    on: {
      change(cp, value) {
        clearTimeout(cpTimeout);
        cpTimeout = setTimeout(() => {
          if (themeColor !== value.hex) setCustomColor(value.hex);
        }, 200);
      }
    }
  });
  
  new Swiper(".featured", {
    slidesPerView: "auto",
    spaceBetween: 10,
    pagination: { el: ".swiper-pagination" },
    autoplay: { delay: 4000, disableOnInteraction: true }
  });
});