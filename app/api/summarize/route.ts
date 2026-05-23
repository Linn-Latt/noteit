import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
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

        // Fetch the article server-side
        let html: string;
        try {
            const response = await fetch(parsedUrl.toString(), {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; NoteIt/1.0)",
                },
                signal: AbortSignal.timeout(10_000),
            });

            if (!response.ok) {
                return new Response("Failed to fetch article", { status: 422 });
            }

            html = await response.text();
        } catch {
            return new Response("Could not reach the URL", { status: 422 });
        }

        // Extract readable text using Readability 
        const dom = new JSDOM(html, { url: parsedUrl.toString() });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article?.textContent?.trim()) {
            return new Response("Could not extract article content", { status: 422 });
        }

        textToSummarize = article.textContent.trim().slice(0, 15_000);
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
