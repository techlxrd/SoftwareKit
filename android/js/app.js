
var app = new Framework7({
  el: '#app',
  name: 'AppRealm',
  id: 'com.apprealm.TechLxrd',
  theme: 'md', 
  popup: {
    swipeToClose: 'to-bottom',
    push: 'true'
  },
  routes: [
    {
      path: '/index/',
      url: 'index.html',
    },
  ],
});

var mainView = app.views.create('.view-main');
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
                icon: '<i class="icon material-icons color-red">wifi_off</i>',
                title: "No Internet Connection",
                titleRightText: "now",
                subtitle: "Unable to establish a connection with the server.",
                text: "Check your connection and try again."
            }).open();
        }
    }, 1000);
}
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".ptr-content").forEach(element => {
        element.addEventListener("ptr:refresh", () => {
            window.location.reload();
        });
    });
    checkConnection();
});

function initPhotoBrowser(urls) {
    const photos = urls.map(url => ({ url }));
    return app.photoBrowser.create({
        photos,
        type: "standalone",
        navbar: true,
        toolbar: false,
        swiper: {
            zoom: true
        },
        on: {
            closed: function() {
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
            <div class="swipe-nav"><div><i class="material-icons" style="border-radius:100%;">remove</i></div></div>
            <div class="page-content">
                <div style="margin-top: 20px; padding: 0px;">
                    <div class="list separated media-list no-chevron inset">
                        <ul>
                            <li style="background:none !important;">
                                <div class="item-content">
                                    <div class="item-media">
                                        <img loading="lazy" src="${item.icon}" style="width: 100px; height: 100px;">
                                    </div>
                                    <div class="item-inner">
                                        <div class="item-title-row" style="font-size: 21px;">
                                            <div class="item-title">
                                                ${item.title}
                                            </div>
                                        </div>
                                        <div class="item-subtitle"><span class="badge">${item.category}</span></div>
                                        <div class="item-text">
                                            
                                           
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="block inset"><a href="${item.get_link}" class="button button-tonal button-round external">Open</a></div>
                    <div class="block block-strong inset">
                        <h2>About</h2>
                        <p>${item.description}</p>
                        <h2>Preview</h2>
                        <center>
                            <div class="screenshot" onclick="openPhotoBrowser(${JSON.stringify(item.screenshots).replace(/"/g, "&quot;")})">
                                ${generateScreenshotElements(item.screenshots)}
                            </div>
                        </center>
                    </div>
                    <div class="list list-strong list-dividers simple-list inset">
                        <ul>
                            <li><span>Type</span><span style="float: right">${item.type}</span></li>
                        </ul>
                    </div>
                    <div class="list media-list separated inset">
                        <ul>
                            <li>
                                <a onclick="addToFavorites({
                                    id: '${item.id}',
                                    icon: '${item.badge}',
                                    image: '${item.icon}',
                                    title: '${item.title}',
                                    subtitle: '${item.category}',
                                    color: '${item.badgecolor}'
                                })" class="item-link item-content">
                                    <div class="item-media"><i class="icon material-icons color-red">favorite</i></div>
                                    <div class="item-inner">
                                        <div class="item-title-row">
                                            <div class="item-title">Add to Favorites</div>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            
                        </ul>
                    </div>
                    <br>
                </div>
            </div>
        </div>
    </div>
  `;
}

function initVirtualList(items) {
    app.virtualList.create({
        el: ".virtual-list",
        items,
        renderItem: function(item, index) {
            return createItemHtml(item);
        },
        searchAll: function(query, items) {
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

async function loadApps() {
    try {
        const response = await fetch("apps.json");
        const apps = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
        const tweaksNumberElement = document.getElementById("tweaksnumber");
        if (tweaksNumberElement) {
            tweaksNumberElement.textContent = apps.length;
        }
        initVirtualList(apps);
    } catch (error) {
        console.error("Could not load apps:", error);
    }
}

function addToFavorites(item) {
    const favEmptyElement = document.getElementById("favempty");
    if (favEmptyElement) {
        favEmptyElement.style.display = "none";
        localStorage.setItem("favemptyHidden", "true");
    }

    app.toast.create({
        icon: '<i class="material-icons">stars</i>',
        text: "Added to Wishlist",
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
                            <img loading="lazy" src="${fav.image}" style="background-color:#C2C2C2;">
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
                <a href="#" class="swipeout-delete" onclick="removeFromFavorites('${fav.title}')">Delete</a>
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
            localStorage.setItem("favemptyHidden", "false");
        }
    }
}

function checkFavEmptyPreference() {
    if (localStorage.getItem("favemptyHidden") === "true") {
        const favEmptyElement = document.getElementById("favempty");
        if (favEmptyElement) {
            favEmptyElement.style.display = "none";
        }
    }
}

function debounce(func, wait, immediate) {
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
}



loadApps();
document.addEventListener("DOMContentLoaded", displayFavorites);
document.addEventListener("DOMContentLoaded", checkFavEmptyPreference);

const handleResize = debounce(function() {
    console.log("Resize event handler called.");
}, 250);

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

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tab-link").forEach(tabLink => {
        tabLink.addEventListener("click", function() {
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

let colorPickerInstance = null;

function updateThemeColor(color) {
    const root = document.documentElement;
    root.style.setProperty("--f7-md-primary", color);
    root.style.setProperty("--f7-md-primary-shade", color + "D9");
    root.style.setProperty("--f7-md-primary-tint", color + "4D");
    localStorage.setItem("md-primary-color", color);
    localStorage.setItem("md-primary-shade", color + "D9");
    localStorage.setItem("md-primary-tint", color + "4D");
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
    const initialColor = localStorage.getItem("md-primary-color") || "#3E84F7";
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


fetch("https://www.androidauthority.com/feed/")
    .then(response => response.text())
    .then(data => {
        const items = (new DOMParser()).parseFromString(data, "text/xml").getElementsByTagName("item");
        const newsContainer = document.getElementById("news");

        for (let i = 0; i < items.length; i++) {
            const title = items[i].getElementsByTagName("title")[0].textContent;
            const link = items[i].getElementsByTagName("link")[0].textContent;
            const description = items[i].getElementsByTagName("description")[0]?.textContent || "";

            const card = document.createElement("div");
            card.classList.add("card", "card-raised");
            card.innerHTML = `
                <div class="card-content">
                    <div class="card-header">${title}</div>
                    <div class="card-body">${description}</div>
                    <div class="card-footer">
                        <a></a>
                        <a href="${link}" class="external">
                            Read full article
                        </a>
                    </div>
                </div>`;
            newsContainer.appendChild(card);
        }
    })
    .catch(error => console.error('Error fetching the RSS feed:', error));
    
function reset() {
                        updateThemeColor("#3E84F7");
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



if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
        if (!registration) {
            navigator.serviceWorker.register("service-worker.js").catch(() => {});
        }
    });
}
