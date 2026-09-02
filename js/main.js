/* ============ TRUE POWER — SITE LOGIC ============ */
(function () {
  const C = window.TP_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => `${C.billing.currency}${n}`;

  /* ---------- Populate business details ---------- */
  document.title = `${C.business.name} — ${C.business.tagline} with ${C.coach.name}`;
  $$("[data-biz]").forEach((el) => { el.textContent = C.business[el.dataset.biz] ?? ""; });
  $$("[data-coach]").forEach((el) => { el.textContent = C.coach[el.dataset.coach] ?? ""; });
  $$("[data-ig]").forEach((a) => { a.href = `https://www.instagram.com/${C.business.instagram}/`; a.target = "_blank"; a.rel = "noopener"; });
  $$("[data-ig-handle]").forEach((el) => { el.textContent = `@${C.business.instagram}`; });
  $("#year").textContent = new Date().getFullYear();

  // Bio
  const bio = $("#bio");
  bio.innerHTML = C.coach.bio.map((p) => `<p>${p}</p>`).join("");
  if (C.coach.credentials.length) {
    $("#creds").innerHTML = C.coach.credentials.map((c) => `<li>${c}</li>`).join("");
  } else { $("#creds").remove(); }

  // Photos with graceful placeholder
  const coachImg = $("#coach-photo");
  coachImg.src = C.coach.photo;
  coachImg.addEventListener("error", () => { coachImg.remove(); });
  coachImg.addEventListener("load", () => { $("#coach-placeholder").remove(); });
  const heroBg = $("#hero-bg");
  const probe = new Image();
  probe.onload = () => { heroBg.style.backgroundImage = `url("${C.coach.heroImage}")`; };
  probe.src = C.coach.heroImage;

  // Contact list
  const contact = $("#contact-list");
  const items = [];
  if (C.business.email) items.push(`<li>Email · <a href="mailto:${C.business.email}">${C.business.email}</a></li>`);
  if (C.business.phone) items.push(`<li>Phone · <a href="tel:${C.business.phone.replace(/\s/g, "")}">${C.business.phone}</a></li>`);
  items.push(`<li>Instagram · <a data-ig href="#">@${C.business.instagram}</a></li>`);
  items.push(`<li>${C.business.location}</li>`);
  contact.innerHTML = items.join("");
  $$("[data-ig]", contact).forEach((a) => { a.href = `https://www.instagram.com/${C.business.instagram}/`; a.target = "_blank"; a.rel = "noopener"; });

  // Booking buttons
  $$("[data-book]").forEach((b) => {
    if (C.bookingUrl) { b.href = C.bookingUrl; b.target = "_blank"; b.rel = "noopener"; }
    else { b.href = "#apply"; }
  });

  /* ---------- Mobile nav ---------- */
  const toggle = $(".nav-toggle"), links = $(".nav-links");
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  $$("a", links).forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));

  /* ---------- Pricing ---------- */
  let commit = false;
  const plansEl = $("#plans");
  const savePct = Math.round((1 - C.plans.reduce((s, p) => s + p.commitPrice, 0) / C.plans.reduce((s, p) => s + p.price, 0)) * 100);
  $("#save-pct").textContent = `Save ${savePct}%`;

  function renderPlans() {
    plansEl.innerHTML = C.plans.map((p) => {
      const price = commit ? p.commitPrice : p.price;
      const note = commit
        ? `<s>${money(p.price)}/mo</s> · ${C.billing.commitNote}`
        : `Billed monthly. Cancel anytime.`;
      return `
        <article class="plan ${p.popular ? "popular" : ""} reveal" data-plan="${p.id}">
          ${p.popular ? `<span class="badge">Most popular</span>` : ""}
          <h3>${p.name}</h3>
          <div class="sub">${p.subtitle}</div>
          <div class="price"><span class="cur">${C.billing.currency}</span><span class="amt">${price}</span><span class="per">/mo</span></div>
          <div class="price-note">${note}</div>
          <ul class="features">${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>
          <button class="btn ${p.popular ? "btn-primary" : "btn-ghost"} btn-block" data-start="${p.id}">Start ${p.name}</button>
        </article>`;
    }).join("");
    $$(".reveal", plansEl).forEach((el) => el.classList.add("in"));
    $$("[data-start]", plansEl).forEach((b) => b.addEventListener("click", () => startPlan(b.dataset.start)));
  }
  $$("#billing-toggle button").forEach((b) => b.addEventListener("click", () => {
    commit = b.dataset.mode === "commit";
    $$("#billing-toggle button").forEach((x) => x.classList.toggle("active", x === b));
    renderPlans();
  }));
  renderPlans();

  function startPlan(id) {
    const plan = C.plans.find((p) => p.id === id);
    if (plan.checkoutUrl) { window.open(plan.checkoutUrl, "_blank", "noopener"); return; }
    openModal(plan);
  }

  /* ---------- Modal application ---------- */
  const modal = $("#modal");
  function openModal(plan) {
    $("#modal-plan").textContent = plan ? `${plan.name} · ${money(commit ? plan.commitPrice : plan.price)}/mo${commit ? " · " + C.billing.commitLabel : ""}` : "General application";
    $("#m-plan").value = plan ? plan.name : "Not sure yet";
    modal.classList.add("open");
    setTimeout(() => $("#m-name").focus(), 50);
  }
  const closeModal = () => modal.classList.remove("open");
  $(".modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  $$("[data-open-apply]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openModal(null); }));

  /* ---------- Forms (modal + page) ---------- */
  async function handleSubmit(form, msgEl) {
    const data = Object.fromEntries(new FormData(form).entries());
    data.source = "truepower-site";
    msgEl.className = "form-msg";
    const btn = $("button[type=submit]", form);
    btn.disabled = true; const label = btn.textContent; btn.textContent = "Sending…";
    try {
      if (C.formEndpoint) {
        const r = await fetch(C.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error("Request failed");
      } else {
        const subject = encodeURIComponent(`True Power application — ${data.name || ""}`);
        const body = encodeURIComponent(Object.entries(data).filter(([k]) => k !== "source").map(([k, v]) => `${k}: ${v}`).join("\n"));
        const to = C.business.email || "";
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      }
      msgEl.textContent = "Application sent. Kevin will reach out within 24–48 hours.";
      msgEl.classList.add("ok");
      form.reset();
    } catch (err) {
      msgEl.textContent = "Something went wrong. Please DM @" + C.business.instagram + " on Instagram instead.";
      msgEl.classList.add("err");
    } finally { btn.disabled = false; btn.textContent = label; }
  }
  $("#modal-form").addEventListener("submit", (e) => { e.preventDefault(); handleSubmit(e.target, $("#modal-msg")); });
  $("#apply-form").addEventListener("submit", (e) => { e.preventDefault(); handleSubmit(e.target, $("#apply-msg")); });

  // Populate plan selects
  const planOptions = [`<option>Not sure yet</option>`].concat(C.plans.map((p) => `<option>${p.name}</option>`)).join("");
  $("#a-plan").innerHTML = planOptions;
  $("#m-plan").innerHTML = planOptions;

  /* ---------- Macro calculator ---------- */
  const calc = $("#calc-form");
  let units = "imperial";
  $$("#unit-seg button").forEach((b) => b.addEventListener("click", () => {
    units = b.dataset.units;
    $$("#unit-seg button").forEach((x) => x.classList.toggle("active", x === b));
    $("#imperial-h").hidden = units !== "imperial";
    $("#metric-h").hidden = units !== "metric";
    $("#weight-unit").textContent = units === "imperial" ? "lb" : "kg";
  }));

  const ACTIVITY = { 1.2: "Sedentary", 1.375: "Light (1–3 days)", 1.55: "Moderate (3–5 days)", 1.725: "Active (6–7 days)", 1.9: "Athlete / physical job" };
  const GOAL = { cut: -0.2, recomp: -0.1, maintain: 0, gain: 0.1 };
  let dayMode = "train";
  let lastResult = null;

  calc.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(calc);
    const sex = f.get("sex"), age = +f.get("age"), act = +f.get("activity"), goal = f.get("goal");
    let kg, cm;
    if (units === "imperial") {
      kg = +f.get("weight") * 0.453592;
      cm = ((+f.get("ft") || 0) * 12 + (+f.get("in") || 0)) * 2.54;
    } else { kg = +f.get("weight"); cm = +f.get("cm"); }
    if (!kg || !cm || !age) return;
    const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === "male" ? 5 : -161);
    const tdee = bmr * act;
    const target = Math.round(tdee * (1 + GOAL[goal]));
    const lb = kg / 0.453592;
    // Protein: ~1 g/lb, tapered above 200 lb so heavier clients aren't over-prescribed.
    const proteinLb = lb <= 200 ? lb : 200 + (lb - 200) * 0.6;
    const protein = Math.round(proteinLb * (goal === "cut" || goal === "recomp" ? 1.0 : 0.85));
    const fat = Math.round((target * 0.25) / 9);
    const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
    lastResult = { target, tdee: Math.round(tdee), protein, fat, carbs, goal, lb: Math.round(lb) };
    renderCalc();
    $("#calc-results").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $$("#day-tabs button").forEach((b) => b.addEventListener("click", () => {
    dayMode = b.dataset.day;
    $$("#day-tabs button").forEach((x) => x.classList.toggle("active", x === b));
    renderCalc();
  }));

  function renderCalc() {
    if (!lastResult) return;
    const r = lastResult;
    // True Power style day variation: training day baseline, rest day pulls carbs, high-carb day pushes carbs.
    let p = r.protein, c = r.carbs, f = r.fat;
    if (dayMode === "rest") { c = Math.round(c * 0.8); f = Math.round(f * 1.1); }
    if (dayMode === "high") { c = Math.round(c * 1.3); f = Math.round(f * 0.85); }
    const kcal = p * 4 + c * 4 + f * 9;
    $("#calc-empty").hidden = true;
    $("#calc-results").hidden = false;
    $("#kcal").textContent = kcal.toLocaleString();
    $("#tdee").textContent = r.tdee.toLocaleString();
    $("#m-p").textContent = p; $("#m-c").textContent = c; $("#m-f").textContent = f;
    $("#bar-p").style.width = (p * 4 / kcal * 100) + "%";
    $("#bar-c").style.width = (c * 4 / kcal * 100) + "%";
    $("#bar-f").style.width = (f * 9 / kcal * 100) + "%";
    const water = Math.max(3, Math.round(r.lb * 0.0296 * 0.75 * 10) / 10);
    $("#extras").innerHTML = `Fiber <b>35–45 g/day</b> · Sodium <b>2,500 mg+</b> · Water <b>${water} L/day</b>`;
    $("#a-goal").value = { cut: "Lose fat", recomp: "Recomp", maintain: "Maintain", gain: "Build muscle" }[r.goal];
  }

  /* ---------- Results section ---------- */
  if (C.results.length) {
    $("#results-grid").innerHTML = C.results.map((r) => `
      <article class="result-card reveal">
        ${r.image ? `<img src="${r.image}" alt="${r.name} transformation" loading="lazy">` : ""}
        <div class="body"><div class="stat">${r.result}</div><b>${r.name}</b>${r.quote ? `<blockquote>“${r.quote}”</blockquote>` : ""}</div>
      </article>`).join("");
  } else { $("#results").remove(); $$('a[href="#results"]').forEach((a) => a.remove()); }

  /* ---------- FAQ ---------- */
  $("#faq-list").innerHTML = C.faq.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("");

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
  // Only elements below the first viewport animate in; everything visible at load stays visible.
  $$(".reveal").forEach((el) => { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("pre"); io.observe(el); } });
})();

/* ---------- Gallery + lightbox ---------- */
(function () {
  const C = window.TP_CONFIG;
  const grid = document.querySelector("#gallery-grid");
  if (!grid) return;
  if (!C.coach.gallery || !C.coach.gallery.length) { document.querySelector("#gallery").remove(); return; }
  grid.innerHTML = C.coach.gallery.map((g, i) => `<button class="shot reveal" data-i="${i}" aria-label="Open photo ${i + 1}"><img src="${g.src}" alt="${g.alt}" loading="lazy"></button>`).join("");
  const lb = document.querySelector("#lightbox"), img = lb.querySelector("img");
  let cur = 0;
  const show = (i) => { cur = (i + C.coach.gallery.length) % C.coach.gallery.length; img.src = C.coach.gallery[cur].src; img.alt = C.coach.gallery[cur].alt; lb.classList.add("open"); };
  grid.addEventListener("click", (e) => { const b = e.target.closest(".shot"); if (b) show(+b.dataset.i); });
  lb.querySelector(".lb-close").addEventListener("click", () => lb.classList.remove("open"));
  lb.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("open"); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") lb.classList.remove("open");
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.1 });
  grid.querySelectorAll(".reveal").forEach((el) => { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("pre"); io.observe(el); } });
})();
