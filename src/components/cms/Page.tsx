import { CanvasProvider, CmsSections } from "./Canvas";
import { siteContent } from "@/lib/cms/public";

// The leaf page owns its content so client navigation never reuses another route's snapshot.
export default async function CmsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await siteContent();
  return (
    <CanvasProvider {...content}>
      {children}
      <CmsSections />
    </CanvasProvider>
  );
}
