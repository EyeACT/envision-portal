
// TODO: Github action that computes in advance with queries as fallback if no results
export default defineEventHandler(async (event) => {

  // get amount of datasets published via EP vs Auto Indexed
  let publishedDatasets = await prisma.publishedDataset.findMany({
    include: {
      PublishedDatasetModality: true
    }
  })

  let manual = 0;
  let autoIndex = 0;
  let modalitiesToDatasetMap: Record<string, number> = {}

  for (const dataset of publishedDatasets) {
    if (dataset.automated) {
      autoIndex += 1;
    } else {
      manual += 1
    }

    // calculate amount of datasets per modality
    for (const modalityRecord of dataset.PublishedDatasetModality) {
      let modality = modalityRecord.modality;
      if (!modalitiesToDatasetMap[modality]) {
        modalitiesToDatasetMap[modality] = 0
      }
      modalitiesToDatasetMap[modality] += 1;
    }
  }


  return {
    manual,
    autoIndex,
    modalitiesToDatasetMap
  }
})