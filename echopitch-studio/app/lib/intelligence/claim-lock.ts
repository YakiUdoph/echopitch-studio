import type { CandidateClaim, ClaimLockResult, RepositoryEvidence, RepositoryIntelligence, VerifiedClaim } from "./types.ts";

const weakWords = new Set(["about", "after", "also", "from", "into", "that", "their", "there", "these", "this", "through", "using", "with", "provides", "implements", "repository", "product"]);

export function candidateClaimsFromIntelligence(intelligence: RepositoryIntelligence, additionalClaims: string[] = []): CandidateClaim[] {
  const metadataId = intelligence.evidence.find((item) => item.kind === "metadata")?.id;
  const candidates: CandidateClaim[] = [
    {
      id: "claim_identity",
      claim: `${intelligence.productName} is the product represented by ${intelligence.repository.owner}/${intelligence.repository.name}.`,
      evidenceIds: metadataId ? [metadataId] : [],
      source: "identity"
    }
  ];

  if (intelligence.problem !== "Insufficient evidence.") {
    candidates.push({ id: "claim_problem", claim: intelligence.problem, source: "problem" });
  }
  for (const item of intelligence.capabilities) {
    candidates.push({ id: `claim_${item.id}`, claim: item.description, evidenceIds: item.evidenceIds, source: "capability" });
  }
  for (const item of intelligence.technicalMechanisms) {
    candidates.push({ id: `claim_${item.id}`, claim: item.description, evidenceIds: item.evidenceIds, source: "mechanism" });
  }
  for (const item of intelligence.differentiators) {
    candidates.push({ id: `claim_${item.id}`, claim: item.description, evidenceIds: item.evidenceIds, source: "differentiator" });
  }
  additionalClaims.forEach((claim, index) => candidates.push({ id: `claim_external_${index + 1}`, claim, source: "external" }));
  return candidates;
}

export function applyClaimLock(intelligence: RepositoryIntelligence, candidates: CandidateClaim[]): ClaimLockResult {
  const evidenceById = new Map(intelligence.evidence.map((item) => [item.id, item]));
  const claims = candidates.map((candidate) => verifyClaim(candidate, intelligence.evidence, evidenceById));
  return {
    claims,
    allowedClaimIds: claims.filter((claim) => claim.status === "SUPPORTED" && claim.allowedNarration).map((claim) => claim.id),
    blockedClaimIds: claims.filter((claim) => claim.status !== "SUPPORTED" || !claim.allowedNarration).map((claim) => claim.id)
  };
}

function verifyClaim(candidate: CandidateClaim, allEvidence: RepositoryEvidence[], evidenceById: Map<string, RepositoryEvidence>): VerifiedClaim {
  const linked = (candidate.evidenceIds || []).map((id) => evidenceById.get(id)).filter((item): item is RepositoryEvidence => Boolean(item));
  const discovered = linked.length > 0 ? linked : findRelevantEvidence(candidate.claim, allEvidence);
  const implementationEvidence = discovered.filter((item) => !["documentation", "metadata"].includes(item.kind));
  const documentationEvidence = discovered.filter((item) => item.kind === "documentation");

  if (candidate.source === "identity" && discovered.some((item) => item.kind === "metadata")) {
    return verdict(candidate, "SUPPORTED", discovered, "Repository identity is confirmed by GitHub metadata.", 0.99, candidate.claim);
  }
  if (implementationEvidence.length > 0) {
    const confidence = Math.min(0.98, 0.78 + implementationEvidence.length * 0.06);
    return verdict(candidate, "SUPPORTED", discovered, "Implementation or configuration evidence directly supports this conservative statement.", confidence, candidate.claim);
  }
  if (documentationEvidence.length > 0 || candidate.source === "problem") {
    return verdict(candidate, "PARTIAL", discovered, "The statement appears only in documentation or marketing context and lacks independent implementation evidence; it is blocked from narration.", 0.5);
  }
  return verdict(candidate, "UNSUPPORTED", [], "Insufficient evidence.", 0.05);
}

function findRelevantEvidence(claim: string, evidence: RepositoryEvidence[]): RepositoryEvidence[] {
  const claimTerms = terms(claim);
  if (claimTerms.size === 0) return [];
  return evidence.filter((item) => {
    const evidenceTerms = terms(`${item.path} ${item.excerpt} ${item.reason}`);
    let overlap = 0;
    for (const term of claimTerms) if (evidenceTerms.has(term)) overlap++;
    return overlap >= Math.min(2, claimTerms.size);
  }).slice(0, 4);
}

function terms(value: string): Set<string> {
  return new Set((value.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []).filter((word) => !weakWords.has(word)));
}

function verdict(
  candidate: CandidateClaim,
  status: VerifiedClaim["status"],
  evidence: RepositoryEvidence[],
  reason: string,
  confidence: number,
  allowedNarration?: string
): VerifiedClaim {
  return { id: candidate.id, claim: candidate.claim, status, evidence, reason, confidence, allowedNarration };
}
