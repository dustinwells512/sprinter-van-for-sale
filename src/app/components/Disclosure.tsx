const disclosures = [
  ["Windshield", "Cracked \u2014 replacement recommended"],
  ["Awning Shade", "Torn fabric \u2014 repair needed"],
  ["Paint", "Minor areas need touch-up paint"],
  ["Floor", "Small scuff mark on garage area floor"],
  [
    "Hitch Accessories",
    "Swing-out hitch arm and cargo basket shown in photos are not included (stored at a different location)",
  ],
  [
    "Personal Items",
    "Snowboards, bikes, generator, bedding, and other items shown in photos are for staging only \u2014 not included",
  ],
  [
    "Photos",
    "Taken at various stages throughout the build and upgrade process. Some images may show the van before certain modifications were completed. The feature list and specs reflect the van\u2019s current state.",
  ],
];

export default function Disclosure() {
  return (
    <section className="disclosure">
      <div className="container">
        <h2 className="section-title">Transparency & Disclosures</h2>
        <p className="disclosure-intro">
          We believe in complete transparency. Here&apos;s what you should know:
        </p>
        <ul className="disclosure-list">
          {disclosures.map(([label, text]) => (
            <li key={label}>
              <strong>{label}:</strong> {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
