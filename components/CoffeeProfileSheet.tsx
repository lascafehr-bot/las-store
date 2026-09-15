"use client";

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
    <div className="space-y-7">
      <section>
        <h2 className="text-base font-bold text-las-primary">{name}</h2>
        {description && (
          <p className="mt-3 text-sm leading-[2] text-las-primary/80">{description}</p>
        )}
      </section>

      {(process || processDescription) && (
        <section>
          <h2 className="text-base font-bold text-las-primary">{t("aboutProcess")}</h2>
          {process && (
            <p className="mt-2 text-sm font-semibold text-las-primary">{process}</p>
          )}
          {processDescription && (
            <p className="mt-2 text-sm leading-[2] text-las-primary/80">{processDescription}</p>
          )}
        </section>
      )}

      <div className="space-y-3 text-sm leading-relaxed text-las-primary/85">
        {origin && (
          <p className="flex items-start gap-3">
            <PinIcon />
            <span>{origin}</span>
          </p>
        )}
        {altitude && <p>{altitude}</p>}
        {flavors && <p>{flavors}</p>}
        {variety && <p>{variety}</p>}
      </div>
    </div>
  );
}
