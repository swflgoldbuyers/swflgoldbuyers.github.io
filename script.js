// ======================================================
// SWFL GOLD & SILVER BUYERS
// script.js
// ======================================================

// ------------------------------
// Smooth Scrolling
// ------------------------------

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", e => {

        const target = document.querySelector(link.getAttribute("href"));

        if (!target) return;

        e.preventDefault();

        target.scrollIntoView({

            behavior: "smooth"

        });

    });

});

// ------------------------------
// Header Scroll Effect
// ------------------------------

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (!header) return;

    if (window.scrollY > 50) {

        header.style.background = "rgba(8,8,8,.95)";
        header.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";

    } else {

        header.style.background = "rgba(8,8,8,.78)";
        header.style.boxShadow = "none";

    }

});

// ------------------------------
// Fade-In Animation
// ------------------------------

const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("visible");

        }

    });

}, {

    threshold: .15

});

document.querySelectorAll("section").forEach(section => {

    section.classList.add("fade-section");

    observer.observe(section);

});
// ------------------------------
// Gold Calculator
// ------------------------------

const puritySelect = document.getElementById("purity");
const weightInput = document.getElementById("weight");
const estimate = document.getElementById("offerAmount");
const calculateBtn = document.getElementById("calculateBtn");

// Demo spot price.
// Replace later with live API.
let goldSpotPrice = 4079;

const purityPercent = {

    "10K": 0.417,
    "14K": 0.585,
    "18K": 0.750,
    "22K": 0.917,
    "24K": 1.000

};

if (calculateBtn) {

    calculateBtn.addEventListener("click", () => {

        const purity = purityPercent[puritySelect.value];

        const grams = parseFloat(weightInput.value);

        if (isNaN(grams) || grams <= 0) {

            estimate.textContent = "--";

            return;

        }

        // Convert spot price (troy oz) to grams
        const gramPrice = goldSpotPrice / 31.1035;

        // Estimated offer (90%)
        const offer = grams * purity * gramPrice * 0.90;

        estimate.textContent =

            "$" + offer.toFixed(2);

    });

}
// ------------------------------
// Spot Price Display
// ------------------------------

const spotElement = document.getElementById("spotPrice");

function updateSpotPrice() {

    if (!spotElement) return;

    spotElement.textContent =

        "$" + goldSpotPrice.toLocaleString();

}

updateSpotPrice();
// ------------------------------
// Button Hover Animation
// ------------------------------

document.querySelectorAll(".btn").forEach(button => {

    button.addEventListener("mouseenter", () => {

        button.style.transform = "translateY(-3px)";

    });

    button.addEventListener("mouseleave", () => {

        button.style.transform = "";

    });

});
