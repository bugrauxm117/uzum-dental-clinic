/* =========================================================
   ÜZÜM DENTAL CLINIC — Site Davranışları
   Bu dosyayı düzenlemenize gerek yok. Bilgiler js/config.js'te.
   ========================================================= */
(function () {
  "use strict";

  var S = window.SITE || {};
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Türkçe karakterleri karşılaştırılabilir hâle getirir (İ, ş, ğ …) */
  var COMBINING = new RegExp("[\\u0300-\\u036f]", "g");

  function norm(str) {
    return String(str)
      .toLocaleLowerCase("tr")
      .normalize("NFD")
      .replace(COMBINING, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Kullanıcı metnini HTML'e gömmeden önce kaçır */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Verisi olmayan bölümü ve ona giden tüm menü linklerini gizler */
  function hideSection(id) {
    var sec = $("#" + id);
    if (sec) sec.hidden = true;
    // Ana sayfada "#id", alt sayfalarda "index.html#id" olarak duruyor
    $$('a[href="#' + id + '"], a[href="index.html#' + id + '"]').forEach(function (a) {
      a.hidden = true;
    });
  }

  /* Bir dizinin gerçekten dolu olup olmadığı */
  function filled(arr) { return Array.isArray(arr) && arr.length > 0; }

  var STARS = new Array(6).join('<svg class="ic"><use href="#i-star"/></svg>');

  /* ---------------------------------------------------------
     1) BAĞLANTILAR — config.js'ten üretilir
     --------------------------------------------------------- */
  function waLink(message) {
    var num = String(S.whatsapp || "").replace(/\D/g, "");
    var txt = message || S.waIntro || "Merhaba, bilgi almak istiyorum.";
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(txt);
  }

  function mapsLink() {
    return "https://www.google.com/maps/search/?api=1&query=" +
           encodeURIComponent(S.mapsQuery || (S.addressLine + " " + S.addressCity));
  }

  var HREFS = {
    tel:  function () { return "tel:" + String(S.phoneRaw || "").replace(/[^\d+]/g, ""); },
    wa:   function () { return waLink(); },
    mail: function () { return "mailto:" + S.email; },
    maps: function () { return mapsLink(); }
  };

  /* ---------------------------------------------------------
     2) METİNLERİ YERLEŞTİR
     --------------------------------------------------------- */
  function fillSite() {
    var computed = {
      addressFull: [S.addressLine, S.addressCity].filter(Boolean).join(", "),
      brandFull:   [S.brand, S.brandSuffix].filter(Boolean).join(" ")
    };

    $$("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      var val = key in computed ? computed[key] : S[key];
      if (val != null && val !== "") el.textContent = val;
    });

    $$("[data-site-href]").forEach(function (el) {
      var fn = HREFS[el.getAttribute("data-site-href")];
      if (fn) el.setAttribute("href", fn());
    });

    // Sekme başlığı ve logo alt metni
    var full = [S.brand, S.brandSuffix].filter(Boolean).join(" ");
    $$(".logo__img").forEach(function (img) { img.alt = full; });

    // Paylaşım görseli mutlak adres ister — WhatsApp/Facebook göreli yolu
    // çözemez. siteUrl girilmişse og:image ve og:url tam adrese çevrilir.
    var site = String(S.siteUrl || "").replace(/\/+$/, "");
    if (site) {
      var ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content.indexOf("http") !== 0) {
        ogImg.setAttribute("content", site + "/" + ogImg.content.replace(/^\//, ""));
      }
      var ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement("meta");
        ogUrl.setAttribute("property", "og:url");
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute("content", site + location.pathname);
    }
  }

  /* ---------------------------------------------------------
     3) İSTATİSTİK ŞERİDİ (+ sayaç animasyonu)
     --------------------------------------------------------- */
  var nf = new Intl.NumberFormat("tr-TR");

  function buildStats() {
    var box = $("#stats");
    if (!box) return;

    // Rakam girilmemişse şerit hiç görünmesin — uydurma sayı yerine boşluk.
    if (!filled(S.stats)) { box.hidden = true; return; }

    box.innerHTML = S.stats.map(function (s) {
      return '<div class="stat">' +
               '<strong class="stat__num" data-to="' + s.value + '"' +
                 (s.decimal ? ' data-decimal="1"' : '') + '>0' +
                 (s.suffix ? '<span>' + s.suffix + '</span>' : '') +
               '</strong>' +
               '<span class="stat__label">' + s.label + '</span>' +
             '</div>';
    }).join("");
  }

  function countUp(el) {
    var to  = parseFloat(el.getAttribute("data-to")) || 0;
    var dec = el.hasAttribute("data-decimal");
    var suffix = el.querySelector("span");
    var sfx = suffix ? suffix.outerHTML : "";
    var dur = 1400, t0 = null;

    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = to * eased;
      el.innerHTML = (dec ? v.toFixed(1).replace(".", ",") : nf.format(Math.round(v))) + sfx;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     3b) HASTA YORUMLARI — config.js > reviews
     Dizi boşsa bölüm de menü linki de görünmez.
     --------------------------------------------------------- */
  function buildReviews() {
    // Önce veriye bak: alt sayfalarda .quotes yok ama menü linki yine kapanmalı
    if (!filled(S.reviews)) { hideSection("yorumlar"); return; }
    var box = $(".quotes");
    if (!box) return;

    box.innerHTML = S.reviews.map(function (r, i) {
      var initial = esc(String(r.name || "?").trim().charAt(0).toLocaleUpperCase("tr"));
      return '<figure class="quote reveal">' +
               '<div class="stars">' + STARS + '</div>' +
               '<blockquote>' + esc(r.text) + '</blockquote>' +
               '<figcaption>' +
                 '<span class="quote__av" style="--h:' + (150 + i * 37 % 90) + '">' + initial + '</span>' +
                 '<div><strong>' + esc(r.name) + '</strong>' +
                 (r.topic ? '<small>' + esc(r.topic) + '</small>' : '') + '</div>' +
               '</figcaption>' +
             '</figure>';
    }).join("");
  }

  /* ---------------------------------------------------------
     3c) ÖNCESİ / SONRASI VAKALARI — config.js > cases
     ⚠️ Yalnızca yazılı hasta onayı alınmış fotoğraflar.
     Dizi boşsa bölüm de menü linki de görünmez.
     --------------------------------------------------------- */
  function buildCases() {
    if (!filled(S.cases)) { hideSection("sonuclar"); return; }
    var box = $(".baGrid");
    if (!box) return;

    box.innerHTML = S.cases.map(function (c) {
      function layer(kind, file, label) {
        return '<div class="ba__layer ba__layer--' + kind + '" data-photo="' + label + '">' +
                 (file ? '<img src="assets/images/' + esc(file) + '" alt="" loading="lazy">' : '') +
               '</div>';
      }
      return '<figure class="ba reveal" data-ba>' +
               '<div class="ba__stage">' +
                 layer("after",  c.after,  "Sonra") +
                 layer("before", c.before, "Önce") +
                 '<span class="ba__tag ba__tag--l">Önce</span>' +
                 '<span class="ba__tag ba__tag--r">Sonra</span>' +
                 '<div class="ba__handle"><svg class="ic"><use href="#i-arrow"/></svg></div>' +
                 '<input class="ba__range" type="range" min="0" max="100" value="50" ' +
                   'aria-label="Öncesi sonrası karşılaştırma">' +
               '</div>' +
               '<figcaption><strong>' + esc(c.title) + '</strong>' +
               (c.detail ? '<span>' + esc(c.detail) + '</span>' : '') + '</figcaption>' +
             '</figure>';
    }).join("");
  }

  /* ---------------------------------------------------------
     3d) DENEYİM ROZETİ + KURULUŞ YILI — girilmemişse gizlenir
     --------------------------------------------------------- */
  function buildClaims() {
    var badge = $(".badgeCard");
    if (badge) {
      var years = String(S.experienceYears || "").trim();
      if (years) $(".badgeCard__num", badge).textContent = years + "+";
      else badge.hidden = true;
    }
    var since = $(".js-since");
    if (since && String(S.sinceYear || "").trim()) since.hidden = false;
  }

  /* ---------------------------------------------------------
     3e) KURUMSAL / YASAL BİLGİLER — config.js
     Hem footer'daki kurumsal satırı hem kvkk.html'deki alanları doldurur.
     Girilmemiş alan hiç görünmez.
     --------------------------------------------------------- */
  function buildLegal() {
    var name    = String(S.legalName || "").trim();
    var manager = String(S.responsibleManager || "").trim();

    // Footer kurumsal satırı — ikisi de boşsa satır görünmez
    var corp = $("#footerCorp");
    if (corp) {
      var bits = [];
      if (name)    bits.push(esc(name));
      if (manager) bits.push("Mesul müdür: " + esc(manager));
      if (bits.length) {
        corp.innerHTML = bits.join(" · ");
        corp.hidden = false;          // HTML'de hidden ile başlıyor
      }
    }

    // Not: unvan boşsa fillSite() metni değiştirmez, kvkk.html'de
    // "kliniğimiz" ifadesi olduğu gibi kalır.
    var mgr = $(".js-manager");
    if (mgr && manager) mgr.hidden = false;

    var upd = $(".js-updated");
    if (upd && String(S.kvkkUpdated || "").trim()) upd.hidden = false;

    // Başvuru e-postası: kvkkEmail girilmemişse genel e-postaya düş
    var mail = $(".js-kvkkMail");
    if (mail) {
      var addr = String(S.kvkkEmail || S.email || "").trim();
      mail.textContent = addr;
    }
  }

  /* ---------------------------------------------------------
     3h) MENÜ — config.js > menu
     Tek listeden hem ana sayfanın hem alt sayfaların menüsü üretilir.
     "#bolum" hedefleri alt sayfalarda otomatik "index.html#bolum" olur.
     --------------------------------------------------------- */
  function anaSayfada() {
    var yol = location.pathname.replace(/\/+$/, "");
    return yol === "" || /\/index\.html$/i.test(yol);
  }

  function menuHref(hedef) {
    if (hedef.charAt(0) !== "#") return hedef;          // ayrı sayfa
    return anaSayfada() ? hedef : "index.html" + hedef;
  }

  function buildNav() {
    var nav = $("#nav");
    if (!nav || !Array.isArray(S.menu)) return;

    var html = S.menu.map(function (m) {
      if (!filled(m.alt)) {
        return '<a href="' + esc(menuHref(m.hedef)) + '">' + esc(m.ad) + '</a>';
      }
      return '<div class="navGroup">' +
               '<a class="navGroup__top" href="' + esc(menuHref(m.hedef)) + '" ' +
                 'aria-haspopup="true" aria-expanded="false">' + esc(m.ad) +
                 '<svg class="ic navGroup__caret"><use href="#i-arrow"/></svg></a>' +
               '<div class="navGroup__menu">' +
                 m.alt.map(function (a) {
                   return '<a href="' + esc(menuHref(a.hedef)) + '">' + esc(a.ad) + '</a>';
                 }).join("") +
               '</div>' +
             '</div>';
    }).join("");

    // Mobil alt butonlar korunur; linkler onların üstüne eklenir
    var cta = $(".nav__mobileCta", nav);
    if (cta) cta.insertAdjacentHTML("beforebegin", html);
    else nav.innerHTML = html;
  }

  /* ---------------------------------------------------------
     3i) FOOTER — config.js > menu (menüyle aynı kaynak)
     Dokuz sayfada da aynı tam footer basılır; bağlantı adresleri
     alt sayfalarda otomatik "index.html#..." olur.
     --------------------------------------------------------- */
  function buildFooter() {
    var foot = $("#footer");
    if (!foot) return;

    var menu = Array.isArray(S.menu) ? S.menu : [];
    var tedaviler = (menu.filter(function (m) { return filled(m.alt); })[0] || {}).alt || [];
    var kurumsal  = menu.filter(function (m) { return !filled(m.alt); });

    /* Link grupları <details> ile kuruluyor. Varsayılan AÇIK gelir; 640px
       altında initFooterFolds() open niteliğini kaldırıp katlar.
       DİKKAT — bunu CSS ile yapmayın: Chrome 128+ kapalı <details> içeriğini
       ::details-content üzerinde content-visibility:hidden ile gizliyor,
       çocuğa display:block vermek içeriği geri getirmiyor (ölçüldü: kutu
       yerleşiyor ama boyanmıyor). Hiçbir link silinmez. */
    function sutun(baslik, ogeler) {
      if (!ogeler.length) return "";
      return '<details class="footer__col footer__col--fold" open>' +
        '<summary><h4>' + esc(baslik) + '</h4></summary>' +
        '<nav class="footer__colLinks" aria-label="' + esc(baslik) + '">' +
        ogeler.map(function (o) {
          return '<a href="' + esc(menuHref(o.hedef)) + '">' + esc(o.ad) + '</a>';
        }).join("") + '</nav></details>';
    }

    foot.innerHTML =
      /* Randevu şeridi: hedef menuHref() ile üretiliyor — ana sayfada
         "#iletisim", alt sayfalarda "index.html#iletisim". */
      '<div class="wrap footer__cta">' +
        '<p>Muayene randevunuzu planlayalım</p>' +
        '<a class="btn btn--primary" href="' + esc(menuHref("#iletisim")) + '">Randevu Al</a>' +
      '</div>' +
      '<div class="wrap footer__in">' +
        '<div class="footer__brand">' +
          '<a href="' + (anaSayfada() ? "#hero" : "index.html") + '" class="logoPlate" aria-label="Ana sayfa">' +
            '<img class="logo__img" src="assets/images/logo.png" alt="" width="1583" height="604">' +
          '</a>' +
          '<p data-site="slogan"></p>' +
          /* Numara config.js > whatsapp'tan geliyor (data-site-href="wa"). */
          '<a class="btn btn--wa" data-site-href="wa" target="_blank" rel="noopener">' +
            '<svg class="ic" aria-hidden="true"><use href="#i-wa"/></svg> WhatsApp\'tan Yaz' +
          '</a>' +
          '<div class="social" id="social"></div>' +
        '</div>' +
        sutun("Tedaviler", tedaviler) +
        sutun("Kurumsal", kurumsal) +
        '<div class="footer__col">' +
          '<h4>İletişim</h4>' +
          '<a data-site-href="tel" data-site="phoneDisplay"></a>' +
          '<a data-site-href="mail" data-site="email"></a>' +
          '<a data-site-href="maps" target="_blank" rel="noopener" data-site="addressFull"></a>' +
          '<span class="js-openNow" data-site="hoursShort"></span>' +
        '</div>' +
      '</div>' +
      '<div class="wrap footer__bottom">' +
        '<p>&copy; <span id="year"></span> <span data-site="brandFull"></span>. Tüm hakları saklıdır.</p>' +
        '<p class="footer__legal">Bu sitedeki bilgiler genel bilgilendirme amaçlıdır; ' +
          'tanı ve tedavi yerine geçmez. Size uygun tedavi ancak muayene sonrası belirlenebilir.</p>' +
        '<p class="footer__corp" id="footerCorp" hidden></p>' +
        '<p class="footer__links"><a href="kvkk.html">Aydınlatma Metni (KVKK)</a></p>' +
      '</div>';
  }

  /* ---------------------------------------------------------
     3g) HEKİM KÜNYESİ + HİZMET KARTI GÖRSELLERİ
     --------------------------------------------------------- */
  function buildCredentials() {
    var box = $("#credCard");
    if (!box) return;
    if (!filled(S.doctorCredentials)) { box.hidden = true; return; }

    box.innerHTML = S.doctorCredentials.map(function (c) {
      return "<div><dt>" + esc(c.label) + "</dt><dd>" + esc(c.value) + "</dd></div>";
    }).join("");
    box.hidden = false;
  }

  /* Kart görseli henüz konmadıysa kırık ikon görünmesin —
     görsel bloğu gizlenir, kart ikonlu hâline döner. */
  function guardCardMedia() {
    $$(".card__media img").forEach(function (img) {
      function hide() {
        var fig = img.closest(".card__media");
        if (fig) fig.hidden = true;
      }
      if (img.complete && img.naturalWidth === 0) hide();
      img.addEventListener("error", hide);
    });
  }

  /* ---------------------------------------------------------
     3f) YAPISAL VERİ (JSON-LD) — Google'ın kliniği tanıması için
     Tamamen config.js ve sayfadaki içerikten üretilir; girilmemiş
     alan şemaya hiç yazılmaz (uydurma veri üretilmez).
     --------------------------------------------------------- */
  var SCHEMA_DAYS = ["pazartesi","sali","carsamba","persembe","cuma","cumartesi","pazar"];
  var SCHEMA_EN    = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  /* "Pazartesi – Cuma" -> ["Monday",…,"Friday"] · "Cumartesi" -> ["Saturday"] */
  function parseDays(label) {
    var found = norm(label).split(" ").filter(function (w) {
      return SCHEMA_DAYS.indexOf(w) > -1;
    });
    if (!found.length) return [];
    var a = SCHEMA_DAYS.indexOf(found[0]);
    var b = found.length > 1 ? SCHEMA_DAYS.indexOf(found[found.length - 1]) : a;
    if (b < a) return [SCHEMA_EN[a]];              // ters aralık: tek gün say
    return SCHEMA_EN.slice(a, b + 1);
  }

  /* "09:00 – 19:00" -> ["09:00","19:00"] */
  function parseTimes(label) {
    var m = String(label || "").match(/\d{1,2}[:.]\d{2}/g);
    if (!m || m.length < 2) return null;
    return [m[0].replace(".", ":"), m[1].replace(".", ":")];
  }

  function openingHours() {
    if (!Array.isArray(S.hours)) return [];
    var out = [];
    S.hours.forEach(function (h) {
      if (h.closed) return;
      var days = parseDays(h.day), times = parseTimes(h.time);
      if (!days.length || !times) return;
      out.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days,
        opens: times[0],
        closes: times[1]
      });
    });
    return out;
  }

  /* Sayfadaki S.S.S. bölümünden FAQPage şeması — metin değişince
     şema kendiliğinden güncel kalsın diye DOM'dan okunuyor. */
  function faqSchema() {
    var items = $$(".faq__item").map(function (d) {
      var q = $("summary", d), a = $(".faq__body", d);
      if (!q || !a) return null;
      return {
        "@type": "Question",
        name: q.textContent.trim(),
        acceptedAnswer: { "@type": "Answer", text: a.textContent.trim() }
      };
    }).filter(Boolean);
    if (!items.length) return null;
    return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items };
  }

  function buildSchema() {
    var site = String(S.siteUrl || "").replace(/\/+$/, "");

    var clinic = {
      "@context": "https://schema.org",
      "@type": "Dentist",
      name: [S.brand, S.brandSuffix].filter(Boolean).join(" "),
      description: (document.querySelector('meta[name="description"]') || {}).content || undefined
    };

    if (S.phoneRaw) clinic.telephone = S.phoneRaw;
    if (S.email)    clinic.email = S.email;
    if (site) {
      clinic.url = site + "/";
      clinic.image = site + "/assets/images/og-kapak.jpg";
    }
    if (S.addressLine || S.addressCity) {
      clinic.address = {
        "@type": "PostalAddress",
        streetAddress: S.addressLine || undefined,
        addressLocality: S.addressCity || undefined,
        addressCountry: "TR"
      };
    }
    var social = Object.keys(S.social || {}).map(function (k) { return S.social[k]; })
                       .filter(Boolean);
    if (social.length) clinic.sameAs = social;

    var hours = openingHours();
    if (hours.length) clinic.openingHoursSpecification = hours;

    [clinic, faqSchema()].filter(Boolean).forEach(function (obj) {
      var tag = document.createElement("script");
      tag.type = "application/ld+json";
      tag.textContent = JSON.stringify(obj);
      document.head.appendChild(tag);
    });
  }

  /* ---------------------------------------------------------
     3j) "ŞU AN AÇIK / KAPALI" GÖSTERGESİ
     config.hours'tan hesaplanır; parseDays/parseTimes yeniden kullanılır.
     Saat DAİMA Europe/Istanbul'a göre — ziyaretçi yurt dışındaysa kendi
     saatine göre yanlış sonuç görmesin.
     Ayrıştırılamayan bir saat biçiminde hiçbir şey yapmaz; fillSite'ın
     yazdığı hoursShort metni olduğu gibi kalır.
     --------------------------------------------------------- */
  var GUN_ADI = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

  /* Türkiye saatiyle {gun: 0-6 (0=Pazar), dk: gece yarısından beri dakika} */
  function trSimdi() {
    try {
      var f = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Istanbul", weekday: "short",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var p = {};
      f.forEach(function (x) { p[x.type] = x.value; });
      var kisa = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(p.weekday);
      if (kisa < 0) return null;
      return { gun: kisa, dk: parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10) };
    } catch (e) { return null; }
  }

  /* config.hours -> haftanın 7 günü için [{ac, kapa}] veya null */
  function haftalikSaatler() {
    if (!Array.isArray(S.hours)) return null;
    var hafta = [null, null, null, null, null, null, null];
    var SIRA = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    var bulundu = false;

    S.hours.forEach(function (h) {
      var gunler = parseDays(h.day);
      if (!gunler.length) return;
      if (h.closed) { bulundu = true; return; }        // kapalı: null kalsın
      var t = parseTimes(h.time);
      if (!t) return;
      function dk(x) { var a = x.split(":"); return parseInt(a[0],10)*60 + parseInt(a[1],10); }
      gunler.forEach(function (g) {
        var i = (SIRA.indexOf(g) + 1) % 7;             // Monday=1 … Sunday=0
        hafta[i] = { ac: dk(t[0]), kapa: dk(t[1]), acS: t[0] };
        bulundu = true;
      });
    });
    return bulundu ? hafta : null;
  }

  function acikDurumMetni() {
    var simdi = trSimdi(), hafta = haftalikSaatler();
    if (!simdi || !hafta) return null;

    var bugun = hafta[simdi.gun];
    function ss(d) { var s2 = Math.floor(d/60), m = d%60;
      return (s2<10?"0":"")+s2+":"+(m<10?"0":"")+m; }

    if (bugun && simdi.dk >= bugun.ac && simdi.dk < bugun.kapa) {
      return { acik: true, metin: "Şu an açık · " + ss(bugun.kapa) + "'a kadar" };
    }
    if (bugun && simdi.dk < bugun.ac) {
      return { acik: false, metin: "Şu an kapalı · " + bugun.acS + "'da açılıyor" };
    }
    // Sonraki açık günü bul
    for (var i = 1; i <= 7; i++) {
      var g = (simdi.gun + i) % 7;
      if (hafta[g]) {
        var ne = i === 1 ? "yarın " : GUN_ADI[g] + " ";
        return { acik: false, metin: "Şu an kapalı · " + ne + hafta[g].acS + "'da açılıyor" };
      }
    }
    return null;
  }

  function buildOpenStatus() {
    var d = acikDurumMetni();
    if (!d) return;                                    // biçim çözülemedi: dokunma
    $$(".js-openNow").forEach(function (el) {
      el.textContent = d.metin;
      el.classList.add("openNow", d.acik ? "is-open" : "is-closed");
    });
  }

  /* ---------------------------------------------------------
     4) ÇALIŞMA SAATLERİ + SOSYAL MEDYA
     --------------------------------------------------------- */
  function buildHours() {
    var t = $("#hoursTable");
    if (!t || !Array.isArray(S.hours)) return;
    t.innerHTML = "<tbody>" + S.hours.map(function (h) {
      return '<tr' + (h.closed ? ' class="is-closed"' : '') + '>' +
               '<td>' + h.day + '</td><td>' + h.time + '</td>' +
             '</tr>';
    }).join("") + "</tbody>";
  }

  /* Hero'daki "Randevu Saatleri" kartinin gun/saat listesi. Iletisimdeki
     tablo ile AYNI kaynaktan (config.js > hours) basilir; saatler iki yerde
     ayri yazilsaydi biri guncellenip digeri unutulurdu. Liste yalnizca
     <=640px'te gorunur (css: .floatCard__days) — masaustunde kart tek
     satirlik ozeti (hoursShort) gostermeye devam eder. */
  function buildHeroHours() {
    var box = $("#heroHours");
    if (!box) return;
    if (!Array.isArray(S.hours) || !S.hours.length) { box.hidden = true; return; }
    box.innerHTML = S.hours.map(function (h) {
      return '<li' + (h.closed ? ' class="is-closed"' : '') + '>' +
               '<span>' + esc(h.day) + '</span><b>' + esc(h.time) + '</b>' +
             '</li>';
    }).join("");
  }

  /* Galerideki "Tedavilerimiz" karosu — footer'daki Tedaviler sütunuyla AYNI
     kaynaktan (config.js > menu) basılır. Liste iki yerde ayrı yazılsaydı
     menüye eklenen bir tedavi burada eksik kalırdı. Menüde alt liste yoksa
     karo tamamen gizlenir. */
  function buildBentoTedaviler() {
    var box = $("#bentoTedaviler");
    if (!box) return;
    var menu = Array.isArray(S.menu) ? S.menu : [];
    var tedaviler = (menu.filter(function (m) { return filled(m.alt); })[0] || {}).alt || [];
    var karo = box.closest(".bento");
    if (!tedaviler.length) { if (karo) karo.hidden = true; return; }
    box.innerHTML = tedaviler.map(function (o) {
      return '<a href="' + esc(menuHref(o.hedef)) + '">' + esc(o.ad) + '</a>';
    }).join("");
  }

  /* ---------------------------------------------------------
     3k) FOOTER LİNK GRUPLARI — mobilde katlanır
     640px altında "Tedaviler" ve "Kurumsal" kapanır; üstünde her zaman açık
     ve başlık tıklanamaz (bkz. style.css > .footer__col--fold).
     --------------------------------------------------------- */
  function initFooterFolds() {
    var gruplar = $$(".footer__col--fold");
    if (!gruplar.length) return;
    var dar = window.matchMedia("(max-width:640px)");

    function uygula() {
      gruplar.forEach(function (g) { g.open = !dar.matches; });
    }
    uygula();
    if (dar.addEventListener) dar.addEventListener("change", uygula);
    else if (dar.addListener) dar.addListener(uygula);
  }

  /* ---------------------------------------------------------
     3l) SÜREÇ ŞERİDİ — 4 adımlık yatay akış
     HTML değişmiyor: <ol class="steps--journey"> şeridin kendisi olur;
     oklar ve 01→04 göstergesi burada üretilir. Kaydırma native CSS
     scroll-snap ile; JS yalnızca aktif adımı işaretler ve okları bağlar.
     Kütüphane yok. Şerit yoksa fonksiyon sessizce çıkar.
     --------------------------------------------------------- */
  function initSurecSlider() {
    var track = $(".steps--journey");
    if (!track) return;
    var adimlar = $$(".step", track);
    if (adimlar.length < 2) return;

    function modGuncelle() {
      var yeni = genis.matches;
      if (yeni === fanMi && track.classList.contains(yeni ? "is-fan" : "is-slider")) {
        if (fanMi) fanYukseklik();
        return;
      }
      fanMi = yeni;
      track.classList.toggle("is-fan", fanMi);
      track.classList.toggle("is-slider", !fanMi);
      if (fanMi) { fanYerlestir(); fanYukseklik(); }
      else { fanTemizle(); }
    }

    var bar = document.createElement("div");
    bar.className = "surecNav";
    bar.innerHTML =
      '<button class="surecNav__ok" type="button" data-yon="-1" aria-label="Önceki adım">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
      '<ol class="surecNav__dots">' +
        adimlar.map(function (s, i) {
          var no = $(".step__num", s);
          return '<li><button type="button" data-i="' + i + '">' +
                 esc(no ? no.textContent.trim() : String(i + 1)) + '</button></li>';
        }).join("") +
      '</ol>' +
      '<button class="surecNav__ok surecNav__ok--ileri" type="button" data-yon="1" aria-label="Sonraki adım">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></button>';
    track.insertAdjacentElement("afterend", bar);

    var noktalar = $$(".surecNav__dots button", bar);
    var oklar = $$(".surecNav__ok", bar);
    var aktif = -1;

    /* Geniş ekranda kartlar yelpaze (fan) olarak üst üste yerleşir; dar ekranda
       kaydırmalı şerit olarak kalır. İki mod tek "aktif" durumunu paylaşır. */
    var genis = window.matchMedia("(min-width:1080px)");   /* 1080px dahil fan modu */
    var fanMi = false;

    /* Aktife göre halka mesafesi: 0 önde, 1 solda, 2 arkada, 3 sağda.
       Değerler ölçülü — kartlar birbirini tamamen örtmez, klinik dili bozulmaz. */
    var FAN = [
      { x:   0, r:  0, s: 1,    y:   0, o: 1,   z: 40 },
      { x: -42, r: -7, s: 0.90, y: -22, o: 0.62, z: 30 },
      { x:   0, r:  0, s: 0.82, y: -44, o: 0.38, z: 20 },
      { x:  42, r:  7, s: 0.90, y: -22, o: 0.62, z: 30 }
    ];

    function fanYerlestir() {
      var n = adimlar.length;
      adimlar.forEach(function (s, i) {
        var d = ((i - aktif) % n + n) % n;
        var f = FAN[Math.min(d, FAN.length - 1)];
        s.style.transform = "translateX(calc(-50% + " + f.x + "%)) translateY(" + f.y +
                            "px) rotate(" + f.r + "deg) scale(" + f.s + ")";
        s.style.opacity = f.o;
        s.style.zIndex = f.z;
      });
    }

    function fanTemizle() {
      adimlar.forEach(function (s) {
        s.style.transform = ""; s.style.opacity = ""; s.style.zIndex = "";
      });
      track.style.height = "";
    }

    function fanYukseklik() {
      var en = 0;
      adimlar.forEach(function (s) { if (s.offsetHeight > en) en = s.offsetHeight; });
      if (en) track.style.height = (en + 56) + "px";   /* 44px kalkış payı + nefes */
    }

    function isaretle(i) {
      i = Math.max(0, Math.min(adimlar.length - 1, i));
      if (i === aktif) return;
      aktif = i;
      adimlar.forEach(function (s, n) {
        s.classList.toggle("is-active", n === aktif);
        s.classList.toggle("is-near", Math.abs(n - aktif) === 1);
      });
      noktalar.forEach(function (d, n) {
        d.classList.toggle("is-active", n === aktif);
        d.setAttribute("aria-current", n === aktif ? "step" : "false");
      });
      oklar[0].disabled = aktif === 0;
      oklar[1].disabled = aktif === adimlar.length - 1;
      if (fanMi) fanYerlestir();
    }

    /* Ok / numara ile geçiş: durum ANINDA burada belirlenir, kaydırma onu takip
       eder. Geniş ekranda şerit son kartın hizasına kadar kaydırılamadığı için
       (scrollLeft üst sınırı) aktif adımı kaydırma konumundan türetmek 03–04'ü
       erişilemez kılıyordu — ölçüldü: 1400px'te ileri oku 01'den sonra 02'de
       takılıyordu. Bu yüzden programatik geçişte scroll dinleyicisi susturulur. */
    var programatik = false, pZaman = null;

    function git(i) {
      i = Math.max(0, Math.min(adimlar.length - 1, i));
      var hedef = adimlar[i];
      if (!hedef) return;
      isaretle(i);
      if (fanMi) return;               /* fan modunda kaydırılacak şerit yok */
      programatik = true;
      clearTimeout(pZaman);
      pZaman = setTimeout(function () { programatik = false; }, 700);
      var maks = track.scrollWidth - track.clientWidth;
      /* scroll-padding-left kadar geri cekilir: CSS'te aktif adim ortada
         duracak sekilde dolgu verildi, hedef de ayni noktayi gostermeli.
         Cikarilmazsa serit saga fazla kayiyor ve genis dar-ekranlarda
         (olculdu: 900-1024px) maksimuma dayanip adim ekran disina tasiyordu. */
      var dolgu = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      var sol = Math.min(Math.max(0, hedef.offsetLeft - track.offsetLeft - dolgu), maks);
      track.scrollTo({ left: sol, behavior: "smooth" });
    }

    oklar.forEach(function (b) {
      b.addEventListener("click", function () { git(aktif + Number(b.getAttribute("data-yon"))); });
    });
    noktalar.forEach(function (d) {
      d.addEventListener("click", function () { git(Number(d.getAttribute("data-i"))); });
    });

    /* Kaydırma durunca sola en yakın adım aktif sayılır */
    var zaman = null;
    track.addEventListener("scroll", function () {
      clearTimeout(zaman);
      zaman = setTimeout(function () {
        if (programatik) return;                 // ok/numara geçişini ezme
        var sol = track.scrollLeft;
        var maks = track.scrollWidth - track.clientWidth;
        if (sol >= maks - 2) { isaretle(adimlar.length - 1); return; }   // sonda: son adım
        if (sol <= 2) { isaretle(0); return; }
        var en = 0, fark = Infinity;
        var dolgu = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
        adimlar.forEach(function (s, n) {
          /* Karsilastirma noktasi git() ile ayni: kaydirma + dolgu. */
          var d = Math.abs((s.offsetLeft - track.offsetLeft) - (sol + dolgu));
          if (d < fark) { fark = d; en = n; }
        });
        isaretle(en);
      }, 90);
    }, { passive: true });

    aktif = -1;
    modGuncelle();
    isaretle(0);

    /* Aktif olmayan karta tıklayınca o adım öne gelir (fan modunda doğal). */
    adimlar.forEach(function (s, i) {
      s.addEventListener("click", function () { if (i !== aktif) git(i); });
    });

    if (genis.addEventListener) genis.addEventListener("change", modGuncelle);
    else if (genis.addListener) genis.addListener(modGuncelle);

    var rZaman = null;
    window.addEventListener("resize", function () {
      clearTimeout(rZaman);
      rZaman = setTimeout(function () { if (fanMi) fanYukseklik(); }, 160);
    }, { passive: true });

    /* Zarif otomatik geçiş: yalnızca bölüm ekrandayken ilerler, ilk kullanıcı
       etkileşiminde kalıcı olarak durur ve hareket azaltma tercihinde hiç
       başlamaz. Kullanıcının kaydırmasıyla yarışmaz. */
    var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (azHareket.matches) return;

    var sayac = null, gorunur = false, durduruldu = false;

    function durdur() {
      if (durduruldu) return;
      durduruldu = true;
      clearInterval(sayac); sayac = null;
    }
    function baslat() {
      if (durduruldu || sayac || !gorunur) return;
      sayac = setInterval(function () {
        if (!gorunur || durduruldu) return;
        git(aktif >= adimlar.length - 1 ? 0 : aktif + 1);
      }, 6500);
    }

    ["pointerdown", "touchstart", "wheel", "keydown"].forEach(function (ev) {
      track.addEventListener(ev, durdur, { passive: true });
    });
    /* click de dinleniyor: klavyeyle (Enter/Space) tetiklenen etkinleştirme
       pointerdown üretmez; kullanıcı kontrole dokunduğu an otomatik geçiş
       kalıcı olarak durmalı. */
    ["pointerdown", "click", "keydown"].forEach(function (ev) {
      bar.addEventListener(ev, durdur);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (girisler) {
        gorunur = girisler[0].isIntersecting;
        if (gorunur) baslat(); else { clearInterval(sayac); sayac = null; }
      }, { threshold: 0.35 }).observe(track);
    }
  }

  /* ---------------------------------------------------------
     3m) TEDAVİ CAROUSEL — yatay kart şeridi
     HTML değişmiyor: mevcut .cards ızgarası şeride dönüşür, oklar ve nokta
     göstergesi burada üretilir. Kaydırma native CSS scroll-snap ile; oklar,
     noktalar ve parmak hareketi tek "aktif" durumunu paylaşır. Kütüphane yok.
     --------------------------------------------------------- */
  function initTedaviCarousel() {
    var track = $(".cards");
    if (!track) return;
    var kartlar = $$(".card", track);
    if (kartlar.length < 2) return;

    track.classList.add("is-carousel");

    var bar = document.createElement("div");
    bar.className = "cardsNav";
    bar.innerHTML =
      '<button class="cardsNav__ok" type="button" data-yon="-1" aria-label="Önceki tedavi">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
      '<ol class="cardsNav__dots">' +
        kartlar.map(function (c, i) {
          var b = $("h3", c);
          return '<li><button type="button" data-i="' + i + '" aria-label="' +
                 esc(b ? b.textContent.trim() : String(i + 1)) + '"></button></li>';
        }).join("") +
      '</ol>' +
      '<button class="cardsNav__ok cardsNav__ok--ileri" type="button" data-yon="1" aria-label="Sonraki tedavi">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></button>';
    track.insertAdjacentElement("afterend", bar);

    var noktalar = $$(".cardsNav__dots button", bar);
    var oklar = $$(".cardsNav__ok", bar);
    var aktif = -1, programatik = false, pZaman = null;

    /* Kartın şerit içindeki yatay konumu.
       .card position:relative olduğu için offsetParent'ı çoğu tarayıcıda
       şeridin kendisidir; o durumda offsetLeft zaten şerit içi konumdur ve
       track.offsetLeft'i ayrıca çıkarmak konumu sayfa payı kadar kaydırır. */
    function icSol(c) {
      return c.offsetParent === track ? c.offsetLeft : c.offsetLeft - track.offsetLeft;
    }

    /* Hizalama CSS'te tanimli: >=1081px'te --kart-hiza:start (kart icerik
       sutununa soldan yaslanir), altinda deger yok ve kart ortalanir.
       Boylece scroll-snap-align ile JS'in hedefi her zaman ayni noktayi
       gosterir; iki yerde ayri sabit tutulmaz. */
    function solaMi() {
      return getComputedStyle(track).getPropertyValue("--kart-hiza").trim() === "start";
    }
    /* Bir kartin aktif sayilmasi icin serit uzerinde bulunmasi gereken nokta. */
    function hizaNoktasi() {
      return solaMi()
        ? track.scrollLeft + parseFloat(getComputedStyle(track).paddingLeft || 0)
        : track.scrollLeft + track.clientWidth / 2;
    }

    function isaretle(i) {
      i = Math.max(0, Math.min(kartlar.length - 1, i));
      if (i === aktif) return;
      aktif = i;
      kartlar.forEach(function (c, n) {
        c.classList.toggle("is-active", n === aktif);
        c.classList.toggle("is-near", Math.abs(n - aktif) === 1);
      });
      noktalar.forEach(function (d, n) {
        d.classList.toggle("is-active", n === aktif);
        d.setAttribute("aria-current", n === aktif ? "true" : "false");
      });
      oklar[0].disabled = aktif === 0;
      oklar[1].disabled = aktif === kartlar.length - 1;
    }

    function git(i) {
      i = Math.max(0, Math.min(kartlar.length - 1, i));
      var hedef = kartlar[i];
      if (!hedef) return;
      isaretle(i);
      programatik = true;
      clearTimeout(pZaman);
      pZaman = setTimeout(function () { programatik = false; }, 700);
      var maks = track.scrollWidth - track.clientWidth;
      /* Hedef, scroll-snap-align ile ayni nokta: masaustunde kartin SOL
         kenari icerik sutununa, altinda kart seridin ORTASINA gelir. */
      var konum = solaMi()
        ? icSol(hedef) - parseFloat(getComputedStyle(track).paddingLeft || 0)
        : icSol(hedef) - (track.clientWidth - hedef.offsetWidth) / 2;
      track.scrollTo({ left: Math.min(Math.max(0, konum), maks), behavior: "smooth" });
    }

    oklar.forEach(function (b) {
      b.addEventListener("click", function () { git(aktif + Number(b.getAttribute("data-yon"))); });
    });
    noktalar.forEach(function (d) {
      d.addEventListener("click", function () { git(Number(d.getAttribute("data-i"))); });
    });

    var zaman = null;
    track.addEventListener("scroll", function () {
      clearTimeout(zaman);
      zaman = setTimeout(function () {
        if (programatik) return;
        var sol = track.scrollLeft;
        var maks = track.scrollWidth - track.clientWidth;
        if (sol >= maks - 2) { isaretle(kartlar.length - 1); return; }
        if (sol <= 2) { isaretle(0); return; }
        var en = 0, fark = Infinity;
        var nokta = hizaNoktasi();
        kartlar.forEach(function (c, n) {
          /* Hiza noktasina en yakin kart aktif olur — snap ile ayni referans. */
          var kRef = solaMi() ? icSol(c) : icSol(c) + c.offsetWidth / 2;
          var f = Math.abs(kRef - nokta);
          if (f < fark) { fark = f; en = n; }
        });
        isaretle(en);
      }, 90);
    }, { passive: true });

    isaretle(0);

    /* Otomatik geçiş: yalnızca bölüm ekrandayken, ilk etkileşimde kalıcı durur,
       hareket azaltma tercihinde hiç başlamaz. */
    var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (azHareket.matches) return;

    var sayac = null, gorunur = false, durduruldu = false;
    function durdur() {
      if (durduruldu) return;
      durduruldu = true; clearInterval(sayac); sayac = null;
    }
    function baslat() {
      if (durduruldu || sayac || !gorunur) return;
      sayac = setInterval(function () {
        if (!gorunur || durduruldu) return;
        git(aktif >= kartlar.length - 1 ? 0 : aktif + 1);
      }, 6000);
    }
    ["pointerdown", "touchstart", "wheel", "keydown"].forEach(function (ev) {
      track.addEventListener(ev, durdur, { passive: true });
    });
    ["pointerdown", "click", "keydown"].forEach(function (ev) {
      bar.addEventListener(ev, durdur);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (g) {
        gorunur = g[0].isIntersecting;
        if (gorunur) baslat(); else { clearInterval(sayac); sayac = null; }
      }, { threshold: 0.3 }).observe(track);
    }
  }

  function buildSocial() {
    var box = $("#social");
    if (!box) return;
    /* Hiç hesap girilmemişse kutuyu tamamen kaldır: boş kalan .social
       yine de margin-top uyguluyor ve marka sütununda ölü boşluk bırakıyordu. */
    if (!S.social || !Object.keys(S.social).some(function (k) { return S.social[k]; })) {
      box.remove(); return;
    }
    var icons = { instagram: "i-ig", facebook: "i-fb", youtube: "i-yt", tiktok: "i-tiktok" };
    var names = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", tiktok: "TikTok" };

    box.innerHTML = Object.keys(icons).filter(function (k) {
      return S.social[k];
    }).map(function (k) {
      return '<a href="' + S.social[k] + '" target="_blank" rel="noopener" aria-label="' + names[k] + '">' +
               '<svg class="ic"><use href="#' + icons[k] + '"/></svg>' +
             '</a>';
    }).join("");
  }

  /* ---------------------------------------------------------
     4b) AÇILIR ALT MENÜ (Tedaviler)
     Durum tek yerde: .navGroup üzerinde is-open + tetikleyicide
     aria-expanded. İkisi hep birlikte değişir.
     Sadece masaüstü genişliğinde; mobilde alt menü zaten açık liste.
     --------------------------------------------------------- */
  function initNavGroups() {
    var gruplar = $$(".navGroup");
    if (!gruplar.length) return;

    var genis = window.matchMedia("(min-width:1081px)");
    var fareVar = window.matchMedia("(hover: hover)");

    function setGroup(g, open) {
      g.classList.toggle("is-open", open);
      var top = $(".navGroup__top", g);
      if (top && genis.matches) top.setAttribute("aria-expanded", String(open));
    }

    /* aria-expanded yalnızca masaüstünde anlamlı. Mobilde alt menü açılır kutu
       değil, hep görünen girintili liste (bkz. style.css "Alt menü mobilde
       açılır kutu değil"): orada aria-expanded="false" bırakmak ekran okuyucuya
       altı tedavi bağlantısı okunabilir dururken "kapalı" demek olur. */
    function ariaSenkronla() {
      gruplar.forEach(function (g) {
        var top = $(".navGroup__top", g);
        if (!top) return;
        if (genis.matches) top.setAttribute("aria-expanded", String(g.classList.contains("is-open")));
        else top.removeAttribute("aria-expanded");
      });
    }

    function hepsiniKapat(haric) {
      gruplar.forEach(function (g) { if (g !== haric) setGroup(g, false); });
    }

    gruplar.forEach(function (g) {
      var top = $(".navGroup__top", g);

      // Yalnızca gerçekten hover'ı olan cihazlarda; dokunmatikte tarayıcı
      // sentetik mouseenter üretiyor ve menüyü erkenden açıyordu.
      g.addEventListener("mouseenter", function () {
        if (genis.matches && fareVar.matches) { hepsiniKapat(g); setGroup(g, true); }
      });
      g.addEventListener("mouseleave", function () {
        if (genis.matches && fareVar.matches) setGroup(g, false);
      });

      // Klavye: gruba odak girince aç, gruptan çıkınca kapat
      g.addEventListener("focusin", function () {
        if (genis.matches) { hepsiniKapat(g); setGroup(g, true); }
      });
      g.addEventListener("focusout", function (e) {
        if (!genis.matches) return;
        if (!g.contains(e.relatedTarget)) setGroup(g, false);
      });

      // Dokunmatik/tıklama: menü kapalıysa ilk tıklama açar (gitmez),
      // ikinci tıklama bağlantıya gider. Hover'ı olmayan cihazlar için şart.
      if (top) {
        // Dokunuşta sentetik mouseenter, click'ten ÖNCE gelip menüyü açabiliyor.
        // O yüzden "menü açık mıydı" bilgisini dokunuşun kendisinde saklıyoruz.
        var dokunmatik = false, oncedenAcik = false;

        top.addEventListener("pointerdown", function (e) {
          dokunmatik = !!e.pointerType && e.pointerType !== "mouse";
          oncedenAcik = g.classList.contains("is-open");
        });

        top.addEventListener("click", function (e) {
          if (!genis.matches) return;              // mobilde liste zaten açık
          var acikti = dokunmatik ? oncedenAcik : g.classList.contains("is-open");
          if (!acikti) {
            e.preventDefault();                    // ilk dokunuş/tık: aç, gitme
            hepsiniKapat(g);
            setGroup(g, true);
          }
          dokunmatik = false;
        });
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      gruplar.forEach(function (g) {
        if (!g.classList.contains("is-open")) return;
        setGroup(g, false);
        var top = $(".navGroup__top", g);
        if (top && g.contains(document.activeElement)) top.focus();
      });
    });

    document.addEventListener("click", function (e) {
      gruplar.forEach(function (g) { if (!g.contains(e.target)) setGroup(g, false); });
    });

    // Genişlik değişince durum sıfırlansın
    var onChange = function () { hepsiniKapat(null); ariaSenkronla(); };
    ariaSenkronla();
    if (genis.addEventListener) genis.addEventListener("change", onChange);
    else if (genis.addListener) genis.addListener(onChange);
  }

  /* ---------------------------------------------------------
     4c) MENÜ ALT ÇİZGİSİ — öğeden öğeye kayan tek gösterge
     Yalnızca masaüstünde ve hareket azaltma kapalıyken kurulur.
     Kurulmazsa .nav'a has-ind sınıfı eklenmez ve CSS'teki tek tek
     ::after alt çizgileri eskisi gibi çalışır.
     --------------------------------------------------------- */
  var NAV_IC = 13;   /* .nav > a yatay iç boşluğu — çizgi hizası buna bağlı */

  function initNavIndicator() {
    var nav = $("#nav");
    if (!nav) return;

    var genis = window.matchMedia("(min-width:1081px)");
    var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    var ind = null, gozlemci = null;

    function hedefler() {
      return $$("#nav > a:not([hidden]), #nav .navGroup__top");
    }

    function tasi(el, gorunur) {
      if (!ind) return;
      if (!el) { ind.style.opacity = "0"; return; }
      var n = nav.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (!r.width) { ind.style.opacity = "0"; return; }
      ind.style.transform = "translateX(" + (r.left - n.left + NAV_IC) + "px)";
      ind.style.width = Math.max(0, r.width - NAV_IC * 2) + "px";
      ind.style.opacity = gorunur === false ? "0" : "1";
    }

    function aktifeDon() {
      // Tetikleyici de aktif olabilir; sadece "#nav > a" ararsak Tedaviler kaçar
      var a = $("#nav > a.is-active:not([hidden]), #nav .navGroup__top.is-active");
      tasi(a, !!a);
    }

    function kur() {
      if (ind) return;
      ind = document.createElement("span");
      ind.className = "nav__ind";
      ind.setAttribute("aria-hidden", "true");
      nav.appendChild(ind);
      nav.classList.add("has-ind");
      aktifeDon();

      // Scrollspy .is-active'i değiştirdiğinde gösterge takip etsin.
      // initScroll'a dokunmadan senkron kalmanın yolu.
      if (window.MutationObserver) {
        gozlemci = new MutationObserver(function () {
          if (!nav.matches(":hover") && !nav.contains(document.activeElement)) aktifeDon();
        });
        gozlemci.observe(nav, { attributes: true, attributeFilter: ["class"], subtree: true });
      }
    }

    function kaldir() {
      if (!ind) return;
      if (gozlemci) { gozlemci.disconnect(); gozlemci = null; }
      ind.parentNode.removeChild(ind);
      ind = null;
      nav.classList.remove("has-ind");
    }

    function tazele() {
      if (genis.matches && !azHareket.matches) { kur(); aktifeDon(); }
      else kaldir();
    }

    nav.addEventListener("mouseover", function (e) {
      if (!ind) return;
      var t = e.target.closest("#nav > a, .navGroup__top");
      if (t && hedefler().indexOf(t) > -1) tasi(t);
    });
    nav.addEventListener("mouseleave", aktifeDon);
    nav.addEventListener("focusin", function (e) {
      if (!ind) return;
      var t = e.target.closest("#nav > a, .navGroup__top");
      if (t && hedefler().indexOf(t) > -1) tasi(t);
    });
    nav.addEventListener("focusout", function (e) {
      if (ind && !nav.contains(e.relatedTarget)) aktifeDon();
    });

    window.addEventListener("resize", function () {
      if (!ind) return;
      aktifeDon();
    });

    if (genis.addEventListener) {
      genis.addEventListener("change", tazele);
      azHareket.addEventListener("change", tazele);
    } else if (genis.addListener) {
      genis.addListener(tazele);
      azHareket.addListener(tazele);
    }

    tazele();
  }

  /* ---------------------------------------------------------
     5) MOBİL MENÜ
     --------------------------------------------------------- */
  function initNav() {
    var burger = $("#burger");
    var nav    = $("#nav");
    if (!burger || !nav) return;

    var scrim = document.createElement("div");
    scrim.className = "navScrim";
    document.body.appendChild(scrim);

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      scrim.classList.toggle("is-on", open);
      document.body.classList.toggle("is-locked", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    }

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    scrim.addEventListener("click", function () { setOpen(false); });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    // Masaüstüne geçildiğinde menü açık kalmasın
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080 && nav.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---------------------------------------------------------
     6) SCROLL: yapışkan header, aktif menü, yukarı çık
     --------------------------------------------------------- */
  function initScroll() {
    var header = $("#header");
    var toTop  = $("#toTop");
    var fab    = $(".waFab");
    var footer = $("#footer");
    /* Açılır menü tetikleyicisi (.navGroup__top) .nav'ın doğrudan çocuğu
       değil — seçiciye ayrıca eklenmezse "Tedaviler" hiç aktif olmuyor. */
    var links  = $$('.nav > a[href^="#"], .nav .navGroup__top[href^="#"]');

    /* Menüdeki sıra sayfadaki bölüm sırasıyla aynı olmak zorunda değil
       (örn. "Galeri" menüde 3., sayfada 8. sırada). Aktif bölümü doğru
       bulmak için çiftleri SAYFA sırasına göre diziyoruz; menü sırasına
       güvenilirse yanlış bağlantı işaretleniyor. */
    var ciftler = links.map(function (a) {
      return { link: a, sec: $(a.getAttribute("href")) };
    }).filter(function (c) { return c.sec; });

    ciftler.sort(function (x, y) {
      var poz = x.sec.compareDocumentPosition(y.sec);
      return (poz & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;

      if (header) header.classList.toggle("is-stuck", y > 8);
      if (toTop)  toTop.classList.toggle("is-on", y > 700);

      /* Sabit WhatsApp balonu footer'a girince gizlenir — footer'da zaten
         "WhatsApp'tan Yaz" butonu var ve balon alt seritteki KVKK linkinin
         ustune biniyordu. */
      if (fab && footer) {
        fab.classList.toggle("is-off",
          footer.getBoundingClientRect().top < window.innerHeight - 40);
      }

      var aktif = null;
      ciftler.forEach(function (c) {
        // Gizli bölümün rect'i sıfır döner; kontrol etmezsek hep "aktif" sayılır
        if (c.sec.hidden) return;
        if (c.sec.getBoundingClientRect().top <= 140) aktif = c.link;
      });
      links.forEach(function (a) { a.classList.toggle("is-active", a === aktif); });

      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    update();
  }

  /* ---------------------------------------------------------
     6b) ANCHOR KONUMLANDIRMA — TEK MEKANİZMA

     Kök neden (ölçüldü): sayfada anchor konumunu belirleyen ÜÇ ayrı yol vardı
     ve üçü farklı sonuç veriyordu:
       1) Tarayıcının kendi fragment atlaması — CSS'teki scroll-padding-top'u
          kullanıyordu; o da sabit 96px'ti. Gerçek yapışkan header masaüstünde
          81px, ≤1080px'te 71px olduğu için her tıklamada 15–25px kayıyordu.
       2) Sayfa #hash ile açıldığında bu atlama bir de rAF ve load olayında
          tekrarlanıyordu (üç konumlandırma arka arkaya).
       3) Geri/ileri tuşunda tarayıcının konum geri yüklemesi ile hashchange
          dinleyicisi aynı anda devreye giriyordu.

     Çözüm: konum TEK bir formülden gelir ve iki yol da aynı sonucu verir —
         hedefY = sec.getBoundingClientRect().top + window.scrollY - headerH
     JS yolu bu formülü doğrudan kullanır; CSS yolu (klavye, JS'siz, native)
     scroll-padding-top:var(--headerH) ile aynı noktaya oturur. Böylece iki yol
     çakışsa bile piksel piksel aynı yeri hedefler.

     Keyfi sabit yok: akordeona, bölüme ya da ekran genişliğine bağlı hiçbir
     ek offset kullanılmıyor. Konum her seferinde o anki DOM geometrisinden
     yeniden ölçülür; akordeon açılıp kapandığında ya da görsel yüklendiğinde
     önceden hesaplanmış değer kullanılmaz.
     --------------------------------------------------------- */

  function headerYuksekligi() {
    var h = $("#header");
    if (!h) return 0;
    var st = getComputedStyle(h);
    if (st.position !== "sticky" && st.position !== "fixed") return 0;
    return h.getBoundingClientRect().height;
  }

  function headerOlc() {
    document.documentElement.style.setProperty("--headerH", Math.round(headerYuksekligi()) + "px");
  }

  /* Hedefin o ANKİ document koordinatı. Önbellek yok. */
  function anchorHedefi(sec) {
    var y = sec.getBoundingClientRect().top + window.scrollY - headerYuksekligi();
    var enFazla = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(Math.round(y), Math.round(enFazla)));
  }

  function anchorGit(sec, yumusak) {
    window.scrollTo({ top: anchorHedefi(sec), behavior: yumusak ? "smooth" : "instant" });
  }

  function hashBolumu(hash) {
    if (!hash || hash.length < 2) return null;
    var el = null;
    try { el = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { el = null; }
    return el && !el.hidden ? el : null;
  }

  function initAnchors() {
    headerOlc();

    var azalt = window.matchMedia("(prefers-reduced-motion: reduce)");
    var bekle = false;
    window.addEventListener("resize", function () {
      if (bekle) return;
      bekle = true;
      requestAnimationFrame(function () { headerOlc(); bekle = false; });
    });
    /* Yazı tipi geç yüklenince header yüksekliği değişebiliyor */
    window.addEventListener("load", headerOlc);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(headerOlc);

    /* --- Yol 1: sayfa içi bağlantı tıklaması ---
       preventDefault ile tarayıcının kendi atlaması kapatılır; konumu yalnızca
       biz belirleriz. Adres çubuğu pushState ile güncellenir — pushState
       hashchange TETİKLEMEZ, dolayısıyla ikinci bir kaydırma oluşmaz. */
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;          // açılır menü gibi başka kod hallettiyse karışma
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank") return;

      var u;
      try { u = new URL(a.getAttribute("href"), location.href); } catch (hata) { return; }
      if (u.pathname !== location.pathname || u.search !== location.search) return;

      var sec = hashBolumu(u.hash);
      if (!sec) return;

      e.preventDefault();
      anchorGit(sec, !azalt.matches);
      if (location.hash !== u.hash) history.pushState(null, "", u.hash);
    });

    /* --- Yol 2: geri/ileri tuşu ---
       popstate ve hashchange aynı gezinmede birlikte tetiklenebiliyor; ikisini
       birden dinlemek çift kaydırma demek. Yalnızca popstate dinleniyor
       (pushState ile yazdığımız girdiler buradan geri gelir) ve tarayıcının
       kendi konum geri yüklemesi manuel'e alınarak devre dışı bırakılıyor. */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.addEventListener("popstate", function () {
      var sec = hashBolumu(location.hash);
      if (sec) anchorGit(sec, false);
      else window.scrollTo({ top: 0, behavior: "instant" });
    });

    /* --- Yol 3: sayfa #hash ile açıldı (tedavi sayfasından gelen
       index.html#iletisim gibi) ---
       Tarayıcı zaten bir atlama yapmış olabilir; doğru konuma TEK seferde
       yerleştiriyoruz. Görseller yüklendikçe yükseklik değişebildiği için
       yerleştirme "load" sonrasına bırakılıyor. */
    var acilisSec = hashBolumu(location.hash);
    if (acilisSec) {
      var yerlestir = function () { headerOlc(); anchorGit(acilisSec, false); };
      if (document.readyState === "complete") requestAnimationFrame(yerlestir);
      else window.addEventListener("load", function () { requestAnimationFrame(yerlestir); }, { once: true });
    }
  }

  /* ---------------------------------------------------------
     7) SCROLL ANİMASYONU + SAYAÇ TETİĞİ
     --------------------------------------------------------- */
  function initReveal() {
    var items = $$(".reveal");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      $$(".stat__num").forEach(countUp);
      return;
    }

    // Aynı satırdaki kartlar sırayla belirsin
    items.forEach(function (el) {
      var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
        return n.classList && n.classList.contains("reveal");
      });
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 90 + "ms");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function (el) { io.observe(el); });

    var statsBox = $("#stats");
    if (statsBox) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          $$(".stat__num", statsBox).forEach(countUp);
          sio.disconnect();
        });
      }, { threshold: 0.4 });
      sio.observe(statsBox);
    }
  }

  /* ---------------------------------------------------------
     8) ÖNCESİ / SONRASI SÜRGÜSÜ
     --------------------------------------------------------- */
  function initBeforeAfter() {
    $$("[data-ba]").forEach(function (fig) {
      var stage = $(".ba__stage", fig);
      var range = $(".ba__range", fig);
      if (!stage || !range) return;

      function apply() { stage.style.setProperty("--pos", range.value + "%"); }
      range.addEventListener("input", apply);
      apply();
    });
  }

  /* ---------------------------------------------------------
     9) S.S.S. AKORDEONU
     <details>/<summary> semantiği bilerek korunuyor: klavye, ekran okuyucu ve
     tarayıcının "sayfada bul" özelliği oradan geliyor, taklit etmeye gerek yok.
     JS iki şey ekliyor:
       1) kapanışı animasyon bitene kadar geciktirmek (tarayıcı open'ı kaldırınca
          içeriği anında yok ediyor, geçiş görünmüyordu),
       2) aynı anda tek soru açık kalması (React bileşenindeki openIndex davranışı).
     Hareket azaltma açıkken hiç kurulmuyor; o zaman tarayıcının anında açılıp
     kapanan yerel davranışı geçerli olur.
     --------------------------------------------------------- */
  function initFaq() {
    var ogeler = $$(".faq__item");
    if (!ogeler.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var SURE = 300;   // css'teki grid-template-rows geçişiyle aynı

    function kapat(d) {
      if (!d.open || d.dataset.kapaniyor) return;
      d.dataset.kapaniyor = "1";
      d.classList.add("is-closing");
      setTimeout(function () {
        d.open = false;
        d.classList.remove("is-closing");
        delete d.dataset.kapaniyor;
      }, SURE);
    }

    ogeler.forEach(function (d) {
      var baslik = $("summary", d);
      if (!baslik) return;
      baslik.addEventListener("click", function (e) {
        e.preventDefault();                 // açma/kapama kontrolü bizde
        if (d.open) { kapat(d); return; }
        ogeler.forEach(function (o) { if (o !== d) kapat(o); });
        d.open = true;
      });
    });
  }

  /* ---------------------------------------------------------
     11) BAŞLAT
     --------------------------------------------------------- */
  function init() {
    buildNav();        // fillSite'tan ÖNCE: menü/footer içindeki data-site
    buildFooter();     // bağlantıları da dolsun; hideSection de bunları görebilsin
    buildBentoTedaviler();
    fillSite();
    buildOpenStatus();
    buildStats();
    buildReviews();
    buildCases();      // initBeforeAfter'dan ÖNCE: sürgüler bu kartların içinde
    buildClaims();
    buildCredentials();
    guardCardMedia();
    buildLegal();
    buildHours();
    buildHeroHours();
    buildSocial();
    initSurecSlider();
    initTedaviCarousel();
    initFooterFolds();
    initNavGroups();
    initNavIndicator();
    initNav();
    initAnchors();
    initScroll();
    initReveal();
    initBeforeAfter();
    initFaq();

    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    buildSchema();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
