export const repositorySources = [
  {name: "figshare", icon: "i-lucide-network", color: "bg-gray-200 text-gray-800"},
  {name: "zenodo", icon: "i-lucide-database", color: "bg-gray-200 text-gray-800"},
  {name: "kaggle", icon: "i-lucide-letter-k", color: "bg-gray-200 text-gray-800"},
  {name: "", icon: "i-lucide-eye", color: "bg-green-50 text-green-600 border-green-200"},
  {name: "datacite", icon: "i-lucide-hard-drive", color: "bg-gray-200 text-gray-800"},
  {name: "dryad", icon: "i-lucide-tree-deciduous", color: "bg-gray-200 text-gray-800"},
  {name: "osf", icon: "i-lucide-diamond", color: "bg-gray-200 text-gray-800"},

]

// Okabe–Ito palette: stays distinct under common color vision deficiencies
export const modalities: {
  longLabel: string;
  shortLabel: string;
  value: string;
  color: string;
}[] = [
  { longLabel: "Optical coherence tomography", shortLabel: "OCT", value: "oct", color: "#D55E00" },
  { longLabel: "OCT Angiography", shortLabel: "OCTA", value: "octa", color: "#0072B2" },
  { longLabel: "Fundus Autofluorescence", shortLabel: "FA", value: "fundus_autofluorescence", color: "#E69F00" },
  { longLabel: "Pseudo Color Fundus", shortLabel: "PCF", value: "pseudo_color_fundus", color: "#CC79A7" },
  { longLabel: "Infrared reflectance", shortLabel: "IR", value: "infrared_reflectance", color: "#56B4E9" },
  { longLabel: "Color Fundus Photography", shortLabel: "CFP", value: "color_fundus_photography", color: "#009E73" },
];