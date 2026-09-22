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

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert travel planner.

Create a realistic trip itinerary using the following information:

Destination: ${destination}
Start date: ${startDate}
End date: ${endDate}
Total budget: €${budget}
Travelers: ${travelers}
Interests: ${interests.join(", ")}

Create a day-by-day itinerary.

Important rules:
- Create an itinerary for EVERY calendar day from the start date through the end date, inclusive.
- Do not skip any day.
- Include 3 to 5 activities per day.
- Include sightseeing, activities and restaurants based on the user's interests.
- Choose places that actually exist.
- Group nearby places together when possible.
- Stay reasonably within the user's total budget.
- Do not include flights or accommodation in the budget.
- estimatedCost must be a NUMBER in euros, never a string.
- Free activities must have estimatedCost: 0.
- Give a realistic estimated cost in euros for EVERY activity.
- estimatedCost must always be a NUMBER.
- Use estimatedCost: 0 ONLY when the activity is genuinely free.
- For restaurants and food stops, estimate a realistic cost per person and multiply it by the number of travelers.
- For paid attractions, estimate the ticket cost and multiply it by the number of travelers.
- The itinerary should fit reasonably within the user's total budget.
- Do not invent generic places such as "Rome's Best Pizza" or "Rome's Best Pasta". Use specific real place names.
- estimatedTotalCost and each day's estimatedCost will be calculated by the application.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not add explanations outside the JSON.

Use exactly this JSON structure:

{
  "destination": "City, Country",
  "summary": "Short description of the trip",
  "estimatedTotalCost": 0,
  "days": [
    {
      "day": 1,
      "title": "Short title",
      "estimatedCost": 0,
      "activities": [
        {
          "time": "09:00",
          "name": "Real place name",
          "type": "attraction",
          "description": "Short description",
          "estimatedCost": 25
        },
        {
          "time": "13:00",
          "name": "Real restaurant name",
          "type": "restaurant",
          "description": "Short description",
          "estimatedCost": 40
        }
      ]
    }
  ]
}
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
            temperature: 0.3,
            num_predict: 2500,
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
        {
          status: 500,
        }
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
        {
          status: 500,
        }
      );
    }

    // Calculate daily costs and total cost ourselves
    let totalCost = 0;

    for (const day of trip.days) {
      let dayCost = 0;

      for (const activity of day.activities) {
        const cost = Number(activity.estimatedCost) || 0;
        dayCost += cost;
      }

      day.estimatedCost = dayCost;
      totalCost += dayCost;
    }

    trip.estimatedTotalCost = totalCost;

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Generate trip error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate trip.",
      },
      {
        status: 500,
      }
    );
  }
}