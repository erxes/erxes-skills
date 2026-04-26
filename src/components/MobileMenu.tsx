"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileMenuProps {
  items: Array<{ _id: string; label?: string; url?: string }>;
}

export default function MobileMenu({ items }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
        aria-label="Цэс нээх"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-[var(--color-surface)] border-b border-[var(--color-muted)] shadow-lg">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {items.map((item) => (
              <Link
                key={item._id}
                href={item.url ?? "/"}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors py-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
