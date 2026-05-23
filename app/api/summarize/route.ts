import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { mode, content, url } = body as {
        mode: "note" | "url";
        content?: string;
        url?: string;
    };

    let textToSummarize = "";

    if (mode === "note") {
        if (!content?.trim()) {
            return new Response("No content provided", { status: 400 });
        }
        textToSummarize = content;
    } else if (mode === "url") {
        if (!url?.trim()) {
            return new Response("No URL provided", { status: 400 });
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return new Response("Invalid URL", { status: 400 });
        }

        // Only allow http/https
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return new Response("Invalid URL protocol", { status: 400 });
        }

        // Use Jina Reader to extract article text
        try {
            const jinaRes = await fetch(`https://r.jina.ai/${parsedUrl.toString()}`, {
                headers: { "Accept": "text/plain" },
                signal: AbortSignal.timeout(15_000),
            });

            if (!jinaRes.ok) {
                return new Response("Failed to fetch article", { status: 422 });
            }

            const text = await jinaRes.text();
            if (!text?.trim()) {
                return new Response("Could not extract article content", { status: 422 });
            }

            textToSummarize = text.trim().slice(0, 15_000);
        } catch {
            return new Response("Could not reach the URL", { status: 422 });
        }
    } else {
        return new Response("Invalid mode", { status: 400 });
    }

    const result = streamText({
        model: groq("llama-3.1-8b-instant"),
        system: "You are a concise summarizer. Produce clear, well-structured summaries in markdown format with bullet points for key takeaways.",
        prompt: `Summarize the following:\n\n${textToSummarize}`,
        maxOutputTokens: 512,
    });

    return result.toTextStreamResponse();
}
