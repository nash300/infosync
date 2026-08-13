import { adminExternalServices } from "@/lib/admin/external-services";

export default function ServicesPage() {
  return (
    <main className="admin-services-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-operation-kicker">External dashboards</p>
          <h1 className="admin-title">Services</h1>
          <p className="admin-subtitle">
            Open the services used to run Screenia. Links open in a new tab so
            your admin work stays available here.
          </p>
        </div>
      </header>

      <section className="admin-services-grid" aria-label="Screenia services">
        {adminExternalServices.map((service) => (
          <a
            key={service.name}
            href={service.href}
            target="_blank"
            rel="noreferrer"
            className="admin-service-card"
          >
            <span className="admin-service-icon" aria-hidden="true">
              {service.shortLabel}
            </span>
            <span className="admin-service-copy">
              <small>{service.category}</small>
              <strong>{service.name}</strong>
              <span>{service.description}</span>
              <span className="admin-service-example">
                <strong>Example</strong>
                {service.example}
              </span>
              <span className="admin-service-action">
                {service.actionLabel}
                <span aria-hidden="true">↗</span>
              </span>
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
