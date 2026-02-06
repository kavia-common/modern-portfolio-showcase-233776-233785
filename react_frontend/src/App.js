import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * Portfolio single-page application sections in scroll order.
 * Keep ids in sync with the section DOM ids.
 */
const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

const PORTFOLIO_ITEMS = [
  {
    title: "Ocean Analytics Dashboard",
    description:
      "A responsive analytics UI with filtering, charts placeholders, and accessibility-first components.",
    tags: ["React", "UI", "A11y"],
  },
  {
    title: "Design System Starter",
    description:
      "Reusable buttons, cards, and form elements with theme tokens and focus-visible styling.",
    tags: ["CSS", "Tokens", "Components"],
  },
  {
    title: "Realtime Collaboration Mock",
    description:
      "Presence indicators and activity feed (UI only) with smooth micro-interactions and skeleton loading.",
    tags: ["UX", "Animation", "Prototype"],
  },
  {
    title: "Landing Page Refresh",
    description:
      "Hero-first layout with subtle gradient, responsive navigation, and performance-oriented styling.",
    tags: ["Responsive", "Performance", "Brand"],
  },
  {
    title: "Content Portfolio CMS UI",
    description:
      "Card/grid management layout and empty states designed for future backend integration.",
    tags: ["Layout", "Forms", "States"],
  },
  {
    title: "Mobile-first Contact Flow",
    description:
      "Client-side validated form UI with inline errors, success state, and keyboard-friendly controls.",
    tags: ["Forms", "Validation", "Mobile"],
  },
];

/**
 * Smoothly scroll to a section by id, respecting reduced motion.
 * Uses scroll-margin-top on sections to account for the fixed header.
 */
// PUBLIC_INTERFACE
function scrollToSection(sectionId) {
  /** Smoothly scroll to a section by id. */
  const el = document.getElementById(sectionId);
  if (!el) return;

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onChange = () => setReduced(Boolean(mediaQuery.matches));
    onChange();

    // Safari < 14 uses addListener/removeListener
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", onChange);
    else mediaQuery.addListener(onChange);

    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", onChange);
      else mediaQuery.removeListener(onChange);
    };
  }, []);

  return reduced;
}

function useScrollSpy(sectionIds, options = {}) {
  const [activeId, setActiveId] = useState(sectionIds[0] || "home");
  const latestActive = useRef(activeId);

  useEffect(() => {
    latestActive.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const ids = (sectionIds || []).filter(Boolean);
    if (!ids.length) return undefined;

    // Use IntersectionObserver when available for stable, cheap updates
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          // Find the most "visible" intersecting section.
          const visible = entries
            .filter((e) => e.isIntersecting)
            .map((e) => ({
              id: e.target.id,
              ratio: e.intersectionRatio,
              top: e.boundingClientRect.top,
            }))
            .sort((a, b) => {
              // Prefer higher intersection ratio, then nearer to top
              if (b.ratio !== a.ratio) return b.ratio - a.ratio;
              return Math.abs(a.top) - Math.abs(b.top);
            });

          if (visible[0] && visible[0].id !== latestActive.current) {
            setActiveId(visible[0].id);
          }
        },
        {
          // Bias towards the section that is near the top of the viewport (below the fixed header).
          root: null,
          rootMargin: options.rootMargin ?? "-20% 0px -65% 0px",
          threshold: options.threshold ?? [0.1, 0.2, 0.35, 0.5, 0.65],
        }
      );

      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }

    // Fallback: scroll listener
    const onScroll = () => {
      const headerOffset = 96; // approx header height + spacing
      const scrollPos = window.scrollY + headerOffset;

      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.offsetTop <= scrollPos) current = id;
      }
      if (current !== latestActive.current) setActiveId(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionIds, options.rootMargin, options.threshold]);

  return activeId;
}

function useRevealOnScroll({ reducedMotion }) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!elements.length) return undefined;

    if (reducedMotion) {
      // Instantly reveal when user prefers reduced motion.
      elements.forEach((el) => el.classList.add("is-revealed"));
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-revealed"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reducedMotion]);
}

function validateContact(values) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) errors.name = "Please enter your name.";
  if (!email) errors.email = "Please enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Please enter a valid email address.";

  if (!message) errors.message = "Please write a message.";
  else if (message.length < 20) errors.message = "Please write at least 20 characters.";

  return errors;
}

// PUBLIC_INTERFACE
function App() {
  /** Single-page portfolio application. */
  const reducedMotion = usePrefersReducedMotion();
  const activeSection = useScrollSpy(SECTIONS.map((s) => s.id));
  useRevealOnScroll({ reducedMotion });

  const [mobileOpen, setMobileOpen] = useState(false);

  const [contactValues, setContactValues] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactTouched, setContactTouched] = useState({
    name: false,
    email: false,
    message: false,
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const contactErrors = useMemo(
    () => validateContact(contactValues),
    [contactValues]
  );

  const isContactValid = Object.keys(contactErrors).length === 0;

  // Close mobile menu on resize to desktop.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 860) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when mobile menu is open (accessibility + UX).
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const onNavClick = (id) => {
    setMobileOpen(false);
    scrollToSection(id);
  };

  const onSkipToContent = (e) => {
    e.preventDefault();
    onNavClick("home");
    const main = document.getElementById("main");
    if (main) main.focus();
  };

  const onContactChange = (e) => {
    const { name, value } = e.target;
    setContactSubmitted(false);
    setContactValues((prev) => ({ ...prev, [name]: value }));
  };

  const onContactBlur = (e) => {
    const { name } = e.target;
    setContactTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onContactSubmit = (e) => {
    e.preventDefault();
    setContactTouched({ name: true, email: true, message: true });

    if (isContactValid) {
      // UI-only: show success state and reset form values.
      setContactSubmitted(true);
      setContactValues({ name: "", email: "", message: "" });
      setContactTouched({ name: false, email: false, message: false });
    }
  };

  return (
    <div className="App">
      <a className="skipLink" href="#main" onClick={onSkipToContent}>
        Skip to content
      </a>

      <header className="siteHeader">
        <div className="container headerInner">
          <div className="brand">
            <span className="brandMark" aria-hidden="true">
              ◼
            </span>
            <span className="brandText">Ocean Portfolio</span>
          </div>

          <nav className="nav" aria-label="Primary navigation">
            <ul className="navList" role="list">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`navLink ${activeSection === s.id ? "is-active" : ""}`}
                    onClick={() => onNavClick(s.id)}
                    aria-current={activeSection === s.id ? "page" : undefined}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="mobileToggle"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-controls="mobile-menu"
            aria-expanded={mobileOpen ? "true" : "false"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="mobileToggleLines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <div
          id="mobile-menu"
          className={`mobileMenu ${mobileOpen ? "is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="mobileMenuPanel">
            <div className="mobileMenuHeader">
              <div className="brand">
                <span className="brandMark" aria-hidden="true">
                  ◼
                </span>
                <span className="brandText">Ocean Portfolio</span>
              </div>
              <button
                type="button"
                className="mobileClose"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <ul className="mobileMenuList" role="list">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`mobileMenuLink ${
                      activeSection === s.id ? "is-active" : ""
                    }`}
                    onClick={() => onNavClick(s.id)}
                    aria-current={activeSection === s.id ? "page" : undefined}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mobileMenuFooter">
              <p className="muted">
                Built with React, lightweight CSS, and accessible motion.
              </p>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => onNavClick("contact")}
              >
                Contact me
              </button>
            </div>
          </div>
          <button
            type="button"
            className="mobileMenuBackdrop"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {/* HERO */}
        <section id="home" className="section hero" aria-label="Hero">
          <div className="container heroGrid">
            <div className="heroCopy" data-reveal>
              <p className="pill">
                <span className="pillDot" aria-hidden="true" />
                Available for projects
              </p>

              <h1 className="heroTitle">
                Modern, accessible interfaces with a calm ocean feel.
              </h1>

              <p className="heroSubtitle">
                I design and build polished web experiences—clean typography, subtle
                motion, and a focus on usability.
              </p>

              <div className="heroActions">
                <button
                  type="button"
                  className="btn btnPrimary btnLarge"
                  onClick={() => onNavClick("work")}
                >
                  View work
                </button>
                <button
                  type="button"
                  className="btn btnGhost btnLarge"
                  onClick={() => onNavClick("contact")}
                >
                  Get in touch
                </button>
              </div>

              <dl className="heroStats" aria-label="Highlights">
                <div className="stat">
                  <dt className="statLabel">Focus</dt>
                  <dd className="statValue">UI engineering</dd>
                </div>
                <div className="stat">
                  <dt className="statLabel">Principles</dt>
                  <dd className="statValue">A11y • performance</dd>
                </div>
                <div className="stat">
                  <dt className="statLabel">Style</dt>
                  <dd className="statValue">Ocean Professional</dd>
                </div>
              </dl>
            </div>

            <div className="heroCardWrap" data-reveal>
              <div className="heroCard">
                <div className="heroCardTop">
                  <div className="avatar" aria-hidden="true">
                    <span>OP</span>
                  </div>
                  <div>
                    <p className="heroName">Your Name</p>
                    <p className="muted heroRole">Frontend Developer</p>
                  </div>
                </div>

                <div className="heroCardBody">
                  <p className="muted">
                    I create single-page experiences with great interaction design,
                    and I love turning product goals into maintainable UI systems.
                  </p>
                  <ul className="checkList" role="list">
                    <li>Semantic HTML + focus styling</li>
                    <li>Motion that respects reduced-motion</li>
                    <li>Responsive layouts without heavy UI libs</li>
                  </ul>
                </div>

                <div className="heroCardActions">
                  <button
                    type="button"
                    className="btn btnSecondary"
                    onClick={() => onNavClick("about")}
                  >
                    About
                  </button>
                  <button
                    type="button"
                    className="btn btnPrimary"
                    onClick={() => onNavClick("contact")}
                  >
                    Contact
                  </button>
                </div>
              </div>
              <div className="heroGlow" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="section about" aria-label="About">
          <div className="container">
            <div className="sectionHeader" data-reveal>
              <h2 className="sectionTitle">About</h2>
              <p className="sectionLead">
                A modern portfolio doesn’t have to be heavy—just intentional.
              </p>
            </div>

            <div className="aboutGrid">
              <article className="card" data-reveal>
                <h3 className="cardTitle">What I do</h3>
                <p className="muted">
                  I build professional UIs that feel fast and thoughtful. My
                  approach focuses on clean architecture, predictable components,
                  and delightful details.
                </p>
                <ul className="bulletList">
                  <li>Design-to-code with strong visual consistency</li>
                  <li>Reusable components and theme tokens</li>
                  <li>Forms with validation and clear feedback</li>
                </ul>
              </article>

              <article className="card" data-reveal>
                <h3 className="cardTitle">How I work</h3>
                <p className="muted">
                  I prefer small, composable pieces: minimal dependencies, great
                  defaults, and progressive enhancement.
                </p>
                <div className="pillRow" aria-label="Skills">
                  <span className="chip">React</span>
                  <span className="chip">CSS</span>
                  <span className="chip">Accessibility</span>
                  <span className="chip">Design systems</span>
                  <span className="chip">Performance</span>
                </div>
              </article>

              <article className="card cardAccent" data-reveal>
                <h3 className="cardTitle">Currently exploring</h3>
                <p className="muted">
                  Motion design patterns that feel calm, plus UI states that guide
                  users without getting in the way.
                </p>
                <div className="callout" role="note">
                  Tip: This template uses IntersectionObserver for reveals and
                  respects <code>prefers-reduced-motion</code>.
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section id="work" className="section work" aria-label="Portfolio">
          <div className="container">
            <div className="sectionHeader" data-reveal>
              <h2 className="sectionTitle">Portfolio</h2>
              <p className="sectionLead">
                A curated set of placeholder projects—swap in your real work when
                ready.
              </p>
            </div>

            <div className="grid" role="list" aria-label="Portfolio gallery">
              {PORTFOLIO_ITEMS.map((item) => (
                <article className="projectCard" key={item.title} role="listitem" data-reveal>
                  <div className="projectTop">
                    <div className="projectIcon" aria-hidden="true">
                      <span />
                    </div>
                    <div className="projectTitleRow">
                      <h3 className="projectTitle">{item.title}</h3>
                      <span className="projectBadge">Case study</span>
                    </div>
                  </div>
                  <p className="muted">{item.description}</p>
                  <div className="tagRow" aria-label="Project tags">
                    {item.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="projectActions">
                    <button type="button" className="btn btnGhost">
                      Preview
                    </button>
                    <button type="button" className="btn btnPrimary">
                      Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="section contact" aria-label="Contact">
          <div className="container">
            <div className="sectionHeader" data-reveal>
              <h2 className="sectionTitle">Contact</h2>
              <p className="sectionLead">
                Send a message—this is a UI-only form with client-side validation.
              </p>
            </div>

            <div className="contactGrid">
              <aside className="card contactCard" data-reveal>
                <h3 className="cardTitle">Let’s build something</h3>
                <p className="muted">
                  Prefer email? Add your real links here. For now, these are
                  placeholders.
                </p>

                <dl className="contactList">
                  <div>
                    <dt className="muted">Email</dt>
                    <dd>
                      <a className="link" href="mailto:hello@example.com">
                        hello@example.com
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="muted">Location</dt>
                    <dd>Remote / Your City</dd>
                  </div>
                  <div>
                    <dt className="muted">Links</dt>
                    <dd className="contactLinks">
                      <a className="link" href="#home" onClick={(e) => e.preventDefault()}>
                        GitHub
                      </a>
                      <a className="link" href="#home" onClick={(e) => e.preventDefault()}>
                        LinkedIn
                      </a>
                    </dd>
                  </div>
                </dl>

                <div className="contactHint" role="note">
                  <strong>Accessibility note:</strong> Errors are announced via{" "}
                  <code>aria-live</code>, and inputs use <code>aria-invalid</code>.
                </div>
              </aside>

              <form className="card formCard" onSubmit={onContactSubmit} noValidate data-reveal>
                <div
                  className="formStatus"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {contactSubmitted ? (
                    <p className="statusSuccess">
                      Message ready! (UI only) — replace this with real submission
                      later.
                    </p>
                  ) : (
                    <p className="muted">
                      Fields marked required must be completed.
                    </p>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="name" className="label">
                    Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="input"
                    value={contactValues.name}
                    onChange={onContactChange}
                    onBlur={onContactBlur}
                    autoComplete="name"
                    aria-invalid={
                      contactTouched.name && contactErrors.name ? "true" : "false"
                    }
                    aria-describedby={contactErrors.name ? "name-error" : undefined}
                    required
                  />
                  {contactTouched.name && contactErrors.name ? (
                    <p className="fieldError" id="name-error" role="alert">
                      {contactErrors.name}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="email" className="label">
                    Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input"
                    value={contactValues.email}
                    onChange={onContactChange}
                    onBlur={onContactBlur}
                    autoComplete="email"
                    aria-invalid={
                      contactTouched.email && contactErrors.email ? "true" : "false"
                    }
                    aria-describedby={contactErrors.email ? "email-error" : undefined}
                    required
                  />
                  {contactTouched.email && contactErrors.email ? (
                    <p className="fieldError" id="email-error" role="alert">
                      {contactErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="message" className="label">
                    Message <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="textarea"
                    rows={6}
                    value={contactValues.message}
                    onChange={onContactChange}
                    onBlur={onContactBlur}
                    aria-invalid={
                      contactTouched.message && contactErrors.message ? "true" : "false"
                    }
                    aria-describedby={contactErrors.message ? "message-error" : undefined}
                    required
                  />
                  {contactTouched.message && contactErrors.message ? (
                    <p className="fieldError" id="message-error" role="alert">
                      {contactErrors.message}
                    </p>
                  ) : null}
                </div>

                <div className="formActions">
                  <button
                    type="submit"
                    className="btn btnPrimary btnLarge"
                    disabled={!isContactValid}
                  >
                    Send message
                  </button>
                  <button
                    type="button"
                    className="btn btnGhost btnLarge"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactValues({ name: "", email: "", message: "" });
                      setContactTouched({ name: false, email: false, message: false });
                    }}
                  >
                    Reset
                  </button>
                </div>

                {!isContactValid ? (
                  <p className="muted small">
                    Complete the required fields to enable sending.
                  </p>
                ) : (
                  <p className="muted small">Ready to send (UI only).</p>
                )}
              </form>
            </div>
          </div>
        </section>

        <footer className="footer" aria-label="Footer">
          <div className="container footerInner">
            <p className="muted small">
              © {new Date().getFullYear()} Ocean Portfolio. Built with React.
            </p>
            <button
              type="button"
              className="linkButton"
              onClick={() => onNavClick("home")}
            >
              Back to top
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
