export const enMessages = {
  "app.title": "Dynamic Content Engine",
  "app.tagline": "Agency workspace foundation",
  "nav.briefs": "Briefs",
  "nav.concepts": "Concepts",
  "nav.production": "Production",
  "nav.learning": "Learning",
  "nav.settings": "Settings",
  "login.heading": "Sign in",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.error": "Sign in failed. Check your credentials and try again.",
  "home.welcome": "Select a client to begin.",
  "home.foundationNote": "M1 foundation shell — fixture mode only.",
  "locale.en": "English",
  "locale.th": "Thai",
} as const;

export type MessageKey = keyof typeof enMessages;
