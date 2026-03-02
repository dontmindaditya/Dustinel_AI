"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [workerId, setWorkerId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prototype auth flow: accept any credentials and continue.
      await new Promise((res) => setTimeout(res, 500));
      router.push(ROUTES.WORKER_DASHBOARD);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="Dustinel AI logo" width={44} height={44} priority />
          </div>
          <CardTitle>Dustinel AI</CardTitle>
          <CardDescription>Prototype sign-in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="worker-id">Worker ID or Email</Label>
              <Input
                id="worker-id"
                type="text"
                placeholder="Type anything"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Password</Label>
              <Input
                id="passcode"
                type="text"
                placeholder="Type anything"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm text-muted-foreground bg-secondary p-2 rounded-md">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Continue"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Prototype mode: any input is accepted.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t text-center text-sm">
            <span className="text-muted-foreground">New worker? </span>
            <Link href="/auth/register" className="font-medium hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
