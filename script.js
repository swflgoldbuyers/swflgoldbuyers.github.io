// SWFL Gold & Silver Buyers

const PURITY = {
    "10K": 0.417,
    "14K": 0.585,
    "18K": 0.750,
    "22K": 0.917,
    "24K": 1.000
};

const TROY_OUNCE_GRAMS = 31.1035;
const OFFER_FACTOR = 0.80;
const CACHE_KEY = "swflGoldSpot";
const LIVE_PRICE_URL = "https://api.gold-api.com/price/XAU";

let goldSpotPrice = null;
let priceIsLive = false;
let selectedPurity = "14K";

const header = document.getElementById("site-header");
const menuToggle = document.getElementById("menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
const purityButtons = document.querySelectorAll(".karat");
const weightInput = document.getElementById("weight");
const estimateEl = document.getElementById("offerAmount");
const calculateBtn = document.getElementById("calculateBtn");
const spotEl = document.getElementById("spotPrice");
const heroSpotEl = document.getElementById("heroSpotPrice");
const spotUpdatedEl = document.getElementById("spotUpdated");
const liveDots = [
    document.getElementById("spotLiveDot"),
    document.getElementById("heroLiveDot")
].filter(Boolean);

function formatMoney(value, digits = 2) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function formatClock(date) {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

function readCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!Number.isFinite(data.price) || data.price <= 0 || !data.at) return null;
        return data;
    } catch (error) {
        return null;
    }
}

function writeCache(price) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            price: price,
            at: Date.now()
        }));
    } catch (error) {
        // Ignore storage failures.
    }
}

function setLiveDots(on) {
    liveDots.forEach((dot) => {
        dot.classList.toggle("is-off", !on);
    });
}

function setCalculatorEnabled(enabled) {
    if (calculateBtn) {
        calculateBtn.disabled = !enabled;
        calculateBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    }
    if (weightInput) weightInput.disabled = !enabled;
    document.body.classList.toggle("price-unavailable", !enabled);
}

function showPrice(value) {
    const formatted = formatMoney(Math.round(value), 0);
    if (spotEl) spotEl.textContent = formatted;
    if (heroSpotEl) heroSpotEl.textContent = formatted;
}

function setLivePrice(price) {
    goldSpotPrice = price;
    priceIsLive = true;
    showPrice(price);
    setLiveDots(true);
    setCalculatorEnabled(true);
    writeCache(price);
    if (spotUpdatedEl) {
        spotUpdatedEl.textContent = "Updated automatically from market data";
    }
    if (weightInput && weightInput.value) calculateOffer();
}

function setUnavailable() {
    goldSpotPrice = null;
    priceIsLive = false;
    setLiveDots(false);
    setCalculatorEnabled(false);
    if (estimateEl) estimateEl.textContent = "—";

    const cached = readCache();
    if (cached) {
        showPrice(cached.price);
        if (spotUpdatedEl) {
            const when = formatClock(new Date(cached.at));
            spotUpdatedEl.textContent = "Last available " + when + " — live market price temporarily unavailable";
        }
        return;
    }

    if (spotEl) spotEl.textContent = "—";
    if (heroSpotEl) heroSpotEl.textContent = "—";
    if (spotUpdatedEl) {
        spotUpdatedEl.textContent = "Live market price temporarily unavailable.";
    }
}

function closeMenu() {
    if (!header || !menuToggle || !mobileNav) return;
    header.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    mobileNav.hidden = true;
}

function openMenu() {
    header.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    mobileNav.hidden = false;
}

if (menuToggle && mobileNav && header) {
    menuToggle.addEventListener("click", () => {
        if (mobileNav.hidden) openMenu();
        else closeMenu();
    });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        closeMenu();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

window.addEventListener("scroll", () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
}, { passive: true });

window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeMenu();
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
});

function calculateOffer() {
    if (!estimateEl || !weightInput) return;

    if (!priceIsLive || !Number.isFinite(goldSpotPrice) || goldSpotPrice <= 0) {
        estimateEl.textContent = "—";
        return;
    }

    const grams = parseFloat(weightInput.value);
    if (isNaN(grams) || grams <= 0) {
        estimateEl.textContent = "—";
        return;
    }

    const purity = PURITY[selectedPurity];
    const gramPrice = goldSpotPrice / TROY_OUNCE_GRAMS;
    const offer = grams * purity * gramPrice * OFFER_FACTOR;
    estimateEl.textContent = formatMoney(offer);
}

purityButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedPurity = button.dataset.purity;
        purityButtons.forEach((item) => {
            const active = item === button;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        if (weightInput && weightInput.value) calculateOffer();
    });
});

if (calculateBtn) {
    calculateBtn.addEventListener("click", calculateOffer);
}

if (weightInput) {
    weightInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            calculateOffer();
        }
    });
}

async function fetchSpotPrice() {
    try {
        const response = await fetch(LIVE_PRICE_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("price request failed");
        const data = await response.json();
        const price = Number(data.price);
        if (!Number.isFinite(price) || price <= 0) throw new Error("invalid price");
        setLivePrice(price);
    } catch (error) {
        setUnavailable();
    }
}

setCalculatorEnabled(false);
fetchSpotPrice();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll("main section:not(.hero)").forEach((section) => {
        section.classList.add("reveal");
        observer.observe(section);
    });
}
