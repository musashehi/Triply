"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"login" | "signup">(
    "login"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        const { data, error } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email to confirm your account."
        );
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          throw error;
        }

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) =>
      current === "login" ? "signup" : "login"
    );

    setError("");
    setMessage("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mx-auto mb-8 flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg text-white">
            ✈
          </div>

          <span className="text-xl font-semibold tracking-tight">
            Triply
          </span>
        </button>

        {/* Card */}
        <div className="rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
              {mode === "login"
                ? "Welcome back"
                : "Join Triply"}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {mode === "login"
                ? "Sign in to Triply"
                : "Create your account"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {mode === "login"
                ? "Sign in to save and manage your trips."
                : "Create an account to save your AI-generated trips."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="h-14 w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="At least 6 characters"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                className="h-14 w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-[#272727] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {/* Switch login/signup */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-black hover:underline"
            >
              {mode === "login"
                ? "Create account"
                : "Sign in"}
            </button>
          </div>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 w-full text-center text-sm text-gray-400 transition hover:text-black"
        >
          ← Back to Triply
        </button>
      </div>
    </main>
  );
}