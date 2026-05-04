import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link
          href="/"
          className="text-4xl md:text-2xl font-light text-[#2C2416] dark:text-zinc-100 mb-4 tracking-tight"
        >
          Nordic Home Decor Store
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/about"
            className="text-xs tracking-[0.25em] uppercase text-[#8C7E6E] mb-3 hover:text-black transition"
          >
            About
          </Link>
          <Link
            href="/admin"
            className="text-xs tracking-[0.25em] uppercase text-[#8C7E6E] mb-3 hover:text-black transition hover:text-blue-600 transition"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};
export default Header;
