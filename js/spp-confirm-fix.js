// Gantariku SPP confirmation compatibility fix.
// The existing SPP actions call confirmSpp(); provide the missing helper.
function confirmSpp(message) {
  return window.confirm(String(message || "Lanjutkan tindakan ini?"));
}
