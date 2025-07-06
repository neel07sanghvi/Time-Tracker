"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Input } from "@time-tracker/ui";
import { Label } from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();

    setLoading(true);
    setError(null);

    const { data, error: authError } = await database.signInWithEmployee(email, password);

    if (!data || authError || !data.session) {
      setError(authError?.message || "An unknown error occurred. Please try again.");
      setLoading(false);
      return;
    }

    // On successful login, Supabase returns a session object.
    // We'll store the access token in a cookie.
    Cookies.set("supabase-auth-token", data.session.access_token, {
      expires: 1, // Expires in 1 day
      secure: process.env.NODE_ENV === "production",
    });

    // Also save the user info for easy access
    Cookies.set("supabase-user", JSON.stringify(data.user), {
      expires: 1
    });

    setLoading(false);

    router.push("/dashboard");

  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Mercor Time Tracker</CardTitle>
          <p className="text-center text-muted-foreground">
            Sign in to your admin account
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
