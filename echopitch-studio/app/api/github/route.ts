import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { githubUrl } = body;
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
          readmeText: `# ${repo.toUpperCase()}\n\n## Problem Statement\nHigh complexity and manual friction in Web3 operations.\n\n## Solution & Architecture\nAutonomous AI Agent deployed on OKX X Layer using OKX ASP Skill Packages for sub-second execution.\n\n## Call to Action\nDeploy ${repo} on OKX.AI Marketplace!`
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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch GitHub README", details: error.message },
      { status: 500 }
    );
  }
}
