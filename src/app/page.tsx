import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Highlights from "./components/Highlights";
import Gallery from "./components/Gallery";
import Features from "./components/Features";
import Specs from "./components/Specs";
import Disclosure from "./components/Disclosure";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Highlights />
      <Gallery />
      <Features />
      <Specs />
      <Disclosure />
      <section id="contact" className="contact">
        <div className="container">
          <h2 className="section-title">Interested?</h2>
          <p className="contact-intro">
            This professional overland adventure camper is ready for its next
            adventure. Reach out to schedule a viewing or for more information.
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
