import { LocalBar, OutlinePill } from "../components/LocalBar";

export const metadata = { title: "Privacy — SafarSetu" };

export default function Privacy() {
  return (
    <main>
      <LocalBar title="Privacy notice" crumb="Plain language · prototype, to be finalised with legal review"><OutlinePill href="/">Back to the planner</OutlinePill></LocalBar>
      <section className="section tight">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="stack">
            <p className="sub">Written with the Digital Personal Data Protection Act, 2023 in mind. This is a prototype: it has not had legal review.</p>
            <div className="card"><h2 className="h3">What we use</h2>
              <ul className="stack mt" style={{ paddingLeft: 20, fontSize: 16 }}>
                <li><b>Your route:</b> the places, times and preferences you type in, to build your plan. In the demo they are held in memory and cleared on restart.</li>
                <li><b>Your location:</b> only if you press “use my location”. It is used once to find the nearest place name; we do not track you in the background.</li>
                <li><b>Gap reports:</b> the two areas, category and your text. No name, phone number or device location. We store a one-way hash of an anonymous id only to count independent reporters.</li>
                <li><b>Interviews (field kit):</b> anonymous participant codes, with consent. Never names.</li>
              </ul></div>
            <div className="card"><h2 className="h3">Who else sees it</h2>
              <p className="mt">Place search and map tiles use OpenStreetMap-based services (Photon, Nominatim, OSM tiles, OSRM) and weather uses Open-Meteo; they receive the text you search or the coordinates being drawn. We do not sell data and show no advertising. Authority staff see gap reports for their own region only; they never see who sent them.</p></div>
            <div className="card"><h2 className="h3">Your choices</h2>
              <p className="mt">You can use the planner with no sign-in. Clear a plan any time (“Clear all”). To see or delete a report you sent, quote its reference number to the grievance contact below. Children’s data: under-18 users need a parent or guardian’s consent in any pilot.</p></div>
            <div className="card"><h2 className="h3">How long, and how safe</h2>
              <p className="mt">Reports are deleted automatically after 12 months (a daily job), after which only anonymous totals remain. Every status change by authority staff is logged. Authority access is role-scoped by region and logged. We have not had an external security audit; one is planned before any pilot. If a breach affects personal data we will notify the people affected and the Data Protection Board as the law requires.</p></div>
            <div className="card"><h2 className="h3">The law and its dates</h2>
              <p className="mt">The DPDP Rules were notified on 13 Nov 2025; most duties start about 18 months later, and a shorter timeline (13 Nov 2026) has been proposed but not confirmed. We follow the stricter reading now. This notice is not legal advice.</p></div>
            <div className="card"><h2 className="h3">Grievance contact</h2>
              <p className="mt">[Add: grievance officer name and email before any pilot]</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
