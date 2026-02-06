# Ocean Professional — Single Page Portfolio (React)

A lightweight Create React App single-page portfolio with:

- Fixed top navigation with active section highlighting
- Sections: **Hero**, **About**, **Portfolio Gallery**, **Contact**
- Ocean Professional theme tokens:
  - Primary: `#2563EB`
  - Secondary/Success: `#F59E0B`
  - Error: `#EF4444`
  - Background: `#f9fafb`
  - Surface: `#ffffff`
  - Text: `#111827`
  - Subtle gradient: blue-500/10 → gray-50
- Smooth scrolling anchor behavior + mobile hamburger navigation
- On-scroll reveal animations using `IntersectionObserver`
- Honors `prefers-reduced-motion`
- Accessible semantics, focus styles, and ARIA for the mobile menu and form errors
- Contact form UI with client-side validation only (no backend submission)

## Getting started

From `react_frontend/`:

```bash
npm install
npm start
```

Open http://localhost:3000

## Project structure

- `src/App.js` — single-page layout + scroll spy + reveal animations + form validation
- `src/App.css` — theme tokens and all component styling (no UI libraries)
- `src/index.css` — global typography + baseline styles

## Notes

- This app intentionally avoids heavy UI/animation dependencies.
- Replace placeholder portfolio items and contact details in `src/App.js` with your own content.
- The contact form currently shows a success message and clears the form; integrate a backend later if needed.
