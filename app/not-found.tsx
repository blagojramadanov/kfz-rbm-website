import { SiteShell } from "@/components/site-shell";
import { NotFoundContent } from "@/components/not-found-content";
import messages from "@/messages/de.json";

// URLs outside the locale routes (paths the middleware skips, e.g. with a file
// extension, or an invalid locale): same styled 404, in the default language.
export default function RootNotFound() {
  return (
    <SiteShell locale="de" messages={messages}>
      <NotFoundContent />
    </SiteShell>
  );
}
