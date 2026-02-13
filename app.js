// ==============================
// ✅ STATE
// ==============================
let bookingType = null;        // "match" | "nets"
let selectedDate = null;       // yyyy-mm-dd
let selectedSlot = null;       // "07:00"
let baseRatePerHour = 0;
let couponApplied = null;      // { type: "percent"|"flat", value: number }

// ==============================
// ✅ HELPERS
// ==============================
function fmtINR(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function $(id) {
  return document.getElementById(id);
}

// ==============================
// ✅ INIT (DOM READY)
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Set default date = today
  const today = new Date().toISOString().split("T")[0];
  const dateInput = $("booking-date");
  if (dateInput) {
    dateInput.value = today;
    dateInput.min = today;
    selectedDate = today;
  }

  // Generate slots
  updateTimeSlots();

  // GSAP animations (safe)
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".booking-card", {
      scrollTrigger: { trigger: "#booking", start: "top 80%" },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
    });
  }

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const navbar = $("navbar");
    if (!navbar) return;
    if (window.scrollY > 50) navbar.classList.add("bg-slate-900/95", "shadow-lg");
    else navbar.classList.remove("bg-slate-900/95", "shadow-lg");
  });

  // ESC close menu
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileMenu();
  });
});

// ==============================
// ✅ BOOKING TYPE (Cards)
// ==============================
function selectBookingType(type) {
  bookingType = type;
  baseRatePerHour = type === "match" ? 3500 : 800;

  // Card UI
  const match = $("match-card");
  const nets = $("nets-card");
  if (match && nets) {
    match.classList.remove("border-green-500", "bg-slate-800", "opacity-50");
    nets.classList.remove("border-blue-500", "bg-slate-800", "opacity-50");

    if (type === "match") {
      match.classList.add("border-green-500", "bg-slate-800");
      nets.classList.add("opacity-50");
    } else {
      nets.classList.add("border-blue-500", "bg-slate-800");
      match.classList.add("opacity-50");
    }
  }

  updateSummary();
  calculateTotal();
}

// ==============================
// ✅ DATE CHANGE
// ==============================
function updateTimeSlots() {
  const container = $("time-slots");
  const dateInput = $("booking-date");
  if (!container || !dateInput) return;

  selectedDate = dateInput.value;

  // Reset slot selection on date change
  selectedSlot = null;
  if ($("summary-time")) $("summary-time").textContent = "-";

  // Hide summary until ready
  if ($("empty-state")) $("empty-state").classList.remove("hidden");
  if ($("booking-details")) $("booking-details").classList.add("hidden");

  // Generate time slots (06:00 to 21:00)
  const slots = [];
  for (let h = 6; h < 22; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }

  container.innerHTML = "";

  slots.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = t;

    // simulate booked slots (optional)
    const isBooked = Math.random() > 0.82;

    btn.className =
      "py-2 px-3 rounded-lg text-sm font-medium transition-all border border-slate-700 " +
      (isBooked
        ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-60"
        : "bg-slate-700 hover:bg-slate-600 text-white");

    if (isBooked) {
      btn.disabled = true;
      btn.title = "Booked";
    } else {
      btn.onclick = () => selectTime(t, btn);
    }

    container.appendChild(btn);
  });

  updateSummary();
}

// ==============================
// ✅ SELECT TIME SLOT
// ==============================
function selectTime(time, btn) {
  selectedSlot = time;

  // Remove previous active
  document.querySelectorAll("#time-slots button").forEach((b) => {
    if (!b.disabled) {
      b.classList.remove("slot-active");
      b.classList.add("bg-slate-700");
    }
  });

  // Active state
  btn.classList.remove("bg-slate-700");
  btn.classList.add("slot-active");

  updateSummary();
  calculateTotal();
}

// ==============================
// ✅ SUMMARY SHOW/HIDE
// ==============================
function updateSummary() {
  const emptyState = $("empty-state");
  const details = $("booking-details");

  // Ready condition
  const ready = bookingType && selectedSlot && selectedDate;

  if (ready) {
    emptyState && emptyState.classList.add("hidden");
    details && details.classList.remove("hidden");

    $("summary-type").textContent =
      bookingType === "match" ? "Match Booking" : "Net Practice";

    $("summary-date").textContent = new Date(selectedDate).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    $("summary-time").textContent = selectedSlot;
  } else {
    // if user hasn't selected properly
    emptyState && emptyState.classList.remove("hidden");
    details && details.classList.add("hidden");
  }
}

// ==============================
// ✅ TOTAL CALC (simple version)
// ==============================
function calculateTotal() {
  const totalEl = $("total-amount");
  if (!totalEl) return;

  if (!bookingType) {
    totalEl.textContent = "₹0";
    return;
  }

  const duration = parseInt($("duration")?.value || "1", 10);
  const total = baseRatePerHour * duration;

  totalEl.textContent = fmtINR(total);
}

// ==============================
// ✅ PAYMENT MODAL
// ==============================
function proceedToPayment() {
  const total = $("total-amount")?.textContent || "₹0";
  if ($("payment-amount")) $("payment-amount").textContent = total;

  const modal = $("payment-modal");
  const content = $("payment-content");

  if (!bookingType || !selectedSlot || !selectedDate) {
    alert("Please select booking type, date and time slot first.");
    return;
  }

  if (!modal) {
    alert("Booking confirmed! Amount: " + total);
    return;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  setTimeout(() => {
    if (!content) return;
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
}

function closePayment() {
  const modal = $("payment-modal");
  const content = $("payment-content");
  if (!modal || !content) return;

  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 300);
}

// ==============================
// ✅ SCROLL BUTTONS
// ==============================
function scrollToBooking() {
  $("booking")?.scrollIntoView({ behavior: "smooth" });
}

function showFacilities() {
  $("facilities")?.scrollIntoView({ behavior: "smooth" });
}

function toggleLogin() {
  alert("Login modal would open here - integrate with your auth system");
}

// ==============================
// ✅ HAMBURGER MENU (WORKING)
// ==============================
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const menuOverlay = document.getElementById("menuOverlay");

function toggleMobileMenu() {
  if (!mobileMenu || !hamburger) return;

  const willOpen = !mobileMenu.classList.contains("open");

  mobileMenu.classList.toggle("open", willOpen);
  hamburger.classList.toggle("is-open", willOpen);
  hamburger.setAttribute("aria-expanded", String(willOpen));

  if (menuOverlay) {
    menuOverlay.classList.toggle("hidden", !willOpen);
  }

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
