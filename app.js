/* Bilan Actif — interactions. Aucun traceur, aucune dépendance. */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Valeurs issues de config.js ---------- */
  $$("[data-prix]").forEach(function (e) { e.textContent = S.prix; });
  $$("[data-annul]").forEach(function (e) { e.textContent = S.annulationHeures; });
  $$("[data-recap]").forEach(function (e) { e.textContent = S.recapHeures; });
  if (S.instagram) $$("[data-instagram]").forEach(function (a) { a.href = S.instagram; a.hidden = false; });
  if (S.email) $$("[data-email]").forEach(function (a) { a.href = "mailto:" + S.email; a.hidden = false; });

  $$("[data-carte]").forEach(function (e) { e.textContent = S.carte || ""; });

  /* ---------- Photos : un emplacement vide est masqué ---------- */
  $$("[data-photo]").forEach(function (fig) {
    var src = (S.photos || {})[fig.dataset.photo];
    if (!src) {
      if (fig.classList.contains("hero__photo")) fig.parentNode.classList.add("no-photo");
      fig.hidden = true; return;
    }
    var img = new Image();
    img.alt = fig.dataset.alt || "";
    img.decoding = "async";
    if (fig.hasAttribute("data-eager")) img.fetchPriority = "high";
    img.src = src;
    var frame = fig.classList.contains("shot") ? fig : $(".shot", fig);
    frame.insertBefore(img, frame.firstChild);
  });

  /* ---------- En-tête ---------- */
  var top = $(".top");
  var onScroll = function () { top.classList.toggle("is-stuck", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Apparitions : titres, masques photo, tracé des annotations ---------- */
  var reveals = $$(".rise, .shot");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("is-in"); });

  /* ---------- Frise des 60 minutes : se remplit au défilement ---------- */
  var tl = $("#tl");
  if (tl) {
    var items = $$("li", tl), ticking = false;
    var paint = function () {
      ticking = false;
      var r = tl.getBoundingClientRect(), line = window.innerHeight * 0.62;
      var p = Math.max(0, Math.min(1, (line - r.top) / r.height));
      tl.style.setProperty("--p", p.toFixed(3));
      items.forEach(function (li) { li.classList.toggle("is-past", li.getBoundingClientRect().top + 12 < line); });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener("resize", paint); paint();
  }

  /* ---------- Hero : titre ligne à ligne, léger décalage de la photo ---------- */
  var hero = $(".hero"), heroPhoto = $(".hero__photo");
  var ready = function () { hero.classList.add("is-ready"); if (heroPhoto) heroPhoto.classList.add("is-in"); };
  requestAnimationFrame(ready); setTimeout(ready, 120);
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Bandeau lié au défilement + barre mobile ---------- */
  var tick = $(".ticker__in"), dock = $("#dock"), bookSec = $("#reserver"), fx = false;
  var onFx = function () {
    fx = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (!calm && heroPhoto && y < vh) heroPhoto.style.transform = "translate3d(0," + (y * 0.1).toFixed(1) + "px,0)";
    if (!calm && tick) {
      var r = tick.parentNode.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) tick.style.transform = "translate3d(" + (-(vh - r.top) * 0.35).toFixed(1) + "px,0,0)";
    }
    if (dock) {
      var b = bookSec.getBoundingClientRect();
      dock.classList.toggle("is-on", y > vh * 0.7 && (b.top > vh * 0.85 || b.bottom < 0));
    }
  };
  window.addEventListener("scroll", function () { if (!fx) { fx = true; requestAnimationFrame(onFx); } }, { passive: true });
  onFx();

  /* ---------- Réservation ---------- */
  var form = $("#bk-form"), panel = $("#booking");
  var back = $("#bk-back"), count = $("#bk-count"), bar = $("#bk-progress");
  var calLink = (S.calendly || "").trim();
  var kind = calLink ? "cal" : "manuel";
  var QUESTIONS = 5, SLOT = 5, DONE = 6, current = 0;

  function stepEl(n) {
    return $$(".step", form).filter(function (el) {
      return +el.dataset.step === n && (!el.dataset.kind || el.dataset.kind === kind);
    })[0];
  }

  function show(n, focus) {
    current = n;
    $$(".step", form).forEach(function (el) { el.classList.remove("is-on"); });
    var el = stepEl(n);
    el.classList.add("is-on");
    back.hidden = n === 0 || n === DONE;
    count.textContent = n < QUESTIONS ? "Question " + (n + 1) + " sur " + QUESTIONS
      : n === SLOT ? "Dernière étape" : "Terminé";
    bar.style.width = Math.min(100, ((n + 1) / (DONE + 1)) * 100) + "%";
    if (focus) {
      var h = $("legend, .step__h", el);
      if (h) h.focus({ preventScroll: true });
      var r = panel.getBoundingClientRect();
      if (r.top < 64 || r.top > window.innerHeight * 0.5) panel.scrollIntoView({ block: "start" });
    }
    if (n === SLOT && kind === "cal") loadCal();
  }

  // Choix rapide → question suivante
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.type !== "radio") return;
    var n = +t.closest(".step").dataset.step;
    setTimeout(function () { if (current === n) show(n + 1, true); }, 260);
  });
  // Re-toucher une réponse déjà cochée (après « Retour ») avance aussi
  form.addEventListener("click", function (e) {
    var t = e.target;
    if (t.type === "radio" && t.dataset.was === "1") {
      var n = +t.closest(".step").dataset.step;
      if (current === n) show(n + 1, true);
    }
    $$("input[type=radio]", form).forEach(function (r) { r.dataset.was = r.checked ? "1" : ""; });
  });

  back.addEventListener("click", function () { if (current > 0) show(current - 1, true); });

  $("#bk-to-slot").addEventListener("click", function () {
    var ack = $("#bk-ack"), err = $("#bk-ack-err");
    if (!ack.checked) { err.hidden = false; ack.focus(); return; }
    err.hidden = true;
    show(SLOT, true);
  });

  function answers() {
    var d = new FormData(form);
    return {
      "Objectif": d.get("objectif") || "—",
      "Niveau actuel": d.get("niveau") || "—",
      "Frein principal": d.get("difficulte") || "—",
      "Lieu de pratique": d.get("lieu") || "—",
      "Contrainte pratique": (d.get("contrainte") || "").trim() || "—"
    };
  }
  function answersText() {
    var a = answers();
    return Object.keys(a).map(function (k) { return k + " : " + a[k]; }).join("\n");
  }

  function done(title, text) {
    $("#bk-done-title").textContent = title;
    $("#bk-done-text").textContent = text;
    show(DONE, true);
  }

  /* --- Calendly : calendrier, anti-double-réservation, emails et lien visio --- */
  var calLoaded = false;
  function loadCal() {
    if (calLoaded) return; calLoaded = true;
    var url = /^https?:/.test(calLink) ? calLink : "https://calendly.com/" + calLink.replace(/^\/+/, "");
    url += (url.indexOf("?") < 0 ? "?" : "&") +
      "hide_gdpr_banner=1&hide_event_type_details=1&background_color=ede8df&text_color=161514&primary_color=c4581f";
    var box = $("#cal-inline");
    var s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.onload = function () {
      box.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: url, parentElement: box,
        prefill: { customAnswers: { a1: answersText() } }
      });
    };
    s.onerror = function () {
      box.innerHTML = '<p class="cal__load">Le calendrier ne se charge pas. <a href="' + url + '" target="_blank" rel="noopener">Ouvrir la réservation dans un nouvel onglet</a>.</p>';
    };
    document.head.appendChild(s);
    window.addEventListener("message", function (e) {
      if (!/calendly\.com$/.test((e.origin || "").replace(/^https?:\/\//, ""))) return;
      if (!e.data || e.data.event !== "calendly.event_scheduled") return;
      var pay = $("#bk-pay"), paid = S.mode === "commercial" && S.stripe;
      if (paid) { pay.href = S.stripe; pay.hidden = false; }
      done(paid ? "Créneau choisi." : "C'est réservé.",
        paid ? "Dernière étape : règle ta séance pour la confirmer. Tu reçois ensuite l'email avec le lien de visio."
             : "Tu vas recevoir un email de confirmation avec la date, l'heure, le lien de visio et le lien pour reporter ou annuler.");
    });
  }

  /* --- Demande manuelle : formulaire → email --- */
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== "Europe/Paris") $("#bk-tz").textContent = " (ton fuseau détecté : " + tz.replace(/_/g, " ") + ")";
  } catch (e) {}

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (current !== SLOT || kind !== "manuel") return;
    var el = stepEl(SLOT), err = $("#bk-send-err"), btn = $("#bk-send");
    var prenom = $("[name=prenom]", el), email = $("[name=email]", el);
    var dispo = $$("[name=dispo]:checked", el).map(function (c) { return c.value; });
    err.hidden = true;
    if (!prenom.value.trim()) { err.textContent = "Indique ton prénom."; err.hidden = false; prenom.focus(); return; }
    if (!email.checkValidity() || !email.value) { err.textContent = "Vérifie ton adresse email."; err.hidden = false; email.focus(); return; }
    if (!dispo.length) { err.textContent = "Choisis au moins un moment possible."; err.hidden = false; return; }

    var payload = Object.assign({
      "Prénom": prenom.value.trim(), "Email": email.value.trim(), email: email.value.trim(),
      "Disponibilités": dispo.join(", "), "Mode": S.mode,
      _subject: "Bilan Actif — demande de " + prenom.value.trim()
    }, answers());
    var okText = "Je te réponds par email sous 24 h avec deux propositions de créneaux" +
      (S.mode === "commercial" ? " et le lien de paiement sécurisé." : ".") + " Pense à vérifier tes indésirables.";

    if (S.formEndpoint) {
      btn.disabled = true;
      fetch(S.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw 0; done("Demande envoyée, " + payload["Prénom"] + ".", okText); })
        .catch(function () {
          btn.disabled = false;
          err.textContent = "L'envoi n'a pas abouti. Réessaie" + (S.email ? " ou écris-moi à " + S.email + "." : " dans un instant.");
          err.hidden = false;
        });
    } else if (S.email) {
      var body = Object.keys(payload).filter(function (k) { return k !== "email" && k !== "_subject"; })
        .map(function (k) { return k + " : " + payload[k]; }).join("\n");
      location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent(payload._subject) + "&body=" + encodeURIComponent(body);
      done("Plus qu'à envoyer.", "Ton application mail vient de s'ouvrir avec ta demande pré-remplie : envoie le message pour la valider. " + okText);
    } else {
      done("Aperçu — rien n'a été envoyé.", "La réservation n'est pas encore branchée : renseigne ton lien Calendly ou un email dans config.js.");
    }
  });

  $$(".obs__row").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".obs__row").forEach(function (x) { x.classList.toggle("is-picked", x === btn); });
      var r = $$("[name=difficulte]", form).filter(function (i) { return i.value === btn.dataset.frein; })[0];
      if (r) { r.checked = true; r.dataset.was = "1"; }
      if (current > 4) show(0, false);
      $("#reserver").scrollIntoView();
    });
  });

  show(0, false);
})();
