// GANTARIKU — IMPORT SISWA PARSER FIX
// Mendukung CSV Excel Indonesia dengan delimiter ;, , atau TAB.
(function () {
  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  let candidates = [];
  let busy = false;
  const esc = (v) => typeof escapeHtml === "function" ? escapeHtml(v ?? "") : String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const notify = (m,t="info") => typeof appNotify === "function" ? appNotify(m,t) : console.log(m);

  function detectDelimiter(text) {
    const sample = String(text || "").split(/\r?\n/).find(x => x.trim()) || "";
    let best = ",", score = -1;
    for (const d of ["\t",";",","]) {
      let n = 0, q = false;
      for (let i=0;i<sample.length;i++) { const c=sample[i]; if(c==='"') q=!q; else if(!q&&c===d)n++; }
      if(n>score){score=n;best=d;}
    }
    return score>0 ? best : ",";
  }

  function parseDelimited(text) {
    const delimiter = detectDelimiter(text), rows=[];
    let row=[], cell="", quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i], next=text[i+1];
      if(ch==='"'){ if(quoted&&next==='"'){cell+='"';i++;}else quoted=!quoted; }
      else if(!quoted&&ch===delimiter){row.push(cell.trim());cell="";}
      else if(!quoted&&(ch==='\n'||ch==='\r')){if(ch==='\r'&&next==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell="";}
      else cell+=ch;
    }
    row.push(cell.trim()); if(row.some(Boolean))rows.push(row);
    return rows;
  }

  const headerKey = v => String(v||"").replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[\s\-\/]+/g,"_");
  function objects(text){
    const rows=parseDelimited(text);
    if(rows.length<2) throw new Error("File harus memiliki judul kolom dan minimal satu data siswa.");
    const headers=rows[0].map(headerKey);
    return rows.slice(1).map((vals,i)=>{const o={__row:i+2};headers.forEach((h,j)=>{if(h)o[h]=String(vals[j]??"").trim();});return o;}).filter(r=>Object.keys(r).some(k=>k!=="__row"&&r[k]));
  }
  function pick(r,keys){for(const k of keys)if(r[k]!==undefined&&String(r[k]).trim()!=="")return String(r[k]).trim();return "";}
  function dateValue(v){
    v=String(v||"").trim();if(!v)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;
    let m=v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    m=v.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);if(m){const mi=MONTHS.findIndex(x=>x.toLowerCase()===m[2].toLowerCase());if(mi>=0)return `${m[3]}-${String(mi+1).padStart(2,"0")}-${m[1].padStart(2,"0")}`;}return null;
  }
  function monthValue(v){v=String(v||"").trim();if(/^\d{4}-\d{2}$/.test(v))return v;let m=v.match(/^(\d{1,2})[\/-](\d{4})$/);if(m)return `${m[2]}-${m[1].padStart(2,"0")}`;const mi=MONTHS.findIndex(x=>v.toLowerCase().includes(x.toLowerCase())),y=v.match(/20\d{2}/)?.[0];return mi>=0&&y?`${y}-${String(mi+1).padStart(2,"0")}`:"";}
  function gender(v){v=String(v||"").trim().toLowerCase();if(["l","lk","laki-laki","laki laki","male"].includes(v))return"L";if(["p","pr","perempuan","female"].includes(v))return"P";return null;}

  function makeCandidates(rows, existing){
    const seen=new Set(existing);
    return rows.map(r=>{
      const nama=pick(r,["nama","nama_siswa","nama_anak","nama_murid"]), nis=pick(r,["nis","nomor_induk","nomor_induk_siswa","nomor_induk_murid"]), kelas=pick(r,["kelas","class"]), errors=[];
      const nk=nis.toLowerCase(); if(!nama)errors.push("Nama kosong");if(!nis)errors.push("NIS kosong");if(!kelas)errors.push("Kelas kosong");if(nis&&seen.has(nk))errors.push("NIS sudah terdaftar/duplikat");if(nis)seen.add(nk);
      const tlRaw=pick(r,["tanggal_lahir","tanggallahir","tgl_lahir"]), tkRaw=pick(r,["tanggal_keluar","tanggal_keluar_siswa","tgl_keluar"]), tl=dateValue(tlRaw), tk=dateValue(tkRaw);if(tlRaw&&!tl)errors.push("Tanggal lahir tidak valid");if(tkRaw&&!tk)errors.push("Tanggal keluar tidak valid");
      const mbRaw=pick(r,["mulai_bergabung","mulai_bulan","bergabung"]), mb=monthValue(mbRaw);if(mbRaw&&!mb)errors.push("Mulai bergabung tidak valid");
      return {row:r.__row,nama,nis,kelas,tahun_ajaran:pick(r,["tahun_ajaran","tahunajaran"]),tempat_lahir:pick(r,["tempat_lahir","tempatlahir"]),tanggal_lahir:tl,jenis_kelamin:gender(pick(r,["jenis_kelamin","jeniskelamin","gender","jk"])),nama_wali:pick(r,["nama_wali","wali","nama_orang_tua","nama_ortu"]),nomor_hp_ortu:pick(r,["nomor_hp_ortu","no_hp_ortu","nomor_hp","no_hp","hp_ortu"]),mulai_bulan:mb?Number(mb.slice(5,7)):null,mulai_tahun:mb?Number(mb.slice(0,4)):null,tanggal_keluar:tk,alamat:pick(r,["alamat"]),kode_akses:pick(r,["kode_akses","kode_akses_anak"]),errors};
    });
  }

  function render(preview,list){
    const valid=list.filter(x=>!x.errors.length), invalid=list.filter(x=>x.errors.length);
    preview.innerHTML=`<div class="gtr-import-summary"><div class="gtr-import-stat"><strong>${list.length}</strong><span>Total baris</span></div><div class="gtr-import-stat is-good"><strong>${valid.length}</strong><span>Siap diimport</span></div><div class="gtr-import-stat ${invalid.length?"is-bad":""}"><strong>${invalid.length}</strong><span>Perlu diperiksa</span></div></div><div class="gtr-import-preview-head"><div><strong>Preview Data Siswa</strong><small>Periksa data sebelum disimpan ke sistem.</small></div></div><div class="gtr-import-table-wrap"><table class="gtr-import-table"><thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Tahun Ajaran</th><th>Jenis Kelamin</th><th>Nama Wali</th><th>HP Orang Tua</th><th>Tgl. Keluar</th><th>Status</th></tr></thead><tbody>${list.slice(0,100).map(x=>`<tr class="${x.errors.length?"is-invalid":""}"><td>${x.row}</td><td class="name-cell">${esc(x.nama||"—")}</td><td>${esc(x.nis||"—")}</td><td>${esc(x.kelas||"—")}</td><td>${esc(x.tahun_ajaran||"—")}</td><td>${x.jenis_kelamin==="L"?"Laki-laki":x.jenis_kelamin==="P"?"Perempuan":"—"}</td><td>${esc(x.nama_wali||"—")}</td><td>${esc(x.nomor_hp_ortu||"—")}</td><td>${esc(x.tanggal_keluar||"—")}</td><td>${x.errors.length?`<span class="gtr-import-badge bad" title="${esc(x.errors.join(", "))}">⚠ ${esc(x.errors[0])}</span>`:`<span class="gtr-import-badge good">✓ Siap</span>`}</td></tr>`).join("")}</tbody></table></div><div class="gtr-import-note">Data dengan tanda ⚠ tidak akan diimport. Data lama tidak diubah.</div>`;
    return {valid,invalid};
  }

  async function handleFile(input){
    const modal=document.getElementById("gtrImportSiswaModal");if(!modal||!input.files?.[0])return;const file=input.files[0], preview=modal.querySelector("#gtrImportPreview"),button=modal.querySelector("#gtrImportRun"),text=modal.querySelector("#gtrImportReadyText"),fileName=modal.querySelector("#gtrImportFileName");
    if(fileName)fileName.textContent=`${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB`;
    try{preview.innerHTML=`<div class="gtr-import-loading">Membaca data siswa...</div>`;text.textContent="Membaca file...";button.disabled=true;const rows=objects(await file.text());const {data:existing,error}=await supabase.from("siswa").select("nis");if(error)throw error;const set=new Set((existing||[]).map(x=>String(x.nis||"").trim().toLowerCase()).filter(Boolean));candidates=makeCandidates(rows,set);const result=render(preview,candidates);button.disabled=result.valid.length===0;text.textContent=result.valid.length?`${result.valid.length} siswa siap diimport${result.invalid.length?` · ${result.invalid.length} perlu diperiksa`:""}.`:"Belum ada data yang siap diimport.";}catch(error){console.error(error);candidates=[];button.disabled=true;text.textContent="File belum siap diimport.";preview.innerHTML=`<div class="gtr-import-error">⚠ ${esc(error?.message||"File tidak dapat dibaca.")}</div>`;}
  }

  async function importData(){
    if(busy)return;const valid=candidates.filter(x=>!x.errors.length);if(!valid.length)return;busy=true;const button=document.getElementById("gtrImportRun");if(button){button.disabled=true;button.textContent="Mengimport...";}
    try{const rows=valid.map(x=>({nama:x.nama,nis:x.nis,kelas:x.kelas,tahun_ajaran:x.tahun_ajaran||null,tempat_lahir:x.tempat_lahir||null,tanggal_lahir:x.tanggal_lahir,jenis_kelamin:x.jenis_kelamin,nama_wali:x.nama_wali||null,nomor_hp_ortu:x.nomor_hp_ortu||null,mulai_bulan:x.mulai_bulan,mulai_tahun:x.mulai_tahun,tanggal_keluar:x.tanggal_keluar,alamat:x.alamat||null,kode_akses:x.kode_akses||(typeof generateKodeAkses==="function"?generateKodeAkses():null)}));const {error}=await supabase.from("siswa").insert(rows);if(error)throw error;notify(`${rows.length} siswa berhasil diimport.`,"success");document.getElementById("gtrImportSiswaModal")?.remove();if(typeof loadSiswa==="function")await loadSiswa();}catch(error){console.error(error);notify(error?.message||"Import siswa gagal.","error");if(button){button.disabled=false;button.textContent="Import Siswa";}}finally{busy=false;}
  }

  document.addEventListener("change",e=>{if(e.target?.id!=="gtrImportSiswaFile")return;e.preventDefault();e.stopImmediatePropagation();handleFile(e.target);},true);
  document.addEventListener("click",e=>{if(!e.target?.closest?.("#gtrImportRun"))return;e.preventDefault();e.stopImmediatePropagation();importData();},true);
})();
