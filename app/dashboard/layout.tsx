export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full flex flex-col">
      <h1>Dashboard layout</h1> {children}
    </div>
  );
}
