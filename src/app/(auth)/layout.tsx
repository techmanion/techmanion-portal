export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Page background behind the card is surface-alt (design-doc §2.1).
  return (
    <main className="flex-1 grid place-items-center bg-secondary px-4">
      {children}
    </main>
  );
}
