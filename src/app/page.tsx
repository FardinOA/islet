import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Order } from "@/components/order";
import { People } from "@/components/people";
import { Walk } from "@/components/walk";
import { Report } from "@/components/report";
import { Pricing } from "@/components/pricing";
import { Questions } from "@/components/questions";
import { Close } from "@/components/close";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Order />
        <People />
        <Walk />
        <Report />
        <Pricing />
        <Questions />
        <Close />
      </main>
      <Footer />
    </>
  );
}
