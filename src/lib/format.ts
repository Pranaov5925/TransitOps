export function currency(n: number, code = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);
}
export function num(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
export function isLicenseExpired(iso: string) {
  return new Date(iso) < new Date();
}
