import React, { useEffect, useMemo, useState } from 'react';
import {
  aboutHighlights,
  contactMethods,
  faqs,
  featureCards,
  galleryImages,
  programHighlights,
  programStats,
  programs,
  privacyHighlights,
  privacyPractices,
  tuitionOptions,
  notFoundLinks,
  scheduleRows,
  spotlightItems,
  staffMembers,
  testimonials,
  termsHighlights,
  termsNotes,
  thankYouLinks,
  thankYouSteps,
} from './content/siteContent';
import {
  adminAccessMode,
  clearAdminDashboardUnlocked,
  getAdminDashboardData,
  isAdminDashboardUnlocked,
  isFirebaseReady,
  saveContactInquiry,
  saveSiteEvent,
  setAdminDashboardUnlocked,
  verifyAdminCode,
} from './lib/firebase';

const routes = [
  { path: '/', label: 'Home' },
  { path: '/programs', label: 'Programs' },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Blog' },
  { path: '/faqs', label: 'FAQs' },
  { path: '/contact', label: 'Contact' },
];

const utilityRoutes = [
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms of Use' },
  { path: '/thank-you', label: 'Thank You' },
];

const adminRoutes = [{ path: '/admin', label: 'Firebase Admin' }];

const allRoutes = [...routes, ...utilityRoutes, ...adminRoutes];

const blogPostSources = import.meta.glob('./content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const blogPosts = parseBlogPosts(blogPostSources);
const blogPostMap = Object.fromEntries(blogPosts.map((post) => [post.slug, post]));

function parseBlogPosts(sources) {
  return Object.values(sources)
    .map((source) => parseBlogPost(source))
    .sort((left, right) => left.order - right.order);
}

function parseBlogPost(source) {
  const { frontmatter, body } = parseMarkdownDocument(source);
  const sections = body
    .split(/\n(?=## )/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const heading = lines[0].replace(/^##\s+/, '');
      const text = lines.slice(1).join(' ').trim();
      return { heading, text };
    });

  return {
    slug: frontmatter.slug,
    title: frontmatter.title,
    description: frontmatter.description,
    readingTime: frontmatter.readingTime,
    image: frontmatter.image,
    order: Number(frontmatter.order || 0),
    takeaways: frontmatter.takeaways || [],
    sections,
  };
}

function parseMarkdownDocument(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: source.trim() };
  }

  const frontmatter = parseFrontmatter(match[1]);
  return { frontmatter, body: match[2].trim() };
}

function parseFrontmatter(source) {
  const data = {};
  const lines = source.split('\n');
  let currentKey = null;

  lines.forEach((line) => {
    const arrayItem = line.match(/^\s*-\s+(.*)$/);
    if (arrayItem && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(arrayItem[1].trim());
      return;
    }

    const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValue) {
      return;
    }

    const [, key, rawValue] = keyValue;
    currentKey = key;

    if (rawValue === '') {
      data[key] = [];
      return;
    }

    data[key] = rawValue.trim();
  });

  return data;
}
const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/BrightPathLearningCenter',
    path: 'M13 22v-8h3l1-4h-4V8c0-1.1.9-2 2-2h2V2h-3c-2.8 0-5 2.2-5 5v3H8v4h3v8h2z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/brightpathlearningcenter',
    path: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm4.8-3.3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/15551234567',
    path: 'M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 1 0 20.5 3.5zm-1.8 14.1a8.8 8.8 0 0 1-4.4 2.1c-1 .2-2 .1-3-.2a8.8 8.8 0 0 1-4.2-2.8 8.8 8.8 0 0 1-1.8-3.9c-.2-1.4 0-2.8.5-4.1a8.8 8.8 0 0 1 3-3.8c1.3-.9 2.8-1.5 4.4-1.5a8.8 8.8 0 0 1 6.6 2.7 8.8 8.8 0 0 1 0 12.5z',
  },
];

function App() {
  const [path, setPath] = useState(getPath);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setPath(getPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const current = allRoutes.find((route) => route.path === path);
    const pageTitle = current
      ? current.path === '/'
        ? 'BrightPath Learning Center'
        : `${current.label} | BrightPath Learning Center`
      : 'Page not found | BrightPath Learning Center';
    document.title = pageTitle;
    window.scrollTo({ top: 0, behavior: 'auto' });
    trackEvent('page_view', {
      route: current?.path ?? path,
      title: current?.label ?? 'Page not found',
    });
  }, [path]);

  const currentPage = useMemo(() => getPage(path), [path]);

  const navigate = (nextPath, state = {}) => {
    if (nextPath === path) return;
    window.history.pushState(state, '', nextPath);
    setPath(nextPath);
    setMenuOpen(false);
  };

  return (
    <div className="page">
      <header className="navbar">
        <button className="brand brand-button" type="button" onClick={() => navigate('/')}>
          <LogoMark />
          <div>
            <strong>BrightPath Learning Center</strong>
            <span>Learning today for a brighter tomorrow</span>
          </div>
        </button>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {routes.map((route) => (
            <button
              key={route.path}
              type="button"
              className={route.path === path ? 'nav-link active' : 'nav-link'}
              onClick={() => navigate(route.path)}
            >
              {route.label}
            </button>
          ))}
          <button type="button" className="btn btn-primary nav-cta" onClick={() => navigate('/contact')}>
            Enroll Now
          </button>
        </nav>
      </header>

      <main>{currentPage}</main>

      <footer className="footer">
        <div>
          <div className="footer-brand">
            <LogoMark />
            <div>
              <strong>BrightPath Learning Center</strong>
              <p>Learning today for a brighter tomorrow</p>
            </div>
          </div>
          <p>128 Willow Street, Suite 4, Harborview</p>
          <p>Email admissions at kierjoyno@gmail.com</p>
          <p>(415) 555-0137</p>
        </div>

        <div>
          <strong>Quick Links</strong>
          <div className="footer-links">
            {routes.map((route) => (
              <button key={route.path} type="button" className="footer-link" onClick={() => navigate(route.path)}>
                {route.label}
              </button>
            ))}
          </div>
          <strong className="footer-subheading">Legal</strong>
          <div className="footer-links">
            {utilityRoutes.map((route) => (
              <button key={route.path} type="button" className="footer-link" onClick={() => navigate(route.path)}>
                {route.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <strong>Follow Us</strong>
          <div className="socials" aria-label="Social media links">
            {socialLinks.map((link) => (
              <SocialIcon key={link.label} label={link.label} href={link.href} path={link.path} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function getPath() {
  const pathname = window.location.pathname;
  return pathname === '/index.html' ? '/' : pathname;
}

function navigateTo(path, state = {}) {
  window.history.pushState(state, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

async function trackEvent(name, details = {}) {
  if (typeof window === 'undefined') return;

  try {
    await saveSiteEvent(name, details);
  } catch {
    // Tracking should never block navigation or rendering.
  }
}

function useAdminDashboard() {
  const [data, setData] = useState(() => getAdminDashboardData());

  const refresh = () => {
    setData(getAdminDashboardData());
  };

  useEffect(() => {
    const handleStorage = () => refresh();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { data, refresh };
}

function useAdminAccess() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return isAdminDashboardUnlocked();
  });

  const unlock = (code) => {
    const success = verifyAdminCode(code);
    setAdminDashboardUnlocked(success);
    setIsUnlocked(success);
    return success;
  };

  const lock = () => {
    clearAdminDashboardUnlocked();
    setIsUnlocked(false);
  };

  return { isUnlocked, unlock, lock };
}

function PageShell({
  eyebrow,
  title,
  description,
  heroImage,
  heroVisualClassName = '',
  heroLayout = 'default',
  children,
  actions,
  compact = false,
  titleClassName = '',
}) {
  return (
    <div className={`page-shell page-shell-${heroLayout} ${compact ? 'compact' : ''}`.trim()}>
      <section className="page-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={titleClassName}>{title}</h1>
          <p className="hero-text">{description}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
        </div>

        {heroImage ? (
          <div className={`page-hero-visual ${heroVisualClassName}`.trim()}>
            <img src={heroImage} alt="" />
          </div>
        ) : null}
      </section>
      {children}
    </div>
  );
}

function HomePage() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <section className="hero reveal-on-scroll">
        <div className="hero-copy">
          <p className="eyebrow">Academic support with a warm learning center feel</p>
          <h1 className="serif-accent hero-title">Helping children improve academically, one subject at a time.</h1>
          <p className="hero-text">
            BrightPath combines small-group tutoring, steady routines, and caring teachers so
            students can build confidence and make real academic progress.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
              Enroll Now
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
              Book a Free Trial
            </button>
          </div>
          <div className="trust-points" aria-label="Trust points">
            <span>Academic Growth</span>
            <span>Small Groups</span>
            <span>Parent Updates</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image-frame">
            <img
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
              alt="Children learning together in a bright classroom"
            />
            <div className="hero-badge">
              <span className="hero-badge-icon" aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>Trusted by parents</strong>
                <span>Warm, structured learning every day</span>
              </div>
            </div>
          </div>
          <div className="hero-notes">
            <div>
              <strong>Small class sizes</strong>
              <span>Personal attention in every room</span>
            </div>
            <div>
              <strong>Parent updates</strong>
              <span>Clear communication that feels personal</span>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section reveal-on-scroll">
        <SectionHeading
          eyebrow="Welcome"
          title="A calm, structured place where students can improve and feel confident."
          description="BrightPath combines focused teaching, thoughtful routines, and a welcoming atmosphere so children settle in and keep progressing."
          titleClassName="serif-accent"
        />
        <div className="home-spotlight">
          <div className="home-spotlight-visual">
            <img
              src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80"
              alt="Teacher guiding children through a classroom activity"
            />
          </div>
          <div className="home-spotlight-copy">
            {spotlightItems.map((item) => (
              <article className="spotlight-card spotlight-inline" key={item.title}>
                <div className="spotlight-icon" aria-hidden="true">
                  {item.icon}
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section reveal-on-scroll">
        <SectionHeading
          eyebrow="Programs"
          title="Math, English, science, and reading support that families can understand at a glance."
          description="Choose one subject area or combine support into a plan that fits your child’s goals."
        />
        <div className="program-grid home-program-grid">
          {programs.map((program) => (
            <article className="program-card program-card-standard" key={program.title}>
              <div className="program-image-wrap">
                <img src={program.image} alt={program.title} />
                <span className="program-chip" aria-hidden="true">
                  {program.tag}
                </span>
              </div>
              <div className="program-content">
                <div className="program-title-row">
                  <div className="program-mini-icon" aria-hidden="true">
                    {program.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="blog-label">{program.tag}</p>
                    <h3>{program.title}</h3>
                  </div>
                </div>
                <p>{program.description}</p>
                <button type="button" className="text-link-button" onClick={() => navigateTo('/contact')}>
                  Book a free trial
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SectionDivider />

      <section className="section section-alt reveal-on-scroll">
        <SectionHeading
          eyebrow="Why families stay"
          title="A few steady details that shape the experience."
          description="The right learning environment should feel welcoming, dependable, and focused on progress."
        />
        <div className="home-feature-layout">
          <article className="story-panel home-feature-lead">
            <p className="eyebrow">Built around calm routines</p>
            <h3>BrightPath is designed to feel steady, human, and easy to trust.</h3>
            <p>
              Instead of a busy list of claims, the experience focuses on the details families
              actually notice: strong teaching, small groups, clear communication, and a space
              that helps children settle in quickly.
            </p>
          </article>
          <div className="home-feature-list">
            {featureCards.slice(0, 6).map((item) => (
              <article className="home-feature-row" key={item.title}>
                <div className="feature-icon" aria-hidden="true">
                  {item.icon}
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section section-alt reveal-on-scroll">
        <div className="split-layout">
          <div>
            <SectionHeading
              eyebrow="Teaching approach"
              title="Practical teaching that balances care, structure, and academic progress."
              description="We focus on routines that help children settle in, participate, and build confidence without pressure."
            />
          </div>
          <div className="story-panel">
            <p>
              Our classes blend guided instruction with hands-on discovery, so children stay engaged
              while building real skills in math, English, science, and reading.
            </p>
            <p>
              We work closely with families because children progress best when home and school feel connected.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section reveal-on-scroll">
        <SectionHeading
          eyebrow="Parent feedback"
          title="The kind of place families remember."
          description="A few words from parents who chose BrightPath for academic support and a warm learning environment."
        />
        <div className="testimonial-grid home-testimonial-grid">
          {testimonials.map((item) => (
            <blockquote className="testimonial-card" key={item.name}>
              <p>"{item.quote}"</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section section-alt reveal-on-scroll">
        <SectionHeading
          eyebrow="Gallery"
          title="A glimpse into daily life at BrightPath."
          description="Warm classrooms, active learning, and small moments that feel reassuring."
        />
        <div className="gallery-grid">
          {galleryImages.map((src, index) => (
            <figure className="gallery-item" key={src}>
              <img src={src} alt={`Learning center activity ${index + 1}`} />
            </figure>
          ))}
        </div>
      </section>

      <section className="section reveal-on-scroll">
        <SectionHeading
          eyebrow="Blog"
          title="Short reads for parents who like practical guidance."
          description="Articles on learning, routines, and school readiness that are easy to scan."
        />
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article className="blog-card" key={post.title}>
              <p className="blog-label">Parent Guide</p>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <button
                type="button"
                className="text-link-button"
                onClick={() => navigateTo(`/blog/${post.slug}`)}
              >
                Read article
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-editorial reveal-on-scroll">
        <img
          src="https://images.unsplash.com/photo-1485546784815-5d71b9d07f68?auto=format&fit=crop&w=1600&q=80"
          alt="Children and teacher in a bright classroom moment"
        />
        <div className="home-editorial-overlay">
          <p className="eyebrow">The BrightPath rhythm</p>
          <h2>Calm mornings, focused teaching, visible progress.</h2>
          <p>
            A learning center where the atmosphere feels warm, polished, and focused on results.
          </p>
        </div>
      </section>

      <SectionDivider />

      <section className="cta-section reveal-on-scroll" id="contact">
        <div className="cta-copy">
          <p className="eyebrow">Ready to take the next step?</p>
          <h2>Enroll your child and start the BrightPath journey.</h2>
          <p>
            We'd love to welcome your family, answer your questions, and help you find the right
            program for your child.
          </p>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Enroll Now
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
            Book a Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}

function ProgramsPage() {
  return (
    <PageShell
      eyebrow="Programs"
      title="Different learning paths, one consistent BrightPath experience."
      description="Families can choose the program that fits their child's needs, whether they are just starting out or need focused support."
      heroImage="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80"
      heroVisualClassName="page-hero-visual-small"
      heroLayout="compact"
      titleClassName="serif-accent"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Enroll Now
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/faqs')}>
            Book a Free Trial
          </button>
        </>
      }
    >
      <section className="section reveal-on-scroll">
        <div className="magazine-layout">
          <div className="magazine-lead">
            <p className="eyebrow">Program lineup</p>
            <h2>Four learning paths, presented like a feature story.</h2>
            <p>
              BrightPath offers math, English, science, and reading support. Each path is designed
              to feel personal, structured, and easy to scan.
            </p>
            <div className="magazine-stats">
              {programStats.map((stat) => (
                <div key={stat.label} className="magazine-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section section-alt reveal-on-scroll">
        <SectionHeading
          eyebrow="Program highlights"
          title="A clearer view of what each path is designed to do."
          description="We keep the structure simple so the differences between programs are easy to scan."
        />
        <div className="spotlight-grid program-highlights">
          {programHighlights.map((item) => (
            <article className="spotlight-card" key={item.title}>
              <div className="spotlight-icon" aria-hidden="true">
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section reveal-on-scroll">
        <div className="program-mag-grid">
          {programs.map((program) => (
            <article className="program-card program-card-standard" key={program.title}>
              <div className="program-image-wrap">
                <img src={program.image} alt={program.title} />
                <span className="program-chip" aria-hidden="true">
                  {program.tag}
                </span>
              </div>
              <div className="program-content">
                <div className="program-title-row">
                  <div className="program-mini-icon" aria-hidden="true">
                    {program.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="blog-label">{program.tag}</p>
                    <h3>{program.title}</h3>
                  </div>
                </div>
                <p>{program.description}</p>
                <button type="button" className="text-link-button" onClick={() => navigateTo('/contact')}>
                  Enquire about this path
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SectionDivider />

      <section className="section section-alt reveal-on-scroll">
        <SectionHeading
          eyebrow="Weekly rhythm"
          title="A predictable day that keeps children settled and focused."
          description="Children do best when they know what comes next, so our schedule stays steady and easy to follow."
        />
        <div className="program-schedule-layout">
          <div className="schedule-list">
            {scheduleRows.map((row) => (
              <div key={row.label} className="schedule-row">
                <strong>{row.label}</strong>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
          <div className="program-side-note">
            <div className="contact-card-icon" aria-hidden="true">
              ✦
            </div>
            <h3>Designed to feel consistent, not rigid.</h3>
            <p>
              The schedule gives children enough structure to feel secure while leaving room for
              curiosity, movement, and discovery.
            </p>
          </div>
        </div>
      </section>

      <section className="section reveal-on-scroll">
        <SectionHeading
          eyebrow="Tuition and enrollment"
          title="Clear next steps and simple pricing families can understand."
          description="BrightPath keeps enrollment transparent so parents know what to expect before they visit."
        />
        <div className="pricing-grid">
          {tuitionOptions.map((item) => (
            <article className="pricing-card" key={item.title}>
              <p className="blog-label">BrightPath</p>
              <h3>{item.title}</h3>
              <strong>{item.price}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
        <div className="story-panel enrollment-panel">
          <div>
            <p className="eyebrow">Enrollment flow</p>
            <h3>Visit, match, and begin with confidence.</h3>
          </div>
          <div className="schedule-list">
            {[
              { label: '1. Inquiry', value: 'Reach out by email, phone, or the contact form.' },
              { label: '2. Tour', value: 'See classrooms, ask questions, and meet the team.' },
              { label: '3. Placement', value: 'We recommend the right program and schedule.' },
              { label: '4. Start', value: 'Children begin with a gentle, supported first week.' },
            ].map((row) => (
              <div key={row.label} className="schedule-row">
                <strong>{row.label}</strong>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="cta-section reveal-on-scroll">
        <div className="cta-copy">
          <p className="eyebrow">Need help choosing?</p>
          <h2>We can recommend the best fit based on your child's age and goals.</h2>
          <p>Reach out and we&apos;ll help you narrow down the right program with no pressure.</p>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Contact admissions
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
            Book a Free Trial
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="A learning center built for steady growth, real progress, and family trust."
      description="BrightPath was created to feel welcoming, organized, and encouraging from the very first visit."
      heroImage="https://images.unsplash.com/photo-1491013516836-7db643ee125a?auto=format&fit=crop&w=1400&q=80"
      heroLayout="reverse"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/programs')}>
            Explore programs
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
            Visit us
          </button>
        </>
      }
    >
      <section className="section">
        <div className="split-layout">
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="A simple idea: children learn best when they feel known and supported."
              description="BrightPath started with the belief that education should be warm, structured, and personal."
            />
            <div className="about-image-card">
              <img
                src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=1200&q=80"
                alt="Teacher helping children in a classroom"
              />
            </div>
          </div>
          <div className="story-stack">
            <div className="story-panel">
              <p>
                We combine subject-based support, reading help, and tutoring so each child can make
                real progress without feeling rushed.
              </p>
              <p>
                Parents trust us because we keep communication clear and routines dependable.
              </p>
            </div>
            <div className="spotlight-grid about-highlights">
              {aboutHighlights.map((item) => (
                <article className="spotlight-card" key={item.title}>
                  <div className="spotlight-icon" aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <SectionHeading
          eyebrow="What we value"
          title="The classroom works best when care and structure move together."
          description="These values guide how we teach, communicate, and build relationships with families."
        />
        <div className="approach-grid">
          {[
            {
              title: 'Play with purpose',
              text: 'Children explore, but every activity also supports learning goals.',
            },
            {
              title: 'Child-centered support',
              text: 'We adjust lessons to match readiness, pace, and individual confidence.',
            },
            {
              title: 'Consistent communication',
              text: 'Families know what their child is learning and how they are progressing.',
            },
          ].map((item, index) => (
            <article className="approach-item" key={item.title}>
              <span className="approach-step">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section reveal-on-scroll">
        <SectionHeading
          eyebrow="Meet the team"
          title="Experienced educators who keep BrightPath steady and personal."
          description="Families should know who is guiding the classroom and supporting their child each day."
        />
        <div className="staff-grid">
          {staffMembers.map((staff) => (
            <article className="staff-card" key={staff.name}>
              <div className="staff-avatar" aria-hidden="true">
                {staff.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </div>
              <p className="blog-label">{staff.role}</p>
              <h3>{staff.name}</h3>
              <p className="staff-credentials">{staff.credentials}</p>
              <p>{staff.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Inside BrightPath"
          title="A calm environment that still feels bright and active."
          description="Our rooms, routines, and team are designed to help children settle in quickly."
        />
        <div className="gallery-grid">
          {galleryImages.slice(0, 4).map((src, index) => (
            <figure className="gallery-item" key={src}>
              <img src={src} alt={`BrightPath learning space ${index + 1}`} />
            </figure>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Meet the team</p>
          <h2>Come see how BrightPath can support your child's next stage.</h2>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Book a visit
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function BlogPage() {
  const featuredPost = blogPosts[0];

  return (
    <PageShell
      eyebrow="Blog"
      title="Practical guidance for parents who want to support learning at home."
      description="Short reads that help with routines, school readiness, and confidence-building."
      heroImage="https://images.unsplash.com/photo-1550376026-cc36a0b1e7c3?auto=format&fit=crop&w=1400&q=80"
      heroLayout="wide"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Talk to us
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/faqs')}>
            Common questions
          </button>
        </>
      }
    >
      <section className="section">
        <SectionHeading
          eyebrow="Featured article"
          title={featuredPost.title}
          description={featuredPost.description}
        />
        <article className="story-panel featured-article">
          <div>
            <p className="blog-label">Parent Guide</p>
            <h3>{featuredPost.title}</h3>
            <p>{featuredPost.sections[0]?.text}</p>
          </div>
        </article>
      </section>

      <section className="section section-alt">
        <SectionHeading
          eyebrow="Recent posts"
          title="Short, useful articles for busy families."
          description="The goal is quick support, not long reading sessions."
        />
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article className="blog-card" key={post.title}>
              <p className="blog-label">Parent Guide</p>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <p className="blog-meta">{post.readingTime}</p>
              <button type="button" className="text-link-button" onClick={() => navigateTo(`/blog/${post.slug}`)}>
                Read article
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="split-layout">
          <div>
            <SectionHeading
              eyebrow="Reading support"
              title="Small habits at home can make a big difference."
              description="These are easy ideas parents can use during everyday routines."
            />
          </div>
          <div className="story-panel">
            <p>Read signs aloud while driving or walking.</p>
            <p>Ask children to retell a story in their own words.</p>
            <p>Let children point out letters, sounds, and familiar words in the world around them.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Want more guidance?</p>
          <h2>We share parent-friendly insights that make the school year easier.</h2>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Ask for help
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function BlogPostPage({ post }) {
  return (
    <PageShell
      eyebrow="Blog"
      title={post.title}
      description={post.description}
      heroImage={post.image}
      heroLayout="wide"
      titleClassName="serif-accent"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Talk to us
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/blog')}>
            Back to blog
          </button>
        </>
      }
    >
      <section className="section">
        <div className="split-layout">
          <div className="story-panel blog-detail-panel">
            <p className="blog-label">{post.readingTime}</p>
            <h3>Why this matters for families</h3>
            <p>{post.sections[0].text}</p>
            <p>{post.sections[1].text}</p>
          </div>
          <div className="story-panel blog-detail-side">
            <h3>Quick takeaways</h3>
            <div className="blog-takeaways">
              {post.takeaways.map((item) => (
                <div className="blog-takeaway" key={item}>
                  <span aria-hidden="true">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <SectionHeading
          eyebrow="Practical guidance"
          title="Three ideas you can start using right away."
          description="A short note that families can use right away."
          titleClassName="serif-accent"
        />
        <div className="feature-grid">
          {post.sections.map((section) => (
            <article className="feature-card" key={section.heading}>
              <div className="feature-icon" aria-hidden="true">
                ✓
              </div>
              <h3>{section.heading}</h3>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Need a personal answer?</p>
          <h2>We can talk through your child's stage and next steps.</h2>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Contact admissions
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <PageShell
      eyebrow="FAQs"
      title="A few clear answers for families exploring BrightPath."
      description="If you're comparing learning centers, these are the questions most parents ask first."
      heroLayout="minimal"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Contact admissions
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/programs')}>
            See programs
          </button>
        </>
      }
    >
      <section className="section">
        <SectionHeading
          eyebrow="Common questions"
          title="Helpful answers without the back-and-forth."
          description="These cover the basics, but you can always reach out for a more detailed conversation."
        />
        <div className="faq-intro">
          <img
            src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80"
            alt="Young child reading with a teacher"
          />
          <div className="faq-intro-copy">
            <div className="contact-card-icon" aria-hidden="true">
              ?
            </div>
            <h3>Quick answers for common enrollment questions.</h3>
            <p>
              Families usually want to know about age groups, tours, schedules, and how we support
              children during the first weeks.
            </p>
          </div>
        </div>
        <div className="faq-grid">
          {faqs.map((item) => (
            <article className={openIndex === item.question ? 'faq-card open' : 'faq-card'} key={item.question}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === item.question ? null : item.question)}
                aria-expanded={openIndex === item.question}
              >
                <div className="faq-card-icon" aria-hidden="true">
                  ?
                </div>
                <div>
                  <h3>{item.question}</h3>
                  <span>{openIndex === item.question ? 'Hide answer' : 'Show answer'}</span>
                </div>
              </button>
              <div className="faq-answer" hidden={openIndex !== item.question}>
                <p>{item.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="split-layout">
          <div>
            <SectionHeading
              eyebrow="Enrollment steps"
              title="A straightforward process that keeps things easy."
              description="We try to keep the next step clear so families do not feel overwhelmed."
            />
          </div>
          <div className="schedule-list">
            {[
              { label: '1. Reach out', value: 'Call, email, or send a message through the contact page.' },
              { label: '2. Schedule a visit', value: 'See the space and ask any questions in person.' },
              { label: '3. Choose a program', value: 'We help match your child with the right class.' },
              { label: '4. Start smoothly', value: 'We guide you through the first days and routines.' },
            ].map((row) => (
              <div key={row.label} className="schedule-row">
                <strong>{row.label}</strong>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Policies"
          title="Predictable routines help children feel secure."
          description="Families usually want to know how the day works before they enroll."
        />
        <div className="feature-grid">
          {[
            'Arrival and pickup routines',
            'Progress updates for parents',
            'Age-based learning groups',
            'Healthy snack and break times',
            'Gentle transition support',
            'Open communication with families',
          ].map((item) => (
            <article className="feature-card" key={item}>
              <div className="feature-icon" aria-hidden="true">
                OK
              </div>
              <h3>{item}</h3>
              <p>Designed to make the experience smoother for both children and parents.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Still deciding?</p>
          <h2>We can walk you through the right fit for your child.</h2>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Reach out now
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function ContactPage() {
  const [submission, setSubmission] = useState({
    status: 'idle',
    message: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    message: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmission({ status: 'idle', message: '', name: '' });

    try {
      await saveContactInquiry(formData);

      setSubmission({
        status: 'success',
        message: 'Thanks, we’ll reach out soon to help with next steps.',
        name: formData.name,
      });
      void trackEvent('lead_submitted', {
        page: window.location.pathname,
        child_age: formData.age,
        inquiry_length: formData.message.length,
      });
      navigateTo('/thank-you', {
        inquiryName: formData.name,
        inquiryEmail: formData.email,
      });
      setFormData({
        name: '',
        age: '',
        email: '',
        message: '',
      });
    } catch (error) {
      setSubmission({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to send your message right now.',
        name: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Contact"
      title="Book a free trial, ask a question, or plan a visit to BrightPath."
      description="Whether you're ready to enroll or just exploring, we'd be happy to help."
      heroLayout="minimal"
      actions={
        <>
          <a
            className="btn btn-primary"
            href="mailto:kierjoyno@gmail.com?subject=BrightPath%20Free%20Trial%20Request"
          >
            Book a Free Trial
          </a>
          <a className="btn btn-secondary" href="tel:+15551234567">
            Call now
          </a>
        </>
      }
    >
      <section className="section">
        <div className="contact-layout">
          <div className="contact-stack">
            <div className="contact-card">
              <div className="contact-card-icon" aria-hidden="true">
                LOC
              </div>
              <h3>Contact details</h3>
              <p>128 Willow Street, Suite 4, Harborview</p>
              <p>Email admissions at kierjoyno@gmail.com</p>
              <p>(415) 555-0137</p>
              <p>Monday to Friday, 8:00 AM - 5:00 PM</p>
            </div>
            <div className="contact-methods">
              {contactMethods.map((item) => (
                <div className="contact-method" key={item.label}>
                  <div className="contact-card-icon" aria-hidden="true">
                    {item.icon}
                  </div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="contact-map-card">
              <div className="contact-card-icon" aria-hidden="true">
                MAP
              </div>
              <h3>Find BrightPath on the map</h3>
              <p>
                Families visit our Harborview location for tours, trials, and enrollment
                conversations.
              </p>
              <a
                className="text-link-button"
                href="https://www.google.com/maps/search/?api=1&query=128%20Willow%20Street%2C%20Suite%204%2C%20Harborview"
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            {submission.status === 'success' ? (
              <div className="contact-success" role="status" aria-live="polite">
                Thanks, {submission.name || 'there'}. {submission.message}
              </div>
            ) : null}
            {submission.status === 'error' ? (
              <div className="contact-error" role="alert" aria-live="polite">
                {submission.message}
              </div>
            ) : null}
            <label>
              Parent name
              <input
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Child's age
              <input
                name="age"
                type="text"
                placeholder="For example: 4 years old"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              What are you looking for?
              <textarea
                name="message"
                rows="5"
                placeholder="Tell us a little about your child and what you need."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send inquiry'}
            </button>
          </form>
        </div>
      </section>

      <section className="section section-alt">
        <SectionHeading
          eyebrow="Visit"
          title="See the space, meet the team, and get a feel for the classrooms."
          description="A visit is the best way to know whether the environment feels right for your family."
        />
        <div className="feature-grid">
          {[
            'Tour the classrooms',
            'Meet the instructors',
            'Learn about programs',
            'Discuss start dates',
            'Review enrollment steps',
            'Ask follow-up questions',
          ].map((item) => (
            <article className="feature-card" key={item}>
              <div className="feature-icon" aria-hidden="true">
                BP
              </div>
              <h3>{item}</h3>
              <p>We keep the visit relaxed so families can focus on the experience.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Let's talk</p>
          <h2>We're ready when you are.</h2>
        </div>
        <div className="cta-actions">
          <a
            className="btn btn-primary"
            href="mailto:kierjoyno@gmail.com?subject=BrightPath%20Free%20Trial%20Request"
          >
            Book a Free Trial
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrow="Privacy Policy"
      title="How BrightPath handles family information with care."
      description="We only collect the details needed to respond to your inquiry, support enrollment, and keep communication clear."
      heroLayout="minimal"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Contact us
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/')}>
            Back home
          </button>
        </>
      }
    >
      <section className="section">
        <div className="split-layout">
          <div>
            <SectionHeading
              eyebrow="At a glance"
              title="We keep the process simple and the data minimal."
              description="BrightPath uses contact information to reply to families, coordinate visits, and support enrollment questions."
            />
            <div className="story-panel">
              <p>
                If you fill out a form or send us an email, we may store the details you share so
                we can respond properly and continue the conversation.
              </p>
              <p>
                We do not sell personal information. Access is limited to team members who need it
                to help your family.
              </p>
            </div>
          </div>
          <div className="story-panel">
            <p className="blog-label">Summary</p>
            <h3>Information is used to help families, not to overwhelm them.</h3>
            <p>
              We keep records focused on the learning experience, inquiry support, and routine
              communication around tours or enrollment.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <SectionHeading
          eyebrow="What we collect"
          title="Only the details that help us respond and support your visit."
          description="The data we receive is limited to the information you choose to submit."
        />
        <div className="feature-grid">
          {privacyHighlights.map((item) => (
            <article className="feature-card" key={item.title}>
              <div className="feature-icon" aria-hidden="true">
                {item.title.slice(0, 2).toUpperCase()}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="How it is used"
          title="The information helps us communicate clearly and keep records accurate."
          description="We use family information in ways that are practical, respectful, and easy to understand."
        />
        <div className="feature-grid">
          {privacyPractices.map((item) => (
            <article className="feature-card" key={item.title}>
              <div className="feature-icon" aria-hidden="true">
                BP
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="split-layout">
          <div className="story-panel">
            <p className="blog-label">Your choices</p>
            <h3>You can update or review information when needed.</h3>
            <p>
              If anything changes, contact us and we will help correct your information or stop
              non-essential updates.
            </p>
          </div>
          <div className="story-panel">
            <p className="blog-label">Questions</p>
            <h3>Need a closer look at how we handle data?</h3>
            <p>
              Reach out and we will explain the current process in plain language so you know what
              to expect.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Need clarification?</p>
          <h2>We are happy to walk you through anything on this page.</h2>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Book a Free Trial
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/')}>
            Back to home
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function TermsPage() {
  return (
    <PageShell
      eyebrow="Terms"
      title="A clear set of expectations for using the BrightPath site."
      description="These terms keep the website straightforward for families while the team handles tours, enrollment, and support."
      heroLayout="minimal"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/programs')}>
            View programs
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
            Contact admissions
          </button>
        </>
      }
    >
      <section className="section">
        <SectionHeading
          eyebrow="Use of the site"
          title="Please use the website as a family resource and communication tool."
          description="The site is meant to help you explore BrightPath and connect with our team."
        />
        <div className="feature-grid">
          {termsHighlights.map((item) => (
            <article className="feature-card" key={item.title}>
              <div className="feature-icon" aria-hidden="true">
                {item.title.slice(0, 2).toUpperCase()}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="split-layout">
          <div className="story-panel">
            <p className="blog-label">Enrollment and visits</p>
            <h3>Class placement and scheduling are confirmed directly with our team.</h3>
            <p>
              Any tour, start date, or program recommendation you see online should be treated as a
              first step, not a final enrollment confirmation.
            </p>
          </div>
          <div className="story-panel">
            <p className="blog-label">Payments</p>
            <h3>Billing details are always confirmed in writing.</h3>
            <p>
              Tuition notes and pricing on the site are informational until the admissions team
              shares a final schedule or agreement.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Core notes"
          title="A few practical rules that keep the site easy to use."
          description="These are simple expectations for content, communication, and respectful use."
        />
        <div className="feature-grid">
          {termsNotes.map((item) => (
            <article className="feature-card" key={item.title}>
              <div className="feature-icon" aria-hidden="true">
                BP
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Still have questions?</p>
          <h2>We are happy to clarify anything before you visit.</h2>
        </div>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/contact')}>
            Talk to us
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/faqs')}>
            Read FAQs
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function ThankYouPage() {
  const inquiryName = window.history.state?.inquiryName || 'there';

  return (
    <PageShell
      eyebrow="Thank you"
      title={`Thanks, ${inquiryName}. We received your inquiry.`}
      description="Your message has been sent to BrightPath, and our team will follow up as soon as possible."
      heroLayout="minimal"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/programs')}>
            Explore programs
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
            Send another message
          </button>
        </>
      }
    >
      <section className="section">
        <div className="split-layout">
          <div className="story-panel">
            <p className="blog-label">What happens next</p>
            <h3>We will review your message and respond with the next best step.</h3>
            <p>
              Most families hear back by email or phone. If you mentioned a program or age group,
              we will include the most relevant information first.
            </p>
          </div>
          <div className="story-panel">
            <p className="blog-label">Helpful next move</p>
            <h3>Review programs, FAQs, or the blog while you wait.</h3>
            <p>
              Those pages can help you compare options, see our approach, and feel ready for the
              first conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <SectionHeading
          eyebrow="Next steps"
          title="A calm process that keeps the family experience simple."
          description="Here is the path most families take after sending an inquiry."
        />
        <div className="schedule-list">
          {thankYouSteps.map((step) => (
            <div key={step.label} className="schedule-row">
              <strong>{step.label}</strong>
              <span>{step.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Useful links"
          title="A few places to keep exploring while we prepare a reply."
          description="These pages make it easier to compare programs and get answers quickly."
        />
        <div className="feature-grid">
          {thankYouLinks.map((link) => (
            <article className="feature-card" key={link.path}>
              <div className="feature-icon" aria-hidden="true">
                BP
              </div>
              <h3>{link.title}</h3>
              <p>{link.text}</p>
              <button type="button" className="text-link-button" onClick={() => navigateTo(link.path)}>
                Open page
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Need help sooner?</p>
          <h2>You can still call or email the BrightPath team anytime.</h2>
        </div>
        <div className="cta-actions">
          <a className="btn btn-primary" href="mailto:kierjoyno@gmail.com">
            Email us
          </a>
          <a className="btn btn-secondary" href="tel:+15551234567">
            Call now
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function FirebaseAdminPage() {
  const { data, refresh } = useAdminDashboard();
  const { isUnlocked, unlock, lock } = useAdminAccess();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isUnlocked) {
    return (
      <PageShell
        eyebrow="Private access"
        title="Enter the BrightPath admin code."
        description="This temporary session-locked dashboard keeps the private view separate from the public site."
        heroLayout="minimal"
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/')}>
            Back home
          </button>
        }
      >
        <section className="section">
          <div className="story-panel admin-login-panel">
            <p className="blog-label">Secure view</p>
            <h3>Use the temporary private code to open the dashboard.</h3>
            <p>
              The dashboard is kept intentionally simple today, with access centralized in one
              place so it can be swapped to Firebase Auth later without reshaping the content.
            </p>
            <div className="admin-access-meta" aria-label="Dashboard access details">
              <span className="admin-access-chip">
                Mode: {adminAccessMode === 'temporary-passcode' ? 'Temporary passcode' : adminAccessMode}
              </span>
              <span className="admin-access-chip">Session only</span>
              <span className="admin-access-chip">Mirrored data</span>
            </div>
            <form
              className="admin-login-form"
              onSubmit={(event) => {
                event.preventDefault();
                const success = unlock(code);
                setError(success ? '' : 'That code did not unlock the dashboard.');
              }}
            >
              <label>
                Admin code
                <input
                  type="password"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Enter the code"
                />
              </label>
              {error ? (
                <p className="admin-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="hero-actions">
                <button type="submit" className="btn btn-primary">
                  Open dashboard
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/')}>
                  Back home
                </button>
              </div>
            </form>
          </div>
        </section>
      </PageShell>
    );
  }

  const recentInquiries = data.inquiries;
  const recentEvents = data.events;

  return (
    <PageShell
      eyebrow="Private dashboard"
      title="BrightPath activity dashboard."
      description="A temporary private browser session view for reviewing mirrored inquiries and site activity."
      heroLayout="minimal"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={refresh}>
            Refresh
          </button>
          <button type="button" className="btn btn-secondary" onClick={lock}>
            Lock dashboard
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/')}>
            Back home
          </button>
        </>
      }
    >
      <section className="section">
        <div className="feature-grid admin-grid">
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              FB
            </div>
            <h3>Storage status</h3>
            <p>{isFirebaseReady ? 'Connected to Firestore' : 'Firebase not configured'}</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              PR
            </div>
            <h3>Project ID</h3>
            <p>brightpath-learning-center</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              AC
            </div>
            <h3>Access mode</h3>
            <p>{adminAccessMode === 'temporary-passcode' ? 'Temporary passcode' : adminAccessMode}</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              CI
            </div>
            <h3>Contact inquiries</h3>
            <p>{recentInquiries.length} mirrored entries</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              EV
            </div>
            <h3>Site events</h3>
            <p>{recentEvents.length} mirrored entries</p>
          </article>
        </div>
      </section>

      <section className="section section-alt">
        <div className="split-layout">
          <div className="story-panel">
            <p className="blog-label">Latest inquiries</p>
            <h3>Recent contact submissions.</h3>
            <div className="schedule-list">
              {recentInquiries.length > 0 ? (
                recentInquiries.map((item) => (
                  <div key={item.id || `${item.email}-${item.submittedAt}`} className="schedule-row">
                    <strong>{item.name || 'Unknown parent'}</strong>
                    <span>
                      {item.email || 'No email'} - {item.submittedAt || 'No timestamp'}
                    </span>
                    <span>{item.message || 'No message'}</span>
                  </div>
                ))
              ) : (
                <p>No mirrored inquiries yet. Submit the contact form to populate this area.</p>
              )}
            </div>
          </div>
          <div className="story-panel">
            <p className="blog-label">Latest events</p>
            <h3>Recent page and lead tracking.</h3>
            <div className="schedule-list">
              {recentEvents.length > 0 ? (
                recentEvents.map((item) => (
                  <div key={item.id || `${item.name}-${item.timestamp}`} className="schedule-row">
                    <strong>{item.name || 'Unknown event'}</strong>
                    <span>
                      {item.path || '/'} - {item.timestamp || 'No timestamp'}
                    </span>
                    <span>{item.label || 'No label'}</span>
                  </div>
                ))
              ) : (
                <p>No mirrored events yet. Browse the site to populate this area.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split-layout">
          <div className="story-panel">
            <p className="blog-label">Future ready</p>
            <h3>The access layer is isolated for a later Firebase Auth swap.</h3>
            <p>
              The dashboard content reads from one helper, and the access check lives in a separate
              helper too, so upgrading the sign-in method later only touches a small slice of code.
            </p>
          </div>
          <div className="story-panel">
            <p className="blog-label">Current setup</p>
            <h3>Private access stays simple until the billing-backed auth path is ready.</h3>
            <p>
              For now the view is session locked, data is mirrored from successful site activity,
              and the public pages remain unchanged.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function getPage(path) {
  switch (path) {
    case '/':
      return <HomePage />;
    case '/programs':
      return <ProgramsPage />;
    case '/about':
      return <AboutPage />;
    case '/blog':
      return <BlogPage />;
    case '/faqs':
      return <FaqPage />;
    case '/contact':
      return <ContactPage />;
    case '/privacy-policy':
      return <PrivacyPolicyPage />;
    case '/terms':
      return <TermsPage />;
    case '/thank-you':
      return <ThankYouPage />;
    case '/admin':
      return <FirebaseAdminPage />;
    default:
      if (path.startsWith('/blog/')) {
        const post = blogPostMap[path.replace('/blog/', '')];
        if (post) {
          return <BlogPostPage post={post} />;
        }
      }
      return <NotFoundPage />;
  }
}

function NotFoundPage() {
  return (
    <PageShell
      eyebrow="404"
      title="We couldn’t find that page."
      description="The link may be outdated or the address may have been typed incorrectly. The BrightPath site still has a few easy places to continue from here."
      heroLayout="minimal"
      compact
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => navigateTo('/')}>
            Back home
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo('/contact')}>
            Contact admissions
          </button>
        </>
      }
    >
      <section className="section">
        <div className="split-layout">
          <div className="story-panel">
            <p className="blog-label">Helpful links</p>
            <h3>Try one of these pages instead.</h3>
            <p>
              Most visitors head back to the homepage, explore a program, or send a quick message to
              the BrightPath team.
            </p>
          </div>
          <div className="feature-grid">
            {notFoundLinks.map((link) => (
              <article className="feature-card" key={link.path}>
                <div className="feature-icon" aria-hidden="true">
                  BP
                </div>
                <h3>{link.title}</h3>
                <p>{link.text}</p>
                <button type="button" className="text-link-button" onClick={() => navigateTo(link.path)}>
                  Open page
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-copy">
          <p className="eyebrow">Need help now?</p>
          <h2>We can point you to the right BrightPath page.</h2>
        </div>
        <div className="cta-actions">
          <a className="btn btn-primary" href="mailto:kierjoyno@gmail.com">
            Email us
          </a>
          <a className="btn btn-secondary" href="tel:+15551234567">
            Call now
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function SectionHeading({ eyebrow, title, description, titleClassName = '' }) {
  return (
    <div className="section-heading">
      <div className="section-heading-mark" aria-hidden="true">
        ●
      </div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className={titleClassName}>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function SocialIcon({ label, href, path }) {
  return (
    <a className="social-icon" href={href} aria-label={label} target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  );
}

function LogoMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        <defs>
          <linearGradient id="bpLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E88E5" />
            <stop offset="55%" stopColor="#54B5FF" />
            <stop offset="100%" stopColor="#C79B43" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#bpLogoGrad)" />
        <path
          d="M20 24c4.5-3.4 8.9-5.1 12-5.1S39.5 20.6 44 24v16.5c-4.5-3.4-8.9-5.1-12-5.1s-7.5 1.7-12 5.1V24Z"
          fill="rgba(255,255,255,0.92)"
        />
        <path d="M32 18.5c-2.2 0-4 .9-4 2.1s1.8 2.1 4 2.1 4-.9 4-2.1-1.8-2.1-4-2.1Z" fill="#fff7df" />
        <path d="M32 25.2v14.6" stroke="#1F2A37" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M32 35.1c-4.6 0-8.6 2.1-11 5.5" stroke="#1F2A37" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M32 35.1c4.6 0 8.6 2.1 11 5.5" stroke="#1F2A37" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="section-divider" aria-hidden="true">
      <span />
      <span>BrightPath</span>
      <span />
    </div>
  );
}

export default App;




