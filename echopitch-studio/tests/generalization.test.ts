import assert from "node:assert/strict";
import test from "node:test";
import { applyClaimLock, candidateClaimsFromIntelligence } from "../app/lib/intelligence/claim-lock.ts";
import { selectUsefulRepositoryFiles, type CollectedFile, type CollectedRepository, type GitTreeItem } from "../app/lib/intelligence/github.ts";
import { analyzeCollectedRepository } from "../app/lib/intelligence/repository-intelligence.ts";
import { createStoryManifest } from "../app/lib/intelligence/story-manifest.ts";
import { createMediaPlan } from "../app/lib/production/director.ts";

type Shape = {
  name: string;
  files: Array<[path: string, content: string, kind?: CollectedFile["kind"]]>;
  expectedCapability?: string;
};

const shapes: Shape[] = [
  { name: "TypeScript/JavaScript library", files: [["lib/request.js", "export const load = url => fetch(url)"]], expectedCapability: "cap_http-client" },
  { name: "frontend application", files: [["ui/App.jsx", "import React, { useState } from 'react'; export default function App(){ const [open] = useState(false); return <button>{open}</button> }"]], expectedCapability: "cap_web-ui" },
  { name: "backend/API application", files: [["service/views.py", "from fastapi import APIRouter\nrouter = APIRouter()\n@router.get('/health')\ndef health(): return {'ok': True}"]], expectedCapability: "cap_http-api" },
  { name: "Python project", files: [["cli.py", "import argparse\nif __name__ == '__main__': argparse.ArgumentParser()"]], expectedCapability: "cap_cli" },
  { name: "Go project", files: [["main.go", "package main\nfunc main() {}"]], expectedCapability: "cap_application-entrypoint" },
  { name: "Java/Kotlin project", files: [["Application.kt", "class Application { companion object { @JvmStatic fun main(args: Array<String>) {} } }"], ["Controller.java", "@RestController public class Controller { @GetMapping public String get(){ return \"ok\"; } }"]], expectedCapability: "cap_http-api" },
  { name: "Rust project", files: [["main.rs", "fn main() { println!(\"ready\"); }"]], expectedCapability: "cap_application-entrypoint" },
  { name: "mixed-language repository", files: [["cmd/api/main.go", "package main\nfunc main() {}"], ["clients/sdk.rs", "pub fn request() { reqwest::get(\"https://example.test\"); }"]], expectedCapability: "cap_http-client" },
  { name: "monorepo", files: [["packages/web/App.tsx", "export default function App(){ return <button onClick={()=>{}}>Go</button> }"], ["services/api/server.js", "app.get('/health', handler)"]], expectedCapability: "cap_web-ui" },
  { name: "nested source tree", files: [["products/service/internal/cmd/main.go", "package main\nfunc main() {}"]], expectedCapability: "cap_application-entrypoint" },
  { name: "repository without package.json", files: [["tools/runner.py", "import argparse\nif __name__ == '__main__': argparse.ArgumentParser()"]], expectedCapability: "cap_cli" },
  { name: "repository without src directory", files: [["server.js", "export async function GET() { return fetch('https://example.test') }"]], expectedCapability: "cap_http-client" },
  { name: "sparse valid implementation", files: [["Main.java", "public class Main { public static void main(String[] args) {} }"]], expectedCapability: "cap_application-entrypoint" },
  { name: "README-heavy repository", files: [["README.md", "# Tool\n\nLong documentation for developers explaining a deliberately documented product.\n\n## Usage\nLots more prose."], ["bin/tool.py", "import argparse\nargparse.ArgumentParser()"]], expectedCapability: "cap_cli" },
  { name: "README marketing unsupported by code", files: [["README.md", "# Rocket\n\nThe fastest autonomous platform ever built."], ["main.py", "if __name__ == '__main__': print('ready')"]], expectedCapability: "cap_application-entrypoint" },
  { name: "insufficient implementation evidence", files: [["README.md", "# Vaporware\n\nThe fastest autonomous platform ever built.", "documentation"]] }
  ,{ name: "unusual executable entrypoint", files: [["ops/launch/Application.java", "public class Application { public static void main(String[] args) {} }"]], expectedCapability: "cap_application-entrypoint" }
  ,{ name: "API/schema-heavy repository", files: [["api/schema.graphql", "type Query { health: String }"], ["api/handler.ts", "export async function POST() { return new Response('ok') }"]], expectedCapability: "cap_typed-models" }
];

test("bounded collector selection recognizes multiple ecosystems and unusual directories", () => {
  const paths = [
    "tools/runner.py", "Main.java", "backend/Program.cs", "crates/worker/main.rs",
    "services/api/pom.xml", "mobile/build.gradle.kts", "docs/architecture.md", "web/package.json"
  ];
  const tree: GitTreeItem[] = paths.map((path, index) => ({ path, type: "blob", size: 100 + index, url: `https://api.example/${index}` }));
  tree.push({ path: "assets/demo.png", type: "blob", size: 100, url: "https://api.example/image" });
  const selected = selectUsefulRepositoryFiles(tree, 18).map((item) => item.path);
  paths.forEach((path) => assert.ok(selected.includes(path), `${path} should be selected`));
  assert.ok(!selected.includes("assets/demo.png"));
});

for (const shape of shapes) {
  test(`repository generalization matrix: ${shape.name}`, () => {
    const intelligence = analyzeCollectedRepository(repository(shape.name, shape.files));
    if (shape.expectedCapability) {
      const ids = [...intelligence.capabilities, ...intelligence.technicalMechanisms].map((item) => item.id);
      assert.ok(ids.includes(shape.expectedCapability), `${shape.expectedCapability} was not derived from ${shape.name}`);
    } else {
      assert.equal(intelligence.capabilities.length, 0);
      assert.match(intelligence.limitations.join(" "), /Insufficient non-documentation evidence/);
    }
    const lock = applyClaimLock(intelligence, candidateClaimsFromIntelligence(intelligence));
    const manifest = createStoryManifest(intelligence, lock, "Hackathon judges", "Hackathon pitch", 60);
    assert.equal(manifest.targetDuration, 60);
    assert.equal(new Set(manifest.scenes.flatMap((scene) => scene.claimIds)).size, manifest.scenes.flatMap((scene) => scene.claimIds).length);
    const context = { intelligence, claimLock: lock, manifest };
    assert.equal(createMediaPlan(context).length, manifest.scenes.length);
    assert.doesNotMatch(JSON.stringify(context), /sindresorhus|YakiUdoph|GreenRoom|\/ky\b/i);
  });
}

test("README marketing remains blocked without implementation evidence", () => {
  const intelligence = analyzeCollectedRepository(repository("unsupported-readme", [["README.md", "# Rocket\n\nThe fastest analytics engine in the world.", "documentation"]]));
  const lock = applyClaimLock(intelligence, [{
    id: "marketing", claim: "The fastest analytics engine in the world.", source: "differentiator",
    evidenceIds: [intelligence.evidence.find((item) => item.path === "README.md")?.id || "missing"]
  }]);
  assert.equal(lock.claims[0].status, "PARTIAL");
  assert.deepEqual(lock.allowedClaimIds, []);
});

test("Story Director uses each supported claim at most once instead of padding scenes", () => {
  const intelligence = analyzeCollectedRepository(repository("small-tool", [["tools/main.py", "import argparse\nif __name__ == '__main__': argparse.ArgumentParser()"]]));
  const lock = applyClaimLock(intelligence, candidateClaimsFromIntelligence(intelligence));
  const manifest = createStoryManifest(intelligence, lock, "Developers", "Technical walkthrough", 120);
  const claimIds = manifest.scenes.flatMap((scene) => scene.claimIds);
  assert.equal(manifest.scenes.length, lock.allowedClaimIds.length);
  assert.equal(new Set(claimIds).size, claimIds.length);
  assert.equal(manifest.targetDuration, 120);
  assert.ok(manifest.scenes.reduce((sum, scene) => sum + scene.duration, 0) <= 15 * lock.allowedClaimIds.length);
});

function repository(name: string, values: Shape["files"]): CollectedRepository {
  return {
    owner: "fixture-owner", name: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    url: `https://github.com/fixture-owner/${name}`, defaultBranch: "main", description: "", language: "",
    limitations: [], files: values.map(([path, content, kind]) => ({
      path, content, kind: kind || (/readme/i.test(path) ? "documentation" : "source"), score: 1,
      url: `https://github.com/fixture-owner/repository/blob/main/${path}`
    }))
  };
}
