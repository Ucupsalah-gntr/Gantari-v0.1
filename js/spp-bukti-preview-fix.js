// ============================================================
// GANTARIKU — PREVIEW BUKTI PEMBAYARAN
// File dipilih -> preview -> konfirmasi -> upload.
// Tidak mengganti fungsi upload asli.
// ============================================================

(function () {
  "use strict";

  let modal = null;
  let objectUrl = null;
  let originalUpload = null;

  function cleanupUrl() {
    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch (_) {}
      objectUrl = null;
    }
  }

  function closeModal(clearInputId) {
    cleanupUrl();
    if (clearInputId) {
      const input = document.getElementById(clearInputId);
      if (input) input.value = "";
    }
    if (modal) {
      modal.remove();
      modal = null;
    }
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function showPreview(sppId, file) {
    const inputId = `fileSpp_${sppId}`;

    const maxSize = 5 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowed.includes(file.type)) {
      if (typeof appNotify === "function") {
        appNotify("File harus berupa JPG, PNG, atau PDF.", "warning");
      }
      const input = document.getElementById(inputId);
      if (input) input.value = "";
      return;
    }

    if (file.size > maxSize) {
      if (typeof appNotify === "function") {
        appNotify("Ukuran file maksimal 5 MB.", "warning");
      }
      const input = document.getElementById(inputId);
      if (input) input.value = "";
      return;
    }

    closeModal();

    modal = document.createElement("div");
    modal.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:99999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:18px",
      "background:rgba(15,23,42,.62)"
    ].join(";");

    const card = document.createElement("div");
    card.style.cssText = [
      "width:min(520px,100%)",
      "max-height:92vh",
      "overflow:auto",
      "background:#fff",
      "border-radius:20px",
      "padding:18px",
      "box-shadow:0 24px 70px rgba(15,23,42,.25)"
    ].join(";");

    const title = document.createElement("h3");
    title.textContent = "Periksa bukti pembayaran";
    title.style.cssText = "margin:0 0 8px;font-size:18px;";

    const desc = document.createElement("div");
    desc.textContent = "Pastikan gambar ini benar sebelum dikirim ke Gantari.";
    desc.style.cssText = "font-size:13px;line-height:1.5;color:#64748b;margin-bottom:12px;";

    const previewBox = document.createElement("div");
    previewBox.style.cssText = [
      "border:1px solid #e2e8f0",
      "border-radius:14px",
      "background:#f8fafc",
      "padding:10px",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "min-height:180px",
      "overflow:hidden"
    ].join(";");

    if (file.type.startsWith("image/")) {
      objectUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = objectUrl;
      img.alt = "Preview bukti pembayaran";
      img.style.cssText = "display:block;max-width:100%;max-height:46vh;width:auto;height:auto;border-radius:10px;object-fit:contain;";
      previewBox.appendChild(img);
    } else {
      const pdf = document.createElement("div");
      pdf.innerHTML = `
        <div style="font-size:48px;text-align:center;">📄</div>
        <div style="font-weight:700;margin-top:8px;text-align:center;">File PDF dipilih</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;text-align:center;">PDF akan dikirim setelah Anda menekan tombol konfirmasi.</div>
      `;
      previewBox.appendChild(pdf);
    }

    const meta = document.createElement("div");
    meta.style.cssText = "margin-top:12px;padding:10px 12px;border-radius:12px;background:#f8fafc;font-size:12px;color:#475569;";
    meta.innerHTML = `<strong>Ukuran:</strong> ${esc(formatSize(file.size))}`;

    const warning = document.createElement("div");
    warning.textContent = "Dengan menekan “Ya, kirim bukti ini”, file akan dikirim ke sistem Gantari.";
    warning.style.cssText = "margin-top:10px;font-size:12px;line-height:1.45;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:10px 12px;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px;";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn ghost";
    cancel.textContent = "Batal";
    cancel.onclick = () => closeModal(inputId);

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "btn";
    confirm.textContent = "✓ Ya, kirim bukti ini";
    confirm.onclick = async () => {
      const chosenFile = file;
      closeModal();
      if (typeof originalUpload === "function") {
        await originalUpload(sppId, chosenFile);
      }
    };

    actions.appendChild(cancel);
    actions.appendChild(confirm);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(previewBox);
    card.appendChild(meta);
    card.appendChild(warning);
    card.appendChild(actions);
    modal.appendChild(card);
    document.body.appendChild(modal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(inputId);
    });
  }

  function install() {
    if (!window.__app || typeof window.__app.uploadBuktiSpp !== "function") {
      setTimeout(install, 100);
      return;
    }

    if (window.__app.uploadBuktiSpp.__gtrPreviewWrapped) return;

    originalUpload = window.__app.uploadBuktiSpp;

    const wrappedUpload = async function (sppId, file) {
      if (!file) return;
      showPreview(sppId, file);
    };

    wrappedUpload.__gtrPreviewWrapped = true;
    wrappedUpload.__gtrOriginal = originalUpload;
    window.__app.uploadBuktiSpp = wrappedUpload;
  }

  install();
})();
