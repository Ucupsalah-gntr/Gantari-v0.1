// GANTARIKU — LABEL IMPORT EXCEL
// FIX: mencegah MutationObserver loop tak berujung.
(function () {
  function adapt() {
    const input = document.getElementById("gtrImportSiswaFile");
    if (!input) return;

    const accept = ".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values";
    if (input.getAttribute("accept") !== accept) input.setAttribute("accept", accept);

    const strong = document.querySelector("#gtrImportDrop strong");
    const small = document.querySelector("#gtrImportDrop small");
    const desc = document.querySelector(".gtr-import-top p");

    if (strong && strong.textContent !== "Pilih file Excel / CSV / TSV") strong.textContent = "Pilih file Excel / CSV / TSV";
    if (small && small.textContent !== "Mendukung Excel (.xlsx/.xls), CSV, dan TSV") small.textContent = "Mendukung Excel (.xlsx/.xls), CSV, dan TSV";
    if (desc && desc.textContent !== "Masukkan data dari Excel/CSV/TSV dan periksa seluruh isi file sebelum disimpan.") desc.textContent = "Masukkan data dari Excel/CSV/TSV dan periksa seluruh isi file sebelum disimpan.";
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      adapt();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  adapt();
})();
