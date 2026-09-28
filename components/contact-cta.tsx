import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { COMPANY, PHONE_HREF } from "@/lib/company";

/** Closing call to action on content pages: contact page link and a tel: link. */
export function ContactCta({
  title,
  text,
  contactLabel,
  callLabel,
}: {
  title: string;
  text: string;
  contactLabel: string;
  /** Accessible label of the call button (the visible text is the phone number). */
  callLabel: string;
}) {
  return (
    <section className="rounded-lg bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-primary-foreground p-6 sm:p-10">
      <h2 className="section-title mb-2">{title}</h2>
      <p className="text-primary-foreground/80 max-w-2xl mb-6">{text}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="accent" size="lg">
          <Link href="/contact">
            {contactLabel}
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <a href={PHONE_HREF} aria-label={callLabel}>
            <Phone className="mr-2 w-5 h-5" aria-hidden="true" />
            {COMPANY.phone}
          </a>
        </Button>
      </div>
    </section>
  );
}
