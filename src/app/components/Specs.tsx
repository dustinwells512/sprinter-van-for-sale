const specs = [
  {
    title: "Vehicle Details",
    items: [
      ["Year", "2020"],
      ["Make", "Mercedes-Benz"],
      ["Model", "Sprinter 2500"],
      ["Roof", "High Roof"],
      ["Mileage", "68,743 miles"],
      ["Wheelbase", '170" Extended'],
      ["Exterior Color", "Tommy Camper Blue Gray"],
      ["Engine", "3.0L OM642 Diesel"],
      ["Transmission", "7-Speed Automatic"],
      ["Sleeps", "2"],
      ["Rides", "2"],
    ],
  },
  {
    title: "Power System",
    items: [
      ["Battery", "800Ah Renogy Lithium (2x most van builds)"],
      ["Solar", "400W (2\u00d7 200W panels)"],
      ["Inverter", "3000W Pure Sine Wave"],
      ["Alternator Charging", "32A DC charger"],
      ["Shore Power", "70A charger (standard 120V household plug)"],
      ["Solar Controller", "30A Renogy Wanderer"],
    ],
  },
  {
    title: "Suspension & Wheels",
    items: [
      ["Suspension", "RIP KIT VS30 Baja Package with Agile Offroad components"],
      ["Lift", "~2.5 inches"],
      ["Front", "Agile Offroad B6 struts with coil assist"],
      ["Rear", 'Fox 2.5" digressive shocks, Agile Offroad heavy-duty leaf springs'],
      ["Wheels", "Overlander XT by Agile Offroad - BRAND NEW with <10 miles (5 total)"],
      ["Tires", "Falken Wildpeak A/T4W 265/70-17 - BRAND NEW with <10 miles (5 total)"],
      ["Differential", "ARB Air Locker (4.18 ratio)"],
      ["Drivetrain", "2WD with ARB Air Locker for enhanced off-road capability"],
    ],
  },
  {
    title: "Interior Features",
    items: [
      ["Layout", "Bennett Interior (professionally designed & installed by Tommy Camper Vans)"],
      ["Bed", '65\u00d754" (queen-size compatible)'],
      ["Fridge", "Dometic CFX 75 dual-zone"],
      ["Heating", "Eberspacher diesel heater"],
      ["Cooling", "Dometic RTX 2000 roof A/C"],
      ["Ventilation", "2\u00d7 Maxxair fans"],
      ["Water", "Heated exterior shower"],
    ],
  },
];

export default function Specs() {
  return (
    <section id="specs" className="specs">
      <div className="container">
        <h2 className="section-title">Technical Specifications</h2>
        <div className="specs-grid">
          {specs.map((card) => (
            <div className="spec-card" key={card.title}>
              <h3>{card.title}</h3>
              <ul>
                {card.items.map(([label, value]) => (
                  <li key={label}>
                    <strong>{label}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
