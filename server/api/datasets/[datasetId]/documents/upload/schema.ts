import { z } from 'zod';


export const DocumentUploadForm = z.object({
  file: z.object({
    data: z.instanceof(Uint8Array).or(z.instanceof(Buffer)),
    name: z.string().optional(),
    filename: z.string().optional(),
    type: z.string().optional()
  }),
  fileName: z.string().min(1),
  fileType: z.string().min(3).optional(),
  fileExtension: z.string().min(1)
})