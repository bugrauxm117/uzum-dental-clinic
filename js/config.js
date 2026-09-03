/* =========================================================
   SİTE AYARLARI — Tüm klinik bilgileri SADECE bu dosyada.
   Buradaki değerleri değiştirin, site otomatik güncellenir.
   Başka hiçbir dosyaya dokunmanıza gerek yok.
   ========================================================= */

/* YAYINA ALMADAN ÖNCE DOLDURULMASI GEREKENLER
   ------------------------------------------------
   doctorName · doctorTitle           → hekim bilgileri
   phoneDisplay · phoneRaw · whatsapp → telefon ve WhatsApp
   email                              → e-posta
   addressLine · addressCity · mapsQuery → adres
   social.instagram · social.facebook → kendi profil adresleriniz
   legalName · responsibleManager     → kurumsal / KVKK
   siteUrl                            → alan adı alındığında
   ------------------------------------------------ */

window.SITE = {

  /* --- Kimlik (logodan geliyor, değiştirmeyin) --- */
  brand: "Üzüm",
  brandSuffix: "Dental Clinic",
  slogan: "Gülüşünüz, en iyi yatırımınız.",

  /* --- Hekim --- ⚠️ DEĞİŞTİRİN */
  doctorName: "Mustafa Birhan Üzüm",
  doctorTitle: "Kurucu Hekim · Estetik Diş Hekimliği",

  /* --- İletişim --- ⚠️ DEĞİŞTİRİN --- */
  phoneDisplay: "0536 917 19 66",           // ekranda görünen hâli
  phoneRaw: "+905369171966",                // tıklanınca aranan numara (boşluksuz)
  whatsapp: "905369171966",                 // ÜLKE KODU + NUMARA. Başında + ve boşluk YOK!
  email: "uzumdentalclinic@gmail.com",

  /* --- Adres --- ⚠️ DEĞİŞTİRİN --- */
  addressLine: "Şahveli, Değirmen Sk. No:5 D:S",
  addressCity: "27000 Şahinbey/Gaziantep",
  mapsQuery: "Şahveli, Değirmen Sk. No:5 D:S, 27000 Şahinbey/Gaziantep",   // "Yol tarifi" butonu bunu arar

  /* --- Çalışma Saatleri --- */
  hours: [
    { day: "Pazartesi – Cumartesi", time: "09:00 – 18:00" },
    { day: "Pazar",                 time: "Kapalı", closed: true }
  ],
  hoursShort: "Pazartesi – Cumartesi 09:00 – 18:00",

  /* --- Site adresi --- ⚠️ DEĞİŞTİRİN -------------------------------------
     Alan adını aldığınızda buraya yazın (sonunda / olmadan), örn:
     "https://uzumdental.com". Doldurunca WhatsApp/Facebook paylaşım görseli
     ve Google'a verilen yapısal veri otomatik olarak doğru adresi kullanır.
     Boşken site çalışır, sadece bu iki şey devre dışı kalır.
     -------------------------------------------------------------------- */
  siteUrl: "",

  /* --- Sosyal Medya --- ⚠️ KENDİ PROFİL ADRESLERİNİZİ YAZIN ---
     Boş bırakılan ikon otomatik gizlenir. Yanlış/eksik adres bırakmaktansa
     boş bırakın — ziyaretçi boş bir profile düşmesin. --- */
  social: {
    instagram: "",
    facebook:  "",
    youtube:   "",
    tiktok:    ""
  },

  /* --- Kuruluş yılı --- boş bırakılırsa "…'ten bu yana" cümlesi gizlenir --- */
  sinceYear: "",                            // örn: "2013"

  /* --- Hakkımızda'daki deneyim rozeti --- boşsa rozet görünmez --- */
  experienceYears: "",                      // örn: "12"

  /* --- Rakamlar (hero altındaki şerit) ---------------------------------
     Boş bırakıldı: uydurma rakam yazmayın. Yalnızca DOĞRULAYABİLECEĞİNİZ
     sayıları girin; dizi boşken şerit hiç görünmez.
     Örnek:
       { value: 12,  suffix: "+", label: "Yıllık Deneyim" },
       { value: 4.8, suffix: "",  label: "Google Puanı", decimal: true }
     -------------------------------------------------------------------- */
  stats: [],

  /* --- Hasta yorumları -------------------------------------------------
     Boş bırakıldı: bölüm ve menüdeki "Yorumlar" linki otomatik gizlenir.
     SADECE gerçekten alınmış yorumları ekleyin — uydurma yorum yayımlamak
     yönetmelik ihlalidir. Hastanın adını kısaltarak yazın.
       { name: "Elif K.", topic: "İmplant tedavisi", text: "..." }
     -------------------------------------------------------------------- */
  reviews: [],

  /* --- Öncesi / Sonrası vakaları ---------------------------------------
     Boş bırakıldı: bölüm ve menüdeki "Sonuçlar" linki otomatik gizlenir.
     ⚠️ Buraya YALNIZCA kendi hastanızın, YAZILI ONAYI alınmış fotoğrafı
     konur. Stok ya da AI görseli koymak olmamış bir sonucu gerçek gibi
     göstermek olur. Dosyaları assets/images/ içine koyup adını yazın:
       { title: "İmplant + Zirkonyum", detail: "Alt çene · 4 ay",
         before: "vaka1-once.jpg", after: "vaka1-sonra.jpg" }
     -------------------------------------------------------------------- */
  cases: [],

  /* --- Menü --- tüm sayfalardaki menü buradan üretilir ----------------
     Tek yerden yönetilir: burada değiştirdiğinizde ana sayfada da,
     tedavi/KVKK/404 sayfalarında da güncellenir.
       hedef "#..."     -> ana sayfadaki bölüm (alt sayfalarda otomatik
                           "index.html#..." hâline gelir)
       hedef "x.html"   -> ayrı sayfa
       alt: [...]       -> açılır alt menü
     -------------------------------------------------------------------- */
  menu: [
    { ad: "Tedaviler", hedef: "#hizmetler", alt: [
      { ad: "İmplant Tedavisi",     hedef: "implant-tedavisi.html" },
      { ad: "Gülüş Tasarımı",       hedef: "gulus-tasarimi.html" },
      { ad: "Ortodonti",            hedef: "ortodonti.html" },
      { ad: "Diş Beyazlatma",       hedef: "dis-beyazlatma.html" },
      { ad: "Çocuk Diş Hekimliği",  hedef: "cocuk-dis-hekimligi.html" },
      { ad: "Kanal & Diş Eti",      hedef: "kanal-ve-dis-eti.html" }
    ]},
    { ad: "Hakkımızda", hedef: "#hakkimizda" },
    { ad: "Sonuçlar",   hedef: "#sonuclar" },   // cases boşken otomatik gizlenir
    { ad: "Yorumlar",   hedef: "#yorumlar" },   // reviews boşken otomatik gizlenir
    { ad: "S.S.S.",     hedef: "#sss" },
    { ad: "İletişim",   hedef: "#iletisim" }
  ],

  /* --- Hekim künyesi (Hakkımızda bölümündeki panel) -------------------
     Boş bırakıldı: panel görünmez. Yalnızca doğrulanabilir bilgi girin —
     mezuniyet, ilgi alanı, oda üyeliği, sertifika gibi.
       { label: "Mezuniyet",  value: "… Üniversitesi Diş Hekimliği Fak., 2011" },
       { label: "İlgi alanı", value: "İmplantoloji, estetik diş hekimliği" },
       { label: "Üyelik",     value: "İstanbul Diş Hekimleri Odası" }
     -------------------------------------------------------------------- */
  doctorCredentials: [],

  /* --- Kurumsal / yasal bilgiler --- ⚠️ DEĞİŞTİRİN ---------------------
     Boş bırakılan alanlar sitede hiç görünmez. kvkk.html sayfası ve
     footer'daki kurumsal satır bu değerlerden beslenir.
     -------------------------------------------------------------------- */
  legalName: "",            // Veri sorumlusu ticari unvan
                            // örn: "Üzüm Ağız ve Diş Sağlığı Polikliniği Ltd. Şti."
  responsibleManager: "",   // Mesul müdür hekim — örn: "Dt. Ayşe Yılmaz"
  kvkkEmail: "",            // KVKK başvuruları için e-posta (boşsa yukarıdaki `email`)
  kvkkUpdated: "",          // Aydınlatma metni güncelleme tarihi — örn: "26.08.2026"

  /* --- WhatsApp'a gidecek hazır mesajın başlığı --- */
  waIntro: "Merhaba, Üzüm Dental Clinic’ten randevu talebinde bulunmak istiyorum. Uygun gün ve saatler hakkında bilgi alabilir miyim?"
};
