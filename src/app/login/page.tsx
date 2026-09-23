"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function changeMode(nextMode: Mode) {
    if (nextMode === mode || loading) return;
    setMode(nextMode);
    setError("");
    setMessage("");
    setShowPassword(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email to confirm your account."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#efede8] px-4 py-5 text-[#171717] sm:px-6 sm:py-7">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute -bottom-56 -right-36 h-[620px] w-[620px] rounded-full bg-black/[0.06] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group flex items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-lg text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6">
            ✈
          </span>
          <span className="text-left">
            <span className="block text-lg font-semibold leading-none tracking-tight">
              Triply
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-black/40">
              AI Travel Planner
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-xs font-semibold text-black/60 backdrop-blur-xl transition hover:bg-white hover:text-black"
        >
          Back to Triply →
        </button>
      </header>

      {/* Main login experience */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-118px)] max-w-7xl items-start justify-center py-6 md:items-center md:py-8">
        <div
          className="relative w-full max-w-[1120px]"
          style={{ perspective: "1800px" }}
        >
          <div className="relative min-h-[820px] overflow-visible rounded-[38px] border border-black/10 bg-[#f8f7f3] shadow-[0_35px_100px_rgba(0,0,0,0.18)] md:min-h-[680px] md:overflow-hidden">
            {/* Desktop static form */}
            <div className="hidden h-full min-h-[680px] md:grid md:grid-cols-2">
              <div className="flex items-center justify-center px-10 py-14 lg:px-16">
                <AuthForm
                  mode="login"
                  active={mode === "login"}
                  email={email}
                  password={password}
                  showPassword={showPassword}
                  loading={loading}
                  error={mode === "login" ? error : ""}
                  message={mode === "login" ? message : ""}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  setShowPassword={setShowPassword}
                  onSubmit={handleSubmit}
                />
              </div>

              <div className="flex items-center justify-center px-10 py-14 lg:px-16">
                <AuthForm
                  mode="signup"
                  active={mode === "signup"}
                  email={email}
                  password={password}
                  showPassword={showPassword}
                  loading={loading}
                  error={mode === "signup" ? error : ""}
                  message={mode === "signup" ? message : ""}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  setShowPassword={setShowPassword}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>

            {/* Moving 3D cover */}
            <motion.div
              className="absolute bottom-0 left-0 top-0 z-30 hidden w-1/2 md:block"
              initial={false}
              animate={{
                x: mode === "login" ? "100%" : "0%",
                rotateY: mode === "login" ? -4 : 4,
              }}
              transition={{
                x: {
                  type: "spring",
                  stiffness: 115,
                  damping: 19,
                  mass: 0.9,
                },
                rotateY: {
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                },
              }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin:
                  mode === "login" ? "left center" : "right center",
              }}
            >
              <div className="absolute inset-0 overflow-hidden rounded-[34px] bg-[#080808] text-white shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
                {/* Cover background */}
                <div className="pointer-events-none absolute inset-0">
                  <motion.div
                    className="absolute -right-32 -top-36 h-[430px] w-[430px] rounded-full border border-white/10"
                    animate={{ rotate: mode === "login" ? 25 : -25 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="absolute inset-[54px] rounded-full border border-white/[0.08]" />
                    <div className="absolute inset-[108px] rounded-full border border-white/[0.07]" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl"
                    animate={{
                      x: mode === "login" ? 50 : 0,
                      y: mode === "login" ? -20 : 0,
                    }}
                    transition={{ duration: 0.9 }}
                  />

                  <div
                    className="absolute inset-0 opacity-[0.13]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
                      backgroundSize: "42px 42px",
                    }}
                  />

                  {/* route */}
                  <svg
                    viewBox="0 0 600 680"
                    className="absolute inset-0 h-full w-full opacity-30"
                    fill="none"
                  >
                    <motion.path
                      d="M-40 535 C 120 440, 165 600, 305 430 S 500 280, 650 325"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeDasharray="7 11"
                      initial={false}
                      animate={{
                        pathLength: mode === "login" ? 0.82 : 1,
                        opacity: mode === "login" ? 0.45 : 0.25,
                      }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                </div>

                <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-12">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65 backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Triply account
                    </div>
                    <span className="text-2xl text-white/35">✦</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, x: mode === "login" ? 28 : -28 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: mode === "login" ? -22 : 22 }}
                      transition={{ duration: 0.38 }}
                      className="max-w-md"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                        {mode === "login"
                          ? "New destination?"
                          : "Already onboard?"}
                      </p>

                      <h1 className="mt-5 text-[52px] font-semibold leading-[0.96] tracking-[-0.055em] lg:text-[62px]">
                        {mode === "login" ? (
                          <>
                            Create
                            <span className="block text-white/45">
                              your account.
                            </span>
                          </>
                        ) : (
                          <>
                            Welcome
                            <span className="block text-white/45">back.</span>
                          </>
                        )}
                      </h1>

                      <p className="mt-6 max-w-sm text-sm leading-6 text-white/50">
                        {mode === "login"
                          ? "Save itineraries, routes and future journeys in one beautifully organized place."
                          : "Your saved journeys are waiting. Sign in and continue planning where you left off."}
                      </p>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          changeMode(mode === "login" ? "signup" : "login")
                        }
                        className="group mt-8 inline-flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white px-6 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50"
                      >
                        {mode === "login" ? "Create account" : "Sign in"}
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </button>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                        From idea to itinerary
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        Plan less. Travel more.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          mode === "signup"
                            ? "w-7 bg-white"
                            : "w-1.5 bg-white/30"
                        }`}
                      />
                      <span
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          mode === "login"
                            ? "w-7 bg-white"
                            : "w-1.5 bg-white/30"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* fake fold highlight */}
                <motion.div
                  className="pointer-events-none absolute bottom-0 top-0 w-16"
                  animate={{
                    left: mode === "login" ? 0 : "calc(100% - 64px)",
                    opacity: [0.12, 0.35, 0.1],
                  }}
                  transition={{
                    left: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.65 },
                  }}
                  style={{
                    background:
                      mode === "login"
                        ? "linear-gradient(90deg, rgba(255,255,255,.22), transparent)"
                        : "linear-gradient(270deg, rgba(255,255,255,.22), transparent)",
                  }}
                />
              </div>
            </motion.div>

            {/* Mobile - animated sliding auth experience */}
            <div className="relative z-20 overflow-visible md:hidden">
              <div className="relative min-h-[820px]">
                {/* Mobile black cover */}
                <motion.div
                  initial={false}
                  animate={{
                    y: mode === "login" ? 0 : 527,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 105,
                    damping: 20,
                    mass: 0.9,
                  }}
                  className="absolute left-0 right-0 top-0 z-30 h-[293px] overflow-hidden bg-black px-6 pb-7 pt-8 text-white"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <motion.div
                      className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10"
                      animate={{ rotate: mode === "login" ? 20 : -20 }}
                      transition={{ duration: 0.8 }}
                    >
                      <div className="absolute inset-10 rounded-full border border-white/[0.08]" />
                      <div className="absolute inset-20 rounded-full border border-white/[0.06]" />
                    </motion.div>

                    <div
                      className="absolute inset-0 opacity-[0.10]"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                        Triply account
                      </span>
                      <span>✦</span>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={mode}
                        initial={{
                          opacity: 0,
                          x: mode === "login" ? 24 : -24,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          x: mode === "login" ? -20 : 20,
                        }}
                        transition={{ duration: 0.32 }}
                      >
                        <h1 className="mt-7 text-[34px] font-semibold leading-none tracking-[-0.045em]">
                          {mode === "login"
                            ? "Welcome back."
                            : "Create your account."}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-white/50">
                          {mode === "login"
                            ? "Continue planning your next journey."
                            : "Save your trips, routes and itineraries with Triply."}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-6 grid grid-cols-2 rounded-2xl bg-white/10 p-1">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => changeMode("login")}
                        className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                          mode === "login"
                            ? "bg-white text-black"
                            : "text-white/50"
                        }`}
                      >
                        Sign in
                      </button>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => changeMode("signup")}
                        className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                          mode === "signup"
                            ? "bg-white text-black"
                            : "text-white/50"
                        }`}
                      >
                        Create account
                      </button>
                    </div>
                  </div>

                  <motion.div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
                    animate={{
                      opacity: [0.08, 0.24, 0.08],
                    }}
                    transition={{ duration: 0.7 }}
                    style={{
                      background:
                        mode === "login"
                          ? "linear-gradient(0deg, rgba(255,255,255,.18), transparent)"
                          : "linear-gradient(180deg, rgba(255,255,255,.18), transparent)",
                    }}
                  />
                </motion.div>

                {/* Sign-in form */}
                <motion.div
                  initial={false}
                  animate={{
                    y: mode === "login" ? 293 : -20,
                    opacity: mode === "login" ? 1 : 0.22,
                    scale: mode === "login" ? 1 : 0.975,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 105,
                    damping: 20,
                    mass: 0.9,
                  }}
                  className="absolute left-0 right-0 top-0 px-6 py-8 sm:px-9"
                  style={{ pointerEvents: mode === "login" ? "auto" : "none" }}
                >
                  <AuthForm
                    mode="login"
                    active={mode === "login"}
                    email={email}
                    password={password}
                    showPassword={showPassword}
                    loading={loading}
                    error={mode === "login" ? error : ""}
                    message={mode === "login" ? message : ""}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    setShowPassword={setShowPassword}
                    onSubmit={handleSubmit}
                  />
                </motion.div>

                {/* Sign-up form */}
                <motion.div
                  initial={false}
                  animate={{
                    y: mode === "signup" ? 0 : 330,
                    opacity: mode === "signup" ? 1 : 0.22,
                    scale: mode === "signup" ? 1 : 0.975,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 105,
                    damping: 20,
                    mass: 0.9,
                  }}
                  className="absolute left-0 right-0 top-0 px-6 py-8 sm:px-9"
                  style={{ pointerEvents: mode === "signup" ? "auto" : "none" }}
                >
                  <AuthForm
                    mode="signup"
                    active={mode === "signup"}
                    email={email}
                    password={password}
                    showPassword={showPassword}
                    loading={loading}
                    error={mode === "signup" ? error : ""}
                    message={mode === "signup" ? message : ""}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    setShowPassword={setShowPassword}
                    onSubmit={handleSubmit}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Ground shadow */}
          <div className="pointer-events-none absolute -bottom-8 left-[8%] right-[8%] -z-10 h-16 rounded-[50%] bg-black/20 blur-3xl" />
        </div>
      </section>
    </main>
  );
}

type AuthFormProps = {
  mode: Mode;
  active: boolean;
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  message: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  onSubmit: (e: FormEvent) => void;
};

function AuthForm({
  mode,
  active,
  email,
  password,
  showPassword,
  loading,
  error,
  message,
  setEmail,
  setPassword,
  setShowPassword,
  onSubmit,
}: AuthFormProps) {
  return (
    <motion.div
      className="w-full max-w-[390px]"
      animate={{
        opacity: active ? 1 : 0.2,
        scale: active ? 1 : 0.975,
      }}
      transition={{ duration: 0.45 }}
      aria-hidden={!active}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
        {mode === "login" ? "Welcome aboard" : "Start your journey"}
      </p>

      <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
        {mode === "login" ? "Sign in." : "Join Triply."}
      </h2>

      <p className="mt-3 text-sm leading-6 text-black/45">
        {mode === "login"
          ? "Enter your details to access your saved journeys."
          : "Create your account and keep every trip in one place."}
      </p>

      <form
        onSubmit={active ? onSubmit : (e) => e.preventDefault()}
        className="mt-8 space-y-5"
      >
        <div>
          <label className="mb-2 block text-xs font-semibold text-black/70">
            Email address
          </label>
          <div className="flex h-14 items-center rounded-2xl border border-black/10 bg-white px-4 transition focus-within:border-black/40 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.035)]">
            <span className="mr-3 text-black/30">＠</span>
            <input
              type="email"
              value={email}
              disabled={!active || loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/25 disabled:cursor-default"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-black/70">
              Password
            </label>
            <span className="text-[10px] text-black/30">
              Minimum 6 characters
            </span>
          </div>

          <div className="flex h-14 items-center rounded-2xl border border-black/10 bg-white px-4 transition focus-within:border-black/40 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.035)]">
            <span className="mr-3 text-black/30">◇</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              disabled={!active || loading}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/25 disabled:cursor-default"
            />

            <button
              type="button"
              disabled={!active || loading}
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 rounded-lg px-2 py-1 text-[11px] font-semibold text-black/35 transition hover:bg-black/5 hover:text-black disabled:pointer-events-none"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {error && active && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600"
            >
              {error}
            </motion.div>
          )}

          {message && active && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={!active || loading}
          whileHover={active && !loading ? { y: -1 } : undefined}
          whileTap={active && !loading ? { scale: 0.99 } : undefined}
          className="group flex h-14 w-full items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && active ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Please wait...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {mode === "login" ? "Sign in" : "Create account"}
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          )}
        </motion.button>
      </form>

      <div className="mt-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/25">
          Triply
        </span>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <p className="mt-5 text-center text-[11px] leading-5 text-black/35">
        Your saved journeys stay connected to your Triply account.
      </p>
    </motion.div>
  );
}
