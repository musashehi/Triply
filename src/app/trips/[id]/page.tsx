"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

type Activity = {
  time: string;
  name: string;
  type: string;
  description: string;
  estimatedCost: number;
};

type Day = {
  day: number;
  title: string;
  estimatedCost: number;
  activities: Activity[];
};

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
  days: Day[];
  created_at: string;
};

type Place = {
  name: string;
  position: [number, number];
  type?: string;
  day?: number;
};

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const [trip, setTrip] = useState<Trip | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mapPosition, setMapPosition] = useState<
    [number, number]
  >([41.9028, 12.4964]);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");
useEffect(() => {
  async function loadTrip() {
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

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setTrip(data);
    } catch (error: any) {
      console.error("Load trip error:", error);

      setError(
        error?.message ||
          "Could not load this trip."
      );
    } finally {
      setLoading(false);
    }
  }

  if (id) {
    loadTrip();
  }
}, [id, router]);
  useEffect(() => {
  if (!trip) return;

  let cancelled = false;

  async function wait(ms: number) {
    return new Promise((resolve) =>
      setTimeout(resolve, ms)
    );
  }

  async function loadMapPlaces() {
    try {
      setMapLoading(true);
      setMapError("");
      setPlaces([]);
      setSelectedPlace(null);

      /*
       * Find destination first.
       */
      const destinationResponse = await fetch(
        `/api/geocode?q=${encodeURIComponent(
          trip!.destination
        )}`
      );

      if (cancelled) return;

      if (!destinationResponse.ok) {
        throw new Error(
          "Could not locate the destination."
        );
      }

      const destinationData =
        await destinationResponse.json();

      if (cancelled) return;

      if (
        Array.isArray(destinationData) &&
        destinationData.length > 0
      ) {
        setMapPosition([
          Number(destinationData[0].lat),
          Number(destinationData[0].lon),
        ]);
      }

      /*
       * Wait before starting activity requests.
       * This avoids hitting Nominatim too quickly.
       */
      await wait(1500);

      if (cancelled) return;

      /*
       * Build activity list.
       */
      const activities =
        trip!.days?.flatMap((day) =>
          (day.activities || []).map((activity) => ({
            ...activity,
            day: day.day,
          }))
        ) || [];

      const foundPlaces: Place[] = [];

      /*
       * Avoid geocoding duplicate places.
       */
      const searchedQueries = new Set<string>();

      for (const activity of activities) {
        if (cancelled) return;

        const query =
          `${activity.name}, ${trip!.destination}`.trim();

        const normalizedQuery =
          query.toLowerCase();

        /*
         * Skip duplicate activity/place queries.
         */
        if (searchedQueries.has(normalizedQuery)) {
          continue;
        }

        searchedQueries.add(normalizedQuery);

        try {
          const response = await fetch(
            `/api/geocode?q=${encodeURIComponent(
              query
            )}`
          );

          if (cancelled) return;

          /*
           * If Nominatim rate-limits us,
           * wait longer before continuing.
           */
          if (response.status === 429) {
            console.warn(
              `Rate limited while locating ${activity.name}`
            );

            await wait(3000);
            continue;
          }

          if (!response.ok) {
            console.warn(
              `Could not locate ${activity.name}`
            );

            await wait(1500);
            continue;
          }

          const data = await response.json();

          if (cancelled) return;

          if (
            Array.isArray(data) &&
            data.length > 0
          ) {
            const place: Place = {
              name: activity.name,
              position: [
                Number(data[0].lat),
                Number(data[0].lon),
              ],
              type: activity.type,
              day: activity.day,
            };

            foundPlaces.push(place);

            setPlaces([...foundPlaces]);
          }

          /*
           * Keep requests comfortably spaced.
           */
          await wait(1500);
        } catch (error) {
          if (cancelled) return;

          console.warn(
            `Could not geocode ${activity.name}:`,
            error
          );

          await wait(1500);
        }
      }

      if (cancelled) return;

      if (foundPlaces.length === 0) {
        setMapError(
          "No itinerary places could be located on the map."
        );
      }
    } catch (error) {
      if (cancelled) return;

      console.warn("Map loading error:", error);

      setMapError(
        "Could not load the itinerary map."
      );
    } finally {
      if (!cancelled) {
        setMapLoading(false);
      }
    }
  }

  loadMapPlaces();

  return () => {
    cancelled = true;
  };
}, [trip]);

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  function formatDate(date: string) {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function handleActivityClick(
    activity: Activity,
    day: number
  ) {
    const place = places.find(
      (place) =>
        place.name === activity.name &&
        place.day === day
    );

    if (!place) {
      return;
    }

    setSelectedPlace(place);

    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

          <p className="mt-4 text-sm text-gray-500">
            Loading your trip...
          </p>
        </div>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
        <div className="w-full max-w-lg rounded-[28px] border border-red-100 bg-white p-10 text-center">
          <div className="text-3xl">✈</div>

          <h1 className="mt-4 text-2xl font-semibold">
            Trip not found
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {error ||
              "This trip could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/trips")}
            className="mt-6 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Back to My Trips
          </button>
        </div>
      </main>
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
              onClick={() => router.push("/trips")}
              className="font-medium text-black"
            >
              My trips
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-12">
        <button
          type="button"
          onClick={() => router.push("/trips")}
          className="mb-6 text-sm font-medium text-gray-500 transition hover:text-black"
        >
          ← Back to My Trips
        </button>

        {/* Trip Header */}
        <div className="rounded-[28px] border border-gray-200 bg-white p-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                Saved trip
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                {trip.destination}
              </h1>

              <p className="mt-4 text-sm font-medium text-gray-500">
                {formatDate(trip.start_date)}
                {" — "}
                {formatDate(trip.end_date)}
              </p>

              {trip.summary && (
                <p className="mt-5 max-w-2xl leading-7 text-gray-500">
                  {trip.summary}
                </p>
              )}
            </div>

            <div className="shrink-0 rounded-2xl bg-[#f7f8fa] px-6 py-5">
              <p className="text-xs text-gray-400">
                Estimated total
              </p>

              <p className="mt-1 text-3xl font-semibold">
                €{trip.estimated_total_cost}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f7f8fa] p-4">
              <p className="text-xs text-gray-400">
                Total budget
              </p>

              <p className="mt-1 font-semibold">
                €{trip.budget}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f8fa] p-4">
              <p className="text-xs text-gray-400">
                Travelers
              </p>

              <p className="mt-1 font-semibold">
                {trip.travelers}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f8fa] p-4">
              <p className="text-xs text-gray-400">
                Trip length
              </p>

              <p className="mt-1 font-semibold">
                {trip.days?.length || 0}{" "}
                {trip.days?.length === 1
                  ? "day"
                  : "days"}
              </p>
            </div>
          </div>

          {/* Interests */}
          {trip.interests?.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                Interests
              </p>

              <div className="flex flex-wrap gap-2">
                {trip.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-500"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Itinerary + Sticky Map */}
        <div className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                Your itinerary
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Day-by-day plan
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Click an activity to focus it on the map.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {trip.days?.map((day) => (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(`day-${day.day}`)
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-black hover:bg-black hover:text-white"
                >
                  Day {day.day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
            {/* Left: Itinerary */}
            <div className="space-y-6">
              {trip.days?.map((day) => (
                <section
                  id={`day-${day.day}`}
                  key={day.day}
                  className="scroll-mt-28 overflow-hidden rounded-[30px] border border-gray-200 bg-white"
                >
                  {/* Day Header */}
                  <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-6 py-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
                        {day.day}
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Day {day.day}
                        </p>

                        <h3 className="mt-1 text-xl font-semibold tracking-tight">
                          {day.title}
                        </h3>
                      </div>
                    </div>

                    <div className="rounded-full bg-[#f7f8fa] px-4 py-2 text-sm">
                      <span className="text-gray-400">
                        Estimated{" "}
                      </span>

                      <span className="font-semibold">
                        €{day.estimatedCost}
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="px-6 py-2">
                    {day.activities?.map(
                      (activity, index) => {
                        const placeExists = places.some(
                          (place) =>
                            place.name === activity.name &&
                            place.day === day.day
                        );

                        const isLast =
                          index === day.activities.length - 1;

                        return (
                          <button
                            type="button"
                            key={`${day.day}-${index}`}
                            onClick={() =>
                              handleActivityClick(
                                activity,
                                day.day
                              )
                            }
                            disabled={!placeExists}
                            className={`group relative grid w-full grid-cols-[64px_28px_minmax(0,1fr)] gap-3 py-5 text-left ${
                              placeExists
                                ? "cursor-pointer"
                                : "cursor-default"
                            }`}
                          >
                            {/* Time */}
                            <div className="pt-0.5 text-sm font-semibold text-gray-500">
                              {activity.time}
                            </div>

                            {/* Timeline rail */}
                            <div className="relative flex justify-center">
                              {!isLast && (
                                <span className="absolute left-1/2 top-5 h-[calc(100%+20px)] w-px -translate-x-1/2 bg-gray-200" />
                              )}

                              <span
                                className={`relative z-10 mt-1 h-3 w-3 rounded-full border-[3px] border-white ring-1 ${
                                  placeExists
                                    ? "bg-black ring-black"
                                    : "bg-gray-300 ring-gray-300"
                                }`}
                              />
                            </div>

                            {/* Activity card */}
                            <div
                              className={`rounded-2xl border p-4 transition ${
                                placeExists
                                  ? "border-gray-200 bg-white group-hover:-translate-y-0.5 group-hover:border-gray-300 group-hover:shadow-lg group-hover:shadow-black/5"
                                  : "border-gray-100 bg-[#fafafa]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold">
                                      {activity.name}
                                    </h4>

                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                                      {activity.type}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm leading-6 text-gray-500">
                                    {activity.description}
                                  </p>

                                  {placeExists && (
                                    <p className="mt-3 text-xs font-medium text-gray-400 transition group-hover:text-black">
                                      View on map →
                                    </p>
                                  )}
                                </div>

                                <div className="shrink-0 rounded-xl bg-[#f7f8fa] px-3 py-2 text-sm font-semibold">
                                  {activity.estimatedCost === 0
                                    ? "Free"
                                    : `€${activity.estimatedCost}`}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Right: Sticky Map */}
            <aside
              ref={mapSectionRef}
              className="scroll-mt-8 lg:sticky lg:top-6"
            >
              <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Explore your trip
                      </p>

                      <h3 className="mt-1 text-xl font-semibold tracking-tight">
                        Trip map
                      </h3>
                    </div>

                    <div className="rounded-full bg-[#f7f8fa] px-3 py-1.5 text-xs font-medium text-gray-500">
                      {places.length} places
                    </div>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Select an activity or use the day controls on
                    the map to explore your route.
                  </p>
                </div>

                <div className="p-3">
                  {mapLoading && places.length === 0 ? (
                    <div className="flex h-[560px] items-center justify-center rounded-[22px] bg-[#f7f8fa]">
                      <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

                        <p className="mt-4 text-sm text-gray-500">
                          Finding itinerary places...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[22px]">
                      <Map
                        position={mapPosition}
                        destination={trip.destination}
                        places={places}
                        selectedPlace={selectedPlace}
                      />
                    </div>
                  )}
                </div>

                {mapLoading && places.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <p className="text-center text-xs text-gray-400">
                      Finding the remaining itinerary places...
                    </p>
                  </div>
                )}

                {mapError && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-3">
                    <p className="text-center text-sm text-red-500">
                      {mapError}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/trips")}
            className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-gray-50"
          >
            ← My Trips
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]"
          >
            + Plan another trip
          </button>
        </div>
      </section>
    </main>
  );
}