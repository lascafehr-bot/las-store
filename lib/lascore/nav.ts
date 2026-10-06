import type { LascoreRole } from "@/lib/lascore/types";

export type LascoreNavItem = {
  href: string;
  label: string;
  roles: LascoreRole[];
};

export const LASCORE_NAV: LascoreNavItem[] = [
  { href: "/lascore", label: "لوحة التحكم", roles: ["admin", "user"] },
  { href: "/lascore/orders", label: "الطلبات", roles: ["admin", "user"] },
  { href: "/lascore/products", label: "المنتجات", roles: ["admin"] },
  { href: "/lascore/inventory", label: "المخزون", roles: ["admin"] },
  { href: "/lascore/customers", label: "العملاء", roles: ["admin"] },
  { href: "/lascore/offers", label: "العروض والكوبونات", roles: ["admin"] },
  { href: "/lascore/payments", label: "المدفوعات", roles: ["admin"] },
  { href: "/lascore/reports", label: "التقارير", roles: ["admin"] },
  { href: "/lascore/shipping", label: "الشحن", roles: ["admin", "user"] },
  { href: "/lascore/users", label: "المستخدمون", roles: ["admin"] },
  { href: "/lascore/settings", label: "الإعدادات", roles: ["admin"] },
];

export function navForRole(role: LascoreRole): LascoreNavItem[] {
  return LASCORE_NAV.filter((item) => item.roles.includes(role));
}

export function canAccessPath(pathname: string, role: LascoreRole): boolean {
  const exact = LASCORE_NAV.find((item) => item.href === pathname);
  if (exact) return exact.roles.includes(role);
  const nested = LASCORE_NAV.filter((item) => item.href !== "/lascore" && pathname.startsWith(`${item.href}/`));
  if (nested.length === 0) return pathname.startsWith("/lascore");
  return nested.some((item) => item.roles.includes(role));
}
