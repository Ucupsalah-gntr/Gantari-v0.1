// ============================================================
// GANTARIKU — PERKEMBANGAN FORM CANCEL / CLOSE FIX
// Menambahkan kontrol Batal/Tutup pada form input perkembangan guru.
// Tidak mengubah alur simpan penilaian yang sudah berjalan.
// ============================================================

(function () {
  "use strict";

  let observer = null;

  function getSection() {
    const form = document.getElementById("formPerkembangan");
    return form?.closest(".section") || null;
  }

  function showForm(section, shouldScroll = false) {
    if (!section) return;

    section.classList.remove("gtr-perk-form-collapsed");
    const form = section.querySelector("#formPerkembangan");
    const collapsedButton = section.querySelector("[data-gtr-perk-open]");
    const closeButton = section.querySelector("[data-gtr-perk-cancel]");

    if (form) form.hidden = false;
    if (collapsedButton) collapsedButton.hidden = true;
    if (closeButton) closeButton.hidden = false;

    if (shouldScroll) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function hideForm(section) {
    if (!section) return;

    const form = section.querySelector("#formPerkembangan");
    const collapsedButton = section.querySelector("[data-gtr-perk-open]");
    const closeButton = section.querySelector("[data-gtr-perk-cancel]");

    if (form) form.hidden = true;
    if (collapsedButton) collapsedButton.hidden = false;
    if (closeButton) closeButton.hidden = true;

    section.classList.add("gtr-perk-form-collapsed");
  }

  function resetAndClose(section) {
    const form = section?.querySelector("#formPerkembangan");
    if (!form) return;

    form.reset();

    const studentSelect = form.querySelector("#perkembanganSiswaId");
    if (studentSelect) {
      studentSelect.innerHTML = "<option value=\"\">Pilih kelas terlebih dahulu</option>";
    }

    hideForm(section);
  }

  function installControls() {
    const section = getSection();
    if (!section || section.dataset.gtrPerkCancelReady === "1") return false;

    const form = section.querySelector("#formPerkembangan");
    if (!form) return false;

    const actionWrap = form.querySelector(".spp-detail-section.spp-detail-section-lg");
    const saveButton = form.querySelector("#btnSimpanPerkembangan");
    if (!actionWrap || !saveButton) return false;

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "btn ghost gtr-perk-cancel-btn";
    cancelButton.dataset.gtrPerkCancel = "1";
    cancelButton.textContent = "Batal / Tutup";
    cancelButton.addEventListener("click", () => resetAndClose(section));

    actionWrap.appendChild(cancelButton);

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "btn secondary gtr-perk-open-btn";
    openButton.dataset.gtrPerkOpen = "1";
    openButton.textContent = "＋ Buka Form Penilaian";
    openButton.hidden = true;
    openButton.addEventListener("click", () => showForm(section, true));

    section.appendChild(openButton);

    section.dataset.gtrPerkCancelReady = "1";
    return true;
  }

  function init() {
    installControls();

    if (observer) return;

    observer = new MutationObserver(() => {
      installControls();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  init();
})();
