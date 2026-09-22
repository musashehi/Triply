"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import BlurText from "@/components/ui/BlurText";
import CountUp from "@/components/ui/CountUp";
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

const interests = [
  "Sightseeing",
  "Food",
  "History",
  "Nature",
  "Beaches",
  "Nightlife",
  "Shopping",
  "Art & Culture",
];

type MapPlace = {
  name: string;
  position: [number, number];
  type?: string;
  day?: number;
};

export default function Home() {
  const router = useRouter();

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Planner
  const [destination, setDestination] = useState("");

  const [mapPosition, setMapPosition] = useState<[number, number]>([
    41.9028, 12.4964,
  ]);

  const [mapDestination, setMapDestination] =
    useState("Rome, Italy");

  const [mapPlaces, setMapPlaces] = useState<MapPlace[]>([]);

  const [selectedMapPlace, setSelectedMapPlace] =
    useState<MapPlace | null>(null);

  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [travelers, setTravelers] = useState("2");

  const [generating, setGenerating] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [generateError, setGenerateError] = useState("");

  const [selectedInterests, setSelectedInterests] = useState<
    string[]
  >(["Sightseeing"]);

  // Save trip
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedTripId, setSavedTripId] = useState<string | null>(
    null
  );

  // Load current user
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setAuthLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();

    setUser(null);
    setSaveMessage("");
    setSaveError("");
    setSavedTripId(null);

    router.refresh();
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  async function searchDestination() {
    if (!destination.trim()) {
      setSearchError("Enter a destination first.");
      return;
    }

    try {
      setSearching(true);
      setSearchError("");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          destination
        )}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.length === 0) {
        setSearchError("Destination not found.");
        return;
      }

      const latitude = Number(data[0].lat);
      const longitude = Number(data[0].lon);

      setMapPosition([latitude, longitude]);
      setMapDestination(data[0].display_name);
    } catch {
      setSearchError(
        "Could not search for this destination."
      );
    } finally {
      setSearching(false);
    }
  }

  async function findTripPlaces(tripData: any) {
    const places: MapPlace[] = [];

    for (const day of tripData.days || []) {
      for (const activity of day.activities || []) {
        try {
          const query = `${activity.name}, ${tripData.destination}`;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&limit=1`
          );

          if (!response.ok) {
            continue;
          }

          const data = await response.json();

          if (data.length > 0) {
            places.push({
              name: activity.name,
              position: [
                Number(data[0].lat),
                Number(data[0].lon),
              ],
              type: activity.type,
              day: day.day,
            });

            setMapPlaces([...places]);
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 1100)
          );
        } catch (error) {
          console.error(
            `Could not locate ${activity.name}`,
            error
          );
        }
      }
    }
  }

  async function generateTrip() {
    if (
      !destination.trim() ||
      !startDate ||
      !endDate ||
      !budget ||
      selectedInterests.length === 0
    ) {
      setGenerateError(
        "Please complete all trip details."
      );
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setGenerateError(
        "End date cannot be before start date."
      );
      return;
    }

    try {
      setGenerating(true);
      setGenerateError("");

      setTrip(null);
      setMapPlaces([]);
      setSelectedMapPlace(null);

      setSaveMessage("");
      setSaveError("");
      setSavedTripId(null);

      // Move map to destination
      await searchDestination();

      // Generate itinerary
      const response = await fetch(
        "/api/generate-trip",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            destination,
            startDate,
            endDate,
            budget: Number(budget),
            travelers: Number(travelers),
            interests: selectedInterests,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate trip."
        );
      }

      setTrip(data);

      setGenerating(false);

      // Find places without blocking itinerary display
      findTripPlaces(data);
    } catch (error) {
      console.error(error);

      setGenerateError(
        "Something went wrong while generating your trip."
      );

      setGenerating(false);
    }
  }

  async function saveTrip() {
    setSaveMessage("");
    setSaveError("");

    if (!trip) {
      setSaveError("Generate a trip first.");
      return;
    }

    if (!user) {
      setSaveError(
        "You need to sign in before saving your trip."
      );
      return;
    }

    if (savedTripId) {
      setSaveMessage("This trip is already saved.");
      return;
    }

    try {
      setSavingTrip(true);

      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          destination: trip.destination || destination,
          start_date: startDate,
          end_date: endDate,
          budget: Number(budget),
          travelers: Number(travelers),
          interests: selectedInterests,
          summary: trip.summary || "",
          estimated_total_cost:
            Number(trip.estimatedTotalCost) || 0,
          days: trip.days || [],
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      setSavedTripId(data.id);
      setSaveMessage("Trip saved successfully.");
    } catch (error: any) {
      console.error("Save trip error:", error);

      setSaveError(
        error?.message ||
          "Could not save your trip. Please try again."
      );
    } finally {
      setSavingTrip(false);
    }
  }

  function handleActivityClick(
    activity: any,
    dayNumber: number
  ) {
    const place = mapPlaces.find(
      (item) =>
        item.name === activity.name &&
        item.day === dayNumber
    );

    if (!place) {
      return;
    }

    setSelectedMapPlace(place);

    setTimeout(() => {
      document
        .getElementById("trip-map")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  }

  function activityHasMapPlace(
    activity: any,
    dayNumber: number
  ) {
    return mapPlaces.some(
      (item) =>
        item.name === activity.name &&
        item.day === dayNumber
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#171717]">
      {/* Navbar */}
<nav className="border-b border-black/5 bg-white">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
    {/* Logo */}
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

    {/* Right side */}
    <div className="flex items-center gap-3">
      {/* My Trips */}
      {!authLoading && user && (
        <button
          type="button"
          onClick={() => router.push("/trips")}
          className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-gray-300 hover:bg-gray-50"
        >
          My trips
        </button>
      )}

      {/* Authentication */}
      {!authLoading && user ? (
        <>
          {/* User email */}
          <div className="hidden text-right lg:block">
            <p className="text-xs text-gray-400">
              Signed in as
            </p>

            <p className="max-w-[180px] truncate text-sm font-medium">
              {user.email}
            </p>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#272727]"
          >
            Sign out
          </button>
        </>
      ) : !authLoading ? (
        /* Sign in */
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#272727]"
        >
          Sign in
        </button>
      ) : (
        /* Loading */
        <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
      )}
    </div>
  </div>
</nav>

      {/* Hero */}
<section className="mx-auto max-w-5xl px-6 pb-12 pt-20 text-center">
  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600">
    <span>✦</span>
    AI-powered trip planning
  </div>

  <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] md:text-7xl">
    <BlurText
      text="Your next trip,"
      delay={80}
      className="block"
    />

    <BlurText
      text="planned in seconds."
      delay={80}
      className="block"
    />
  </h1>

  <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-500 md:text-lg">
    Pick a destination, set your budget and tell us
    what you love. We&apos;ll build a personalized
    day-by-day itinerary for you.
  </p>
</section>

      {/* Planner */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Destination */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Where do you want to go?
              </label>

              <div className="flex items-center rounded-2xl border border-gray-200 bg-[#fafafa] px-4 transition focus-within:border-gray-400 focus-within:bg-white">
                <span className="mr-3 text-gray-400">
                  ⌖
                </span>

                <input
                  type="text"
                  value={destination}
                  onChange={(e) =>
                    setDestination(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchDestination();
                    }
                  }}
                  placeholder="e.g. Rome, Italy"
                  className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>

              {searchError && (
                <p className="mt-2 text-sm text-red-500">
                  {searchError}
                </p>
              )}

              {searching && (
                <p className="mt-2 text-xs text-gray-400">
                  Finding destination...
                </p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Start date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="h-14 w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                End date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="h-14 w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Total budget
              </label>

              <div className="flex h-14 items-center rounded-2xl border border-gray-200 bg-[#fafafa] px-4">
                <span className="mr-2 text-gray-400">
                  €
                </span>

                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value)
                  }
                  onWheel={(e) =>
                    e.currentTarget.blur()
                  }
                  placeholder="1000"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* Travelers */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Travelers
              </label>

              <select
                value={travelers}
                onChange={(e) =>
                  setTravelers(e.target.value)
                }
                className="h-14 w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              >
                <option value="1">1 traveler</option>
                <option value="2">2 travelers</option>
                <option value="3">3 travelers</option>
                <option value="4">4 travelers</option>
                <option value="5">5 travelers</option>
                <option value="6">6+ travelers</option>
              </select>
            </div>
          </div>

          {/* Interests */}
          <div className="mt-7">
            <div className="mb-3 flex items-end justify-between gap-4">
              <label className="text-sm font-medium">
                What are you interested in?
              </label>

              <span className="text-xs text-gray-400">
                Choose as many as you like
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => {
                const selected =
                  selectedInterests.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() =>
                      toggleInterest(interest)
                    }
                    className={`rounded-full border px-4 py-2.5 text-sm transition ${
                      selected
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-black"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate */}
          <button
            type="button"
            onClick={generateTrip}
            disabled={generating}
            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-[#272727] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>✦</span>

            {generating
              ? "Planning your trip..."
              : "Generate my trip"}
          </button>

          {generateError && (
            <p className="mt-3 text-center text-sm text-red-500">
              {generateError}
            </p>
          )}

          <p className="mt-4 text-center text-xs text-gray-400">
            Your itinerary will be generated based on your
            budget and preferences.
          </p>
        </div>

        {/* Generated Trip */}
        {trip && (
          <div className="mt-8">
            {/* Trip Header */}
            <div className="rounded-[30px] border border-gray-200 bg-white p-7 md:p-8">
              <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-start">
                <div className="max-w-2xl">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                    Your AI trip
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                    {trip.destination}
                  </h2>

                  <p className="mt-3 leading-7 text-gray-500">
                    {trip.summary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f7f8fa] px-3.5 py-2 text-xs font-medium text-gray-600">
                      {trip.days?.length || 0}{" "}
                      {trip.days?.length === 1 ? "day" : "days"}
                    </span>

                    <span className="rounded-full bg-[#f7f8fa] px-3.5 py-2 text-xs font-medium text-gray-600">
                      {travelers}{" "}
                      {Number(travelers) === 1
                        ? "traveler"
                        : "travelers"}
                    </span>

                    <span className="rounded-full bg-[#f7f8fa] px-3.5 py-2 text-xs font-medium text-gray-600">
                      €{budget} budget
                    </span>
                  </div>
                </div>

                <div className="flex min-w-[190px] flex-col gap-3">
                  <div className="rounded-2xl bg-black px-5 py-4 text-white">
                    <p className="text-xs text-white/60">
                      Estimated total
                    </p>

                    <p className="mt-1 text-3xl font-semibold">
                      <CountUp
                        value={
                          Number(trip.estimatedTotalCost) || 0
                        }
                        prefix="€"
                      />
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={saveTrip}
                    disabled={
                      savingTrip || Boolean(savedTripId)
                    }
                    className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      savedTripId
                        ? "cursor-default bg-green-50 text-green-700"
                        : "border border-black bg-white text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    }`}
                  >
                    {savingTrip
                      ? "Saving..."
                      : savedTripId
                        ? "✓ Trip saved"
                        : "Save trip"}
                  </button>
                </div>
              </div>

              {saveMessage && (
                <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {saveMessage}
                </div>
              )}

              {saveError && (
                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>{saveError}</span>

                  {!user && (
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="font-semibold text-black hover:underline"
                    >
                      Sign in
                    </button>
                  )}
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
                  {trip.days?.map((day: any) => (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => {
                        document
                          .getElementById(
                            `generated-day-${day.day}`
                          )
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
                  {trip.days?.map((day: any) => (
                    <section
                      id={`generated-day-${day.day}`}
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
                          (
                            activity: any,
                            activityIndex: number
                          ) => {
                            const hasMapPlace =
                              activityHasMapPlace(
                                activity,
                                day.day
                              );

                            const isLast =
                              activityIndex ===
                              day.activities.length - 1;

                            return (
                              <button
                                type="button"
                                key={`${day.day}-${activityIndex}`}
                                onClick={() =>
                                  handleActivityClick(
                                    activity,
                                    day.day
                                  )
                                }
                                disabled={!hasMapPlace}
                                className={`group relative grid w-full grid-cols-[64px_28px_minmax(0,1fr)] gap-3 py-5 text-left ${
                                  hasMapPlace
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
                                      hasMapPlace
                                        ? "bg-black ring-black"
                                        : "bg-gray-300 ring-gray-300"
                                    }`}
                                  />
                                </div>

                                {/* Activity */}
                                <div
                                  className={`rounded-2xl border p-4 transition ${
                                    hasMapPlace
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

                                      {hasMapPlace && (
                                        <p className="mt-3 text-xs font-medium text-gray-400 transition group-hover:text-black">
                                          View on map →
                                        </p>
                                      )}
                                    </div>

                                    <div className="shrink-0 rounded-xl bg-[#f7f8fa] px-3 py-2 text-sm font-semibold">
                                      {activity.estimatedCost ===
                                      0
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
                  id="trip-map"
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
                          {mapPlaces.length} places
                        </div>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Select an activity or use the day
                        controls on the map to explore your
                        route.
                      </p>
                    </div>

                    <div className="p-3">
                      <div className="overflow-hidden rounded-[22px]">
                        <Map
                          position={mapPosition}
                          destination={mapDestination}
                          places={mapPlaces}
                          selectedPlace={selectedMapPlace}
                        />
                      </div>
                    </div>

                    {mapPlaces.length === 0 && (
                      <div className="border-t border-gray-100 px-5 py-3">
                        <p className="text-center text-xs text-gray-400">
                          Finding your trip stops on the map...
                        </p>
                      </div>
                    )}

                    {mapPlaces.length > 0 && (
                      <div className="border-t border-gray-100 px-5 py-3">
                        <p className="text-center text-xs text-gray-400">
                          {mapPlaces.length} trip{" "}
                          {mapPlaces.length === 1
                            ? "stop"
                            : "stops"}{" "}
                          found on the map
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid gap-4 text-sm text-gray-500 md:grid-cols-3">
          <div className="text-center">
            <span className="font-medium text-black">
              Day-by-day
            </span>
            <br />
            Personalized itinerary
          </div>

          <div className="text-center">
            <span className="font-medium text-black">
              Interactive map
            </span>
            <br />
            See every stop on the map
          </div>

          <div className="text-center">
            <span className="font-medium text-black">
              Budget aware
            </span>
            <br />
            Planned around your budget
          </div>
        </div>
      </section>
    </main>
  );
}