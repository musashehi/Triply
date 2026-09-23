"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Trip = {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  interests: string[];
  summary: string | null;
  estimated_total_cost: number;
  days: any[];
  created_at: string;
};

export default function TripsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrips() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setUser(user);

        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        setTrips(data || []);
      } catch (error: any) {
        console.error("Load trips error:", error);

        setError(
          error?.message ||
            "Could not load your trips."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  async function deleteTrip(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trip?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setTrips((current) =>
        current.filter((trip) => trip.id !== id)
      );
    } catch (error) {
      console.error("Delete trip error:", error);

      setError("Could not delete this trip.");
    }
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  const totalBudget = trips.reduce(
    (sum, trip) => sum + Number(trip.budget || 0),
    0
  );

  const totalEstimated = trips.reduce(
    (sum, trip) => sum + Number(trip.estimated_total_cost || 0),
    0
  );

  const totalDays = trips.reduce(
    (sum, trip) => sum + (trip.days?.length || 0),
    0
  );

  const uniqueDestinations = new Set(
    trips.map((trip) => trip.destination.trim().toLowerCase())
  ).size;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#171717]">
      {/* Floating Navbar */}
      <div className="sticky top-0 z-[1000] px-4 pt-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[22px] border border-black/10 bg-white/80 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl md:px-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
              ✈
            </div>
            <div className="text-left">
              <span className="block text-lg font-semibold leading-none tracking-tight">
                Triply
              </span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 sm:block">
                AI Travel Planner
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-black/5 hover:text-black sm:block"
            >
              Plan a trip
            </button>

            <div className="hidden h-7 w-px bg-gray-200 md:block" />

            {user && (
              <div className="hidden px-2 text-right lg:block">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Signed in as
                </p>
                <p className="mt-0.5 max-w-[170px] truncate text-xs font-medium">
                  {user.email}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="group flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#272727]"
            >
              <span>Sign out</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10 md:pt-14">
        {/* Dashboard Hero */}
        <div className="relative overflow-hidden rounded-[36px] bg-[#050505] px-7 py-9 text-white shadow-[0_24px_80px_rgba(0,0,0,0.10)] md:px-10 md:py-11">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-16 h-72 w-72 rounded-full border border-white/[0.07]" />
            <div className="absolute bottom-[-150px] left-[20%] h-80 w-80 rounded-full bg-white/[0.06] blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-9 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-medium text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Your travel dashboard
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
                Your journeys,
                <span className="block text-white/45">all in one place.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/50 md:text-base">
                Revisit every itinerary you have planned with Triply, explore
                your routes and keep your next adventure close.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="group flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white">
                +
              </span>
              Plan new trip
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && trips.length > 0 && (
          <div className="relative z-20 -mt-5 grid gap-3 px-3 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
            {[
              ["Saved trips", trips.length, "✈"],
              ["Destinations", uniqueDestinations, "⌖"],
              ["Travel days", totalDays, "◷"],
              ["Planned budget", `€${totalBudget.toLocaleString()}`, "€"],
            ].map(([label, value, icon]) => (
              <div
                key={label}
                className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {value}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f4f4] text-sm font-semibold">
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content heading */}
        <div className="mt-14 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Saved adventures
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              My trips
            </h2>
          </div>

          {!loading && !error && trips.length > 0 && (
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500">
              €{totalEstimated.toLocaleString()} estimated across all trips
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 overflow-hidden rounded-[30px] border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
            <p className="mt-4 text-sm text-gray-500">Loading your trips...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 rounded-[30px] border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && trips.length === 0 && (
          <div className="mt-6 overflow-hidden rounded-[32px] border border-gray-200 bg-white">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex min-h-[320px] items-center justify-center bg-black p-8">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/15">
                  <div className="absolute inset-8 rounded-full border border-white/10" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-black">
                    ✈
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Start exploring
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                  No saved trips yet.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
                  Build your first AI itinerary, save it and it will become part
                  of your personal travel dashboard.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-7 w-fit rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]"
                >
                  Plan your first trip →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trip cards */}
        {!loading && !error && trips.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {trips.map((trip, index) => {
              const tripDays = trip.days?.length || 0;
              const interestPreview = trip.interests?.slice(0, 3) || [];
              const moreInterests = Math.max(
                (trip.interests?.length || 0) - interestPreview.length,
                0
              );

              return (
                <article
                  key={trip.id}
                  className="group overflow-hidden rounded-[30px] border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
                >
                  {/* Visual card top */}
                  <div className="relative overflow-hidden bg-[#090909] p-6 text-white">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
                      <div className="absolute -right-3 -top-10 h-44 w-44 rounded-full border border-white/[0.07]" />
                      <div className="absolute bottom-[-90px] left-12 h-48 w-48 rounded-full bg-white/[0.07] blur-3xl" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-[10px] text-white">
                              ✈
                            </span>
                            Journey {String(index + 1).padStart(2, "0")}
                          </div>

                          <h3 className="mt-5 max-w-[340px] text-3xl font-semibold leading-tight tracking-[-0.035em]">
                            {trip.destination}
                          </h3>

                          <p className="mt-2 text-sm text-white/45">
                            {formatDate(trip.start_date)} —{" "}
                            {formatDate(trip.end_date)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-right backdrop-blur-md">
                          <p className="text-[10px] uppercase tracking-wider text-white/40">
                            Estimated
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            €{Number(trip.estimated_total_cost || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center gap-2">
                        <span className="h-1.5 w-10 rounded-full bg-white" />
                        <span className="h-1.5 w-4 rounded-full bg-white/20" />
                        <span className="h-1.5 w-4 rounded-full bg-white/20" />
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6">
                    {trip.summary && (
                      <p className="line-clamp-2 min-h-12 text-sm leading-6 text-gray-500">
                        {trip.summary}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-2.5">
                      <div className="rounded-2xl bg-[#f6f7f8] p-3.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Budget
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">
                          €{Number(trip.budget || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f6f7f8] p-3.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Travelers
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">
                          {trip.travelers}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f6f7f8] p-3.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Days
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">
                          {tripDays}
                        </p>
                      </div>
                    </div>

                    {interestPreview.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {interestPreview.map((interest) => (
                          <span
                            key={interest}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-500"
                          >
                            {interest}
                          </span>
                        ))}
                        {moreInterests > 0 && (
                          <span className="rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white">
                            +{moreInterests}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex gap-3 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={() => router.push(`/trips/${trip.id}`)}
                        className="group/button flex flex-1 items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]"
                      >
                        View journey
                        <span className="transition-transform duration-300 group-hover/button:translate-x-1">
                          →
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTrip(trip.id)}
                        className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
