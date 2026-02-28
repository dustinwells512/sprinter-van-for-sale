const faqs = [
  {
    q: "Is the van still available?",
    a: "Yes! If you can see this listing, the van is available and ready to view.",
  },
  {
    q: "Will you accept trades?",
    a: "No, we are not accepting trades at this time.",
  },
  {
    q: "Is the price firm?",
    a: "We welcome serious offers. Use the contact form below and let us know what you have in mind.",
  },
  {
    q: "Where is the van located?",
    a: "The van is located in Colorado\u2019s Western Slopes. We\u2019re happy to work with you on scheduling a convenient time for viewing and pickup.",
  },
  {
    q: "Can you deliver the van?",
    a: "The buyer is responsible for pickup or arranging their own delivery. We can recommend transport companies if needed.",
  },
  {
    q: "Can I schedule a viewing?",
    a: "Absolutely. To respect everyone\u2019s time and ensure we\u2019re working with serious buyers, we do require proof of funds or proof of financing before scheduling a viewing. Once verified, we\u2019ll coordinate a time that works. Fill out the contact form below to get started.",
  },
  {
    q: "Is financing available?",
    a: "We don\u2019t offer financing directly, but we\u2019re happy to work with your lender or financing company.",
  },
  {
    q: "What\u2019s included in the sale?",
    a: "Everything listed in the features and specifications sections is included. Personal items shown in staging photos (bikes, snowboards, generator, bedding, etc.) are not included.",
  },
];

export default function FAQ() {
  return (
    <section className="faq">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          {faqs.map((item) => (
            <div className="faq-item" key={item.q}>
              <h4 className="faq-question">{item.q}</h4>
              <p className="faq-answer">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
