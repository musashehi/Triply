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

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#171717]">
      {/* Navbar */}
      <nav className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-lg text-white">
              ✈
            </div>

            <span className="text-lg font-semibold tracking-tight">
              Triply
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm text-gray-600 md:flex">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="transition hover:text-black"
            >
              Plan a trip
            </button>

            <button
              type="button"
              className="font-medium text-black"
            >
              My trips
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-xs text-gray-400">
                  Signed in as
                </p>

                <p className="max-w-[180px] truncate text-sm font-medium">
                  {user.email}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          Your adventures
        </p>

        <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              My trips
            </h1>

            <p className="mt-3 max-w-xl text-gray-500">
              All your saved AI-generated travel plans in
              one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]"
          >
            + Plan new trip
          </button>
        </div>
      </section>

      {/* Trips */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        {loading && (
          <div className="rounded-[28px] border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="mt-4 text-sm text-gray-500">
              Loading your trips...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          trips.length === 0 && (
            <div className="rounded-[28px] border border-gray-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                ✈
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                No saved trips yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Generate your first AI itinerary and save
                it. It will appear here.
              </p>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-6 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]"
              >
                Plan your first trip
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          trips.length > 0 && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {trips.length}{" "}
                  {trips.length === 1
                    ? "saved trip"
                    : "saved trips"}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="group rounded-[28px] border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)]"
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                          Saved trip
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                          {trip.destination}
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                          {formatDate(trip.start_date)}
                          {" — "}
                          {formatDate(trip.end_date)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f7f8fa] px-4 py-3 text-right">
                        <p className="text-[11px] text-gray-400">
                          Estimated
                        </p>

                        <p className="mt-1 font-semibold">
                          €
                          {trip.estimated_total_cost}
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    {trip.summary && (
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-500">
                        {trip.summary}
                      </p>
                    )}

                    {/* Info */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-[#f7f8fa] p-3">
                        <p className="text-[11px] text-gray-400">
                          Budget
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          €{trip.budget}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f7f8fa] p-3">
                        <p className="text-[11px] text-gray-400">
                          Travelers
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {trip.travelers}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f7f8fa] p-3">
                        <p className="text-[11px] text-gray-400">
                          Days
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {trip.days?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Interests */}
                    {trip.interests?.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {trip.interests.map(
                          (interest) => (
                            <span
                              key={interest}
                              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-500"
                            >
                              {interest}
                            </span>
                          )
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex gap-3 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/trips/${trip.id}`
                          )
                        }
                        className="flex-1 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]"
                      >
                        View trip
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTrip(trip.id)
                        }
                        className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
      </section>
    </main>
  );
}