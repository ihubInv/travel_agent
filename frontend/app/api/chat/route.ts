import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const prompt = messages
    .map((message: any) => {
      return `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`
    })
    .join("\n")

  const systemPrompt = `You are an AI flight booking assistant. You help users find flights, answer travel-related questions, and provide information about destinations.
  
  Be friendly, helpful, and concise in your responses. If the user asks about booking a flight, ask for details like origin, destination, dates, and preferences.
  
  For this demo, you can simulate flight searches and bookings without actually making real reservations.`

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt,
  })

  return result.toDataStreamResponse()
}

