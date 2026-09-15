// ============================================================
// GANTARIKU — NOTIFICATION UX FIX
// Badge + outside click + Escape + action auto-close.
// Loaded before app.js so window.__app receives these functions.
// ============================================================

(function () {
  const originalLoadNotifikasi = window.loadNotifikasi || null;

  function setNotifExpanded(expanded) {
    const button = document.getElementById("notifButton");
    if (button) {
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
  }

  function closeNotifikasi() {
    const panel = document.getElementById("notifPanel");
    if (!panel) return;
    panel.classList.remove("show");
    setNotifExpanded(false);
  }

  window.closeNotifikasi = closeNotifikasi;

  window.toggleNotifikasi = async function toggleNotifikasiFixed() {
    const panel = document.getElementById("notifPanel");
    if (!panel) return;

    const willOpen = !panel.classList.contains("show");
    panel.classList.toggle("show", willOpen);
    setNotifExpanded(willOpen);

    if (willOpen && typeof originalLoadNotifikasi === "function") {
      await originalLoadNotifikasi();
      setNotifExpanded(true);

      // If there are attention items even without pending payments,
      // show a small dot instead of leaving the bell visually silent.
      const count = document.getElementById("notifCount");
      if (count && count.textContent === "0") {
        const text = (panel.textContent || "").trim().toLowerCase();
        const hasAttention =
          text &&
          !text.includes("tidak ada notifikasi") &&
          !text.includes("belum ada notifikasi");

        if (hasAttention) {
          count.textContent = "•";
          count.style.display = "inline-flex";
        }
      }
    }
  };

  // Close when clicking outside the notification area.
  document.addEventListener("click", function (event) {
    const panel = document.getElementById("notifPanel");
    const button = document.getElementById("notifButton");
    if (!panel || !panel.classList.contains("show")) return;

    if (
      !panel.contains(event.target) &&
      !button?.contains(event.target)
    ) {
      closeNotifikasi();
    }
  });

  // Close after choosing any action/item inside the notification panel.
  document.addEventListener("click", function (event) {
    const panel = document.getElementById("notifPanel");
    if (!panel || !panel.contains(event.target)) return;

    const action = event.target.closest("button, a, [role='button'], .notif-payment");
    if (action) {
      setTimeout(closeNotifikasi, 120);
    }
  });

  // Escape is the standard desktop way to dismiss a popover.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNotifikasi();
    }
  });
})();
