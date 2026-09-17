export interface document {
  id: string
  datasetId: string
  storagePath: string
  originalName: string
  sanitizedName: string
  documentType: string
  mimeType: string
  created: string
  size: BigInt
}