
// TODO: Github action that computes in advance with queries as fallback if no results
export default defineEventHandler(async (event) => {

  // get amount of datasets published via EP vs Auto Indexed
  let publishedDatasets = await prisma.publishedDataset.findMany({
    include: {
      PublishedDatasetModality: true,
      PublishedDatasetRegistrationDetails: true
    }
  })

  let manual = 0;
  let autoIndex = 0;
  let datasetsPerModality: Record<string, number> = {}
  let datasetsPerSource: Record<string, number> = {}
  let datasetsPerYear: Record<string, number> = {}

  for (const dataset of publishedDatasets) {
    if (dataset.automated) {
      autoIndex += 1;
    } else {
      manual += 1
    }

    // calculate amount of datasets per modality
    for (const modalityRecord of dataset.PublishedDatasetModality) {
      let modality = modalityRecord.modality;
      if (!datasetsPerModality[modality]) {
        datasetsPerModality[modality] = 0
      }
      datasetsPerModality[modality] += 1;
    }

    if(dataset.PublishedDatasetRegistrationDetails) {
      const source = dataset.PublishedDatasetRegistrationDetails.datasetSource;
      if(!datasetsPerSource[source]) {
        datasetsPerSource[source] = 0
      }
      datasetsPerSource[source] += 1;
    }

    if(dataset.created) {
      const isoDate = dataset.created.toISOString().slice(0,4)
      if(!datasetsPerYear[isoDate]) {
        datasetsPerYear[isoDate] = 0
      }
      datasetsPerYear[isoDate] += 1  
    }
  }

  const datasetsPublicationYearData = Object.entries(datasetsPerYear).map(
    ([year, datasets]) => {
      return {
        year: year, 
        datasets: datasets
      }
    }
  )


  return {
    manual,
    autoIndex,
    datasetsPerModality, 
    datasetsPerSource,
    datasetsPublicationYearData
  }
})