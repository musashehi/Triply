"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import BlurText from "@/components/ui/BlurText";
import CountUp from "@/components/ui/CountUp";
import GenerateButton from "@/components/ui/GenerateButton";
import { AnimatePresence, motion } from "framer-motion";
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

const travelSlides = [
  {
    city: "Rome",
    place: "Colosseum",
    subtitle: "History, food & timeless streets",
    icon: "◉",
  },
  {
    city: "Paris",
    place: "Eiffel Tower",
    subtitle: "Cafés, art & iconic views",
    icon: "✦",
  },
  {
    city: "Tokyo",
    place: "Shibuya",
    subtitle: "Neon nights & hidden gems",
    icon: "⌖",
  },
  {
    city: "Barcelona",
    place: "Sagrada Família",
    subtitle: "Architecture, tapas & sea",
    icon: "◇",
  },
  {
    city: "Santorini",
    place: "Oia",
    subtitle: "Clifftop sunsets & blue seas",
    icon: "☼",
  },
];

function DestinationSlider() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSlide((current) => (current + 1) % travelSlides.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const current = travelSlides[slide];

  return (
    <div className="absolute right-7 top-44 hidden w-48 rotate-3 md:block lg:right-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.city}
          initial={{ opacity: 0, x: 28, y: 8, rotate: 2, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, x: -28, y: -6, rotate: -2, scale: 0.96 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[22px] border border-white/15 bg-white/[0.09] p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Next stop · {current.city}
            </span>
            <motion.span
              className="h-2 w-2 rounded-full bg-white"
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm">
              {current.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{current.place}</p>
              <p className="mt-1 text-[11px] leading-4 text-white/45">
                {current.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            {travelSlides.map((item, index) => (
              <button
                key={item.city}
                type="button"
                aria-label={`Show ${item.city}`}
                onClick={() => setSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === slide ? "w-8 bg-white" : "w-3 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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
        `/api/geocode?q=${encodeURIComponent(destination.trim())}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setSearchError("Destination not found.");
        return;
      }

      const latitude = Number(data[0].lat);
      const longitude = Number(data[0].lon);

      setMapPosition([latitude, longitude]);
      setMapDestination(data[0].display_name);
    } catch (error) {
      console.error("Destination search failed:", error);
      setSearchError("Could not search for this destination.");
    } finally {
      setSearching(false);
    }
  }

  async function findTripPlaces(tripData: any) {
    const places: MapPlace[] = [];
    const verifiedNames = new Set<string>();

    for (const day of tripData.days || []) {
      for (const activity of day.activities || []) {
        try {
          const activityName = String(activity?.name || "").trim();

          if (!activityName) {
            activity.mapVerified = false;
            continue;
          }

          const normalizedName = activityName.toLowerCase();

          if (verifiedNames.has(normalizedName)) {
            activity.mapVerified = false;
            continue;
          }

          const genericPatterns = [
            /^local\s/i,
            /^best\s/i,
            /^famous\s/i,
            /^traditional\s/i,
            /^city\s/i,
            /best pizza/i,
            /best pasta/i,
            /local restaurant/i,
            /local cafe/i,
            /local café/i,
            /traditional restaurant/i,
            /famous restaurant/i,
          ];

          const looksGeneric = genericPatterns.some((pattern) =>
            pattern.test(activityName)
          );

          if (looksGeneric) {
            activity.mapVerified = false;
            continue;
          }

          const query = `${activityName}, ${tripData.destination}`;

          const response = await fetch(
            `/api/geocode?q=${encodeURIComponent(query)}`
          );

          if (!response.ok) {
            activity.mapVerified = false;
            continue;
          }

          const data = await response.json();

          if (!Array.isArray(data) || data.length === 0) {
            activity.mapVerified = false;
            continue;
          }

          const latitude = Number(data[0].lat);
          const longitude = Number(data[0].lon);

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            activity.mapVerified = false;
            continue;
          }

          activity.mapVerified = true;
          activity.mapDisplayName = data[0].display_name;

          verifiedNames.add(normalizedName);

          places.push({
            name: activityName,
            position: [latitude, longitude],
            type: activity.type,
            day: day.day,
          });

          setMapPlaces([...places]);
        } catch (error) {
          activity.mapVerified = false;

          console.error(
            `Could not verify ${activity?.name}`,
            error
          );
        }
      }
    }

    setTrip({ ...tripData });
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
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fa] text-[#171717]">
      {/* Floating Navbar */}
      <div className="fixed left-0 right-0 top-0 z-[1000] px-3 pt-3 sm:px-4 sm:pt-4">
<nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[20px] border border-black/10 bg-white/90 px-3 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:rounded-[22px] sm:px-4 sm:py-3 md:px-5">          {/* Logo */}
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

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {!authLoading && user && (
              <button
                type="button"
                onClick={() => router.push("/trips")}
                className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-black/5 hover:text-black sm:block"
              >
                My trips
              </button>
            )}

            {!authLoading && user ? (
              <>
                <div className="hidden h-7 w-px bg-gray-200 md:block" />

                <div className="hidden px-2 text-right lg:block">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">
                    Signed in as
                  </p>
                  <p className="mt-0.5 max-w-[170px] truncate text-xs font-medium">
                    {user.email}
                  </p>
                </div>

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
              </>
            ) : !authLoading ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="group flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#272727]"
              >
                Sign in
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            ) : (
              <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-100" />
            )}
          </div>
        </nav>
      </div>

      {/* Hero + Planner */}
      <section className="mx-auto max-w-7xl px-3 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28 md:pt-32">
        <div className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.07)] sm:rounded-[36px]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            {/* Hero side */}
            <div className="relative overflow-hidden bg-[#050505] px-5 py-9 text-white sm:px-7 sm:py-12 md:px-10 md:py-14 lg:min-h-[700px] lg:px-12 lg:py-16">
              {/* Premium background */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl" />
                <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-white/[0.09] blur-3xl" />
                <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-white/[0.06] blur-3xl" />

                <div
                  className="absolute inset-0 opacity-[0.14]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage:
                      "linear-gradient(to bottom, black, transparent 88%)",
                  }}
                />

                {/* Travel orbit */}
                <div className="absolute -right-36 top-8 h-[440px] w-[440px] rounded-full border border-white/10">
                  <div className="absolute inset-[54px] rounded-full border border-white/[0.08]" />
                  <div className="absolute inset-[108px] rounded-full border border-white/[0.07]" />

                  <div className="absolute left-[37px] top-[78px] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-base shadow-2xl backdrop-blur-xl">
                    ✈
                  </div>
                  <div className="absolute bottom-[78px] left-[66px] h-3 w-3 rounded-full bg-white shadow-[0_0_28px_rgba(255,255,255,0.8)]" />
                  <div className="absolute bottom-[112px] right-[52px] h-2 w-2 rounded-full bg-white/70" />
                </div>

                {/* Animated destination slider */}
                <DestinationSlider />
              </div>

              <div className="relative z-10 flex h-full flex-col">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-medium text-white/80 shadow-lg shadow-black/20 backdrop-blur-md">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black">
                      ✦
                    </span>
                    AI-powered trip planning
                  </div>

                  <h1 className="mt-7 max-w-xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:mt-8 sm:text-5xl md:text-6xl lg:text-[68px]">
                    <BlurText text="Plan less." delay={80} className="block" />
                    <BlurText
                      text="Travel more."
                      delay={80}
                      className="block bg-gradient-to-r from-white via-white/70 to-white/30 bg-clip-text text-transparent"
                    />
                  </h1>

                  <p className="mt-7 max-w-md text-base leading-7 text-white/55 md:text-lg">
                    Tell Triply where you want to go and what matters to you.
                    Your itinerary, budget and route come together in one place.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <div className="flex -space-x-2">
                      {["✈", "⌖", "€"].map((item) => (
                        <div
                          key={item}
                          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-xs font-semibold text-black"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/80">
                        One planner. Your whole trip.
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/35">
                        AI + routes + budget
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-14 grid gap-3 sm:grid-cols-3 lg:mt-auto lg:grid-cols-3">
                  {[
                    ["01", "AI itinerary", "Day-by-day"],
                    ["02", "Live routes", "Mapped stops"],
                    ["03", "Budget aware", "Cost focused"],
                  ].map(([number, title, description]) => (
                    <div
                      key={title}
                      className="group rounded-[22px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30">
                          {number}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-white/50 transition group-hover:bg-white" />
                      </div>
                      <p className="mt-5 text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-white/40">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Planner side */}
            <div className="bg-white px-5 py-8 sm:px-6 sm:py-9 md:px-10 md:py-12 lg:px-12">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Create your trip
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                  Where are you going?
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Add your trip details and Triply will build the itinerary for you.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Destination</label>
                  <div className="flex h-14 items-center rounded-2xl border border-gray-200 bg-[#f7f8fa] px-4 transition focus-within:border-black focus-within:bg-white">
                    <span className="mr-3 text-lg text-gray-400">⌖</span>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") searchDestination();
                      }}
                      placeholder="e.g. Rome, Italy"
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                  {searchError && <p className="mt-2 text-sm text-red-500">{searchError}</p>}
                  {searching && <p className="mt-2 text-xs text-gray-400">Finding destination...</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Start date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f7f8fa] px-4 text-sm outline-none transition focus:border-black focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">End date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f7f8fa] px-4 text-sm outline-none transition focus:border-black focus:bg-white" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Total budget</label>
                    <div className="flex h-14 items-center rounded-2xl border border-gray-200 bg-[#f7f8fa] px-4 transition focus-within:border-black focus-within:bg-white">
                      <span className="mr-2 text-gray-400">€</span>
                      <input type="number" min="0" value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="1000" className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Travelers</label>
                    <select value={travelers} onChange={(e) => setTravelers(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f7f8fa] px-4 text-sm outline-none transition focus:border-black focus:bg-white">
                      <option value="1">1 traveler</option>
                      <option value="2">2 travelers</option>
                      <option value="3">3 travelers</option>
                      <option value="4">4 travelers</option>
                      <option value="5">5 travelers</option>
                      <option value="6">6+ travelers</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <label className="text-sm font-medium">Interests</label>
                    <span className="hidden text-xs text-gray-400 sm:block">Choose as many as you like</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => {
                      const selected = selectedInterests.includes(interest);
                      return (
                        <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                          className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                            selected
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-black"
                          }`}>
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <GenerateButton
  loading={generating}
  onClick={generateTrip}
/>

                {generateError && <p className="text-center text-sm text-red-500">{generateError}</p>}

                <p className="text-center text-xs leading-5 text-gray-400">
                  Your itinerary is generated around your destination, budget and interests.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Trip */}
        {trip && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            {/* Destination command center */}
            <div className="relative overflow-hidden rounded-[26px] bg-[#050505] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:rounded-[36px] sm:p-7 md:p-10">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-28 -top-40 h-[480px] w-[480px] rounded-full border border-white/10" />
                <div className="absolute -right-8 -top-20 h-[320px] w-[320px] rounded-full border border-white/[0.08]" />
                <div className="absolute -bottom-44 left-1/3 h-80 w-80 rounded-full bg-white/[0.07] blur-3xl" />
                <div
                  className="absolute inset-0 opacity-[0.10]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
                    backgroundSize: "46px 46px",
                    maskImage: "linear-gradient(to right, black, transparent 90%)",
                  }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65 backdrop-blur-xl">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Your AI journey
                      </span>
                      <span className="rounded-full border border-white/10 px-3.5 py-2 text-[10px] font-medium text-white/45">
                        Ready to explore
                      </span>
                    </div>

                    <h2 className="mt-7 text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-6xl">
                      {trip.destination}
                    </h2>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
                      {trip.summary}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2">
                      {selectedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/55"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px] lg:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Days</p>
                      <p className="mt-2 text-2xl font-semibold">{trip.days?.length || 0}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Travelers</p>
                      <p className="mt-2 text-2xl font-semibold">{travelers}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Budget</p>
                      <p className="mt-2 text-2xl font-semibold">€{budget}</p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4 text-black">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">AI estimate</p>
                      <p className="mt-2 text-2xl font-semibold">
                        <CountUp value={Number(trip.estimatedTotalCost) || 0} prefix="€" />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Budget meter */}
                <div className="mt-9 border-t border-white/10 pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                        Budget overview
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        €{Number(trip.estimatedTotalCost) || 0} planned of €{Number(budget) || 0}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={saveTrip}
                      disabled={savingTrip || Boolean(savedTripId)}
                      className={`rounded-full px-5 py-2.5 text-xs font-semibold transition ${
                        savedTripId
                          ? "cursor-default bg-green-400/15 text-green-300"
                          : "bg-white text-black hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      }`}
                    >
                      {savingTrip
                        ? "Saving..."
                        : savedTripId
                          ? "✓ Journey saved"
                          : "Save this journey →"}
                    </button>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          100,
                          Number(budget) > 0
                            ? ((Number(trip.estimatedTotalCost) || 0) / Number(budget)) * 100
                            : 0
                        )}%`,
                      }}
                      transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {saveMessage && (
              <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {saveMessage}
              </div>
            )}

            {saveError && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
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

            {/* Day navigation */}
            <div className="mt-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Your itinerary
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                  The journey, day by day.
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Every stop is connected to your interactive trip map.
                </p>
              </div>

              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {trip.days?.map((day: any) => (
                  <button
                    key={day.day}
                    type="button"
                    onClick={() => {
                      document
                        .getElementById(`generated-day-${day.day}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-500 transition hover:border-black hover:bg-black hover:text-white"
                  >
                    Day {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Itinerary + map */}
            <div className="mt-5 grid min-w-0 items-start gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] xl:grid-cols-[minmax(0,1.12fr)_minmax(390px,0.88fr)]">
              <div className="space-y-5">
                {trip.days?.map((day: any, dayIndex: number) => (
                  <motion.section
                    id={`generated-day-${day.day}`}
                    key={day.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: Math.min(dayIndex * 0.08, 0.35) }}
                    className="scroll-mt-24 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)] sm:scroll-mt-28 sm:rounded-[30px]"
                  >
                    <div className="grid grid-cols-[78px_minmax(0,1fr)] border-b border-gray-100 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
                      <div className="flex items-center gap-3 bg-black px-5 py-5 text-white sm:flex-col sm:items-start sm:justify-center">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                          Day
                        </span>
                        <span className="text-3xl font-semibold tracking-[-0.04em]">
                          {String(day.day).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="px-5 py-5 sm:px-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Daily route
                        </p>
                        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.025em]">
                          {day.title}
                        </h3>
                      </div>

                      <div className="col-span-2 flex items-center border-t border-gray-100 px-4 py-3 sm:col-span-1 sm:border-l sm:border-t-0 sm:px-5 sm:py-4">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400">
                            Estimate
                          </p>
                          <p className="mt-1 text-lg font-semibold">€{day.estimatedCost}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 sm:px-6">
                      {day.activities?.map((activity: any, activityIndex: number) => {
                        const hasMapPlace = activityHasMapPlace(activity, day.day);
                        const isLast = activityIndex === day.activities.length - 1;

                        return (
                          <button
                            type="button"
                            key={`${day.day}-${activityIndex}`}
                            onClick={() => handleActivityClick(activity, day.day)}
                            disabled={!hasMapPlace}
                            className={`group relative grid w-full grid-cols-[44px_18px_minmax(0,1fr)] gap-2 py-3 text-left sm:grid-cols-[56px_24px_minmax(0,1fr)] sm:gap-3 sm:py-4 ${
                              hasMapPlace ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            <div className="pt-1 text-xs font-semibold text-gray-400">
                              {activity.time}
                            </div>

                            <div className="relative flex justify-center">
                              {!isLast && (
                                <span className="absolute left-1/2 top-4 h-[calc(100%+18px)] w-px -translate-x-1/2 bg-gray-200" />
                              )}
                              <span
                                className={`relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ${
                                  hasMapPlace
                                    ? "bg-black ring-black"
                                    : "bg-gray-300 ring-gray-300"
                                }`}
                              />
                            </div>

                            <div
                              className={`rounded-[20px] border p-4 transition-all duration-300 ${
                                hasMapPlace
                                  ? "border-gray-100 bg-[#fafafa] group-hover:-translate-y-0.5 group-hover:border-gray-200 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-black/5"
                                  : "border-gray-100 bg-[#fafafa]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold tracking-[-0.01em]">
                                      {activity.name}
                                    </h4>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                                      {activity.type}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm leading-6 text-gray-500">
                                    {activity.description}
                                  </p>

                                  {hasMapPlace && (
                                    <p className="mt-3 text-[11px] font-semibold text-gray-400 transition group-hover:text-black">
                                      Focus on map ↗
                                    </p>
                                  )}
                                </div>

                                <span className="shrink-0 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">
                                  {activity.estimatedCost === 0
                                    ? "Free"
                                    : `€${activity.estimatedCost}`}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.section>
                ))}
              </div>

              <aside id="trip-map" className="min-w-0 scroll-mt-24 sm:scroll-mt-28 lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-[30px] border border-black/10 bg-[#050505] shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
                  <div className="flex items-start justify-between gap-4 px-6 py-5 text-white">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                        Live journey map
                      </p>
                      <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.025em]">
                        Explore your route
                      </h3>
                      <p className="mt-2 max-w-xs text-xs leading-5 text-white/40">
                        Select any mapped activity to move directly to that stop.
                      </p>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/65">
                      {mapPlaces.length} stops
                    </div>
                  </div>

                  <div className="bg-white p-2.5">
                    <div className="overflow-hidden rounded-[22px]">
                      <Map
                        position={mapPosition}
                        destination={mapDestination}
                        places={mapPlaces}
                        selectedPlace={selectedMapPlace}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-5 py-4 text-[10px] text-white/40">
                    <span>
                      {mapPlaces.length === 0
                        ? "Locating your itinerary..."
                        : `${mapPlaces.length} trip ${
                            mapPlaces.length === 1 ? "stop" : "stops"
                          } mapped`}
                    </span>
                    <span className="text-white/70">OpenStreetMap · Live route</span>
                  </div>
                </div>
              </aside>
            </div>
          </motion.div>
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