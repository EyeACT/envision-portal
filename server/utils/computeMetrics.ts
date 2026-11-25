import { PrismaClient } from "~~/shared/generated/client";
import {MetricsSnapshotPayload} from "#shared/types/metrics"

type MetadataWithRights = {
  datasetDescription?: {
    rights?: {
      rightsName?: string
    }[],
    publisher: {
      publisherName: string
    }
  }
}

const normalizedNamesEnum = {
  "CREATIVE_COMMONS_LICENSE": "creative commons license",
}
const creativeCommonsTokens = [
  "CC BY",
  "CC BY 4.0",
  "CC BY-NC 4.0",
  "CC BY-NC-SA 4.0",
  "CC BY-SA 4.0",
  "CC-BY",
  "Attribution 4.0 International (CC BY 4.0)",
  "Attribution-NonCommercial 3.0 Unported",
  "Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)",
  "Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)",
  "Creative Commons Attribution",
  "Creative Commons Attribution 4.0",
  "Creative Commons Attribution 4.0 International",
  "Creative Commons Attribution 4.0 International Public License",
  "Creative Commons Attribution No Derivatives 2.0 Generic",
  "Creative Commons Attribution Non Commercial 4.0 International",
  "Creative Commons Attribution Non Commercial No Derivatives 4.0 International",
  "Creative Commons Attribution Non Commercial Share Alike 4.0 International",
  "Creative Commons Attribution Share Alike 4.0 International",
  "Creative Commons Attribution Share-Alike 4.0",
  "Creative Commons Attribution-NonCommercial 4.0",
  "Creative Commons Zero v1.0 Universal",
  "cc-by-4.0",
  "cc-by-nc-4.0",
  "cc-by-nc-nd-4.0",
  "cc-by-sa-4.0",
  "cc-zero",
  "https://spdx.org/licenses/CC0-1.0.html"
]

const apacheTokens = [
  "Apache 2.0",
  "Apache License 2.0",
  "apache2.0"
]

const mitTokens = [
  "MIT",
  "MIT License",
  "mit-license"
]

const gnuTokens = [
  "GNU Affero General Public License 3.0",
  "GNU General Public License v3.0 or later",
  "GNU Lesser General Public License 3.0",
  "GPL 3",
  "GPL 3.0+"
]

const unknownOrNoLicenseTokens = [
  "No license available",
  "Unknown",
  "unknown"
]


export const computeSnapshot = async (client: PrismaClient = prisma) : Promise<MetricsSnapshotPayload> => {
  // get amount of datasets published via EP vs Auto Indexed
  let publishedDatasets = await client.publishedDataset.findMany({
    include: {
      PublishedDatasetModality: true,
      PublishedDatasetRegistrationDetails: true,
      PublishedDatasetFileSummary: true
    }
  })

  let manual = 0;
  let autoIndex = 0;
  let datasetsPerModality: Record<string, number> = {}
  let datasetsPerSource: Record<string, number> = {}
  let datasetsPerYear: Record<string, number> = {}
  let dois: number = 0;
  let licenses: Record<string, number> = {
    "unknown": 0
  }
  const publishers: Record<string,number> = {}


  for (const dataset of publishedDatasets) {
    if (dataset.automated) {
      autoIndex += 1;
    } else {
      manual += 1
    }

    if(dataset.doi) {
      dois += 1;
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

    const metadata = dataset.publishedMetadata as unknown as MetadataWithRights

    if(metadata?.datasetDescription?.rights?.some((right) => right.rightsName)) {
      for(const license of metadata.datasetDescription.rights) {
        let rightsName = license.rightsName
        if(!rightsName) {
          continue;
        }
        licenses[rightsName] = (licenses[rightsName] ?? 0) + 1;
      }
    } else {
      licenses["unknown"] = (licenses["unknown"] ?? 0) + 1;
    }


    if(metadata?.datasetDescription?.publisher?.publisherName) {
      const publisherName = metadata.datasetDescription.publisher.publisherName
      publishers[publisherName] = (publishers[publisherName] ?? 0 ) + 1
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

    const publishersData = Object.entries(publishers).map(
    ([publisher, datasets]) => {
      return {
        publisher: publisher, 
        datasets: datasets
      }
    }
  )

  const modalityData = Object.entries(datasetsPerModality).map(
    ([modality, datasets]) => {
      return {
        modality: modality.replaceAll("_", " "),
        datasets
      }
    })

  
  // merge same licenses that use different key names
  const groupedLicenses: Record<string, number> = {}
  for(const [license_name, lc] of Object.entries(licenses)) {
    if(creativeCommonsTokens.includes(license_name)) {
      groupedLicenses["cc-by"] = (groupedLicenses["cc-by"] ?? 0 ) + lc
    } else if(apacheTokens.includes(license_name)) {
      groupedLicenses["apache"] = (groupedLicenses["apache"] ?? 0) + lc
    } else if(mitTokens.includes(license_name)) {
      groupedLicenses["mit"] = (groupedLicenses["mit"] ?? 0) + lc
    } else if(gnuTokens.includes(license_name)) {
      groupedLicenses["gnu"] = (groupedLicenses["gnu"] ?? 0) + lc
    } else if(unknownOrNoLicenseTokens.includes(license_name)) {
      groupedLicenses["unknown"] = (groupedLicenses["unknown"] ?? 0) + lc
    } else {
      groupedLicenses["other"] = (groupedLicenses["other"] ?? 0) + lc
    }
  }

  const groupedLicenseData = []
  groupedLicenseData.push(groupedLicenses["cc-by"] ?? 0)
  groupedLicenseData.push(groupedLicenses["apache"] ?? 0)
  groupedLicenseData.push(groupedLicenses["mit"] ?? 0)
  groupedLicenseData.push(groupedLicenses["gnu"] ?? 0)
  groupedLicenseData.push(groupedLicenses["other"] ?? 0)
  groupedLicenseData.push(groupedLicenses["unknown"] ?? 0)


    return {
    totalDatasets: manual + autoIndex,
    manual,
    autoIndex,
    modalityData, 
    datasetsPerSource,
    datasetsPublicationYearData,
    reach: {
      dois,
      "licenseData": groupedLicenseData,
      "publishers": publishersData
    },
  }
}