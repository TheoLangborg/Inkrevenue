import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Förhandsvisning av CRM:t på marknadssajten.
 *
 * Skärmarna är återskapade i HTML/CSS enligt `tattoo-crm/docs/inkrevenue-design-system.md`
 * — samma färger, samma Inter, samma statusord — så att bilden studion bygger upp här
 * stämmer när de sedan loggar in på inkrevenue-crm.online.
 *
 * OBS: texten INNE i skärmarna är alltid svensk, även på den engelska sajten. CRM:t
 * finns bara på svenska; att översätta mockupen skulle visa en produkt som inte finns.
 * Bara ramen runt omkring (rubrik, ingress, bildtext) går genom i18n.
 *
 * Skalning: `.crm-window` är en storleksbehållare och allt inuti mäts i `calc(var(--s) * n)`
 * där `--s` är en cqw-baserad enhet. Hela "skärmdumpen" krymper alltså proportionerligt
 * på mobil utan transform-skalning eller JS.
 */

const NAV_GROUPS = [
  {
    label: "Start",
    items: [{ id: "dashboard", label: "Översikt", icon: "home" }]
  },
  {
    label: "Arbete",
    items: [
      { id: "leads", label: "Förfrågningar", icon: "user", badge: 3 },
      { id: "bookings", label: "Bokningar", icon: "calendar" },
      { id: "waitlist", label: "Väntelista", icon: "clock" },
      { id: "social", label: "Sociala medier", icon: "share" }
    ]
  },
  {
    label: "Inställningar",
    items: [
      { id: "profile", label: "Studioprofil", icon: "profile" },
      { id: "rules", label: "Bokningsregler", icon: "sliders" },
      { id: "billing", label: "Abonnemang", icon: "card" }
    ]
  }
];

const ICON_PATHS = {
  home: "M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z",
  user: "M10 10a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 10 10zM3.8 17c0-2.9 2.8-4.6 6.2-4.6s6.2 1.7 6.2 4.6",
  calendar: "M4 5.5h12v11H4zM4 9h12M7.5 3.5v3M12.5 3.5v3",
  clock: "M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM10 6.4V10l2.6 1.6",
  share: "M6.6 11.4 13 14.7M13 5.3 6.6 8.6M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM15 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  profile: "M10 10.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zM4.5 16.8c0-2.6 2.5-4.2 5.5-4.2s5.5 1.6 5.5 4.2",
  sliders: "M3.5 6.5h13M3.5 13.5h13M8 4.4v4.2M13 11.4v4.2",
  card: "M3.5 5.5h13v9h-13zM3.5 8.8h13"
};

function NavIcon({ name }) {
  return (
    <svg className="crm-nav__icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d={ICON_PATHS[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Statusbadge — alltid par (tonad bakgrund + mörk text i samma kulör), aldrig solid. */
function Badge({ tone, children }) {
  return (
    <span className={`crm-badge crm-badge--${tone}`}>
      <span className="crm-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

const SCREENS = [
  { id: "dashboard", tab: "Översikt", group: "Start" },
  { id: "leads", tab: "Förfrågningar", group: "Arbete" },
  { id: "bookings", tab: "Bokningar", group: "Arbete" },
  { id: "waitlist", tab: "Väntelista", group: "Arbete" },
  { id: "social", tab: "Sociala medier", group: "Arbete" }
];

const HEADINGS = {
  dashboard: { title: "God eftermiddag, Nordic Ink", subtitle: "Det viktigaste just nu." },
  leads: { title: "Förfrågningar", subtitle: "Allt som kommit in — och vad som är nästa steg." },
  bookings: { title: "Bokningar", subtitle: "Kommande pass och avbokningar." },
  waitlist: {
    title: "Väntelista & lediga tider",
    subtitle: "Avbokade tider erbjuds automatiskt vidare. Först till kvarn gäller."
  },
  social: { title: "Sociala medier", subtitle: "Kö, godkännanden och publicerat." }
};

// Förfrågningar per dag, senaste 30 dagarna (höjd i procent).
const CHART_BARS = [
  22, 35, 18, 44, 30, 26, 55, 40, 33, 62, 48, 29, 37, 70, 52, 41, 34, 58, 46, 66, 39, 51, 74, 45,
  57, 82, 61, 49, 68, 90
];

function DashboardScreen() {
  return (
    <>
      <div className="crm-card crm-kpis">
        <div className="crm-kpi">
          <span className="crm-kpi__label">Konverteringsgrad</span>
          <strong className="crm-kpi__value">34%</strong>
          <div className="crm-kpi__bar">
            <div className="crm-kpi__bar-fill" style={{ width: "34%" }} />
          </div>
          <span className="crm-kpi__hint">12 av 35 vunna</span>
        </div>
        <div className="crm-kpi">
          <span className="crm-kpi__label">Denna månad</span>
          <div className="crm-kpi__row">
            <strong className="crm-kpi__value">18</strong>
            <span className="crm-trend">+29%</span>
          </div>
          <span className="crm-kpi__hint">+29% vs förra månaden</span>
        </div>
        <div className="crm-kpi">
          <span className="crm-kpi__label">Snitt dagar till bokning</span>
          <strong className="crm-kpi__value">4 d</strong>
          <span className="crm-kpi__hint">Från förfrågan till bekräftad bokning</span>
        </div>
        <div className="crm-kpi">
          <span className="crm-kpi__label">Totalt leads</span>
          <strong className="crm-kpi__value">142</strong>
          <span className="crm-kpi__hint">48 vunna totalt</span>
        </div>

        <div className="crm-chart">
          <div className="crm-chart__head">
            <span className="crm-kpi__label">Förfrågningar per dag — senaste 30 dagarna</span>
          </div>
          <div className="crm-chart__bars">
            {CHART_BARS.map((height, index) => (
              <span key={index} className="crm-chart__bar" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card__head">
          <div>
            <h3>Att göra nu</h3>
            <p>Öppna ärenden som kräver åtgärd.</p>
          </div>
        </div>
        <div className="crm-tablewrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Kund</th>
                <th>Nästa steg</th>
                <th>Prioritet</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Emma Lindqvist</strong><span>Blackwork, underarm</span></td>
                <td>Följ upp manuellt</td>
                <td><Badge tone="danger">Viktigast</Badge></td>
              </tr>
              <tr>
                <td><strong>Jonas Berg</strong><span>Fine line, revben</span></td>
                <td>Svara kunden</td>
                <td><Badge tone="danger">Viktigast</Badge></td>
              </tr>
              <tr>
                <td><strong>Sara Ahmed</strong><span>Realism, överarm</span></td>
                <td>Skapa bokning</td>
                <td><Badge tone="warning">Snart</Badge></td>
              </tr>
              <tr>
                <td><strong>Milo Chen</strong><span>Traditionell, vad</span></td>
                <td>Ta första kontakt</td>
                <td><Badge tone="info">Under kontroll</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card__head">
          <div>
            <h3>Kommande bokningar</h3>
            <p>Det som ligger närmast i schemat.</p>
          </div>
        </div>
        <div className="crm-tablewrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Kund</th>
                <th>Tid</th>
                <th>Typ</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sara Ahmed</strong></td>
                <td>tors 14 aug · 13:00</td>
                <td>Tatueringspass</td>
                <td><Badge tone="booked">Bokad</Badge></td>
              </tr>
              <tr>
                <td><strong>Emma Lindqvist</strong></td>
                <td>fre 15 aug · 10:30</td>
                <td>Konsultation</td>
                <td><Badge tone="booked">Bokad</Badge></td>
              </tr>
              <tr>
                <td><strong>Noah Ek</strong></td>
                <td>mån 18 aug · 15:00</td>
                <td>Touch-up</td>
                <td><Badge tone="booked">Bokad</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const LEAD_FOCUS_VIEWS = [
  "Alla",
  "Nya idag",
  "Kundsvar",
  "Redo att boka",
  "Väntar länge",
  "Har bokning"
];

function LeadsScreen() {
  return (
    <div className="crm-card">
      <div className="crm-chips">
        {LEAD_FOCUS_VIEWS.map((view, index) => (
          <span key={view} className={`crm-chip${index === 0 ? " crm-chip--active" : ""}`}>
            {view}
          </span>
        ))}
      </div>
      <div className="crm-tablewrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Kund</th>
              <th>Status</th>
              <th>Nästa steg</th>
              <th>Nästa bokning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Emma Lindqvist</strong><span>emma.l@mail.se · Blackwork</span></td>
              <td><Badge tone="warning">Kontaktad</Badge></td>
              <td>Följ upp manuellt</td>
              <td className="crm-table__muted">—</td>
            </tr>
            <tr>
              <td><strong>Jonas Berg</strong><span>jonas.b@mail.se · Fine line</span></td>
              <td><Badge tone="info">Ny</Badge></td>
              <td>Svara kunden</td>
              <td className="crm-table__muted">—</td>
            </tr>
            <tr>
              <td><strong>Sara Ahmed</strong><span>sara.a@mail.se · Realism</span></td>
              <td><Badge tone="booked">Bokad</Badge></td>
              <td>Förbered besöket</td>
              <td>14 aug · 13:00</td>
            </tr>
            <tr>
              <td><strong>Milo Chen</strong><span>milo.c@mail.se · Traditionell</span></td>
              <td><Badge tone="info">Ny</Badge></td>
              <td>Ta första kontakt</td>
              <td className="crm-table__muted">—</td>
            </tr>
            <tr>
              <td><strong>Alice Ohlsson</strong><span>alice.o@mail.se · Dotwork</span></td>
              <td><Badge tone="success">Vunnen</Badge></td>
              <td>Kvalitetssäkra historik</td>
              <td className="crm-table__muted">—</td>
            </tr>
            <tr>
              <td><strong>Hugo Nyström</strong><span>hugo.n@mail.se · Neo-traditionell</span></td>
              <td><Badge tone="warning">Kontaktad</Badge></td>
              <td>Följ upp eller boka</td>
              <td className="crm-table__muted">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookingsScreen() {
  return (
    <div className="crm-card">
      <div className="crm-chips">
        <span className="crm-chip crm-chip--active">Kommande</span>
        <span className="crm-chip">Tidigare</span>
        <span className="crm-chip">Avbokade</span>
      </div>
      <div className="crm-tablewrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Kund</th>
              <th>Tid</th>
              <th>Status</th>
              <th>Flaggor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Sara Ahmed</strong><span>Realism, överarm</span></td>
              <td>tors 14 aug · 13:00–17:00</td>
              <td><Badge tone="booked">Bokad</Badge></td>
              <td>Tatueringspass</td>
            </tr>
            <tr>
              <td><strong>Emma Lindqvist</strong><span>Blackwork, underarm</span></td>
              <td>fre 15 aug · 10:30–11:15</td>
              <td><Badge tone="booked">Bokad</Badge></td>
              <td>Konsultation</td>
            </tr>
            <tr>
              <td><strong>Milo Chen</strong><span>Traditionell, vad</span></td>
              <td>lör 16 aug · 12:00–15:00</td>
              <td><Badge tone="success">Bokad av bot</Badge></td>
              <td>Tatueringspass</td>
            </tr>
            <tr>
              <td><strong>Noah Ek</strong><span>Touch-up, axel</span></td>
              <td>mån 11 aug · 15:00–15:45</td>
              <td><Badge tone="success">Genomförd</Badge></td>
              <td>Touch-up</td>
            </tr>
            <tr>
              <td><strong>Vera Lund</strong><span>Fine line, handled</span></td>
              <td>tis 12 aug · 09:00–10:00</td>
              <td><Badge tone="danger">Avbokad</Badge></td>
              <td>Tatueringspass</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Väntelistan (luckåtervinningen). Två kort, som i SlotRecoveryWorkspace: de
 * avbokade tiderna överst med sin egen statusskala (Öppen/Erbjuden/Fylld/
 * Utgången), kön under.
 */
function WaitlistScreen() {
  return (
    <>
      <div className="crm-card">
        <div className="crm-card__head crm-card__head--row">
          <div>
            <h3>Lediga tider</h3>
            <p>Avbokade tider som erbjudits vidare via SMS.</p>
          </div>
          <span className="crm-card__meta">2 av 3 återfyllda</span>
        </div>
        <div className="crm-slots">
          <article className="crm-slot">
            <div>
              <strong>tis 12 aug · 09:00</strong>
              <span>60 min · Vera Lund avbokade i går</span>
            </div>
            <Badge tone="success">Fylld</Badge>
          </article>
          <article className="crm-slot">
            <div>
              <strong>ons 13 aug · 14:00</strong>
              <span>3 tim · erbjuden till 4 på väntelistan</span>
            </div>
            <Badge tone="warning">Erbjuden</Badge>
          </article>
          <article className="crm-slot">
            <div>
              <strong>fre 22 aug · 11:00</strong>
              <span>90 min · ingen matchning ännu</span>
            </div>
            <Badge tone="info">Öppen</Badge>
          </article>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card__head">
          <div>
            <h3>På väntelistan (4)</h3>
            <p>Får SMS så fort en tid som passar blir ledig.</p>
          </div>
        </div>
        <div className="crm-tablewrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Kund</th>
                <th>Passar</th>
                <th>Tillagd</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tove Ilmarinen</strong><span>070 — 123 45 67</span></td>
                <td>60–180 min</td>
                <td>4 aug</td>
                <td><Badge tone="success">Aktiv</Badge></td>
              </tr>
              <tr>
                <td><strong>Rasmus Holm</strong><span>070 — 234 56 78</span></td>
                <td>Från 120 min</td>
                <td>6 aug</td>
                <td><Badge tone="success">Aktiv</Badge></td>
              </tr>
              <tr>
                <td><strong>Nadia Sjögren</strong><span>070 — 345 67 89</span></td>
                <td>45–90 min</td>
                <td>7 aug</td>
                <td><Badge tone="success">Aktiv</Badge></td>
              </tr>
              <tr>
                <td><strong>Petter Alm</strong><span>070 — 456 78 90</span></td>
                <td>Ingen gräns</td>
                <td>8 aug</td>
                <td><Badge tone="success">Aktiv</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const SOCIAL_POSTS = [
  {
    platform: "Instagram",
    type: "Reel",
    caption: "Blackwork-sleeve, session 2 av 3 — svep för före/efter.",
    time: "Idag · 18:00",
    tone: "info",
    status: "Schemalagd"
  },
  {
    platform: "TikTok",
    type: "Kort video",
    caption: "Så bokar du en tid hos oss — 20 sekunder.",
    time: "I morgon · 12:00",
    tone: "info",
    status: "I kö"
  },
  {
    platform: "Facebook",
    type: "Bildkarusell",
    caption: "Fyra fine line-motiv från augusti.",
    time: "Ons 13 aug · 17:00",
    tone: "approval",
    status: "Väntar på godkännande"
  },
  {
    platform: "Instagram",
    type: "Feed-inlägg",
    caption: "Nytt hos oss: touch-up ingår första året.",
    time: "7 aug · 17:00",
    tone: "success",
    status: "Publicerad"
  }
];

function SocialScreen() {
  return (
    <div className="crm-card">
      <div className="crm-chips">
        <span className="crm-chip crm-chip--active">Kö</span>
        <span className="crm-chip">Arkiv</span>
        <span className="crm-chip">Kopplingar</span>
      </div>
      <div className="crm-posts">
        {SOCIAL_POSTS.map((post) => (
          <article key={post.caption} className="crm-post">
            <div className="crm-post__thumb" aria-hidden="true" />
            <div className="crm-post__body">
              <div className="crm-post__meta">
                <strong>{post.platform}</strong>
                <span>· {post.type}</span>
              </div>
              <p className="crm-post__caption">{post.caption}</p>
              <span className="crm-post__time">{post.time}</span>
            </div>
            <Badge tone={post.tone}>{post.status}</Badge>
          </article>
        ))}
      </div>
    </div>
  );
}

const SCREEN_BODIES = {
  dashboard: DashboardScreen,
  leads: LeadsScreen,
  bookings: BookingsScreen,
  waitlist: WaitlistScreen,
  social: SocialScreen
};

export function CrmPreview() {
  const { t } = useLanguage();
  const [active, setActive] = useState("dashboard");

  const screen = SCREENS.find((item) => item.id === active) || SCREENS[0];
  const ScreenBody = SCREEN_BODIES[screen.id];
  const heading = HEADINGS[screen.id];

  return (
    <section className="section section--blue crm-showcase" id="produkten">
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div
          data-reveal="up"
          style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}
        >
          <p className="eyebrow">{t("productPreview.eyebrow")}</p>
          <h2>{t("productPreview.title")}</h2>
          <p className="body" style={{ fontSize: "1.05rem" }}>
            {t("productPreview.lead")}
          </p>
        </div>

        <div
          className="crm-showcase__tabs"
          role="tablist"
          aria-label={t("productPreview.tabsLabel")}
          data-reveal="up"
        >
          {SCREENS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`crm-tab-${item.id}`}
              aria-selected={item.id === active}
              aria-controls="crm-tabpanel"
              className={`crm-showcase__tab${item.id === active ? " crm-showcase__tab--active" : ""}`}
              onClick={() => setActive(item.id)}
            >
              {item.tab}
            </button>
          ))}
        </div>

        <div className="crm-showcase__frame" data-reveal="scale" data-reveal-delay="1">
          <div className="crm-window">
            <div className="crm-window__chrome">
              <span className="crm-window__dot" />
              <span className="crm-window__dot" />
              <span className="crm-window__dot" />
              <span className="crm-window__url">inkrevenue-crm.online</span>
            </div>

            <div
              className="crm-app"
              role="tabpanel"
              id="crm-tabpanel"
              aria-labelledby={`crm-tab-${screen.id}`}
            >
              <aside className="crm-sidebar">
                <div className="crm-sidebar__brand">
                  <svg viewBox="0 0 24 32" width="15" height="20" aria-hidden="true">
                    <path
                      d="M12 2C7 2 3.5 5.5 3.5 10C3.5 17 12 30 12 30C12 30 20.5 17 20.5 10C20.5 5.5 17 2 12 2Z"
                      fill="rgba(255,255,255,0.07)"
                      stroke="#e8edf7"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="4" fill="#d97706" />
                  </svg>
                  <span>
                    <strong>InkRevenue CRM</strong>
                    <small>Bokningar &amp; kunder</small>
                  </span>
                </div>

                <nav className="crm-sidebar__nav">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.label} className="crm-nav-group">
                      <p className="crm-nav-group__title">{group.label}</p>
                      {group.items.map((item) => (
                        <span
                          key={item.id}
                          className={`crm-nav${item.id === screen.id ? " crm-nav--active" : ""}`}
                        >
                          <NavIcon name={item.icon} />
                          {item.label}
                          {item.badge ? <em className="crm-nav__badge">{item.badge}</em> : null}
                        </span>
                      ))}
                    </div>
                  ))}
                </nav>

                <div className="crm-sidebar__footer">
                  <strong>Nordic Ink Studio</strong>
                  <small>Studioanvändare</small>
                </div>
              </aside>

              <div className="crm-main">
                <header className="crm-topbar">
                  <div>
                    <p className="crm-topbar__crumbs">
                      {screen.group} <span>/</span> {screen.tab}
                    </p>
                    {/* Inte en h1: sidan har redan sin rubrik, och förhandsvisningen är en bild av CRM:et. */}
                    <p className="crm-topbar__title">{heading.title}</p>
                    <p className="crm-topbar__subtitle">{heading.subtitle}</p>
                  </div>
                  <div className="crm-topbar__right">
                    <span className="crm-search">
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          d="M8.8 3.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4zM12.7 12.7 16.4 16.4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Sök
                      <kbd>Ctrl K</kbd>
                    </span>
                    <span className="crm-bell">
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          d="M10 3.2a4.4 4.4 0 0 0-4.4 4.4c0 3.4-1.2 4.6-1.2 4.6h11.2s-1.2-1.2-1.2-4.6A4.4 4.4 0 0 0 10 3.2zM8.4 14.8a1.8 1.8 0 0 0 3.2 0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <em>3</em>
                    </span>
                  </div>
                </header>

                <div className="crm-content">
                  <ScreenBody />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="crm-showcase__note" data-reveal="up">
          {t("productPreview.note")}
        </p>
      </div>
    </section>
  );
}
