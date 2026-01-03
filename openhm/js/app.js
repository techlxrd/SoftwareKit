var app = new Framework7({
     el: "#app",
      theme: "ios",     
      id: "com.TechLxrd.SoftwareKit",
      popup: {

         push: false,
         swipeToClose: 'to-bottom'

      },
      sheet: {

         push: false,
         swipeToClose: true

      },
      serviceWorker: {

         path: "./service-worker.js"

      },
        routes: [        
    {
      path: '/index/',
      url: 'index.html',
    },
  ],
});
   mainView = app.views.create(".view-main");
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
      updateNavbarTitleFromTab(this.getAttribute('href'));
    });
  });
  window.goToTab = function (tabId) {
    app.popup.close();
    app.tab.show(tabId);
    updateNavbarTitleFromTab(tabId);
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

notificationShown = false;


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


function updateIcon(url) {

   document.querySelectorAll("#favicon").forEach(favicon => {

      favicon.href = url;

   });

   document.querySelectorAll("#faviconimg").forEach(faviconImg => {

      faviconImg.src = url;

   });

   localStorage.setItem("customicon", url);

}


function customicon(e, t) {

   const preloader = app.dialog.preloader("Applying icon");

   preloader.open();

   updateIcon(t);

   setTimeout(() => {

      preloader.close();

      window.location.reload();

   }, 2000);

}


function loadIcon() {

   const customIcon = localStorage.getItem("customicon");

   if (customIcon) {

      updateIcon(customIcon);

   }

}



document.addEventListener("DOMContentLoaded", () => {

   document.querySelectorAll(".ptr-content").forEach(element => {

      element.addEventListener("ptr:refresh", () => {

         window.location.reload();

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


window.addEventListener("load", loadIcon);


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

   const photos = urls.map(url => ({
      url
   }));

   return app.photoBrowser.create({

      photos,

      type: "standalone",

      navbar: true,

      toolbar: true,

      swiper: {

         zoom: true

      },

      on: {

         closed: function () {

            app.photoBrowserPopup = null;

         }

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
    <div class="swipe-nav">
      <div>
        <i class="f7-icons">minus</i>
      </div>
    </div>
    <div class="page-content">
      <div style="margin-top: 20px; padding: 0px;">
        <div class="list separated media-list no-chevron inset">
          <ul>
            <li style="background:none;">
              <div class="item-content">
                <div class="item-media">
                  <img loading="lazy" src="${item.icon}" style="width: 100px; height: 100px;">
                </div>
                <div class="item-inner">
                  <div class="item-title-row" style="font-size: 21px;">
                    <div class="item-title">${item.title}</div>
                  </div>
                  <div class="item-subtitle">
                    <span class="badge">${item.category}</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div class="block block-strong inset">
          <h2>Description</h2>
          <p>${item.description}</p>
          <center>
            <div class="screenshot" onclick="openPhotoBrowser(${JSON.stringify(item.screenshots).replace(/"/g, "&quot;")})">
              ${generateScreenshotElements(item.screenshots)}
            </div>
          </center>
        </div>
                     <div class="list media-list list-strong inset">
              <ul>
                <li>
                  <a onclick='addToFavorites(${JSON.stringify(item).replace(/'/g, "&apos;")})' class="item-link item-content">
                    <div class="item-media"><i class="hm-icons hm-public-favorites-filled"></i></div>
                    <div class="item-inner"><div class="item-title">Add to Favorites</div></div>
                  </a>
                </li>
                <li>
                  <a onclick="navigator.share({ title: '${item.title}', url: '${item.get_link}' })" class="item-link item-content external">
                    <div class="item-media"><i class="hm-icons hm-share-filled"></i></div>
                    <div class="item-inner"><div class="item-title">Share</div></div>
                  </a>
                </li>
                <li>
                  <a class="item-link item-content" onclick="openReportPopup('${item.title.replace(/'/g, "\\'")}')">
                    <div class="item-media"><i class="hm-icons hm-privacy-statement"></i></div>
                    <div class="item-inner"><div class="item-title">Report</div></div>
                  </a>
                </li>
              </ul>
            </div>
            <br>
            <br>
        </div>
      </div>
      <div class="block block-strong install">
 
  <a href="${item.get_link}" 
     class="button button-fill button-raised button-round button-large external" 
     style=" margin: auto;width:95%;">
    INSTALL
  </a>
</div>

`;

}


function initVirtualList(containerSelector, items) {

   app.virtualList.create({

      el: containerSelector,

      items: items,

      renderItem: function (item, index) {

         return createItemHtml(item);

      },

      searchAll: function (query, items) {

         const results = [];

         for (let i = 0; i < items.length; i++) {

            if (items[i].title.toLowerCase().includes(query.toLowerCase()) || query.trim() === "") {

               results.push(i);

            }

         }

         return results;

      },

      height: 90

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

      if (appsCountElement) {

         appsCountElement.textContent = apps.length;

      }

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
    text: "Added to Favorites",
    position: "bottom",
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
                   </i>
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
            Unfavorite <i class="hm-icons hm-gallery-shortcut-favorite"></i>
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

      if (favEmptyElement) {

         favEmptyElement.style.display = "";

      }

   }

}

document.addEventListener("DOMContentLoaded", function () {

   fetchAndLoadApps();
   displayFavorites();

});
let colorPickerInstance = null;

function updateThemeColor(color) {
    const root = document.documentElement;
    root.style.setProperty("--f7-ios-primary", color);
    root.style.setProperty("--f7-ios-primary-shade", color + "D9");
    root.style.setProperty("--f7-ios-primary-tint", color + "4D");
    localStorage.setItem("ios-primary-color", color);
    localStorage.setItem("ios-primary-shade", color + "D9");
    localStorage.setItem("ios-primary-tint", color + "4D");
}

const debouncedUpdateThemeColor = debounce(updateThemeColor, 250);

function openColorPicker(initialColor) {
    colorPickerInstance = app.colorPicker.create({
        inputEl: "#accent-color",
        openIn: "popover",      
        closeOnSelect: true,
        modules: ['palette'],
        value: { hex: initialColor },
        
        on: {
            change: (picker, value) => {
                debouncedUpdateThemeColor(value.hex);
            },
            closed: () => {
                colorPickerInstance.destroy();
                colorPickerInstance = null;
            }
        }
    });
    colorPickerInstance.open();
}

document.addEventListener("DOMContentLoaded", () => {
    const initialColor = localStorage.getItem("ios-primary-color") || "#0404f8";
    updateThemeColor(initialColor);
    
    document.getElementById("accent-color").addEventListener("click", () => {
        if (colorPickerInstance) {
            colorPickerInstance.setValue({ hex: initialColor });
            colorPickerInstance.open();
        } else {
            openColorPicker(initialColor);
        }
    });
});



function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
var swiperFeatured = new Swiper(".featured", {

   slidesPerView: "auto",

   spaceBetween: 10,

   pagination: {

      el: ".swiper-pagination",

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
  app.dialog.create({
    title: 'Reset',
    verticalButtons: true,
    buttons: [
      {
        text: 'Reset Accent Color',
        onClick: function () {
          updateThemeColor("#0A58F7");
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
            'This will delete all your settings and data including favorites. This action cannot be undone.',
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
       
      }
    ]
  }).open();
}if ("serviceWorker" in navigator) {

   navigator.serviceWorker.getRegistration().then(registration => {

      if (!registration) {

         navigator.serviceWorker.register("service-worker.js").catch(() => {});

      }

   });

     }
