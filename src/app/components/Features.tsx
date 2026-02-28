const categories = [
  {
    title: "Drivetrain & Performance",
    items: [
      {
        name: "ARB Air Locker",
        desc: "Rear differential with 4.18 ratio for serious off-road capability",
      },
      {
        name: "Onboard Air Compressor",
        desc: "ARB engine-mounted air system with quick disconnect fittings front and rear. Includes hose, filter, and air tools \u2014 air up tires, run air tools, and operate the locker from anywhere on the van",
      },
      {
        name: "3.0L OM642 Diesel",
        desc: "7-Speed automatic transmission, recently serviced",
      },
      {
        name: "Pedal Control 2.0",
        desc: "Throttle controller eliminates lag, improves drivability",
      },
    ],
  },
  {
    title: "Suspension & Wheels",
    items: [
      {
        name: "RIP KIT VS30 Baja Package",
        desc: "Agile Offroad front coil assist, B6 struts, heavy-duty leaf springs, Fox 2.5\" rear shocks - adds ~2.5\" lift",
      },
      {
        name: "Fox 2.5\" Digressive Shocks",
        desc: "Premium Fox rear shocks for superior off-road performance",
      },
      {
        name: "Overlander XT Wheels by Agile Offroad",
        desc: "Matte grey with matte black lip, cast-flow-formed construction - BRAND NEW with <10 miles (5 total)",
      },
      {
        name: "Falken Wildpeak A/T4W",
        desc: "265/70-17 Load Range E, 3PMSF rated - BRAND NEW with <10 miles (5 tires including spare)",
      },
    ],
  },
  {
    title: "Electrical System",
    items: [
      {
        name: "800Ah Lithium Battery Bank",
        desc: "Upgraded Renogy lithium system - DOUBLE the capacity of most vans for extended off-grid capability",
      },
      {
        name: "400W Solar Power",
        desc: "Two 200W Renogy monocrystalline panels on roof rack",
      },
      {
        name: "3000W Pure Sine Wave Inverter",
        desc: "Brand new Renogy unit (replaced November 2025)",
      },
      {
        name: "Triple Charging System",
        desc: "Solar, 70A shore power, and 32A alternator charging",
      },
    ],
  },
  {
    title: "Exterior Equipment",
    items: [
      {
        name: "Tommy Roof Rack",
        desc: "Wooden deck platform perfect for stargazing",
      },
      {
        name: "Baja Designs LED Lights",
        desc: "Four S1 exterior work/scene lights, roof-mounted, dash-controlled",
      },
      {
        name: "Fiamma F45s Awning",
        desc: "Side-mounted retractable awning for outdoor living",
      },
      {
        name: "Starlink Mini",
        desc: "Roof-mounted with magnetic mount and waterproof installation",
      },
      {
        name: "Owl Trax Table",
        desc: "Stainless steel outdoor table/cooking area that mounts to sliding door track",
      },
      {
        name: "Aluminess Surf Pole & Paddleboard Rack",
        desc: "High-roof surf pole with side-mounted hooks (2 hooks), custom-modified to integrate with Owl ladder and roof rack",
      },
      {
        name: "Owl Vans Accessories",
        desc: "Side ladder, steps with tread plates, Molle panels",
      },
      {
        name: "Agency 6 Rear Storage",
        desc: "Dual exterior lockers with Molle panels",
      },
      {
        name: "Owl B2 Dual Bike Carrier",
        desc: "Top-mounted dual bike rack on rear storage box - holds 2 bikes",
      },
      {
        name: "Class IV Hitch Receiver",
        desc: "Curt Class IV 2\" hitch receiver with Factor 55 locking hitch pin",
      },
      {
        name: "OWL Storage Boxes",
        desc: "Monster Box XL (40\"\u00d724\"\u00d716\") + Mini Monster Box - lockable aluminum cargo boxes",
      },
      {
        name: "Additional Storage",
        desc: "Rotopax 2-gallon diesel with locking mount, OWL Sherpa cargo carrier",
      },
      {
        name: "Agile Offroad Heavy Duty Scissor Jack",
        desc: "7000 lb / 3.5 ton capacity, drill-operable (\u00bd\" hex drive), extended height 20.5\"",
      },
    ],
  },
  {
    title:
      "Interior - Bennett Layout (Professionally Designed & Installed by Tommy Camper Vans)",
    items: [
      {
        name: "Handcrafted Cabinetry",
        desc: "White painted maple and pine with walnut butcherblock countertops",
      },
      {
        name: "Full Kitchen",
        desc: "Farm sink, induction stove, gooseneck faucet, slide-out Dometic fridge",
      },
      {
        name: "Sleeping Platform",
        desc: '65\u00d754" bed (fits queen bedding) with massive storage underneath',
      },
      {
        name: "Swivel Seats",
        desc: "Universal swivel on both driver and passenger seats",
      },
      {
        name: "Climate Control",
        desc: "RTX 2000 Dometic roof A/C and Eberspacher diesel heater",
      },
      {
        name: "Two Maxxair Fans",
        desc: "7500 (intake/exhaust) and 6400 (exhaust only)",
      },
      {
        name: "Power Outlets",
        desc: "Multiple 110V outlets with integrated USB throughout van",
      },
      {
        name: "Premium Insulation",
        desc: "Mylar foam (floor/ceiling), mineral wool (walls), Havelock wool (doors)",
      },
      {
        name: "Cab Liner/Overhead Storage",
        desc: "Organized overhead storage with protective cab liner",
      },
      {
        name: "Owl Molle Seatback Panels",
        desc: "Tactical storage and organization panels for driver and passenger seats (pair)",
      },
    ],
  },
  {
    title: "Recent Maintenance (All performed by Certified Mercedes Dealer)",
    items: [
      {
        name: "Comprehensive Service B",
        desc: "Complete service including transmission, differentials, brakes (Feb 2025)",
      },
      {
        name: "Brake System Flush",
        desc: "Full flush with Xentry-activated ABS bleed, Mercedes DOT4 Plus fluid",
      },
      {
        name: "Four-Wheel Alignment",
        desc: "Professional alignment completed after suspension installation",
      },
    ],
  },
];

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <h2 className="section-title">Premium Features & Upgrades</h2>
        {categories.map((cat) => (
          <div className="feature-category" key={cat.title}>
            <h3 className="category-title">{cat.title}</h3>
            <div className="feature-grid">
              {cat.items.map((item) => (
                <div className="feature-item" key={item.name}>
                  <h4>{item.name}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
