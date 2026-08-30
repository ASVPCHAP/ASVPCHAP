const AUX_ICONS = {
  medical: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  servers: '<path d="M8 3v6a2 2 0 0 0 4 0V3M10 9v12"/><path d="M16 3v6c0 1.7 1 2.7 2 3.3V21"/>',
  multipurpose: '<rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="15" cy="12" r="1"/>',
  choir: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  audio: '<path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 8a5 5 0 0 1 0 8M19.5 5a9 9 0 0 1 0 14"/>',
  "visual-production": '<rect x="3" y="7" width="14" height="11" rx="2"/><path d="M17 10l4-2v8l-4-2"/><circle cx="10" cy="12.5" r="3"/>',
  ushers: '<path d="M15 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h9"/><path d="M15 3v18"/><path d="M18 12h4M19 9l3 3-3 3"/>',
  kitchen: '<path d="M4 12h16l-1.2 7.2A2 2 0 0 1 16.8 21H7.2a2 2 0 0 1-2-1.8L4 12z"/><path d="M4 12a8 8 0 0 1 16 0"/><path d="M9 3v2M12 2v2M15 3v2"/>',
  security: '<path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/>',
  transportation: '<path d="M3 16V9a1 1 0 0 1 1-1h9l4 4h3a1 1 0 0 1 1 1v3"/><path d="M3 16h17"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  "parking-lot": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 16V8h4a3 3 0 0 1 0 6H9"/>',
  cleaning: '<path d="M20 4L11 13"/><path d="M11 13c-2 0-4 1-5 3l-2 4 4-2c2-1 3-3 3-5z"/>',
  "international-finance": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  "youth-work": '<path d="M12 2l2.9 6.9L22 9.6l-5.5 5 1.6 7.4L12 18.8 5.9 22l1.6-7.4L2 9.6l7.1-.7L12 2z"/>',
  "process-improvement": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  finance: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"/>',
  greeters: '<path d="M12 3v9"/><path d="M9 6v6"/><path d="M15 6v6"/><path d="M6 10v3a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6v-2l-3-3"/>',
  maintenance: '<path d="M14.7 6.3a4 4 0 1 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-3 3-2-2 3-3z"/>',
  communications: '<path d="M3 9v6l4 1 10 4V4L7 8l-4 1z"/><path d="M7 16v3a2 2 0 0 0 4 0v-2"/>',
  "womens-work": '<circle cx="12" cy="12" r="2.5"/><path d="M12 2a3 3 0 0 1 0 6 3 3 0 0 1 0-6zM12 16a3 3 0 0 1 0 6 3 3 0 0 1 0-6zM2 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0zM16 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0z"/>',
  baptistry: '<path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"/>',
};

function auxIconSvg(slug, extraClass) {
  const inner = AUX_ICONS[slug];
  if (!inner) return "";
  const cls = extraClass ? ` ${extraClass}` : "";
  return `<svg class="aux-icon${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
