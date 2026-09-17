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
  const process = localized(profile.process, locale);
  const flavors = localized(profile.flavors, locale);
  const variety = localized(profile.variety, locale);
  const processDescription = localized(profile.processDescription, locale);
  const roastNotes = localized(profile.roastNotes, locale);
  const brew = localized(profile.brew, locale);
  const weight = localized(profile.weight, locale);

  return (
    <div className="space-y-8 bg-las-bg px-5 py-7 sm:px-7">
      <section>
        <h2 className="text-base font-bold text-las-primary">{name}</h2>
        {description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-[2] text-las-primary/80">
            {description}
          </p>
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

      <ul className="space-y-4">
        {origin && (
          <li className="flex items-start gap-3 text-sm leading-relaxed text-las-primary/85">
            <PinIcon />
            <span>
              <span className="font-semibold">{t("origin")}: </span>
              {origin}
            </span>
          </li>
        )}
        {roastNotes && (
          <li className="text-sm leading-relaxed text-las-primary/85">
            <span className="font-semibold">{t("roastLevel")}: </span>
            {roastNotes}
          </li>
        )}
        {variety && (
          <li className="text-sm leading-relaxed text-las-primary/85">
            <span className="font-semibold">{t("variety")}: </span>
            {variety}
          </li>
        )}
        {flavors && (
          <li className="text-sm leading-relaxed text-las-primary/85">
            <span className="font-semibold">{t("flavors")}: </span>
            {flavors}
          </li>
        )}
        {brew && (
          <li className="text-sm leading-relaxed text-las-primary/85">
            <span className="font-semibold">{t("brewMethod")}: </span>
            {brew}
          </li>
        )}
        {weight && (
          <li className="text-sm leading-relaxed text-las-primary/85">
            <span className="font-semibold">{t("weight")}: </span>
            {weight}
          </li>
        )}
      </ul>
    </div>
  );
}
