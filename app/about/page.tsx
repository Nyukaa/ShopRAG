import Link from "next/link";
const AboutPage = () => {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* ── About ─────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white dark:bg-zinc-950 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8C7E6E] mb-3">
            About
          </p>

          <h2 className="text-3xl md:text-4xl font-light text-[#2C2416] dark:text-zinc-100 mb-6 tracking-tight">
            Designed for calm, modern living
          </h2>

          <p className="text-sm text-[#8C7E6E] leading-relaxed">
            We curate timeless Nordic objects that bring warmth, balance and
            simplicity into everyday spaces. From soft lighting and natural
            materials to quiet textures and subtle forms — each piece is chosen
            to create a home that feels calm, intentional and beautifully lived
            in.
          </p>
        </div>
      </section>
      <div className="mt-10">
        <Link href="/">
          <button className="px-6 py-3 border border-[#2C2416] text-[#2C2416] dark:border-zinc-200 dark:text-zinc-200 text-sm tracking-wide hover:bg-[#2C2416] hover:text-white transition">
            Explore Collection
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
