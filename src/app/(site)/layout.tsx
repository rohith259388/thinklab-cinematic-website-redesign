import ExperienceShell from "@/components/experience/ExperienceShell";
import Cursor from "@/components/ui/Cursor";
import Preloader from "@/components/ui/Preloader";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";

import { CanvasProvider, CmsSections } from "@/components/cms/Canvas";
import { siteContent } from "@/lib/cms/public";
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await siteContent();
  return (
    <CanvasProvider {...content} registerCanvas={false}>
      <Preloader />
      <Cursor />
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
