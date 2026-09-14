// ============================================================
// VIEW: GURU & PELATIH
// ============================================================

function renderGuru() {

  return `

    <style>

      .guru-list-mobile {
        display:none;
      }


      .guru-card-grid {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );
        gap:14px;
      }


      .guru-card {
        border:1px solid var(--line);
        border-radius:16px;
        padding:15px;
        background:#fff;
      }


      .guru-card-top {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:12px;
      }


      .guru-card-name {
        font-size:15px;
        font-weight:700;
        line-height:1.35;
      }


      .guru-card-email {
        margin-top:5px;
        font-size:12px;
        color:var(--ink-soft);
        word-break:break-word;
      }


      .guru-card-meta {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:14px;
      }


      @media (
        max-width:760px
      ) {

        .guru-table-desktop {
          display:none;
        }


        .guru-list-mobile {
          display:block;
        }


        .guru-card-grid {
          grid-template-columns:
            1fr;
        }

      }


      @media (
        min-width:761px
      ) {

        .guru-list-mobile {
          display:none;
        }

      }

    </style>


    <div class="section">

      <div class="section-head">

        <div>

          <h2>
            Guru & Pelatih Gantari
          </h2>

          <div
            style="
              font-size:12px;
              color:var(--ink-soft);
              margin-top:4px;
            "
          >
            Daftar akun guru dan pelatih yang sudah terdaftar.
          </div>

        </div>


        <div class="controls">

          <input
            type="text"
            id="cariGuru"
            placeholder="Cari nama atau email..."
          >


          <button
            class="btn secondary"
            onclick="
              window.__app.loadGuru()
            "
          >
            Refresh
          </button>

        </div>

      </div>


      <div class="section-body">

        <p
          style="
            margin-top:0;
            color:var(--ink-soft);
            font-size:13px;
          "
        >

          Akun guru/pelatih dikelola melalui autentikasi Supabase.
          Halaman ini menampilkan akun dengan role
          <strong>guru</strong>
          yang sudah terdaftar.

        </p>


        <!-- DESKTOP TABLE -->

        <div
          class="
            guru-table-desktop
          "
        >

          <table>

            <thead>

              <tr>

                <th>
                  Nama
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody
              id="
                daftarGuru
              "
            >

              <tr>

                <td
                  colspan="4"
                  style="
                    text-align:center;
                  "
                >
                  Memuat data guru...
                </td>

              </tr>

            </tbody>

          </table>

        </div>


        <!-- MOBILE CARD -->

        <div
          class="
            guru-list-mobile
          "
          id="
            daftarGuruMobile
          "
        >

          <div
            class="
              perk-empty
            "
          >
            Memuat data guru...
          </div>

        </div>

      </div>

    </div>

  `;

}


// ============================================================
// LOAD GURU
// ============================================================

async function loadGuru() {

  const tbody =
    document.getElementById(
      "daftarGuru"
    );


  const mobileContainer =
    document.getElementById(
      "daftarGuruMobile"
    );


  const searchInput =
    document.getElementById(
      "cariGuru"
    );


  if (!supabase) {
    return;
  }


  if (tbody) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="4"
          style="
            text-align:center;
          "
        >
          Memuat data guru...
        </td>

      </tr>
    `;

  }


  if (mobileContainer) {

    mobileContainer.innerHTML = `
      <div
        class="
          perk-empty
        "
      >
        Memuat data guru...
      </div>
    `;

  }


  try {

    const {
      data,
      error
    } =
      await withRequestTimeout(
        supabase
        .from("pengguna")
        .select(
          `
          id,
          nama,
          email,
          role
          `
        )
        .eq(
          "role",
          "guru"
        )
        .order(
          "nama",
          {
            ascending: true
          }
        ),
        "data guru"
      );


    if (error) {
      throw error;
    }


    const keyword =
      (
        searchInput?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    const hasil =
      (data || [])
        .filter(
          (g) =>

            (
              g.nama ||
              ""
            )
              .toLowerCase()
              .includes(
                keyword
              )

            ||

            (
              g.email ||
              ""
            )
              .toLowerCase()
              .includes(
                keyword
              )

        );


    if (!hasil.length) {

      if (tbody) {

        tbody.innerHTML = `

          <tr>

            <td
              colspan="4"
              style="
                text-align:center;
              "
            >
              Belum ada akun guru/pelatih.
            </td>

          </tr>

        `;

      }


      if (mobileContainer) {

        mobileContainer.innerHTML = `

          <div
            class="
              perk-empty
            "
          >
            Belum ada akun guru/pelatih.
          </div>

        `;

      }


      return;

    }


    // ========================================================
    // DESKTOP TABLE
    // ========================================================

    if (tbody) {

      tbody.innerHTML =
        hasil
          .map(
            (g) => `

              <tr>

                <td>
                  ${g.nama || "-"}
                </td>


                <td>
                  ${g.email || "-"}
                </td>


                <td>

                  <span
                    class="
                      badge
                      badge-good
                    "
                  >
                    Guru / Pelatih
                  </span>

                </td>


                <td>

                  <span
                    class="
                      badge
                      badge-muted
                    "
                  >
                    Aktif
                  </span>

                </td>

              </tr>

            `
          )
          .join("");

    }


    // ========================================================
    // MOBILE CARD
    // ========================================================

    if (mobileContainer) {

      mobileContainer.innerHTML = `

        <div
          class="
            guru-card-grid
          "
        >

          ${hasil
            .map(
              (g) => `

                <div
                  class="
                    guru-card
                  "
                >

                  <div
                    class="
                      guru-card-top
                    "
                  >

                    <div>

                      <div
                        class="
                          guru-card-name
                        "
                      >
                        ${g.nama || "-"}
                      </div>


                      <div
                        class="
                          guru-card-email
                        "
                      >
                        ${g.email || "-"}
                      </div>

                    </div>

                  </div>


                  <div
                    class="
                      guru-card-meta
                    "
                  >

                    <span
                      class="
                        badge
                        badge-good
                      "
                    >
                      Guru / Pelatih
                    </span>


                    <span
                      class="
                        badge
                        badge-muted
                      "
                    >
                      Aktif
                    </span>

                  </div>

                </div>

              `
            )
            .join("")}

        </div>

      `;

    }


    // ========================================================
    // SEARCH LISTENER
    // ========================================================

    if (
      searchInput &&
      !searchInput.dataset.bound
    ) {

      searchInput.addEventListener(
        "input",
        loadGuru
      );


      searchInput.dataset.bound =
        "1";

    }

  }

  catch (error) {

    console.error(
      "Error load guru:",
      error
    );


    const pesan =
      `
        Gagal memuat data guru:<br>
        <span style="font-size:12px;">${error.message || "Terjadi kesalahan."}</span>
        ${retryButtonHtml("window.__app.loadGuru()")}
      `;


    if (tbody) {

      tbody.innerHTML = `

        <tr>

          <td
            colspan="4"
            style="
              text-align:center;
              color:#E11D48;
            "
          >
            ${pesan}
          </td>

        </tr>

      `;

    }


    if (mobileContainer) {

      mobileContainer.innerHTML = `

        <div
          class="
            perk-empty
          "
          style="
            color:#E11D48;
          "
        >
          ${pesan}
        </div>

      `;

    }

  }

}
