import Link from "next/link";

const Header = () => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold">
          NextJS Example
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/products/basic"
            className="hover:text-blue-600 transition"
          >
            Products (basic)
          </Link>
          <Link
            href="/products/redux"
            className="hover:text-blue-600 transition"
          >
            Products (redux)
          </Link>
        </nav>
      </div>
    </header>
  );
};
export default Header;
