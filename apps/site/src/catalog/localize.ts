export type Localized<T> = { en: T; [locale: string]: T };

export function localize<T>(value: Localized<T>, locale = "en"): T {
  return value[locale] ?? value.en;
}
