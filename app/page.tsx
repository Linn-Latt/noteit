import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/note");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EC8F8D] text-white text-xs font-bold">
            N
          </div>
          <span className="font-semibold text-sm tracking-wide">NoteIT</span>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3 mr-28 hidden md:block">
          <a href="/login" className="text-sm text-foreground/70 hover:text-foreground transition-colors mr-4">
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-md border border-foreground/30 px-4 py-1.5 text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
          >
            Sign up
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center">

        {/* Headline */}
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight">
          A quiet place for{" "} <br />
          <span className="text-foreground/30">loud ideas.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 max-w-md text-sm text-foreground/50 leading-relaxed">
          Capture thoughts, draft essays, and organize your mind in a minimal,
          high-performance workspace designed to get out of your way.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex items-center gap-3">
          <a
            href="/register"
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Start writing
          </a>
          <a
            href="#"
            className="rounded-md border border-foreground/20 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 transition-colors"
          >
            View demo
          </a>
        </div>

        {/* Mobile-only auth links */}
        <div className="mt-4 flex item-center max-w-xs sm:hidden">
          <a
            href="/register"
            className="rounded-md px-5 py-2.5 text-sm font-medium text-center hover:opacity-90 transition-opacity hover:text-[#EC8F8D]"
          >
            Sign up
          </a>
          <a
            href="/login"
            className="rounded-md px-5 py-2.5 text-sm font-medium text-center hover:bg-foreground/5 transition-colors hover:text-[#EC8F8D]"
          >
            Sign in
          </a>
        </div>
      </main>
    </div>
  );
}
