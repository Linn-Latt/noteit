"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) router.push("/note");
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Something went wrong.");
    } else {
      router.push("/note");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-0.5"
        style={{ background: "linear-gradient(135deg, #537D96, #EC8F8D)" }}
      >
        <div className="rounded-2xl bg-background px-8 py-4">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EC8F8D] text-white font-bold text-sm">
              N
            </div>
            <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
            <p className="text-xs text-foreground/50">Sign in to your NoteIt account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground/70">Email</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#44A194] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground/70">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#44A194] transition-colors"
              />
            </div>

            {error && <p className="text-xs text-[#EC8F8D]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-md bg-[#EC8F8D] py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-foreground/50">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-[#EC8F8D] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
