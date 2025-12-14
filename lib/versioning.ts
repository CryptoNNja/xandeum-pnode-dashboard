export interface VersionFamily {
  id: string;
  label: string;
  color: string;
  matchers?: RegExp[];
}

const HERRENBERG: VersionFamily = {
  id: "v0_4_herrenberg",
  label: "v0.4 Herrenberg",
  color: "#38BDF8",
  matchers: [/^v?0\.4(\.|$)/i],
};

const INGOLSTADT: VersionFamily = {
  id: "v0_5_ingolstadt",
  label: "v0.5 Ingolstadt",
  color: "#F472B6",
  matchers: [/^v?0\.5(\.|$)/i],
};

const STUTTGART: VersionFamily = {
  id: "v0_6_stuttgart",
  label: "v0.6 Stuttgart",
  color: "#7B3FF2",
  matchers: [/^v?0\.6(\.|$)/i],
};

const PRIVATE_FAMILY: VersionFamily = {
  id: "private",
  label: "Private (Hidden)",
  color: "#475569",
};

const UNVERIFIED_FAMILY: VersionFamily = {
  id: "unverified",
  label: "Unverified Build",
  color: "#94A3B8",
};

export const VERSION_FAMILY_REGISTRY: VersionFamily[] = [
  HERRENBERG,
  INGOLSTADT,
  STUTTGART,
  PRIVATE_FAMILY,
  UNVERIFIED_FAMILY,
];

export function normalizeVersionLabel(
  rawVersion: string | undefined
): string | undefined {
  if (!rawVersion) return undefined;
  const trimmed = rawVersion.trim();
  if (!trimmed || /^unknown$/i.test(trimmed)) return undefined;
  const normalized = trimmed.replace(/^V/, "v");
  return normalized.startsWith("v") ? normalized : `v${normalized}`;
}

export function mapVersionToFamily(
  rawVersion: string | undefined,
  isPrivate: boolean
): VersionFamily {
  const normalized = normalizeVersionLabel(rawVersion);

  if (normalized) {
    for (const family of VERSION_FAMILY_REGISTRY) {
      if (!family.matchers) continue;
      if (family.matchers.some((regex) => regex.test(normalized))) {
        return family;
      }
    }
  }

  if (isPrivate && !normalized) {
    return PRIVATE_FAMILY;
  }

  return UNVERIFIED_FAMILY;
}
