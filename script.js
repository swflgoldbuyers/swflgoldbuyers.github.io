// SWFL Gold & Silver Buyers

const PURITY = {
    "10K": 0.417,
    "14K": 0.585,
    "18K": 0.750,
    "22K": 0.917,
    "24K": 1.000
};

const TROY_OUNCE_GRAMS = 31.1035;
const OFFER_FACTOR = 0.90;
const FALLBACK_SPOT = 4366;

let goldSpotPrice = FALLBACK_SPOT;
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

function formatMoney(value, digits = 2) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function setSpotDisplay(price) {
    const rounded = Math.round(price);
    const formatted = formatMoney(rounded, 0);

    if (spotEl) spotEl.textContent = formatted;
    if (heroSpotEl) heroSpotEl.textContent = formatted;
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

function calculateOffer() {
    if (!estimateEl || !weightInput) return;

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
    const endpoints = [
        {
            url: "https://api.gold-api.com/price/XAU",
            parse: (data) => Number(data.price)
        },
        {
            url: "https://data-asg.goldprice.org/dbXRates/USD",
            parse: (data) => Number(data.items && data.items[0] && data.items[0].xauPrice)
        }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url, { cache: "no-store" });
            if (!response.ok) continue;
            const data = await response.json();
            const price = endpoint.parse(data);
            if (Number.isFinite(price) && price > 0) {
                goldSpotPrice = price;
                setSpotDisplay(price);
                if (spotUpdatedEl) {
                    const time = new Date().toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit"
                    });
                    spotUpdatedEl.textContent = "Updated " + time;
                }
                if (weightInput && weightInput.value) calculateOffer();
                return;
            }
        } catch (error) {
            // Try the next source.
        }
    }

    setSpotDisplay(goldSpotPrice);
    if (spotUpdatedEl) {
        spotUpdatedEl.textContent = "Market reference rate";
    }
}

setSpotDisplay(goldSpotPrice);
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
