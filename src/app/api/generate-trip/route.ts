import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      interests,
    } = body;

    if (
      !destination ||
      !startDate ||
      !endDate ||
      !budget ||
      !travelers ||
      !Array.isArray(interests)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid trip information." },
        { status: 400 }
      );
    }

    const totalBudget = Number(budget);
    const travelerCount = Number(travelers);

    if (
      !Number.isFinite(totalBudget) ||
      totalBudget <= 0 ||
      !Number.isFinite(travelerCount) ||
      travelerCount <= 0
    ) {
      return NextResponse.json(
        { error: "Budget and travelers must be valid numbers." },
        { status: 400 }
      );
    }

    const minimumBudgetTarget = Math.round(totalBudget * 0.8);
    const idealBudgetTarget = Math.round(totalBudget * 0.9);
    const maximumBudgetTarget = Math.round(totalBudget * 0.95);

    const prompt = `
You are Triply, an expert AI travel itinerary planner.

Your job is to create a realistic, geographically sensible and
budget-aware itinerary.

TRIP INFORMATION

Destination: ${destination}
Start date: ${startDate}
End date: ${endDate}
Total activity and food budget: €${totalBudget}
Number of travelers: ${travelerCount}
Interests: ${interests.join(", ")}

The budget does NOT include:
- flights
- accommodation
- airport transportation unless specifically included as an activity

ITINERARY RULES

1. Create an itinerary for EVERY calendar day from the start date
   through the end date, inclusive.

2. Never skip a calendar day.

3. Include between 3 and 5 activities per day.

4. Activities should reflect the user's interests whenever possible.

5. Use SPECIFIC real-world places that you are confident exist
   in or near the requested destination.

6. Never invent generic businesses or attractions.

BAD examples:
- "Best Pizza in Rome"
- "Local Italian Restaurant"
- "Famous Paris Cafe"
- "Traditional Food Place"
- "City Shopping Center"

GOOD examples:
- Colosseum
- Pantheon
- Trevi Fountain
- Vatican Museums

7. Prefer well-established landmarks, museums, parks,
   neighborhoods, markets and restaurants that are likely to be
   recognizable by mapping/geocoding services.

8. Do NOT repeat the same attraction, restaurant, cafe or activity
   during the trip unless there is a very strong reason.

9. Every activity name must identify the PLACE itself.
   Do not put instructions inside the name.

BAD:
"Walk around the Colosseum"

GOOD:
"Colosseum"

10. GEOGRAPHIC PLANNING IS IMPORTANT.

Activities on the same day should be geographically close to each
other whenever possible.

Avoid sending the traveler back and forth across the city.

For example, if several attractions are located in the same historic
district, group them on the same day.

11. Order activities in a realistic travel sequence.

Example:
09:00 attraction
11:00 nearby attraction
13:00 lunch
15:00 museum or neighborhood
19:00 dinner

Do not schedule activities at unrealistic times.

12. Avoid scheduling two places at exactly the same time.

13. Restaurants should normally appear around realistic meal times.

Typical ranges:
Breakfast: 07:30-10:00
Lunch: 12:00-14:30
Dinner: 18:30-21:30

14. Do not overfill the itinerary.
Allow realistic time for walking, transportation, meals and visiting.

BUDGET RULES

15. Treat the user's €${totalBudget} budget as money they are genuinely
    willing to spend on activities, food and experiences during this trip.
    It is NOT merely a maximum ceiling.

    Budget targets for this trip:
    - Preferred minimum spend: approximately €${minimumBudgetTarget} (80%)
    - Ideal spend: approximately €${idealBudgetTarget} (90%)
    - Preferred maximum spend: approximately €${maximumBudgetTarget} (95%)
    - Absolute maximum: €${totalBudget}

    Whenever the destination, trip duration and user's interests provide
    worthwhile real options, actively build the itinerary so the combined
    estimated cost lands between €${minimumBudgetTarget} and
    €${maximumBudgetTarget}, preferably close to €${idealBudgetTarget}.

    If an initial itinerary would use far less than 80% of the budget,
    improve the EXPERIENCE rather than simply leaving most of the budget
    unused. Consider meaningful real upgrades such as:
    - reputable guided tours
    - paid museums and attractions
    - cultural experiences
    - boat trips or excursions
    - food experiences
    - better restaurant choices
    - nightlife when relevant to the user's interests
    - worthwhile day experiences near the destination
    - other paid experiences that genuinely match the user's interests

    Do NOT inflate prices, invent premium versions, add pointless spending,
    or include low-quality/redundant activities merely to reach the target.

    Spending below €${minimumBudgetTarget} is acceptable when there are not
    enough worthwhile and realistic activities to responsibly use 80% of
    the budget. In that situation, return the best realistic itinerary
    instead of fabricating costs.

    Never exceed the total €${totalBudget} budget.

16. The budget is for ALL ${travelerCount} travelers combined.

17. Every activity MUST contain estimatedCost.

18. estimatedCost must always be a JSON NUMBER representing euros.

Correct:
"estimatedCost": 25

Incorrect:
"estimatedCost": "€25"

19. Use estimatedCost: 0 ONLY when the activity itself is genuinely
free.

20. For paid attractions:
estimatedCost should represent the approximate ticket cost multiplied
by ${travelerCount} travelers.

21. For restaurants and food stops:
estimatedCost should represent the approximate total meal cost for
${travelerCount} travelers, not the price for one person.

22. When exact current prices are uncertain, use a conservative
reasonable estimate rather than claiming an exact official price.

23. Do not spend almost the entire budget on one activity unless it is
essential to the requested interests.

24. Prefer a reasonable mixture of free and paid activities when the
budget is limited.

25. Do not include flights or accommodation in estimatedCost.

QUALITY RULES

26. Descriptions should be short and useful.

27. Do not make unsupported claims such as guaranteed opening hours,
exact current ticket prices, availability or reservation status.

28. Keep activity types simple and consistent.

Preferred types:
"attraction"
"museum"
"restaurant"
"food"
"nature"
"beach"
"shopping"
"nightlife"
"culture"
"neighborhood"

29. The summary should be approximately 1-2 sentences.

30. Do not include duplicate activity names anywhere in the itinerary.

OUTPUT RULES

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Do NOT include commentary before or after the JSON.

Use EXACTLY this structure:

{
  "destination": "City, Country",
  "summary": "Short description of the trip",
  "estimatedTotalCost": 0,
  "days": [
    {
      "day": 1,
      "title": "Short descriptive title",
      "estimatedCost": 0,
      "activities": [
        {
          "time": "09:00",
          "name": "Specific real place name",
          "type": "attraction",
          "description": "Short useful description",
          "estimatedCost": 25
        },
        {
          "time": "13:00",
          "name": "Specific real restaurant name",
          "type": "restaurant",
          "description": "Short useful description",
          "estimatedCost": 40
        }
      ]
    }
  ]
}

IMPORTANT:

The application will calculate each day's estimatedCost and
estimatedTotalCost itself.

Still provide estimatedCost for EVERY activity.

Before returning the JSON, silently check:
- every requested day exists
- each day has 3 to 5 activities
- there are no duplicate places
- times are sensible
- nearby places are grouped together
- every activity has a numeric estimatedCost
- restaurant costs represent all ${travelerCount} travelers
- the combined estimated activity and food costs should preferably be
  between €${minimumBudgetTarget} and €${maximumBudgetTarget}
- if the total is below €${minimumBudgetTarget}, check whether worthwhile
  real experiences can be added or upgraded before finalizing
- aim close to €${idealBudgetTarget} when doing so is realistic
- never inflate prices or invent spending just to hit the target
- never exceed the €${totalBudget} total budget
- the JSON is valid
`;

    const ollamaResponse = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen3:4b",
          prompt,
          stream: false,
          format: "json",
          think: false,
          options: {
            temperature: 0.2,
            num_predict: 3000,
          },
        }),
      }
    );

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();

      console.error(
        "Ollama error:",
        ollamaResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          error: `Ollama failed with status ${ollamaResponse.status}.`,
        },
        { status: 500 }
      );
    }

    const ollamaData = await ollamaResponse.json();

    if (!ollamaData.response) {
      console.error("Empty Ollama response:", ollamaData);

      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 500 }
      );
    }

    let trip;

    try {
      trip = JSON.parse(ollamaData.response);
    } catch (parseError) {
      console.error("Invalid JSON from Ollama:");
      console.error(ollamaData.response);
      console.error(parseError);

      return NextResponse.json(
        {
          error: "AI returned invalid JSON. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!trip || !Array.isArray(trip.days)) {
      console.error("Invalid trip structure:", trip);

      return NextResponse.json(
        {
          error: "AI returned an invalid trip structure.",
        },
        { status: 500 }
      );
    }

    let totalCost = 0;

    for (const day of trip.days) {
      let dayCost = 0;

      for (const activity of day.activities) {
        let cost = Number(activity.estimatedCost);

        if (!Number.isFinite(cost) || cost < 0) {
          cost = 0;
        }

        activity.estimatedCost =
          Math.round(cost * 100) / 100;

        dayCost += activity.estimatedCost;
      }

      day.estimatedCost =
        Math.round(dayCost * 100) / 100;

      totalCost += day.estimatedCost;
    }

    trip.estimatedTotalCost =
      Math.round(totalCost * 100) / 100;

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Generate trip error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate trip.",
      },
      { status: 500 }
    );
  }
}