function initUpdateForm() {
  const form = document.getElementById("update-form");
  const auxSelect = document.getElementById("auxiliary");
  const radios = form.querySelectorAll('input[name="request-type"]');
  const sections = form.querySelectorAll("fieldset[data-section]");
  const statusEl = document.getElementById("form-status");
  const submitStatus = document.getElementById("submit-status");
  const backLink = document.getElementById("back-link");

  const primaryFieldBySection = {
    contact: document.getElementById("contact-name"),
    note: form.querySelector('textarea[name="note-text"]'),
    supplies: document.getElementById("supplies-items"),
  };

  function showSection(type) {
    sections.forEach((section) => {
      const isMatch = section.getAttribute("data-section") === type;
      section.hidden = !isMatch;
    });
    Object.entries(primaryFieldBySection).forEach(([key, field]) => {
      if (!field) return;
      field.required = key === type;
    });
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => showSection(radio.value));
  });

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const type = params.get("type");

  if (slug && [...auxSelect.options].some((o) => o.value === slug)) {
    auxSelect.value = slug;
    backLink.innerHTML = `<a href="auxiliary.html?slug=${encodeURIComponent(slug)}">&larr; Back to auxiliary</a>`;
  }

  if (type && ["contact", "note", "supplies"].includes(type)) {
    const radio = form.querySelector(`input[name="request-type"][value="${type}"]`);
    if (radio) {
      radio.checked = true;
      showSection(type);
    }
  }

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

      statusEl.innerHTML = '<div class="form-status success">Thank you — your request was submitted and will be reviewed.</div>';
      submitStatus.textContent = "";
      form.reset();
      sections.forEach((section) => (section.hidden = true));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      statusEl.innerHTML = '<div class="form-status error">Something went wrong submitting the form. Please try again, or reach out directly.</div>';
      submitStatus.textContent = "";
    }
  });
}

initUpdateForm();
