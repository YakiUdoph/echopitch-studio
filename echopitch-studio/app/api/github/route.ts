import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const githubUrl = typeof body === "object" && body !== null && "githubUrl" in body
      ? (body as { githubUrl?: unknown }).githubUrl
      : undefined;
    if (!githubUrl || typeof githubUrl !== "string") {
      return NextResponse.json({ error: "Missing githubUrl parameter" }, { status: 400 });
    }

    // Clean URL to extract owner/repo
    const cleaned = githubUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const parts = cleaned.split("/");
    if (parts.length < 2) {
      return NextResponse.json({ error: "Invalid GitHub repository format (expected owner/repo)" }, { status: 400 });
    }

    const owner = parts[0];
    const repo = parts[1];

    // Try fetching main branch first, then master branch
    let rawResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
    if (!rawResponse.ok) {
      rawResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
    }

    if (!rawResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          owner,
          repo,
          message: "Could not fetch README.md directly from main or master branch. Provided fallback template.",
          readmeText: `# ${repo.toUpperCase()}\n\n## Problem Statement\nComplex products are difficult to explain clearly in a short demo.\n\n## Solution & Architecture\nEchoPitch turns repository context into a structured storyboard, timed narration, and exportable pitch assets.\n\n## Call to Action\nCreate a concise, high-impact demo for ${repo}.`
        },
        { status: 200 }
      );
    }

    const readmeText = await rawResponse.text();

    return NextResponse.json(
      {
        success: true,
        owner,
        repo,
        readmeText,
        charCount: readmeText.length
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch GitHub README", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
