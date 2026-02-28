import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Highlights from "./components/Highlights";
import Gallery from "./components/Gallery";
import Features from "./components/Features";
import Specs from "./components/Specs";
import Disclosure from "./components/Disclosure";
import FAQ from "./components/FAQ";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";
import VisitTracker from "./components/VisitTracker";

export default function Home() {
  return (
    <>
      <VisitTracker />
      <Nav />
      <Hero />
      <Highlights />
      <Gallery />
      <Features />
      <Specs />
      <Disclosure />
      <FAQ />
      <section id="contact" className="contact">
        <div className="container">
          <div className="availability-badge">
            <span className="availability-dot" />
            Available
          </div>
          <h2 className="section-title">Interested?</h2>
          <p className="contact-intro">
            This professional overland adventure camper is ready for its next
            owner. Fill out the form below and we&apos;ll follow up personally.
          </p>
          <ContactForm />
          <div className="contact-info" style={{ marginTop: "1.5rem" }}>
            <p className="contact-note">
              Serious inquiries only. Van located in Colorado Western Slopes.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
