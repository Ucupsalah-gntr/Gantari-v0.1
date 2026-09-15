// ============================================================
// GANTARIKU — NOTIFIKASI UX PATCH
// Badge, auto-close, click-outside, Escape, and action close.
// ============================================================

(function () {
  let outsideHandlerBound = false;
  let panelHandlerBound = false;

  function getNotifEls() {
    return {
      button: document.getElementById("notifButton"),
      panel: document.getElementById("notifPanel"),
      count: document.getElementById("notifCount"),
    };
  }

  function closeNotifikasi() {
    const { panel, button } = getNotifEls();
    if (!panel) return;
    panel.classList.remove("show");
    if (button) button.setAttribute("aria-expanded", "false");
  }

  function hasAttentionNotification(text) {
    const value = String(text || "").toLowerCase();
    return [
      "belum lunas",
      "menunggu verifikasi",
      "belum mengisi absensi",
      "belum memiliki absensi",
      "perlu tindakan",
      "tagihan spp",
    ].some((keyword) => value.includes(keyword));
  }

  function syncNotificationBadge() {
    const { panel, count, button } = getNotifEls();
    if (!count || !panel) return;

    const currentCount = Number.parseInt(count.textContent, 10) || 0;
    const hasAttention = hasAttentionNotification(panel.textContent);
    const hasAnyNotification = currentCount > 0 || hasAttention;

    count.classList.toggle("is-hidden", !hasAnyNotification);
    count.style.display = hasAnyNotification ? "inline-flex" : "none";

    if (hasAnyNotification && currentCount === 0) {
      count.textContent = "•";
      count.setAttribute("aria-label", "Ada notifikasi yang perlu diperhatikan");
    }

    if (button) {
      button.classList.toggle("has-notification", hasAnyNotification);
    }
  }

  function bindNotificationUx() {
    const { button, panel } = getNotifEls();

    if (button) {
      button.setAttribute(
        "aria-expanded",
        panel?.classList.contains("show") ? "true" : "false"
      );
    }

    if (!outsideHandlerBound) {
      document.addEventListener("click", (event) => {
        const { button: currentButton, panel: currentPanel } = getNotifEls();
        if (!currentPanel?.classList.contains("show")) return;
        if (currentPanel.contains(event.target)) return;
        if (currentButton?.contains(event.target)) return;
        closeNotifikasi();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeNotifikasi();
      });

      outsideHandlerBound = true;
    }

    if (panel && !panelHandlerBound) {
      panel.addEventListener("click", (event) => {
        const action = event.target.closest(
          "button, a, [data-notif-action], .notif-payment"
        );
        if (!action) return;
        setTimeout(closeNotifikasi, 120);
      });
      panelHandlerBound = true;
    }
  }

  const originalToggleNotifikasi = window.toggleNotifikasi;
  if (typeof originalToggleNotifikasi === "function") {
    window.toggleNotifikasi = function () {
      bindNotificationUx();
      originalToggleNotifikasi();

      const { panel, button } = getNotifEls();
      if (button && panel) {
        button.setAttribute(
          "aria-expanded",
          panel.classList.contains("show") ? "true" : "false"
        );
      }
    };
  }

  const originalLoadNotifikasi = window.loadNotifikasi;
  if (typeof originalLoadNotifikasi === "function") {
    window.loadNotifikasi = async function (...args) {
      const result = await originalLoadNotifikasi(...args);
      bindNotificationUx();
      syncNotificationBadge();
      return result;
    };
  }

  window.closeNotifikasi = closeNotifikasi;
  window.syncNotificationBadge = syncNotificationBadge;
})();
