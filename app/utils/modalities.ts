export interface ModalityDefinition {
  /** Matches PublishedDatasetModality.modality */
  key: string;
  short: string;
  label: string;
  /** Tailwind classes. Kept as literal strings so Tailwind picks them up. */
  dot: string;
  chip: string;
}

// The six classes detected by the image classifier, ordered by how common
// they are across the discovered datasets.
export const MODALITIES: ModalityDefinition[] = [
  {
    key: "oct",
    short: "OCT",
    label: "Optical coherence tomography",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800",
  },
  {
    key: "color_fundus_photography",
    short: "CFP",
    label: "Color fundus photography",
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-800",
  },
  {
    key: "octa",
    short: "OCTA",
    label: "OCT angiography",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800",
  },
  {
    key: "infrared_reflectance",
    short: "IR",
    label: "Infrared reflectance",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800",
  },
  {
    key: "pseudo_color_fundus",
    short: "UWF-PC",
    label: "Ultra-widefield pseudocolor",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  },
  {
    key: "fundus_autofluorescence",
    short: "FAF",
    label: "Fundus autofluorescence",
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  },
];

const FALLBACK: Omit<ModalityDefinition, "key" | "label" | "short"> = {
  dot: "bg-zinc-400",
  chip: "bg-zinc-50 text-zinc-700 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700",
};

export const getModality = (key: string): ModalityDefinition =>
  MODALITIES.find((m) => m.key === key) ?? {
    ...FALLBACK,
    key,
    short: key.toUpperCase(),
    label: key,
  };

export const REPOSITORIES: Record<string, { label: string; icon: string }> = {
  zenodo: { label: "Zenodo", icon: "i-lucide-database" },
  figshare: { label: "Figshare", icon: "i-lucide-share-2" },
};
