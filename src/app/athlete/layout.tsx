import { AthleteSidebar } from "@/components/athlete/AthleteSidebar";

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AthleteSidebar />
      <main className="lg:pl-[262px]">
        <div className="max-w-7xl mx-auto p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
