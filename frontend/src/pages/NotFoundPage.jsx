import { SiteLink } from "../utils/siteRouter";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";

export function NotFoundPage() {
  usePageMetadata({
    title: buildPageTitle("Sidan kunde inte hittas"),
    description: "Sidan du letar efter finns inte längre. Gå tillbaka till startsidan eller öppna studiokatalogen.",
    noIndex: true
  });

  return (
    <section className="section section--white">
      <div className="container">
        <div className="empty-panel">
          <p className="eyebrow">404</p>
          <h2>Sidan kunde inte hittas</h2>
          <p>
            Länken verkar vara fel eller så finns sidan inte längre. Du kan alltid gå tillbaka till
            startsidan eller öppna studiokatalogen.
          </p>
          <div className="cta-row">
            <SiteLink className="btn btn-primary" href="/">
              Till startsidan
            </SiteLink>
            <SiteLink className="btn btn-secondary" href="/studios">
              Se studios
            </SiteLink>
          </div>
        </div>
      </div>
    </section>
  );
}
