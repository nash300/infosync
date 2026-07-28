"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  adminNavGroups,
  adminNavItems,
  siteContentNavItems,
} from "@/lib/admin/navigation";

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="admin-nav-toggle"
        aria-expanded={isOpen}
        aria-controls="admin-sidebar-navigation"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>Adminmeny</span>
        <span aria-hidden="true">{isOpen ? "×" : "☰"}</span>
      </button>
      <nav
        id="admin-sidebar-navigation"
        className={`admin-sidebar-navigation relative flex-1 overflow-y-auto px-4 pb-4${
          isOpen ? " admin-sidebar-navigation-open" : ""
        }`}
      >
        {adminNavGroups.map((group) => (
          <section key={group.title} className="admin-nav-group">
            <p className="admin-nav-group-title">{group.title}</p>
            <div className="admin-nav-list">
              {adminNavItems
                .filter((item) => group.hrefs.includes(item.href))
                .map((item) => {
                  const siteContentActive = siteContentNavItems.some(
                    (contentItem) =>
                      pathname === contentItem.href ||
                      pathname.startsWith(`${contentItem.href}/`),
                  );
                  const isActive =
                    item.href === "/admin/site-content"
                      ? pathname === "/admin/site-content" || siteContentActive
                      : item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        isActive
                          ? "admin-nav-link admin-nav-link-active"
                          : "admin-nav-link"
                      }
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="admin-nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </nav>
    </>
  );
}
