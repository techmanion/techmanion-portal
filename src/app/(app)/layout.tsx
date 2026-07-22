import { requireUser } from "@/lib/auth/guards";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex flex-1">
      <AppSidebar
        user={{
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
        }}
      />
      {/* Max content width 1200px, centered — design-doc §2.3. */}
      <div className="flex-1 overflow-x-hidden">
        <main className="mx-auto w-full max-w-[1200px] px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
