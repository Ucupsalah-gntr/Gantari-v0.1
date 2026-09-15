// GANTARIKU — LABEL IMPORT EXCEL
(function () {
  function adapt() {
    const input = document.getElementById("gtrImportSiswaFile");
    if (!input) return;
    input.setAttribute("accept", ".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values");
    const strong = document.querySelector("#gtrImportDrop strong");
    const small = document.querySelector("#gtrImportDrop small");
    const desc = document.querySelector(".gtr-import-top p");
    if (strong) strong.textContent = "Pilih file Excel / CSV / TSV";
    if (small) small.textContent = "Mendukung Excel (.xlsx/.xls), CSV, dan TSV";
    if (desc) desc.textContent = "Masukkan data dari Excel/CSV/TSV dan periksa seluruh isi file sebelum disimpan.";
  }
  new MutationObserver(adapt).observe(document.body, { childList: true, subtree: true });
  adapt();
})();
