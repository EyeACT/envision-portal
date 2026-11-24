/**
 * Mock data for the discovery page while /api/discover/dataset does not yet
 * return modalities, image counts or facets. It takes the same query params
 * the page sends to the API, so swapping it out only touches the fetch call.
 */
import type {
  DiscoveryDatasetList,
  DiscoveryDatasetModality,
  DiscoveryDatasetResponse,
  DiscoveryFacets,
} from "#shared/types/dataset";
import { getModality } from "./modalities";

export interface DiscoveryQuery {
  page?: number;
  limit?: number;
  search?: string;
  keyword?: string;
  /** Comma-separated modality keys */
  modality?: string;
  modalityMatch?: "any" | "all";
  /** "true" = external only, "false" = Envision Portal only */
  external?: string;
  repository?: string;
  yearFrom?: number;
  yearTo?: number;
  minImages?: number;
  maxImages?: number;
  sort?: "relevance" | "newest" | "oldest" | "images" | "title";
}

// Small seeded PRNG so the mock data is the same on server and client.
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Seed = {
  title: string;
  description: string;
  keywords: string[];
  /** [modality key, approximate image count] */
  modalities: [string, number][];
  repository: "zenodo" | "figshare" | null;
  date: string;
  creators: string[];
  versions?: number;
  masks?: number;
};

const SEEDS: Seed[] = [
  {
    title: "Multimodal retinal imaging in type 2 diabetes",
    description:
      "Multimodal data from participants with and without type 2 diabetes, including retinal imaging across several devices, wearable sensor data, clinical measurements and survey responses, collected to support AI-driven research. Deposited directly on the Envision Portal.",
    keywords: ["type 2 diabetes", "retinal imaging", "multimodal", "AI-ready"],
    modalities: [
      ["color_fundus_photography", 41200],
      ["oct", 98400],
      ["octa", 22100],
      ["infrared_reflectance", 9600],
      ["fundus_autofluorescence", 1900],
    ],
    repository: null,
    date: "2026-05-14",
    creators: ["Envision Imaging Consortium"],
    versions: 3,
  },
  {
    title: "Retinal OCT images for classification of CNV, DME and drusen",
    description:
      "Labeled optical coherence tomography B-scans from adult patients, split into choroidal neovascularization, diabetic macular edema, drusen and normal classes for training deep learning classifiers.",
    keywords: ["oct", "cnv", "dme", "drusen", "deep learning"],
    modalities: [["oct", 109309]],
    repository: "zenodo",
    date: "2018-06-01",
    creators: ["Rivera A", "Okafor N", "Lindqvist E"],
    versions: 2,
  },
  {
    title: "Paired OCT and OCTA volumes of the macula in early glaucoma",
    description:
      "Macular OCT structural volumes and matching OCT angiography en face projections from eyes with early primary open-angle glaucoma and age-matched controls.",
    keywords: ["glaucoma", "octa", "macula", "vessel density"],
    modalities: [
      ["oct", 18400],
      ["octa", 6120],
    ],
    repository: "figshare",
    date: "2022-09-21",
    creators: ["Tanaka H", "Moreau C", "Haddad S"],
    masks: 400,
  },
  {
    title:
      "Fundus images with diabetic retinopathy grading from a screening programme",
    description:
      "Color fundus photographs graded for diabetic retinopathy severity on a five-level scale, with image quality labels, collected during community screening.",
    keywords: ["diabetic retinopathy", "fundus", "screening", "grading"],
    modalities: [["color_fundus_photography", 35126]],
    repository: "zenodo",
    date: "2021-03-08",
    creators: ["Kowalski P", "Nguyen T", "Fischer L"],
  },
  {
    title: "Ultra-widefield pseudocolor images of retinal detachment",
    description:
      "Ultra-widefield pseudocolor fundus images of rhegmatogenous retinal detachment, retinal tears and healthy retinas, annotated by retina specialists.",
    keywords: ["retinal detachment", "ultra-widefield", "pseudocolor"],
    modalities: [["pseudo_color_fundus", 3420]],
    repository: "figshare",
    date: "2023-11-02",
    creators: ["Mensah K", "Ortiz R"],
  },
  {
    title: "Fundus autofluorescence in geographic atrophy progression",
    description:
      "Longitudinal short-wavelength fundus autofluorescence images of eyes with geographic atrophy secondary to AMD, with lesion area segmentations at each visit.",
    keywords: ["geographic atrophy", "amd", "autofluorescence", "longitudinal"],
    modalities: [
      ["fundus_autofluorescence", 1240],
      ["infrared_reflectance", 1180],
    ],
    repository: "zenodo",
    date: "2024-02-19",
    creators: ["Shah P", "Brennan M", "Ivanova D"],
    masks: 1240,
  },
  {
    title: "Retinal vessel segmentation dataset with manual annotations",
    description:
      "High resolution color fundus images with manual vessel segmentations by two independent observers, intended as a benchmark for vessel segmentation methods.",
    keywords: ["vessel segmentation", "fundus", "benchmark"],
    modalities: [["color_fundus_photography", 450]],
    repository: "figshare",
    date: "2019-07-12",
    creators: ["Costa F", "Park J"],
    masks: 450,
  },
  {
    title: "Multi-device OCT of age-related macular degeneration",
    description:
      "OCT volumes acquired on three commercial devices from the same patients with intermediate and neovascular AMD, for studying domain shift between scanners.",
    keywords: ["amd", "oct", "domain shift", "multi-device"],
    modalities: [
      ["oct", 64300],
      ["infrared_reflectance", 2900],
    ],
    repository: "zenodo",
    date: "2025-01-27",
    creators: ["Adeyemi O", "Bauer K"],
    versions: 1,
  },
  {
    title: "OCTA en face images of diabetic eyes with capillary dropout labels",
    description:
      "Superficial and deep capillary plexus OCT angiography images from people with diabetes, with expert annotation of non-perfusion areas and the foveal avascular zone.",
    keywords: ["octa", "diabetes", "non-perfusion", "faz"],
    modalities: [["octa", 8840]],
    repository: "figshare",
    date: "2023-05-30",
    creators: ["Silva M", "Yamamoto R", "Dubois J"],
    masks: 2200,
  },
  {
    title: "Pediatric retinopathy of prematurity fundus images",
    description:
      "Wide-field fundus images from premature infants screened for retinopathy of prematurity, with zone, stage and plus disease labels.",
    keywords: ["rop", "pediatric", "fundus", "plus disease"],
    modalities: [["color_fundus_photography", 6004]],
    repository: "figshare",
    date: "2024-08-15",
    creators: ["Larsen I", "Chowdhury A"],
  },
  {
    title: "Infrared and OCT imaging in central serous chorioretinopathy",
    description:
      "Near-infrared reflectance images and corresponding OCT B-scans from acute and chronic central serous chorioretinopathy.",
    keywords: ["cscr", "infrared", "oct"],
    modalities: [
      ["oct", 2410],
      ["infrared_reflectance", 820],
    ],
    repository: "zenodo",
    date: "2022-04-04",
    creators: ["Novak T", "Ferreira B"],
  },
  {
    title: "Glaucoma fundus images with optic disc and cup segmentations",
    description:
      "Optic nerve head centered fundus photographs with glaucoma labels and optic disc and cup segmentations, assembled from several hospitals.",
    keywords: ["glaucoma", "optic disc", "cup-to-disc ratio", "segmentation"],
    modalities: [["color_fundus_photography", 2874]],
    repository: "zenodo",
    date: "2020-10-19",
    creators: ["Kim S", "Hughes E"],
    masks: 2874,
  },
  {
    title: "Envision pilot: OCT and fundus imaging in Alzheimer's disease",
    description:
      "Retinal imaging from participants with mild cognitive impairment, Alzheimer's disease and cognitively normal controls, shared through the Envision Portal with controlled access.",
    keywords: ["alzheimer's disease", "retinal biomarkers", "oct", "fundus"],
    modalities: [
      ["oct", 12800],
      ["color_fundus_photography", 3200],
      ["octa", 2400],
    ],
    repository: null,
    date: "2026-09-03",
    creators: ["Rossi G", "Abara U", "Weber H"],
    versions: 1,
  },
  {
    title: "Retinitis pigmentosa ultra-widefield and autofluorescence images",
    description:
      "Ultra-widefield pseudocolor and autofluorescence images of patients with genetically confirmed retinitis pigmentosa.",
    keywords: ["retinitis pigmentosa", "inherited retinal disease", "uwf"],
    modalities: [
      ["pseudo_color_fundus", 1960],
      ["fundus_autofluorescence", 640],
    ],
    repository: "figshare",
    date: "2025-06-11",
    creators: ["Rivera A", "Okafor N"],
  },
  {
    title: "OCT B-scans with retinal layer segmentations in multiple sclerosis",
    description:
      "Macular OCT scans from people with multiple sclerosis and healthy controls, with manual segmentation of nine retinal layer boundaries.",
    keywords: ["multiple sclerosis", "layer segmentation", "oct"],
    modalities: [["oct", 1470]],
    repository: "zenodo",
    date: "2019-02-25",
    creators: ["Lindqvist E", "Tanaka H", "Moreau C"],
    masks: 1470,
  },
  {
    title: "Smartphone fundus photographs for low-cost DR screening",
    description:
      "Fundus images captured with smartphone-based adapters in primary care settings, with referable diabetic retinopathy labels.",
    keywords: ["smartphone", "diabetic retinopathy", "low-cost", "fundus"],
    modalities: [["color_fundus_photography", 1890]],
    repository: "figshare",
    date: "2021-12-01",
    creators: ["Haddad S", "Kowalski P"],
  },
  {
    title: "Swept-source OCTA of choroidal neovascularization",
    description:
      "Swept-source OCT angiography volumes of treatment-naive and treated choroidal neovascularization, with lesion outlines.",
    keywords: ["cnv", "octa", "swept-source", "anti-vegf"],
    modalities: [
      ["octa", 5400],
      ["oct", 5400],
    ],
    repository: "zenodo",
    date: "2024-10-07",
    creators: ["Nguyen T", "Fischer L", "Mensah K"],
  },
  {
    title: "Myopic maculopathy fundus image collection",
    description:
      "Color fundus photographs of high myopia graded by the META-PM classification, including lacquer cracks and patchy atrophy.",
    keywords: ["myopia", "pathologic myopia", "fundus"],
    modalities: [["color_fundus_photography", 2260]],
    repository: "zenodo",
    date: "2023-03-14",
    creators: ["Ortiz R", "Shah P"],
  },
  {
    title: "Infrared fundus images from scanning laser ophthalmoscopy",
    description:
      "Confocal scanning laser ophthalmoscopy infrared images from routine clinical visits, de-identified and released for self-supervised pretraining.",
    keywords: ["slo", "infrared", "pretraining"],
    modalities: [["infrared_reflectance", 4180]],
    repository: "figshare",
    date: "2025-09-22",
    creators: ["Brennan M", "Ivanova D"],
  },
  {
    title: "Uveitis OCT and fundus imaging dataset",
    description:
      "OCT and color fundus images from patients with anterior, intermediate and posterior uveitis, with vitreous haze and macular edema grading.",
    keywords: ["uveitis", "vitreous haze", "macular edema"],
    modalities: [
      ["oct", 3600],
      ["color_fundus_photography", 980],
    ],
    repository: "figshare",
    date: "2026-02-10",
    creators: ["Costa F", "Park J"],
  },
  {
    title: "Envision demo: Healthy eye imaging reference set",
    description:
      "Reference retinal images from healthy volunteers across age groups, deposited on the Envision Portal as a normative baseline.",
    keywords: ["normative", "healthy", "reference"],
    modalities: [],
    repository: null,
    date: "2026-10-28",
    creators: ["FAIR Data Innovations Hub"],
  },
  {
    title: "Retinal images of sickle cell retinopathy",
    description:
      "Ultra-widefield pseudocolor images and OCT scans of patients with sickle cell disease, with peripheral non-perfusion labels.",
    keywords: ["sickle cell", "retinopathy", "ultra-widefield"],
    modalities: [
      ["pseudo_color_fundus", 1220],
      ["oct", 860],
    ],
    repository: "zenodo",
    date: "2022-07-18",
    creators: ["Adeyemi O", "Bauer K"],
  },
  {
    title: "Hypertensive retinopathy fundus images",
    description:
      "Fundus photographs annotated for arteriovenous nicking, hemorrhages and cotton wool spots in patients with systemic hypertension.",
    keywords: ["hypertension", "fundus", "retinopathy"],
    modalities: [["color_fundus_photography", 712]],
    repository: "figshare",
    date: "2017-11-09",
    creators: ["Silva M"],
  },
  {
    title: "Stargardt disease autofluorescence and OCT",
    description:
      "Fundus autofluorescence and OCT images from patients with ABCA4-associated Stargardt disease, with atrophy segmentations.",
    keywords: ["stargardt", "abca4", "autofluorescence"],
    modalities: [
      ["fundus_autofluorescence", 980],
      ["oct", 2100],
    ],
    repository: "zenodo",
    date: "2025-04-01",
    creators: ["Yamamoto R", "Dubois J"],
    masks: 980,
  },
];

const buildMockDatasets = (): DiscoveryDatasetList[] => {
  const rand = mulberry32(2026);

  return SEEDS.map((seed, index) => {
    const modalities: DiscoveryDatasetModality[] = seed.modalities.map(
      ([key, count]) => {
        const def = getModality(key);
        const complete = rand() > 0.35;
        return {
          modality: key,
          label: def.label,
          fileCount: complete ? count : Math.round(count / 10) * 10,
          fileCountComplete: complete,
        };
      },
    );

    const ocular = modalities.reduce((n, m) => n + (m.fileCount ?? 0), 0);
    const external = seed.repository !== null;

    return {
      id: index + 1,
      canonicalId: null,
      datasetId: null,
      doi: external
        ? seed.repository === "zenodo"
          ? `10.5281/zenodo.${7000000 + index * 1379}`
          : `10.6084/m9.figshare.${21000000 + index * 4211}.v1`
        : `10.82914/envision.${index + 1}`,
      external,
      repository: seed.repository,
      title: seed.title,
      description: seed.description,
      versionTitle: String((seed.versions ?? 0) + 1),
      rights: [],
      registrationSource: external
        ? "Automatic Registration"
        : "Envision Portal",
      creators: seed.creators.map((name) => ({
        creatorName: name,
        nameType: "Personal",
        affiliation: [],
        nameIdentifier: [],
      })),
      keywords: seed.keywords,
      created: new Date(seed.date),
      versionCount: seed.versions ?? 0,
      labelingMethod: "",
      validationInfo: "",
      modalities,
      // Records usually hold some non-ocular images too
      imageFileCount: ocular ? Math.round(ocular * (1 + rand() * 0.25)) : null,
      maskFileCount: seed.masks ?? 0,
    };
  });
};

let cache: DiscoveryDatasetList[] | null = null;
const allDatasets = () => (cache ??= buildMockDatasets());

type FacetKey = "modality" | "origin" | "repository";

const matches = (
  d: DiscoveryDatasetList,
  q: DiscoveryQuery,
  skip?: FacetKey,
): boolean => {
  if (q.search) {
    const term = q.search.toLowerCase();
    const haystack = [d.title, d.description, ...d.keywords]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  if (q.keyword) {
    const term = q.keyword.toLowerCase();
    if (!d.keywords.some((k) => k.toLowerCase().includes(term))) return false;
  }

  if (skip !== "modality" && q.modality) {
    const wanted = q.modality.split(",").filter(Boolean);
    const present = new Set(d.modalities?.map((m) => m.modality));
    const ok =
      q.modalityMatch === "all"
        ? wanted.every((m) => present.has(m))
        : wanted.some((m) => present.has(m));
    if (!ok) return false;
  }

  if (skip !== "origin" && skip !== "repository") {
    if (q.external === "true" && !d.external) return false;
    if (q.external === "false" && d.external) return false;
  }

  if (skip !== "repository" && q.repository && d.repository !== q.repository)
    return false;

  const year = new Date(d.created).getFullYear();
  if (q.yearFrom && year < q.yearFrom) return false;
  if (q.yearTo && year > q.yearTo) return false;

  const images = d.imageFileCount ?? 0;
  if (q.minImages !== undefined && images < q.minImages) return false;
  if (q.maxImages !== undefined && images > q.maxImages) return false;

  return true;
};

const sorters: Record<
  NonNullable<DiscoveryQuery["sort"]>,
  (a: DiscoveryDatasetList, b: DiscoveryDatasetList) => number
> = {
  relevance: (a, b) => (b.imageFileCount ?? 0) - (a.imageFileCount ?? 0),
  newest: (a, b) => +new Date(b.created) - +new Date(a.created),
  oldest: (a, b) => +new Date(a.created) - +new Date(b.created),
  images: (a, b) => (b.imageFileCount ?? 0) - (a.imageFileCount ?? 0),
  title: (a, b) => a.title.localeCompare(b.title),
};

export const queryMockDatasets = async (
  q: DiscoveryQuery,
): Promise<DiscoveryDatasetResponse> => {
  // Simulate network latency so loading states can be seen
  await new Promise((resolve) => setTimeout(resolve, 250));

  const all = allDatasets();
  const filtered = all
    .filter((d) => matches(d, q))
    .sort(sorters[q.sort ?? "relevance"]);

  // Each facet counts results with every other filter applied
  const facets: DiscoveryFacets = {
    modality: {},
    origin: { envision: 0, external: 0 },
    repository: {},
  };
  for (const d of all) {
    if (matches(d, q, "modality")) {
      for (const m of d.modalities ?? []) {
        facets.modality[m.modality] = (facets.modality[m.modality] ?? 0) + 1;
      }
    }
    if (matches(d, q, "origin")) {
      facets.origin[d.external ? "external" : "envision"]++;
    }
    if (matches(d, q, "repository") && d.repository) {
      facets.repository[d.repository] =
        (facets.repository[d.repository] ?? 0) + 1;
    }
  }

  const page = q.page ?? 1;
  const limit = q.limit ?? 10;

  return {
    data: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    facets,
    summary: {
      datasets: all.length,
      images: all.reduce(
        (n, d) =>
          n + (d.modalities ?? []).reduce((s, m) => s + (m.fileCount ?? 0), 0),
        0,
      ),
      repositories: new Set(all.map((d) => d.repository ?? "envision")).size,
    },
  };
};
