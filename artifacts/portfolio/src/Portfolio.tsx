import { useEffect, useRef, useState } from 'react';

const A = (f: string) =>
  import.meta.env.BASE_URL + 'assets/' + encodeURIComponent(f);

const HASH =
  'cf6a32fc8621ec75fbe509c149afaf8cbc7bc1e7190ebafa2fddc5d532fdde6f';

function removeSelf(e: React.SyntheticEvent<HTMLElement>) {
  e.currentTarget.remove();
}
function removeParent(e: React.SyntheticEvent<HTMLElement>) {
  e.currentTarget.parentElement?.remove();
}
function removeGrandparent(e: React.SyntheticEvent<HTMLElement>) {
  e.currentTarget.parentElement?.parentElement?.remove();
}

function Ticks() {
  return (
    <>
      <span className="tick tl"></span>
      <span className="tick tr"></span>
      <span className="tick bl"></span>
      <span className="tick br"></span>
    </>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function check() {
    const input = inputRef.current;
    const gate = gateRef.current;
    if (!input || !gate) return;
    const v = input.value.trim();
    if (!v) return;
    let ok = false;
    if (window.crypto && crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(v),
        );
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        ok = hex === HASH;
      } catch {
        ok = false;
      }
    } else {
      let x = 5381;
      for (let i = 0; i < v.length; i++) {
        x = ((x * 33) + v.charCodeAt(i)) >>> 0;
      }
      ok = x === 2084910241;
    }
    if (ok) {
      try {
        sessionStorage.setItem('dfok', '1');
      } catch {
        /* ignore */
      }
      onUnlock();
    } else {
      gate.classList.remove('deny');
      void gate.offsetWidth;
      gate.classList.add('deny');
      input.value = '';
      input.focus();
    }
  }

  return (
    <div id="gate" role="dialog" aria-label="Password required" ref={gateRef}>
      <div className="inner">
        <div className="art art-splash">
          <img src={A('gate.png')} alt="OHOKBB — Betrayal" onError={removeParent} />
        </div>
        <div className="ask">Insert Password:</div>
        <input
          id="gatepw"
          ref={inputRef}
          type="password"
          autoComplete="off"
          spellCheck={false}
          aria-label="Password"
          onKeyDown={(e) => {
            if (e.key === 'Enter') check();
          }}
        />
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [locked, setLocked] = useState(() => {
    try {
      return sessionStorage.getItem('dfok') !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('locked', locked);
    return () => document.body.classList.remove('locked');
  }, [locked]);

  // Deep links: the anchor targets only exist after React renders, and
  // images reflow the page as they load — so re-anchor a few times while
  // the layout settles.
  useEffect(() => {
    if (locked || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    const go = () =>
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
    const timers = [200, 700, 1500].map((ms) => window.setTimeout(go, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [locked]);

  const tickerLine = (
    <p>
      <span>Polymarket</span>
      <span className="aw">★</span>
      <span>Waste Management</span>
      <span className="aw">★</span>
      <span>Lagunitas</span>
      <span className="aw">★</span>
      <span>AARP</span>
      <span className="aw">★</span>
      <span>Houston Public Media / PBS</span>
      <span className="aw">★</span>
      <span>Vice</span>
      <span className="aw">★</span>
      <span>MAMA Magazine</span>
      <span className="aw">★</span>
      <span>Galvanick</span>
      <span className="aw">★</span>
      <span>University of Houston</span>
      <span className="aw">★</span>
    </p>
  );

  return (
    <>
      {locked && <Gate onUnlock={() => setLocked(false)} />}
      <div className="shell">
        {/* ================= SIDEBAR ================= */}
        <aside className="sidebar">
          <div className="wordmark">Devin Finch</div>
          <div className="sb-id">
            <strong>Creative Director / Art Director</strong>
            <br />
            Houston, TX
            <br />
            15+ yrs · 10+ national awards
            <br />
            AI-native production
          </div>
          <nav className="sb-nav" aria-label="Case studies">
            <span>The Work</span>
            <a href="#polymarket">Polymarket</a>
            <a href="#allthenticate">Allthenticate</a>
            <a href="#believe">Believe! Journal</a>
            <a href="#ccp">Club Cabana Panic</a>
            <a href="#proxima">Proxima CRO</a>
            <a href="#blackmass">Column Bay / Black Mass</a>
            <a href="#receipts">The Receipts</a>
          </nav>
          <div className="sb-links">
            <a href="mailto:devin@ohokbb.com">Email</a>
            <a
              href="https://www.linkedin.com/in/devin-finch-creativedirector"
              target="_blank"
              rel="noopener"
            >
              LinkedIn
            </a>
            <a href={A('Devin_Finch_Resume.docx')} download>
              Resume
            </a>
          </div>
          <div className="sb-copy">
            © 2026 Devin Finch.
            <br />
            All work shown was produced by these hands (and their machines).
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main>
          {/* HERO */}
          <section className="hero">
            <h1>
              Sensational
              <br />
              Creative
              <br />
              Direction
            </h1>
            <p className="strap">
              Brand, editorial, video &amp; systems — built by hand, accelerated
              by machine.
            </p>
            <div className="meta">
              <div>
                <b>Currently</b>Polymarket · MAMA · WILL Agency
              </div>
              <div>
                <b>Awards</b>dotComm · MarCom · Hermes · AVA
              </div>
              <div>
                <b>Base</b>Houston, Texas
              </div>
              <div>
                <b>Status</b>Open to full-time &amp; select clients
              </div>
            </div>
          </section>

          <div className="checker" aria-hidden="true"></div>

          {/* CLIENT TICKER */}
          <div className="tickerwrap" aria-hidden="true">
            <div className="ticker">
              {tickerLine}
              {tickerLine}
            </div>
          </div>

          {/* ============ POLYMARKET ============ */}
          <a className="row p-red" href="#polymarket" aria-label="Case: Polymarket">
            <span className="chip">Case</span>
            <span className="mq">
              <span className="mq-inner">
                <span>Polymarket — Daily Email System</span>
                <span>Polymarket — Daily Email System</span>
              </span>
            </span>
          </a>
          <section className="case p-red" id="polymarket">
            <div className="kicker">
              <em>Client · Polymarket</em>
              <em>Role · Art Direction + Email Design</em>
              <em>2025–Now</em>
            </div>
            <h2>1.3 million readers. Every graphic. Every line of HTML.</h2>
            <p className="lede">
              The daily visual system for the ~$9B prediction market backed by
              the NYSE's parent company.
            </p>
            <p className="facts">
              Full ownership of the daily newsletter template — layout system,
              editorial imagery through a custom AI composition pipeline, and
              hand-coded production HTML that survives every email client. Plus
              the signup-flow series — eight chrome-rendered hero concepts,
              live-market modules, countdown mechanics — and the newsletter
              artwork for The Oracle.{' '}
              <b>Shipped as the publication's standing daily format.</b>
            </p>
            <div className="grid g-hero">
              <div className="slot tall">
                <Ticks />
                <img
                  src={A('polymarket-hero.jpg')}
                  alt="Polymarket email hero render"
                  onError={removeSelf}
                />
              </div>
            </div>
            <div className="grid g-2">
              <div className="slot">
                <Ticks />
                <img
                  src={A('polymarket-emails.jpg')}
                  alt="Signup flow email series"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('polymarket-detail.jpg')}
                  alt="Email template detail"
                  onError={removeSelf}
                />
              </div>
            </div>
            <p className="caption">
              Signup-flow series E1–E8 · live market modules · production HTML
              by me, end to end.
            </p>
          </section>

          {/* ============ ALLTHENTICATE ============ */}
          <a
            className="row p-ink"
            href="#allthenticate"
            aria-label="Case: Allthenticate"
          >
            <span className="chip">Case</span>
            <span className="mq">
              <span className="mq-inner">
                <span>Allthenticate — Repositioning a Cybersecurity Brand</span>
                <span>Allthenticate — Repositioning a Cybersecurity Brand</span>
              </span>
            </span>
          </a>
          <section className="case p-ink" id="allthenticate">
            <div className="kicker">
              <em>Client · Allthenticate</em>
              <em>Role · Director of Marketing &amp; Creative</em>
              <em>2023–2025</em>
            </div>
            <h2>
              From hardware vendor nobody could place to a brand investors
              bragged about.
            </h2>
            <p className="lede">
              Two and a half years owning everything: positioning, identity,
              web, app, analytics, and the investor narrative.
            </p>
            <p className="facts">
              Rebuilt the brand and website from scratch. Grew traffic{' '}
              <b>~300 → 10,000–15,000 monthly</b>. Designed and copywrote the
              pitch deck behind a <b>$3M seed extension</b>. Directed the full
              mobile app redesign including the patented Rescue Missions
              recovery flow. 50+ videos: RSA launch film, DEF CON demos,
              EDUCAUSE collateral. Lead investor Ping Identity credited the
              transformation.
            </p>
            <div className="grid g-hero">
              <div className="slot tall">
                <Ticks />
                <img
                  src={A('allth-hero.jpg')}
                  alt="Allthenticate website"
                  onError={removeSelf}
                />
              </div>
            </div>
            <div className="grid g-2">
              <div className="slot">
                <Ticks />
                <img
                  src={A('allth-app-1.jpg')}
                  alt="App store screens"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('allth-app-2.jpg')}
                  alt="App store screens"
                  onError={removeSelf}
                />
              </div>
            </div>
            <p className="caption">
              Identity → web → app UI → investor deck → trade show floor. One
              continuous system.
            </p>
          </section>

          {/* ============ BELIEVE ============ */}
          <a
            className="row p-peach"
            href="#believe"
            aria-label="Case: Believe! Journal"
          >
            <span className="chip">Case</span>
            <span className="mq">
              <span className="mq-inner">
                <span>Believe! Journal — Image Systems &amp; Video</span>
                <span>Believe! Journal — Image Systems &amp; Video</span>
              </span>
            </span>
          </a>
          <section className="case p-peach" id="believe">
            <div className="kicker">
              <em>Client · Believe! Journal</em>
              <em>Role · Art Direction + Video</em>
              <em>2025–Now</em>
            </div>
            <h2>A new visual world every quarter. A full asset system every week.</h2>
            <p className="lede">
              Each quarter gets its own direction — Free Enterprise, then the
              PlayStation-memory AI series, now America 250 — and every article
              ships with covers, carousels, video, and a complete Substack asset
              package.
            </p>
            <p className="facts">
              Weekly cadence: editorial covers for the print edition, social
              carousels, short-form video, and per-article Substack packages —
              all inside whichever world the quarter lives in.{' '}
              <b>Three themes deep and counting.</b>
            </p>
            <div className="grid g-3">
              <div className="slot tall">
                <Ticks />
                <img
                  src={A('believe-hero.jpg')}
                  alt="Believe! Journal quarterly theme imagery"
                  onError={removeSelf}
                />
              </div>
              <div className="slot tall">
                <Ticks />
                <img
                  src={A('believe-detail.jpg')}
                  alt="Believe! editorial"
                  onError={removeSelf}
                />
              </div>
              <div className="slot tall">
                <Ticks />
                <img
                  src={A('believe-detail-3.jpg')}
                  alt="Believe! editorial"
                  onError={removeSelf}
                />
              </div>
            </div>
            <div className="grid g-3">
              <div className="slot">
                <Ticks />
                <img
                  src={A('believe-cover-1.jpg')}
                  alt="Article cover"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('believe-cover-2.jpg')}
                  alt="Article cover"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('believe-detail-2.jpg')}
                  alt="Article cover"
                  onError={removeSelf}
                />
              </div>
            </div>
            <div className="grid g-vid">
              <div className="slot vslot">
                <Ticks />
                <video
                  src={A('Believe_JUN2026-EIC_1.mp4')}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={removeSelf}
                ></video>
              </div>
              <div className="slot vslot">
                <Ticks />
                <video
                  src={A('YoungWashington_Reel_Update.mp4')}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={removeSelf}
                ></video>
              </div>
            </div>
            <p className="caption">
              Quarterly directions: Free Enterprise → PlayStation AI → America
              250 (current). Weekly video + carousel output.
            </p>
          </section>

          {/* ============ CLUB CABANA PANIC ============ */}
          <a className="row p-ink" href="#ccp" aria-label="Case: Club Cabana Panic">
            <span className="chip">Signal</span>
            <span className="mq">
              <span className="mq-inner">
                <span>Club Cabana Panic — The Newsletter</span>
                <span>Club Cabana Panic — The Newsletter</span>
              </span>
            </span>
          </a>
          <section className="case p-ink" id="ccp">
            <div className="kicker">
              <em>Imprint · Club Cabana Panic</em>
              <em>Role · Writer + Designer + Producer</em>
              <em>Ongoing</em>
            </div>
            <h2>Where the theory gets written down.</h2>
            <p className="lede">
              Thesis-driven writing on design, AI, and culture — with the visual
              system, preview films, and asset packages made in-house,
              obviously.
            </p>
            <div className="grid g-vid1">
              <div className="slot vslot">
                <Ticks />
                <video
                  src={A('ccp-preview.mp4')}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={removeParent}
                ></video>
              </div>
              <div>
                <div className="slot">
                  <Ticks />
                  <img
                    src={A('CCP-hero.jpg')}
                    alt="Club Cabana Panic visual"
                    onError={removeSelf}
                  />
                </div>
                <nav className="linklist" aria-label="Selected essays">
                  <a
                    href="https://clubcabanapanic.substack.com/p/the-sforza-letter"
                    target="_blank"
                    rel="noopener"
                  >
                    <span>The Sforza Letter</span>
                    <span className="arrow">→</span>
                  </a>
                  <a
                    href="https://clubcabanapanic.substack.com/p/amputated-rooms"
                    target="_blank"
                    rel="noopener"
                  >
                    <span>Amputated Rooms</span>
                    <span className="arrow">→</span>
                  </a>
                  <a
                    href="https://clubcabanapanic.substack.com/p/the-commiseration-frequency"
                    target="_blank"
                    rel="noopener"
                  >
                    <span>The Commiseration Frequency</span>
                    <span className="arrow">→</span>
                  </a>
                </nav>
              </div>
            </div>
            <div className="grid g-2">
              <div className="slot">
                <Ticks />
                <img
                  src={A('CCP-detail-1.jpg')}
                  alt="Club Cabana Panic asset"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('CCP-detail-2.jpg')}
                  alt="Club Cabana Panic asset"
                  onError={removeSelf}
                />
              </div>
            </div>
          </section>

          {/* ============ PROXIMA ============ */}
          <a
            className="row p-pink"
            href="#proxima"
            aria-label="Case: Proxima Clinical Research"
          >
            <span className="chip">Case</span>
            <span className="mq">
              <span className="mq-inner">
                <span>Proxima CRO — The Award Shelf</span>
                <span>Proxima CRO — The Award Shelf</span>
              </span>
            </span>
          </a>
          <section className="case p-pink" id="proxima">
            <div className="kicker">
              <em>Client · Proxima Clinical Research</em>
              <em>Role · Creative Director</em>
              <em>2021–2023</em>
            </div>
            <h2>One rebrand. Ten-plus national awards.</h2>
            <p className="lede">
              dotComm Platinum ×2 · dotComm Gold · MarCom Gold ×2 · Hermes
              Platinum · Hermes Gold · AVA Gold ×2.
            </p>
            <p className="facts">
              Full-scale rebrand for a medtech CRO, plus complete brand builds
              for two spin-outs — the M1 MedTech accelerator and the Inventing
              Tomorrow podcast. Taught branding workshops that helped 5+
              startups toward rebrands and raises.
            </p>
            <div className="grid g-hero">
              <div className="slot">
                <Ticks />
                <img
                  src={A('proxima-hero.jpg')}
                  alt="Proxima rebrand"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('proxima-detail-1.jpg')}
                  alt="Proxima collateral"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('proxima-detail-2.jpg')}
                  alt="Proxima brand strip"
                  onError={removeSelf}
                />
              </div>
            </div>
          </section>

          {/* ============ COLUMN BAY / BLACK MASS ============ */}
          <a
            className="row p-powder"
            href="#blackmass"
            aria-label="Case: Column Bay / BLACK MASS"
          >
            <span className="chip">Tool</span>
            <span className="mq">
              <span className="mq-inner">
                <span>Column Bay — BLACK MASS, an AI Composition System</span>
                <span>Column Bay — BLACK MASS, an AI Composition System</span>
              </span>
            </span>
          </a>
          <section className="case p-powder" id="blackmass">
            <div className="kicker">
              <em>Studio · Column Bay</em>
              <em>Role · Creator</em>
              <em>2025–Now</em>
            </div>
            <h2>I built the tool I wished existed. Then people started buying it.</h2>
            <p className="lede">
              BLACK MASS is an AI composition system built on Framed Ink
              cinematography principles — versioned releases, reusable asset
              architecture, and a commercial licensing tier.
            </p>
            <p className="facts">
              System 01 shipped, CONTINUITY (multi-shot sequencing) followed, v4
              split client data from the public build. Sold on Gumroad with an
              MCP/skill licensing tier — validated by its first commercial
              licensee. <b>Every image system on this site runs through it.</b>
            </p>
            <div className="grid g-hero">
              <div className="slot tall">
                <Ticks />
                <img
                  src={A('blackmass-hero.jpg')}
                  alt="BLACK MASS system"
                  onError={removeSelf}
                />
              </div>
            </div>
            <div className="grid g-2">
              <div className="slot">
                <Ticks />
                <img
                  src={A('column-1.jpg')}
                  alt="Column Bay work"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('columb-2.jpg')}
                  alt="Column Bay work"
                  onError={removeSelf}
                />
              </div>
            </div>
            <div className="grid g-2">
              <div className="slot">
                <Ticks />
                <img
                  src={A('columb-3.jpg')}
                  alt="Column Bay work"
                  onError={removeSelf}
                />
              </div>
              <div className="slot">
                <Ticks />
                <img
                  src={A('columb-4.jpg')}
                  alt="Column Bay work"
                  onError={removeSelf}
                />
              </div>
            </div>
            <nav className="linklist" aria-label="BLACK MASS link">
              <a
                href="https://columnbay.com/blackmass"
                target="_blank"
                rel="noopener"
              >
                <span>BLACK MASS — columnbay.com/blackmass</span>
                <span className="arrow">→</span>
              </a>
            </nav>
          </section>

          {/* ============ RECEIPTS ============ */}
          <section className="receipts" id="receipts">
            <h2>The Receipts</h2>
            <p className="sub">Fifteen years of paper trail, abbreviated.</p>
            <div
              className="slot"
              style={{ minHeight: 320, marginBottom: 10 }}
            >
              <Ticks />
              <video
                src={A('DevinFinch_reel.mp4')}
                controls
                muted
                loop
                playsInline
                onError={removeParent}
              ></video>
            </div>
            <p className="caption" style={{ marginBottom: 26 }}>
              Animation reel — broadcast, commercial &amp; motion work.
            </p>
            <div className="rlist">
              <div className="rline">
                <span className="yr">2026</span>
                <span className="what">
                  DoD pitch film — concept, composites, edit &amp; VO,
                  one-person production
                </span>
                <span className="who">Galvanick</span>
              </div>
              <div className="rline">
                <span className="yr">2023</span>
                <span className="what">
                  Full-stack animation aired on PBS — backgrounds, characters,
                  motion (w/ United Way &amp; ConocoPhillips)
                </span>
                <span className="who">Houston Public Media</span>
              </div>
              <div className="rline">
                <span className="yr">2023</span>
                <span className="what">
                  Broadcast transitions, title sequences &amp; animation
                </span>
                <span className="who">AARP</span>
              </div>
              <div className="rline">
                <span className="yr">2021–22</span>
                <span className="what">
                  CCUS / energy-transition decks, designed &amp; animated with
                  oil &amp; gas executives
                </span>
                <span className="who">UH Energy</span>
              </div>
              <div className="rline">
                <span className="yr">2021</span>
                <span className="what">
                  Mobile app UI &amp; HQ display systems (Fortune 500)
                </span>
                <span className="who">Waste Management</span>
              </div>
              <div className="rline">
                <span className="yr">2019–21</span>
                <span className="what">
                  CPG &amp; beer packaging — incl. Houston favorite Cali Boy
                </span>
                <span className="who">Design Riot</span>
              </div>
              <div className="rline">
                <span className="yr">2018–19</span>
                <span className="what">
                  Multi-part Lagunitas documentary series, raw-to-polished,
                  motion packages (via DINOLION)
                </span>
                <span className="who">Lagunitas</span>
              </div>
              <div className="rline">
                <span className="yr">2018–19</span>
                <span className="what">
                  Commercial production in LA — Walgreens, StarKist (edit,
                  audio, storyboards)
                </span>
                <span className="who">Freelance</span>
              </div>
              <div className="rline">
                <span className="yr">2019</span>
                <span className="what">
                  Cartoon "Tommy Knuckles" pitched to near-production; COVID had
                  other plans
                </span>
                <span className="who">Frederator</span>
              </div>
              <div className="rline">
                <span className="yr">2010–13</span>
                <span className="what">
                  Comic series "Molly My Die" and "BBT"
                </span>
                <span className="who">Vice</span>
              </div>
              <div className="rline">
                <span className="yr">2003→</span>
                <span className="what">
                  First licensed illustration at age 12. Been at it since.
                </span>
                <span className="who">Clear Lake, TX</span>
              </div>
            </div>
          </section>

          <div className="saintsbar">
            <div className="slot">
              <img
                src={A('saintsgride-1.jpg')}
                alt="Patron saints — Philip K. Dick, Wally George, Robert Anton Wilson"
                onError={removeGrandparent}
              />
            </div>
            <div className="cap">Patron saints · Dick — George — Wilson</div>
          </div>

          <div className="checker" aria-hidden="true"></div>

          {/* FOOTER */}
          <footer>
            <a className="mail" href="mailto:devin@ohokbb.com">
              devin@ohokbb.com
            </a>
            <div className="fine">
              <span>© 2026 Devin Finch · Houston, TX</span>
              <span>Open to full-time roles &amp; select clients</span>
              <span>Set in F37 Judge, Instrument Serif &amp; Space Mono</span>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
