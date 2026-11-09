import type { SupportedUiLocale } from '../../../src/shared/ui-locale'

// The page build carries no catalogs: page-locale-catalog-source.ts reads them from the desktop and
// the device store. This seam stays import-free so pages that only translate pull in no transport.
export type LocaleCatalog = Readonly<Record<string, unknown>>
type CatalogLocale = Exclude<SupportedUiLocale, 'en'>
type CatalogLoader = (locale: CatalogLocale) => Promise<LocaleCatalog>
type ArrivalListener = (locale: CatalogLocale, catalog: LocaleCatalog) => void

let loader: CatalogLoader | null = null
const arrivalListeners = new Set<ArrivalListener>()

export function publishPageLocaleCatalogLoader(next: CatalogLoader): void {
  loader = next
}

// Same contract as the bundled imports: resolve the catalog or reject so activation falls back to English.
export function importLocaleCatalog(locale: CatalogLocale): Promise<LocaleCatalog> {
  return loader === null
    ? Promise.reject(new Error('[i18n] no catalog source outside a shell page'))
    : loader(locale)
}

// A catalog that arrives after activation settled: a newer copy, or the first one after an offline start.
export function onLocaleCatalogArrival(listener: ArrivalListener): () => void {
  arrivalListeners.add(listener)
  return () => {
    arrivalListeners.delete(listener)
  }
}

export function announceLocaleCatalog(locale: CatalogLocale, catalog: LocaleCatalog): void {
  for (const listener of arrivalListeners) {
    listener(locale, catalog)
  }
}
