import { Mountain, Zap, Home, Thermometer } from "lucide-react";

const highlights = [
  {
    icon: Mountain,
    title: "Off-Road Ready",
    text: "ARB Air Locker rear differential with onboard air compressor, RIP KIT VS30 suspension with Agile Offroad components and Fox 2.5\" rear shocks, premium A/T tires",
  },
  {
    icon: Zap,
    title: "800Ah Lithium Power",
    text: "2x the battery of most vans. Solar, shore power, and alternator charging with 3000W inverter",
  },
  {
    icon: Home,
    title: "Bennett Interior by Tommy Camper Vans",
    text: "Professionally designed handcrafted cabinetry, walnut countertops, full kitchen",
  },
  {
    icon: Thermometer,
    title: "Climate Control",
    text: "Dometic roof A/C and Eberspacher diesel heater for year-round comfort",
  },
];

export default function Highlights() {
  return (
    <section className="highlights">
      <div className="container">
        <div className="highlight-grid">
          {highlights.map((h) => (
            <div className="highlight-card" key={h.title}>
              <div className="highlight-icon">
                <h.icon />
              </div>
              <h3>{h.title}</h3>
              <p>{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
