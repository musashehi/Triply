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

      
      await wait(1500);

      if (cancelled) return;

      
      const activities =
        trip!.days?.flatMap((day) =>
          (day.activities || []).map((activity) => ({
            ...activity,
            day: day.day,
          }))
        ) || [];

      const foundPlaces: Place[] = [];

      
      const searchedQueries = new Set<string>();

      for (const activity of activities) {
        if (cancelled) return;

        const query =
          `${activity.name}, ${trip!.destination}`.trim();

        const normalizedQuery =
          query.toLowerCase();

        
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
      
      <div className="sticky top-0 z-[1000] px-4 pt-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[22px] border border-black/10 bg-white/80 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl md:px-5">
          <button type="button" onClick={() => router.push("/")} className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">✈</div>
            <div className="text-left">
              <span className="block text-lg font-semibold leading-none tracking-tight">Triply</span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 sm:block">AI Travel Planner</span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.push("/")} className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-black/5 hover:text-black sm:block">Plan a trip</button>
            <button type="button" onClick={() => router.push("/trips")} className="hidden rounded-xl bg-black/5 px-4 py-2.5 text-sm font-medium text-black sm:block">My trips</button>
            <div className="hidden h-7 w-px bg-gray-200 md:block" />
            <button type="button" onClick={handleSignOut} className="group flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#272727]">
              Sign out <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10 md:pt-14">
        <button type="button" onClick={() => router.push("/trips")} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-black">
          <span>←</span> Back to My Trips
        </button>

        
        <div className="relative overflow-hidden rounded-[36px] bg-[#050505] px-7 py-9 text-white shadow-[0_24px_80px_rgba(0,0,0,0.10)] md:px-10 md:py-11 lg:px-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-40 h-[430px] w-[430px] rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-16 h-[290px] w-[290px] rounded-full border border-white/[0.07]" />
            <div className="absolute bottom-[-180px] left-[22%] h-96 w-96 rounded-full bg-white/[0.06] blur-3xl" />
            <div className="absolute right-[16%] top-[30%] h-2 w-2 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.8)]" />
            <div className="absolute right-[27%] top-[62%] h-1.5 w-1.5 rounded-full bg-white/60" />
            <div className="absolute inset-0 opacity-[0.10]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",backgroundSize:"48px 48px"}} />
          </div>

          <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-medium text-white/70 backdrop-blur-md">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black">✦</span>
                Saved journey
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] md:text-6xl lg:text-7xl">{trip.destination}</h1>
              <p className="mt-4 text-sm font-medium text-white/50 md:text-base">{formatDate(trip.start_date)} <span className="mx-2 text-white/25">→</span> {formatDate(trip.end_date)}</p>
              {trip.summary && <p className="mt-6 max-w-2xl text-sm leading-7 text-white/50 md:text-base">{trip.summary}</p>}

              {trip.interests?.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2">
                  {trip.interests.map((interest) => <span key={interest} className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur-md">{interest}</span>)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="col-span-2 rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-md lg:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Estimated total</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-4xl font-semibold tracking-tight">€{Number(trip.estimated_total_cost || 0).toLocaleString()}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-black">AI PLAN</span>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Budget</p>
                <p className="mt-1.5 text-lg font-semibold">€{Number(trip.budget || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Travelers</p>
                <p className="mt-1.5 text-lg font-semibold">{trip.travelers}</p>
              </div>
              <div className="col-span-2 rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div><p className="text-[10px] uppercase tracking-wider text-white/35">Trip length</p><p className="mt-1.5 text-lg font-semibold">{trip.days?.length || 0} {trip.days?.length === 1 ? "day" : "days"}</p></div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">✈</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="mt-14 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Your itinerary</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">The journey, day by day.</h2>
            <p className="mt-2 text-sm text-gray-500">Select any mapped activity to jump directly to its location.</p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {trip.days?.map((day) => (
              <button key={day.day} type="button" onClick={() => document.getElementById(`day-${day.day}`)?.scrollIntoView({behavior:"smooth",block:"start"})} className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-black hover:bg-black hover:text-white">Day {day.day}</button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,0.88fr)]">
          
          <div className="space-y-7">
            {trip.days?.map((day) => (
              <section id={`day-${day.day}`} key={day.day} className="scroll-mt-28 overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.035)]">
                <div className="relative overflow-hidden border-b border-gray-100 px-6 py-6 sm:px-7">
                  <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-black/[0.035]" />
                  <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">{String(day.day).padStart(2,"0")}</div>
                      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Day {day.day}</p><h3 className="mt-1 text-xl font-semibold tracking-tight">{day.title}</h3></div>
                    </div>
                    <div className="rounded-full bg-[#f5f6f7] px-4 py-2 text-xs"><span className="text-gray-400">Day estimate </span><span className="font-semibold text-black">€{day.estimatedCost}</span></div>
                  </div>
                </div>

                <div className="px-5 py-3 sm:px-7">
                  {day.activities?.map((activity,index) => {
                    const placeExists = places.some((place) => place.name === activity.name && place.day === day.day);
                    const isLast = index === day.activities.length - 1;
                    return (
                      <button type="button" key={`${day.day}-${index}`} onClick={() => handleActivityClick(activity,day.day)} disabled={!placeExists} className={`group relative grid w-full grid-cols-[58px_24px_minmax(0,1fr)] gap-3 py-4 text-left ${placeExists ? "cursor-pointer" : "cursor-default"}`}>
                        <div className="pt-4 text-xs font-semibold text-gray-400">{activity.time}</div>
                        <div className="relative flex justify-center">
                          {!isLast && <span className="absolute left-1/2 top-7 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-gray-200" />}
                          <span className={`relative z-10 mt-5 h-3 w-3 rounded-full border-[3px] border-white ring-1 ${placeExists ? "bg-black ring-black" : "bg-gray-300 ring-gray-300"}`} />
                        </div>
                        <div className={`rounded-[22px] border p-4 transition duration-300 ${placeExists ? "border-gray-200 bg-white group-hover:-translate-y-0.5 group-hover:border-gray-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]" : "border-gray-100 bg-[#fafafa]"}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{activity.name}</h4><span className="rounded-full bg-[#f4f4f4] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">{activity.type}</span></div>
                              <p className="mt-2 text-sm leading-6 text-gray-500">{activity.description}</p>
                              {placeExists && <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 transition group-hover:text-black">View on map →</p>}
                            </div>
                            <div className="shrink-0 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">{activity.estimatedCost === 0 ? "Free" : `€${activity.estimatedCost}`}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          
          <aside ref={mapSectionRef} className="scroll-mt-28 lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
              <div className="bg-[#0a0a0a] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Explore your journey</p><h3 className="mt-1.5 text-xl font-semibold tracking-tight">Interactive trip map</h3></div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70">{places.length} places</div>
                </div>
                <p className="mt-2 max-w-sm text-xs leading-5 text-white/45">Follow each day on the map and select an itinerary stop to focus it instantly.</p>
              </div>

              <div className="p-3">
                {mapLoading && places.length === 0 ? (
                  <div className="flex h-[560px] items-center justify-center rounded-[22px] bg-[#f7f8fa]"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" /><p className="mt-4 text-sm text-gray-500">Finding itinerary places...</p></div></div>
                ) : (
                  <div className="overflow-hidden rounded-[22px]"><Map position={mapPosition} destination={trip.destination} places={places} selectedPlace={selectedPlace} /></div>
                )}
              </div>

              {mapLoading && places.length > 0 && <div className="border-t border-gray-100 px-5 py-3"><p className="text-center text-xs text-gray-400">Finding the remaining itinerary places...</p></div>}
              {mapError && <div className="border-t border-red-100 bg-red-50 px-5 py-3"><p className="text-center text-sm text-red-500">{mapError}</p></div>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => router.push("/trips")} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-black">← My Trips</button>
              <button type="button" onClick={() => router.push("/")} className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#272727]">+ New trip</button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
