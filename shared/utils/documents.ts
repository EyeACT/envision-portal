import sanitize from "sanitize-filename"


export const sanitizeFileName = (fileName: string) => {
  let sanitizedName = sanitize(fileName)

  if (!sanitizedName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot upload file"
    })
  }

  // replace symbols and spaces with dashes
  sanitizedName = sanitizedName.replace(/[^a-zA-Z0-9\(\)\.]/g, "-")


  return sanitizedName

}

export const shouldRename = (documentName: string) => {
  return sanitizeFileName(documentName) !== documentName
}