import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role="worker" workerName="Worker" unreadAlerts={0} />
      <main className="flex-1 container py-6 md:py-8 max-w-2xl mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}