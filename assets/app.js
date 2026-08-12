const DATA_URL = "data/auxiliaries.json";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

async function fetchAuxiliaries() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("Failed to load auxiliaries data");
  return res.json();
}

function contactsSummary(aux) {
  const leader = aux.contacts.find((c) => c.role === "Leader");
  return leader ? leader.name : (aux.contacts[0] ? aux.contacts[0].name : "");
}

async function loadAuxiliaryGrid() {
  const grid = document.getElementById("aux-grid");
  const searchInput = document.getElementById("aux-search");

  let auxiliaries = [];
  try {
    auxiliaries = await fetchAuxiliaries();
  } catch (err) {
    grid.innerHTML = '<p class="empty-note">Could not load auxiliary data.</p>';
    return;
  }

  function render(list) {
    if (list.length === 0) {
      grid.innerHTML = '<p class="empty-note">No auxiliaries match your search.</p>';
      return;
    }
    grid.innerHTML = list
      .map(
        (aux) => `
        <a class="aux-card" href="auxiliary.html?slug=${encodeURIComponent(aux.slug)}">
          <h3>${escapeHtml(aux.name)}</h3>
          <p class="leader">${escapeHtml(contactsSummary(aux))}</p>
        </a>`
      )
      .join("");
  }

  render(auxiliaries);

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = auxiliaries.filter((aux) => {
      if (aux.name.toLowerCase().includes(q)) return true;
      return aux.contacts.some((c) => c.name.toLowerCase().includes(q));
    });
    render(filtered);
  });
}

async function loadAuxiliaryDetail() {
  const container = document.getElementById("aux-content");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  let auxiliaries = [];
  try {
    auxiliaries = await fetchAuxiliaries();
  } catch (err) {
    container.innerHTML = '<p class="empty-note">Could not load auxiliary data.</p>';
    return;
  }

  const aux = auxiliaries.find((a) => a.slug === slug);
  if (!aux) {
    container.innerHTML = '<p class="empty-note">Auxiliary not found.</p>';
    return;
  }

  document.title = `${aux.name} | The Living Gospel - Mesquite`;

  const contactsRows = aux.contacts
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.role)}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${c.phone ? `<a href="tel:${escapeHtml(c.phone.replace(/[^0-9+]/g, ""))}">${escapeHtml(c.phone)}</a>` : ""}</td>
        <td>${c.email ? `<a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>` : ""}</td>
      </tr>`
    )
    .join("");

  const sopHtml =
    aux.sop && aux.sop.length
      ? `<ol class="sop-steps">${aux.sop.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`
      : `<p class="empty-note">No SOP documented yet for this auxiliary.</p>
         <div class="quick-actions"><a class="btn secondary" href="sop-questionnaire.html?slug=${encodeURIComponent(aux.slug)}">Help complete this SOP</a></div>`;

  const suppliesHtml =
    aux.supplies && aux.supplies.length
      ? `<ul class="supply-list">${aux.supplies.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : '<p class="empty-note">No supply list documented yet for this auxiliary.</p>';

  const notesHtml = aux.notes
    ? `<p>${escapeHtml(aux.notes)}</p>`
    : '<p class="empty-note">No additional notes.</p>';

  const descriptionHtml = aux.description
    ? `<p class="page-subtitle">${escapeHtml(aux.description)}</p>`
    : "";

  const listHtml = (items) =>
    items && items.length
      ? `<ul class="supply-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";

  const hasAssessment =
    (aux.goals && aux.goals.length) ||
    (aux.strengths && aux.strengths.length) ||
    (aux.improvements && aux.improvements.length) ||
    aux.events ||
    aux.volunteerRecruitment;

  const assessmentHtml = hasAssessment
    ? `
    <div class="aux-section">
      <h2>Auxiliary Assessment</h2>
      ${aux.goals && aux.goals.length ? `<h3>Goals for the year</h3>${listHtml(aux.goals)}` : ""}
      ${aux.strengths && aux.strengths.length ? `<h3>Strengths</h3>${listHtml(aux.strengths)}` : ""}
      ${aux.improvements && aux.improvements.length ? `<h3>Areas of opportunity</h3>${listHtml(aux.improvements)}` : ""}
      ${aux.events ? `<h3>Events &amp; meetings</h3><p>${escapeHtml(aux.events)}</p>` : ""}
      ${aux.volunteerRecruitment ? `<h3>How volunteers are recruited</h3><p>${escapeHtml(aux.volunteerRecruitment)}</p>` : ""}
    </div>`
    : "";

  const slugParam = encodeURIComponent(aux.slug);
  const addContactBtn = `<div class="quick-actions"><a class="btn secondary" href="update-request.html?slug=${slugParam}&type=contact">+ Add a Contact</a></div>`;
  const requestSuppliesBtn = `<div class="quick-actions"><a class="btn secondary" href="update-request.html?slug=${slugParam}&type=supplies">+ Request Supplies</a></div>`;
  const addNoteBtn = `<div class="quick-actions"><a class="btn secondary" href="update-request.html?slug=${slugParam}&type=note">+ Add a Note</a></div>`;

  container.innerHTML = `
    <h1 class="page-title">${escapeHtml(aux.name)}</h1>
    ${descriptionHtml}

    <div class="aux-section">
      <h2>Contacts</h2>
      <table class="contacts">
        <thead>
          <tr><th>Role</th><th>Name</th><th>Phone</th><th>Email</th></tr>
        </thead>
        <tbody>${contactsRows}</tbody>
      </table>
      ${addContactBtn}
    </div>

    <div class="aux-section">
      <h2>Standard Operating Procedure</h2>
      ${sopHtml}
    </div>

    <div class="aux-section">
      <h2>Supplies Needed</h2>
      ${suppliesHtml}
      ${requestSuppliesBtn}
    </div>
    ${assessmentHtml}

    <div class="aux-section">
      <h2>Notes</h2>
      ${notesHtml}
      ${addNoteBtn}
    </div>
  `;
}
