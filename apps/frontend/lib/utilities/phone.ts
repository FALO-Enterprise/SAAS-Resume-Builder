export function formatPhoneNumber(rawValue: string): string {
  const hasPlus = rawValue.trim().startsWith("+");
  let digits = rawValue.replace(/\D/g, "");

  // Hard cap: E.164 standard allows max 15 digits for international numbers
  const MAX_DIGITS = hasPlus ? 15 : 10;
  digits = digits.slice(0, MAX_DIGITS);

  if (!digits) return hasPlus ? "+" : "";

  if (hasPlus) {
    const countryCodeLen = digits.length > 10 ? 3 : digits.length > 7 ? 2 : 1;
    const countryCode = digits.slice(0, countryCodeLen);
    const rest = digits.slice(countryCodeLen);

    const groups = rest.match(/.{1,3}/g) ?? [];
    return `+${countryCode}${groups.length ? " " + groups.join(" ") : ""}`;
  }

  if (digits.length <= 10) {
    const area = digits.slice(0, 3);
    const mid = digits.slice(3, 6);
    const last = digits.slice(6, 10);

    if (digits.length <= 3) return area;
    if (digits.length <= 6) return `(${area}) ${mid}`;
    return `(${area}) ${mid}-${last}`;
  }

  const groups = digits.match(/.{1,3}/g) ?? [];
  return groups.join(" ");
}
