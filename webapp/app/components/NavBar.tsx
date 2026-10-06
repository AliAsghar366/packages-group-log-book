import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/entries", label: "Entries" },
  { href: "/issuance", label: "Issuance" },
  { href: "/vendors", label: "Vendors" },
  { href: "/machines", label: "Machines" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/20 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="font-semibold tracking-tight">
          Packages Group Log Book
        </span>
        <nav className="flex gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-black/70 transition-colors hover:bg-white/40 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}