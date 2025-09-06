// Grab DOM elements
const form = document.getElementById("regForm");
const cards = document.getElementById("cards");
const summaryBody = document.querySelector("#summary tbody");
const liveRegion = document.getElementById("live-region");

// Simple utils
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const urlRegex = /^https?:\/\/.+/i;

// Keep an in-memory map for syncing card <-> row
const registry = new Map(); // id -> profile

function announce(message) {
  // Update aria-live region for screen readers
  liveRegion.textContent = message;
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message || "";
}

function clearAllErrors() {
  ["firstNameError","lastNameError","emailError","programmeError","yearError","photoError"]
    .forEach(id => setError(id, ""));
}

function validateFieldset(values) {
  let valid = true;

/*  Error displayed when a field is left empty or datatype is wrong */
  if (!values.firstName) {
    setError("firstNameError", "First name is required.");
    valid = false;
  }
  if (!values.lastName) {
    setError("lastNameError", "Last name is required.");
    valid = false;
  }
  if (!values.email) {
    setError("emailError", "Email is required.");
    valid = false;
  } else if (!emailRegex.test(values.email)) {
    setError("emailError", "Please enter a valid email, e.g. you@school.edu.");
    valid = false;
  }
  if (!values.programme) {
    setError("programmeError", "Please select a programme.");
    valid = false;
  }
  if (!values.year) {
    setError("yearError", "Please select a year.");
    valid = false;
  }
  if (values.photo && !urlRegex.test(values.photo)) {
    setError("photoError", "Photo URL should start with http(s)://");
    valid = false;
  }

  return valid;
}
/* Read the personal details, and return them*/
function readForm() {
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    programme: document.getElementById("programme").value,
    year: document.getElementById("year").value,
    interests: document.getElementById("interests").value.trim(),
    photo: document.getElementById("photo").value.trim()
  };
}

function placeholderAvatar(name) {
  const initials = name.split(" ").map(p => p[0]?.toUpperCase() || "").join("").slice(0,2) || "U";
  // tiny SVG data URL fallback
  return `data:image/svg+xml;utf8,` +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
        <rect width="100%" height="100%" fill="#11162a"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, Helvetica, sans-serif" font-size="56" fill="#a1c4ff">${initials}</text>
      </svg>`
    );
}

function renderCard(profile) {
  const li = document.createElement("article");
  li.className = "card";
  li.setAttribute("role", "listitem");
  li.dataset.id = profile.id;

  const img = document.createElement("img");
  img.alt = `${profile.firstName} ${profile.lastName} photo`;
  img.src = profile.photo || placeholderAvatar(`${profile.firstName} ${profile.lastName}`);
  img.referrerPolicy = "no-referrer";

  const body = document.createElement("div");
  const h3 = document.createElement("h3");
  h3.textContent = `${profile.firstName} ${profile.lastName}`;

  const p1 = document.createElement("p");
  p1.textContent = profile.email;

  const p2 = document.createElement("p");
  p2.textContent = `${profile.programme} • Year ${profile.year}`;

  const p3 = document.createElement("p");
  p3.textContent = profile.interests ? `Interests: ${profile.interests}` : "Interests: —";

  const actions = document.createElement("div");
  actions.className = "card-actions";

/*Remove button*/
  const removeBtn = document.createElement("button");
  removeBtn.className = "link";
  removeBtn.type = "button";
  removeBtn.setAttribute("aria-label", `Remove ${profile.firstName} ${profile.lastName}`);
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => removeProfile(profile.id));

  actions.appendChild(removeBtn);

  body.append(h3, p1, p2, p3, actions);
  li.append(img, body);
  cards.prepend(li); // newest first
}

function renderRow(profile) {
  const tr = document.createElement("tr");
  tr.dataset.id = profile.id;

  const tdName = document.createElement("td");
  tdName.textContent = `${profile.firstName} ${profile.lastName}`;

  const tdEmail = document.createElement("td");
  tdEmail.textContent = profile.email;

  const tdProgramme = document.createElement("td");
  tdProgramme.textContent = profile.programme;

  const tdYear = document.createElement("td");
  tdYear.textContent = profile.year;

  const tdActions = document.createElement("td");
  const removeBtn = document.createElement("button");
  removeBtn.className = "link";
  removeBtn.type = "button";
  removeBtn.setAttribute("aria-label", `Remove ${profile.firstName} ${profile.lastName} from summary`);
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => removeProfile(profile.id));
  tdActions.appendChild(removeBtn);

  tr.append(tdName, tdEmail, tdProgramme, tdYear, tdActions);
  summaryBody.prepend(tr);
}

/* Remove button for removing a profile*/
function removeProfile(id) {
  // remove from map
  const prof = registry.get(id);
  if (!prof) return;

  // remove card
  const card = cards.querySelector(`[data-id="${id}"]`);
  if (card) card.remove();

  // remove row
  const row = summaryBody.querySelector(`[data-id="${id}"]`);
  if (row) row.remove();

  registry.delete(id);
  announce(`Removed profile for ${prof.firstName} ${prof.lastName}.`);
}

function handleSubmit(e) {
  e.preventDefault();
  clearAllErrors();

  const values = readForm();
  const ok = validateFieldset(values);

  if (!ok) {
    announce("Please fix the highlighted errors.");
    return;
  }

  const id = crypto.randomUUID();
  const profile = { id, ...values };
  registry.set(id, profile);

  renderCard(profile);
  renderRow(profile);

  announce(`Added profile for ${profile.firstName} ${profile.lastName}.`);

  // Optional: reset form after successful add
  e.target.reset();
  document.getElementById("firstName").focus();
}

// Inline validation: on blur/input for faster feedback
function attachInlineValidation() {
  const map = [
    { id: "firstName", err: "firstNameError", validate: v => v.trim() ? "" : "First name is required." },
    { id: "lastName", err: "lastNameError", validate: v => v.trim() ? "" : "Last name is required." },
    { id: "email", err: "emailError", validate: v => !v.trim() ? "Email is required." : (emailRegex.test(v) ? "" : "Enter a valid email.") },
    { id: "programme", err: "programmeError", validate: v => v ? "" : "Please select a programme." },
    { id: "year", err: "yearError", validate: v => v ? "" : "Please select a year." },
    { id: "photo", err: "photoError", validate: v => v && !urlRegex.test(v) ? "Photo URL should start with http(s)://" : "" },
  ];

  map.forEach(({ id, err, validate }) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(err);
    if (!input || !errorEl) return;

    const run = () => {
      const msg = validate(input.value);
      errorEl.textContent = msg;
    };
    input.addEventListener("blur", run);
    input.addEventListener("input", run);
  });
}

// Wire events
form.addEventListener("submit", handleSubmit);
attachInlineValidation();
