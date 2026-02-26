import Link from "next/link";
import { Shield, ArrowRight, Cpu, Bell, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Analysis",
    description:
      "Azure AI Vision detects PPE compliance, fatigue, and environmental hazards in real time.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description:
      "Critical risk events trigger push, SMS, and in-app notifications within 5 seconds.",
  },
  {
    icon: BarChart3,
    title: "Health Dashboard",
    description:
      "Monitor individual and organization-wide health scores with trend analysis.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Dustinel AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.LOGIN}>Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={ROUTES.LOGIN}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container py-20 md:py-32 flex flex-col items-center text-center gap-6 max-w-3xl mx-auto animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Microsoft Imagine Cup 2025 · Built on Azure
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Worker Safety,{" "}
            <span className="border-b-2 border-foreground">Intelligently</span>{" "}
            Monitored
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl">
            Dustinel AI uses computer vision and machine learning to detect
            safety risks, score worker health in real time, and alert teams
            before incidents happen.
          </p>

          <div className="flex gap-3 flex-wrap justify-center">
            <Button size="lg" asChild>
              <Link href={ROUTES.LOGIN}>
                Worker Check-in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.ADMIN_DASHBOARD}>Admin Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container pb-20">
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardContent className="p-6">
                    <Icon className="h-8 w-8 mb-4 opacity-60" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-xs text-muted-foreground">
          Dustinel AI — Protecting Workers, Powered by Azure
        </div>
      </footer>
    </div>
  );
}