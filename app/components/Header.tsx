import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold">
          Nordic Home Decor Store
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="hover:text-blue-600 transition">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};
export default Header;
