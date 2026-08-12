function buildKnownContext(aux) {
  const ctx = {};

  if (aux.goals && aux.goals.length) {
    ctx.purpose =
      "From an earlier assessment, this auxiliary's stated goals were:\n" +
      aux.goals.map((g) => "• " + g).join("\n");
  }

  if (aux.contacts && aux.contacts.length) {
    ctx.roles =
      "Current contacts on file:\n" +
      aux.contacts.map((c) => `${c.role}: ${c.name}`).join("\n");
  }

  if (aux.supplies && aux.supplies.length) {
    ctx.supplies =
      "Already noted as needed:\n" +
      aux.supplies.map((s) => "• " + s).join("\n");
  }

  if (aux.safetyGuidelinesStatus || aux.emergencyProceduresStatus) {
    const lines = [];
    if (aux.safetyGuidelinesStatus) lines.push(`Safety guidelines in place: ${aux.safetyGuidelinesStatus}`);
    if (aux.emergencyProceduresStatus) lines.push(`Emergency response procedures in place: ${aux.emergencyProceduresStatus}`);
    ctx.safety =
      "As of the last assessment:\n" +
      lines.join("\n") +
      "\nPlease describe the actual procedure below (or note that one still needs to be created).";
  }

  if (aux.events || aux.volunteerRecruitment) {
    const lines = [];
    if (aux.events) lines.push(`Events/meetings on file: ${aux.events}`);
    if (aux.volunteerRecruitment) lines.push(`How volunteers are recruited: ${aux.volunteerRecruitment}`);
    ctx.scheduling = lines.join("\n");
  }

  if (aux.volunteerRecruitment) {
    ctx.training = `Recruitment process on file: ${aux.volunteerRecruitment}`;
  }

  return ctx;
}

async function initSopForm() {
  const form = document.getElementById("sop-form");
  const auxSelect = document.getElementById("auxiliary");
  const knownBoxes = form.querySelectorAll(".known-context");
  const statusEl = document.getElementById("form-status");
  const submitStatus = document.getElementById("submit-status");

  let auxiliaries = [];
  try {
    auxiliaries = await fetchAuxiliaries();
  } catch (err) {
    // Known-context enrichment is optional — form still works without it.
  }

  function renderKnownContext() {
    const aux = auxiliaries.find((a) => a.slug === auxSelect.value);
    const ctx = aux ? buildKnownContext(aux) : {};
    knownBoxes.forEach((box) => {
      const field = box.getAttribute("data-field");
      if (ctx[field]) {
        box.textContent = ctx[field];
        box.hidden = false;
      } else {
        box.textContent = "";
        box.hidden = true;
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  const preselect = params.get("slug");
  if (preselect && [...auxSelect.options].some((o) => o.value === preselect)) {
    auxSelect.value = preselect;
  }
  renderKnownContext();

  auxSelect.addEventListener("change", renderKnownContext);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitStatus.textContent = "Submitting…";

    const body = new URLSearchParams(new FormData(form)).toString();

    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) throw new Error("Submission failed");

      statusEl.innerHTML = '<div class="form-status success">Thank you — your answers were submitted. You can come back and fill out another auxiliary, or update this one later.</div>';
      submitStatus.textContent = "";
      form.reset();
      knownBoxes.forEach((box) => (box.hidden = true));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      statusEl.innerHTML = '<div class="form-status error">Something went wrong submitting the form. Please try again, or reach out directly so we can log your answers.</div>';
      submitStatus.textContent = "";
    }
  });
}

initSopForm();
