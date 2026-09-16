"use client";

import type { ReactNode } from "react";
import { PinIcon } from "@/components/CoffeeIcons";
import { useLocale } from "@/components/LocaleProvider";
import { localized, type CoffeeProfile } from "@/lib/products";

type CoffeeProfileSheetProps = {
  name: string;
  description: string;
  profile: CoffeeProfile;
};

export function CoffeeProfileSheet({ name, description, profile }: CoffeeProfileSheetProps) {
  const { locale, t } = useLocale();
  const origin = localized(profile.origin, locale);
  const altitude = localized(profile.altitude, locale);
  const process = localized(profile.process, locale);
  const flavors = localized(profile.flavors, locale);
  const variety = localized(profile.variety, locale);
  const processDescription = localized(profile.processDescription, locale);

  return (
    <div className="space-y-8 bg-las-cream/70 px-5 py-7 sm:px-7">
      <section>
        <SheetHeading>{name}</SheetHeading>
        {description && (
          <p className="mt-4 text-sm leading-[2] text-las-primary/80">{description}</p>
        )}
      </section>

      {(process || processDescription) && (
        <section>
          <SheetHeading>{t("aboutProcess")}</SheetHeading>
          {process && (
            <p className="mt-2 text-sm font-semibold text-las-primary">{process}</p>
          )}
          {processDescription && (
            <p className="mt-2 text-sm leading-[2] text-las-primary/80">{processDescription}</p>
          )}
        </section>
      )}

      <ul className="space-y-4">
        {origin && (
          <SheetRow icon={<PinIcon />}>{origin}</SheetRow>
        )}
        {altitude && <SheetRow>{altitude}</SheetRow>}
        {flavors && <SheetRow>{flavors}</SheetRow>}
        {variety && <SheetRow>{variety}</SheetRow>}
      </ul>
    </div>
  );
}

function SheetHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-bold text-las-primary">{children}</h2>
  );
}

function SheetRow({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-las-primary/85">
      {icon}
      <span>{children}</span>
    </li>
  );
}
