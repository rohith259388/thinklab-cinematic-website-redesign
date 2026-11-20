import ExperienceShell from "@/components/experience/ExperienceShell";
import Cursor from "@/components/ui/Cursor";
import IntroLoader from "@/components/ui/IntroLoader";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import SmoothScroll from "@/components/ui/SmoothScroll";

import { CanvasProvider, CmsSections } from "@/components/cms/Canvas";
import "@/components/cms/sections.css";
import { siteContent } from "@/lib/cms/public";
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await siteContent();
  return (
    <CanvasProvider {...content} registerCanvas={false}>
      <SmoothScroll />
      <IntroLoader />

      <ExperienceShell />
      <Nav />
      <main id="main" className="relative z-10">
        {children}
      </main>
      <CmsSections global />
      <Footer />
    </CanvasProvider>
  );
}
