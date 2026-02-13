// ==========================
// State
// ==========================
let selectedType = null;   // "match" | "nets"
let selectedDate = null;   // "YYYY-MM-DD"
let selectedTime = null;   // "HH:00"
let baseRatePerHour = 0;
let couponApplied = null;  // { type: "percent"|"flat", value:number }

// ==========================
// Helpers
// ==========================
function fmtINR(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function getEl(id) {
  return document.getElementById(id);
}

// ==========================
// Init
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Date init
  const today = new Date().toISOString().split("T")[0];
  const dateInput = getEl("booking-date");
  if (dateInput) {
    dateInput.value = today;
    dateInput.min = today;
    selectedDate = today;

    dateInput.addEventListener("change", () => {
      selectedDate = dateInput.value;
      updateTimeSlots();
      updateSummary();
      calculateTotal();
    });
  }

  // Duration change
  const duration = getEl("duration");
  if (duration) duration.addEventListener("change", calculateTotal);

  // Addons change
  document.querySelectorAll(".addon").forEach((c) => c.addEventListener("change", calculateTotal));

  // Pay option change
  const payFull = getEl("pay-full");
  const payAdv = getEl("pay-advance");
  if (payFull) payFull.addEventListener("change", updatePaySplit);
  if (payAdv) payAdv.addEventListener("change", updatePaySplit);

  // Players change (optional)
  const players = getEl("players");
  if (players) players.addEventListener("input", () => calculateTotal());

  updateTimeSlots();
  updatePaySplit();

  // GSAP (optional)
  try {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".booking-card", {
      scrollTrigger: { trigger: "#booking", start: "top 80%" },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
    });
  } catch (e) {}
});

// ==========================
// Booking Type
// ==========================
function selectBookingType(type) {
  selectedType = type;
  baseRatePerHour = type === "match" ? 3500 : 800;

  // Visual selection
  const matchCard = getEl("match-card");
  const netsCard = getEl("nets-card");

  if (matchCard && netsCard) {
    matchCard.classList.remove("border-green-500", "bg-slate-800", "opacity-50");
    netsCard.classList.remove("border-blue-500", "bg-slate-800", "opacity-50");

    if (type === "match") {
      matchCard.classList.add("border-green-500", "bg-slate-800");
      netsCard.classList.add("opacity-50");
    } else {
      netsCard.classList.add("border-blue-500", "bg-slate-800");
      matchCard.classList.add("opacity-50");
    }
  }

  // Players hint
  const hint = getEl("players-hint");
  const players = getEl("players");
  if (hint && players) {
    if (type === "match") {
      hint.textContent = "Match booking: recommended 20+ players.";
      if (parseInt(players.value || "0", 10) < 20) players.value = 20;
    } else {
      hint.textContent = "Net practice: recommended 1–6 players.";
      if (parseInt(players.value || "0", 10) > 6) players.value = 6;
    }
  }

  updateSummary();
  calculateTotal();
}

// ==========================
// Time Slots
// ==========================
function updateTimeSlots() {
  const container = getEl("time-slots");
  if (!container) return;

  container.innerHTML = "";

  // Reset time when date changes
  selectedTime = null;
  const summaryTime = getEl("summary-time");
  if (summaryTime) summaryTime.textContent = "-";

  // Generate slots 06:00 to 21:00
  for (let h = 6; h < 22; h++) {
    const time = `${String(h).padStart(2, "0")}:00`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = time;

    const isBooked = Math.random() > 0.82;

    btn.className =
      "py-2 px-3 rounded-lg text-sm font-medium transition-all border border-slate-700 " +
      (isBooked
        ? "bg-slate-800 text-slate-600 cursor-not-allowed slot-disabled"
        : "bg-slate-700 hover:bg-slate-600 text-white");

    if (!isBooked) {
      btn.addEventListener("click", () => selectTime(time, btn));
    } else {
      btn.disabled = true;
    }

    container.appendChild(btn);
  }
}

function selectTime(time, btn) {
  // remove previous active
  document.querySelectorAll("#time-slots button").forEach((b) => {
    b.classList.remove("slot-active");
    if (!b.disabled) {
      b.classList.add("bg-slate-700");
    }
  });

  btn.classList.remove("bg-slate-700");
  btn.classList.add("slot-active");

  selectedTime = time;
  updateSummary();
  calculateTotal();
}

// ==========================
// Summary
// ==========================
function updateSummary() {
  const emptyState = getEl("empty-state");
  const details = getEl("booking-details");

  if (!selectedDate) {
    const dateInput = getEl("booking-date");
    selectedDate = dateInput ? dateInput.value : null;
  }

  const ready = !!(selectedType && selectedTime && selectedDate);

  if (!emptyState || !details) return;

  if (ready) {
    emptyState.classList.add("hidden");
    details.classList.remove("hidden");

    const summaryType = getEl("summary-type");
    const summaryDate = getEl("summary-date");
    const summaryTime = getEl("summary-time");

    if (summaryType) summaryType.textContent = selectedType === "match" ? "Match Booking" : "Net Practice";
    if (summaryDate)
      summaryDate.textContent = new Date(selectedDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (summaryTime) summaryTime.textContent = selectedTime;

    updatePaySplit();
  } else {
    // keep hidden until ready
    details.classList.add("hidden");
    emptyState.classList.remove("hidden");
  }
}

// ==========================
// Coupon
// ==========================
function applyCoupon() {
  const code = (getEl("coupon")?.value || "").trim().toUpperCase();
  const msg = getEl("coupon-msg");
  couponApplied = null;

  if (!code) {
    if (msg) msg.textContent = "Enter a coupon code.";
    calculateTotal();
    return;
  }

  if (code === "SAVE10") couponApplied = { type: "percent", value: 10 };
  else if (code === "FLAT200") couponApplied = { type: "flat", value: 200 };
  else couponApplied = null;

  if (msg) msg.textContent = couponApplied ? `Coupon applied: ${code}` : "Invalid coupon. Try SAVE10 or FLAT200.";
  calculateTotal();
}

// ==========================
// Total Calculation
// ==========================
function calculateTotal() {
  const totalEl = getEl("total-amount");
  if (!totalEl) return;

  if (!selectedType) {
    totalEl.textContent = "₹0";
    updateBreakdown(0, 0, 0, 0, 0);
    updatePaySplit();
    return;
  }

  const duration = parseInt(getEl("duration")?.value || "1", 10);

  // add-ons per hour
  let addonsPerHour = 0;
  document.querySelectorAll(".addon").forEach((el) => {
    if (el.checked) addonsPerHour += parseInt(el.dataset.price || "0", 10);
  });

  const basePerHour = baseRatePerHour;
  const subtotal = (basePerHour + addonsPerHour) * duration;

  // discount
  let discount = 0;
  if (couponApplied) {
    if (couponApplied.type === "percent") discount = Math.round((subtotal * couponApplied.value) / 100);
    if (couponApplied.type === "flat") discount = Math.min(couponApplied.value * duration, subtotal);
  }

  const afterDiscount = Math.max(subtotal - discount, 0);
  const gst = Math.round(afterDiscount * 0.18);
  const total = afterDiscount + gst;

  totalEl.textContent = fmtINR(total);
  updateBreakdown(basePerHour, addonsPerHour, subtotal, discount, gst);
  updatePaySplit();
}

function updateBreakdown(basePerHour, addonsPerHour, subtotal, discount, gst) {
  const set = (id, val) => {
    const el = getEl(id);
    if (el) el.textContent = val;
  };
  set("bd-base", fmtINR(basePerHour));
  set("bd-addons", fmtINR(addonsPerHour));
  set("bd-subtotal", fmtINR(subtotal));
  set("bd-discount", `- ${fmtINR(discount)}`);
  set("bd-gst", fmtINR(gst));
}

// ==========================
// Pay Split
// ==========================
function updatePaySplit() {
  const totalText = getEl("total-amount")?.textContent || "₹0";
  const totalNum = parseInt(totalText.replace(/[₹,]/g, ""), 10) || 0;

  const payNowEl = getEl("pay-now");
  const payLaterEl = getEl("pay-later");

  const payFull = getEl("pay-full")?.checked;
  const now = payFull ? totalNum : Math.round(totalNum * 0.3);
  const later = Math.max(totalNum - now, 0);

  if (payNowEl) payNowEl.textContent = fmtINR(now);
  if (payLaterEl) payLaterEl.textContent = fmtINR(later);
}

// ==========================
// Payment Modal / Validation
// ==========================
function proceedToPayment() {
  const warn = getEl("bk-warn");
  const vmsg = getEl("validation-msg");

  // must be ready
  if (!(selectedType && selectedDate && selectedTime)) {
    if (vmsg) {
      vmsg.classList.remove("hidden");
      vmsg.textContent = "Please select booking type, date and time slot first.";
    }
    return;
  }

  if (vmsg) vmsg.classList.add("hidden");

  // validate name + phone
  const name = (getEl("bk-name")?.value || "").trim();
  const phone = (getEl("bk-phone")?.value || "").trim();
  const phoneOk = /^[6-9]\d{9}$/.test(phone);

  if (!name || !phoneOk) {
    if (warn) warn.classList.remove("hidden");
    return;
  }
  if (warn) warn.classList.add("hidden");

  // modal
  const total = getEl("total-amount")?.textContent || "₹0";
  const paymentAmount = getEl("payment-amount");
  if (paymentAmount) paymentAmount.textContent = total;

  const modal = getEl("payment-modal");
  const content = getEl("payment-content");

  if (modal && content) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    setTimeout(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }, 10);
  } else {
    alert("Booking confirmed! Amount: " + total);
  }
}

function closePayment() {
  const modal = getEl("payment-modal");
  const content = getEl("payment-content");
  if (!modal || !content) return;

  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 250);
}

// ==========================
// Navigation helpers
// ==========================
function scrollToBooking() {
  getEl("booking")?.scrollIntoView({ behavior: "smooth" });
}
function showFacilities() {
  getEl("facilities")?.scrollIntoView({ behavior: "smooth" });
}
function toggleLogin() {
  alert("Login modal would open here - integrate with your auth system");
}

// Navbar scroll effect
window.addEventListener("scroll", () => {
  const navbar = getEl("navbar");
  if (!navbar) return;
  if (window.scrollY > 50) navbar.classList.add("bg-slate-900/95", "shadow-lg");
  else navbar.classList.remove("bg-slate-900/95", "shadow-lg");
});

// Mobile menu
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const menuOverlay = document.getElementById("menuOverlay");

function toggleMobileMenu() {
  if (!mobileMenu || !hamburger) return;

  const willOpen = !mobileMenu.classList.contains("open");
  mobileMenu.classList.toggle("open", willOpen);
  hamburger.classList.toggle("is-open", willOpen);
  hamburger.setAttribute("aria-expanded", String(willOpen));

  if (menuOverlay) menuOverlay.classList.toggle("hidden", !willOpen);
  document.body.classList.toggle("overflow-hidden", willOpen);
}

function closeMobileMenu() {
  if (!mobileMenu || !hamburger) return;

  mobileMenu.classList.remove("open");
  hamburger.classList.remove("is-open");
  hamburger.setAttribute("aria-expanded", "false");

  if (menuOverlay) menuOverlay.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

// Esc close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMobileMenu();
});

