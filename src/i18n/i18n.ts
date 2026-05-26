import { STRINGS } from './strings';

let current: 'zh' | 'en' = 'zh';

export function setLocale(l: 'zh' | 'en'): void { current = l; }
export function getLocale(): 'zh' | 'en' { return current; }

/**
 * Resolve a key into the current locale. Supports {placeholder} substitution.
 * Falls back to English if key missing in current locale, then to the key itself.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const en = STRINGS.en as Record<string, string>;
  const dict = STRINGS[current] as Record<string, string>;
  let s = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}
