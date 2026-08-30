const EF_DATA_URL = "data/essential-functions.json";

function efEscapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

async function fetchEssentialFunctions() {
  const res = await fetch(EF_DATA_URL);
  if (!res.ok) throw new Error("Failed to load essential functions data");
  return res.json();
}

async function loadEssentialFunctionGrid() {
  const grid = document.getElementById("ef-grid");

  let items = [];
  try {
    items = await fetchEssentialFunctions();
  } catch (err) {
    grid.innerHTML = '<p class="empty-note">Could not load essential functions data.</p>';
    return;
  }

  if (items.length === 0) {
    grid.innerHTML = '<p class="empty-note">No essential functions documented yet.</p>';
    return;
  }

  grid.innerHTML = items
    .map(
      (item) => `
      <a class="aux-card" href="essential-function.html?slug=${encodeURIComponent(item.slug)}">
        <div class="aux-icon-badge">${typeof auxIconSvg === "function" ? auxIconSvg(item.slug) : ""}</div>
        <h3>${efEscapeHtml(item.name)}</h3>
        <p class="leader">${efEscapeHtml(item.description || "")}</p>
      </a>`
    )
    .join("");
}

async function loadEssentialFunctionDetail() {
  const container = document.getElementById("ef-content");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  let items = [];
  try {
    items = await fetchEssentialFunctions();
  } catch (err) {
    container.innerHTML = '<p class="empty-note">Could not load essential functions data.</p>';
    return;
  }

  const item = items.find((i) => i.slug === slug);
  if (!item) {
    container.innerHTML = '<p class="empty-note">Essential function not found.</p>';
    return;
  }

  document.title = `${item.name} | The Living Gospel - Mesquite`;

  const iconHtml =
    typeof auxIconSvg === "function"
      ? `<div class="aux-icon-badge large">${auxIconSvg(item.slug)}</div>`
      : "";

  const descriptionHtml = item.description
    ? `<p class="page-subtitle">${efEscapeHtml(item.description)}</p>`
    : "";

  const contactsHtml =
    item.contacts && item.contacts.length
      ? `
      <div class="aux-section">
        <h2>Contacts</h2>
        <table class="contacts">
          <thead><tr><th>Role</th><th>Name</th><th>Phone</th><th>Email</th></tr></thead>
          <tbody>
            ${item.contacts
              .map(
                (c) => `
              <tr>
                <td>${efEscapeHtml(c.role)}</td>
                <td>${efEscapeHtml(c.name)}</td>
                <td>${c.phone ? `<a href="tel:${efEscapeHtml(c.phone.replace(/[^0-9+]/g, ""))}">${efEscapeHtml(c.phone)}</a>` : ""}</td>
                <td>${c.email ? `<a href="mailto:${efEscapeHtml(c.email)}">${efEscapeHtml(c.email)}</a>` : ""}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
      : "";

  const renderStep = (step, index) => {
    const hasImage = Boolean(step.image);
    const photoHtml = hasImage
      ? `<div class="ef-step-photo"><img src="${efEscapeHtml(step.image)}" alt="${efEscapeHtml(step.alt || "")}" loading="lazy"></div>`
      : "";
    return `
      <div class="ef-step${hasImage ? "" : " no-image"}">
        <div class="ef-step-text">
          <span class="ef-step-num">${index + 1}</span>
          <p>${efEscapeHtml(step.text)}</p>
        </div>
        ${photoHtml}
      </div>`;
  };

  const sectionsHtml = (item.sections || [])
    .map(
      (section) => `
      <div class="aux-section">
        <h2>${efEscapeHtml(section.title)}</h2>
        <div class="ef-steps">
          ${section.steps.map(renderStep).join("")}
        </div>
      </div>`
    )
    .join("");

  const notesHtml = item.notes
    ? `<div class="aux-section"><h2>Notes</h2><p>${efEscapeHtml(item.notes)}</p></div>`
    : "";

  container.innerHTML = `
    <div class="aux-detail-heading">
      ${iconHtml}
      <h1 class="page-title">${efEscapeHtml(item.name)}</h1>
    </div>
    ${descriptionHtml}
    ${contactsHtml}
    ${sectionsHtml}
    ${notesHtml}
  `;
}
