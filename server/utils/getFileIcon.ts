const DEFAULT_FILE_ICON = "i-heroicons-document";

// Maps lowercase file extensions to icon names
const FILE_ICONS: Record<string, string> = {
  // Tabular data
  csv: "i-vscode-icons-file-type-csv",
  tsv: "i-vscode-icons-file-type-csv",
  xls: "i-vscode-icons-file-type-excel",
  xlsx: "i-vscode-icons-file-type-excel",
  parquet: "i-vscode-icons-file-type-parquet",
  sqlite: "i-vscode-icons-file-type-sqlite",
  db: "i-vscode-icons-file-type-sqlite",
  sql: "i-vscode-icons-file-type-sql",

  // Structured data and config
  json: "i-vscode-icons-file-type-json",
  jsonl: "i-vscode-icons-file-type-json",
  ndjson: "i-vscode-icons-file-type-json",
  xml: "i-vscode-icons-file-type-xml",
  yaml: "i-vscode-icons-file-type-yaml",
  yml: "i-vscode-icons-file-type-yaml",
  toml: "i-vscode-icons-file-type-toml",
  ini: "i-vscode-icons-file-type-ini",
  env: "i-vscode-icons-file-type-dotenv",

  // Scientific and medical data
  dcm: "i-vscode-icons-file-type-image",
  dicom: "i-vscode-icons-file-type-image",
  h5: "i-vscode-icons-file-type-binary",
  hdf5: "i-vscode-icons-file-type-binary",
  mat: "i-vscode-icons-file-type-matlab",
  ipynb: "i-vscode-icons-file-type-jupyter",
  npy: "i-vscode-icons-file-type-numpy",
  npz: "i-vscode-icons-file-type-numpy",

  // Documents
  md: "i-vscode-icons-file-type-markdown",
  txt: "i-vscode-icons-file-type-text",
  log: "i-vscode-icons-file-type-log",
  pdf: "i-vscode-icons-file-type-pdf2",
  doc: "i-vscode-icons-file-type-word",
  docx: "i-vscode-icons-file-type-word",
  ppt: "i-vscode-icons-file-type-powerpoint",
  pptx: "i-vscode-icons-file-type-powerpoint",
  rtf: "i-vscode-icons-file-type-text",
  tex: "i-vscode-icons-file-type-tex",
  html: "i-vscode-icons-file-type-html",
  htm: "i-vscode-icons-file-type-html",

  // Code
  py: "i-vscode-icons-file-type-python",
  r: "i-vscode-icons-file-type-r",
  rmd: "i-vscode-icons-file-type-rmd",
  m: "i-vscode-icons-file-type-matlab",
  js: "i-vscode-icons-file-type-js",
  ts: "i-vscode-icons-file-type-typescript",
  sh: "i-vscode-icons-file-type-shell",
  java: "i-vscode-icons-file-type-java",
  c: "i-vscode-icons-file-type-c",
  cpp: "i-vscode-icons-file-type-cpp",
  go: "i-vscode-icons-file-type-go",
  rs: "i-vscode-icons-file-type-rust",
  jl: "i-vscode-icons-file-type-julia",

  // Images
  png: "i-vscode-icons-file-type-image",
  jpg: "i-vscode-icons-file-type-image",
  jpeg: "i-vscode-icons-file-type-image",
  gif: "i-vscode-icons-file-type-image",
  bmp: "i-vscode-icons-file-type-image",
  tif: "i-vscode-icons-file-type-image",
  tiff: "i-vscode-icons-file-type-image",
  webp: "i-vscode-icons-file-type-image",
  svg: "i-vscode-icons-file-type-svg",

  // Audio and video
  mp3: "i-vscode-icons-file-type-audio",
  wav: "i-vscode-icons-file-type-audio",
  flac: "i-vscode-icons-file-type-audio",
  ogg: "i-vscode-icons-file-type-audio",
  mp4: "i-vscode-icons-file-type-video",
  mov: "i-vscode-icons-file-type-video",
  avi: "i-vscode-icons-file-type-video",
  mkv: "i-vscode-icons-file-type-video",
  webm: "i-vscode-icons-file-type-video",

  // Archives
  zip: "i-vscode-icons-file-type-zip",
  gz: "i-vscode-icons-file-type-zip",
  tgz: "i-vscode-icons-file-type-zip",
  tar: "i-vscode-icons-file-type-zip",
  bz2: "i-vscode-icons-file-type-zip",
  xz: "i-vscode-icons-file-type-zip",
  "7z": "i-vscode-icons-file-type-zip",
  rar: "i-vscode-icons-file-type-zip",
};

// Returns an icon name for a filename based on its extension
export const getFileIcon = (filename: string): string => {
  if (!filename.includes(".")) return DEFAULT_FILE_ICON;

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  return FILE_ICONS[extension] ?? DEFAULT_FILE_ICON;
};
