"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { clinicData } from "../data/clinicData";

export default function Navbar({ clinic }: { clinic?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const clinicName = clinic?.clinicName || clinic?.name || clinicData.clinicName;

  const navLinks = clinicData.navigation.map((item) => ({
    label: item.label,
    href: `/${item.href}`,
  }));

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">

      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* LOGO */}
        <Link
          href="/#home"
          className="text-2xl font-bold tracking-tight text-blue-600"
        >
          {clinicName}
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-8 md:flex">

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="
                text-sm
                font-medium
                text-gray-700
                transition
                hover:text-blue-600
              "
            >
              {link.label}
            </Link>
          ))}

        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden items-center gap-4 md:flex">

          <Link
            href="/admin/login"
            className="
              flex items-center gap-2
              text-sm
              font-medium
              text-gray-500
              transition
              hover:text-blue-600
            "
          >
            🔒 Admin
          </Link>

          <Link
            href="/Booking"
            className="
              rounded-full
              bg-blue-600
              px-6
              py-3
              text-sm
              font-medium
              text-white
              shadow-sm
              transition
              hover:bg-blue-700
            "
          >
            Book Now
          </Link>

        </div>

        {/* MOBILE TOGGLE BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center justify-center
            text-gray-700
            transition
            hover:text-blue-600
            md:hidden
          "
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

      </nav>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">

          <div className="flex flex-col gap-6 px-6 py-6">

            {/* MOBILE NAV LINKS */}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="
                  text-base
                  font-medium
                  text-gray-700
                  transition
                  hover:text-blue-600
                "
              >
                {link.label}
              </Link>
            ))}

            {/* MOBILE ADMIN BUTTON */}
            <Link
              href="/admin/login"
              onClick={closeMenu}
              className="
                text-base
                font-medium
                text-gray-500
                transition
                hover:text-blue-600
              "
            >
              🔒 Admin Login
            </Link>

            {/* MOBILE CTA */}
            <Link
              href="/Booking"
              onClick={closeMenu}
              className="
                rounded-full
                bg-blue-600
                px-6
                py-3
                text-center
                text-sm
                font-medium
                text-white
                transition
                hover:bg-blue-700
              "
            >
              Book Now
            </Link>

          </div>

        </div>
      )}
    </header>
  );
}