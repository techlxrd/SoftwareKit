var app = new Framework7({

      el: "#app",
      theme: "ios",
      name: "AppRealm",
      id: "com.TechLxrd.AppRealm",
      popup: {

         push: !0,
         swipeToClose: !0

      },
      sheet: {

         push: !0,
         swipeToClose: !0

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
document.addEventListener("DOMContentLoaded", () => {

   document.querySelectorAll(".tab-link").forEach(tabLink => {

      tabLink.addEventListener("click", function () {

         var tabTitle = this.getAttribute("data-tab-title");

         var navbarTitle = document.querySelector(".navbar .title");

         var navbarLargeTitle = document.querySelector(".navbar .title-large-text");

         if (navbarTitle) {

            navbarTitle.textContent = tabTitle;

         }

         if (navbarLargeTitle) {

            navbarLargeTitle.textContent = tabTitle;

         }

      });

   });

});





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
        <i class="hm-icons hm-screenshot-line"></i>
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
          <br>
          <br>
        </div>
      </div>
      <div class="block block-strong" 
     style="position: fixed; bottom: 0; left: 0; right: 0; width: 100%; 
            border: 1px solid rgba(255,255,255,0.1); z-index: 1000; 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 10px; box-sizing: border-box; margin: 0;">
  <a onclick="addToFavorites({
                  id: '${item.id}',
                  image: '${item.icon}',
                  title: '${item.title}',
                  subtitle: '${item.category}'
                })" 
     style="background: none; color: var(--f7-ios-primary); flex: 0; margin-right: 10px;">
    <i class="hm-icons hm-public-favorites-filled"></i>
  </a>
  <a href="${item.get_link}" 
     class="button button-fill button-raised button-round external" 
     style="flex-grow: 1; margin: 0 10px; text-align: center;">
    INSTALL
  </a>
  <a onclick="navigator.share({ title: '${item.title}', url: '${item.get_link}' })" 
     style="background: none; color: var(--f7-ios-primary); flex: 0; margin-left: 10px;">
    <i class="hm-icons hm-share-filled"></i>
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

   const favEmptyElement = document.getElementById("favempty");

   if (favEmptyElement) {

      favEmptyElement.style.display = "none";

   }


   app.toast.create({

      icon: '<i class="hm-icons hm-public-favorites-filled"></i>',

      text: "Added to Favorites",

      position: "center",

      closeTimeout: 1500

   }).open();


   let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

   if (!favorites.some(fav => fav.title === item.title)) {

      favorites.push(item);

      localStorage.setItem("favorites", JSON.stringify(favorites));

      displayFavorites();

   }

}


function displayFavorites() {

   const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

   const favList = document.getElementById("fav").querySelector("ul");

   favList.innerHTML = "";

   favorites.forEach(fav => {

      const favItemHtml = `

<li class="swipeout">
            <div class="swipeout-content">
                <a class="item-link popup-open" href="#" data-popup="#${fav.id}">
                    <div class="item-content">
                        <div class="item-media">
                            <img loading="lazy" src="${fav.image}">
                        </div>
                        <div class="item-inner">
                            <div class="item-title-row">
                                <div class="item-title">
                                    ${fav.title}
                                </div>
                            </div>
                            <div class="item-subtitle">${fav.subtitle}</div>
                            <div class="item-footer"></div>
                        </div>
                    </div>
                </a>
            </div>
            <div class="swipeout-actions-right">
                <a href="#" class="swipeout-delete" onclick="removeFromFavorites('${fav.title}')">Remove</a>
            </div>
        </li>`;


      favList.insertAdjacentHTML("beforeend", favItemHtml);

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

         title: "AppMarkt",

         text: "Elevate your iDevice experience with our advanced store.",

         url: "https://appmarkt.pages.dev/"

      });

   }

}


function reset() {

   app.actions.create({

      buttons: [

         [

            {

               text: "Reset Accent Color",

               onClick: function () {

                  updateThemeColor("#0404f8");

               }

            },

            {

               text: "Erase All Data and Preferences",

               onClick: function () {

                  app.dialog.confirm(

                     "Please confirm if you want to Erase All Data and Settings. This action cannot be undone.",

                     "Reset",

                     () => {

                        var preloader = app.dialog.preloader("Resetting");

                        preloader.open();

                        setTimeout(() => {

                           document.cookie.split(";").forEach(cookie => {

                              var eqPos = cookie.indexOf("=");

                              var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;

                              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";

                           });

                           localStorage.clear();

                           preloader.close();

                           window.location.href = "app.html";

                        }, 2000);

                     }

                  );

               }

            }

         ],

         [

            {

               text: "Cancel",

               color: "red",

               onClick: function () {}

            }

         ]

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
