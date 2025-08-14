import { z } from "zod";
import { DataLakeServiceClient } from "@azure/storage-file-datalake";

const createDatasetSchema = z.object({
  id: z.string(),
  version: z.string(),
});

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();
  const session = await requireUserSession(event);

  const { user } = session;
  const _userId = user.id;

  // todo: add permissions check

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    createDatasetSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study data",
    });
  }

  const { id, version } = body.data;

  const originalDataset = await prisma.dataset.findUnique({
    include: {
      DatasetAccess: true,
      DatasetAlternateIdentifier: true,
      DatasetConsent: true,
      DatasetContributor: true,
      DatasetDate: true,
      DatasetDeIdentLevel: true,
      DatasetDescription: true,
      DatasetFunder: true,
      DatasetHealthsheet: true,
      DatasetManagingOrganization: true,
      DatasetMember: true,
      DatasetOther: true,
      DatasetRelatedIdentifier: true,
      DatasetRights: true,
      DatasetSubject: true,
      DatasetTitle: true,
      StudyArm: true,
      StudyCentralContact: true,
      StudyCollaborators: true,
      StudyConditions: true,
      StudyDescription: true,
      StudyDesign: true,
      StudyEligibility: true,
      StudyIdentification: true,
      StudyIntervention: true,
      StudyKeywords: true,
      StudyLocation: true,
      StudyOverallOfficials: true,
      StudyOversight: true,
      StudySponsors: true,
      StudyStatus: true,
    },
    where: {
      id,
    },
  });

  if (!originalDataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const newDataset = await prisma.dataset.create({
    data: {
      title: originalDataset.title,
      canonicalId: originalDataset.canonicalId,

      DatasetAccess: {
        create: {
          description: originalDataset.DatasetAccess?.description ?? "",
          type: originalDataset.DatasetAccess?.type ?? "Access",
          url: originalDataset.DatasetAccess?.url ?? "",
          urlLastChecked:
            originalDataset.DatasetAccess?.urlLastChecked ?? new Date(),
        },
      },

      DatasetAlternateIdentifier: {
        create: originalDataset.DatasetAlternateIdentifier.map(
          (identifier) => ({
            identifier: identifier.identifier,
            type: identifier.type,
          }),
        ),
      },

      DatasetConsent: {
        create: {
          details: originalDataset.DatasetConsent?.details ?? "",
          geneticOnly: originalDataset.DatasetConsent?.geneticOnly ?? false,
          geogRestrict: originalDataset.DatasetConsent?.geogRestrict ?? false,
          noMethods: originalDataset.DatasetConsent?.noMethods ?? false,
          noncommercial: originalDataset.DatasetConsent?.noncommercial ?? false,
          researchType: originalDataset.DatasetConsent?.researchType ?? false,
          type: originalDataset.DatasetConsent?.type ?? "Consent",
        },
      },

      DatasetContributor: {
        create: originalDataset.DatasetContributor.map((contributor) => ({
          affiliations: contributor.affiliations as any,
          contributorType: contributor.contributorType,
          creator: contributor.creator,
          familyName: contributor.familyName,
          givenName: contributor.givenName,
          nameIdentifier: contributor.nameIdentifier,
          nameIdentifierScheme: contributor.nameIdentifierScheme,
          nameIdentifierSchemeUri: contributor.nameIdentifierSchemeUri,
          nameType: contributor.nameType,
        })),
      },

      DatasetDate: {
        create: originalDataset.DatasetDate.map((date) => ({
          date: date.date,
          information: date.information,
          type: date.type,
        })),
      },

      DatasetDeIdentLevel: {
        create: {
          dates: originalDataset.DatasetDeIdentLevel?.dates ?? false,
          details: originalDataset.DatasetDeIdentLevel?.details ?? "",
          direct: originalDataset.DatasetDeIdentLevel?.direct ?? false,
          hipaa: originalDataset.DatasetDeIdentLevel?.hipaa ?? false,
          kAnon: originalDataset.DatasetDeIdentLevel?.kAnon ?? false,
          nonarr: originalDataset.DatasetDeIdentLevel?.nonarr ?? false,
          type: originalDataset.DatasetDeIdentLevel?.type ?? "DeIdentLevel",
        },
      },

      DatasetDescription: {
        create: originalDataset.DatasetDescription.map((desc) => ({
          description: desc.description,
          type: desc.type ?? "Abstract",
        })),
      },

      DatasetFunder: {
        create: originalDataset.DatasetFunder.map((funder) => ({
          name: funder.name,
          awardNumber: funder.awardNumber,
          awardTitle: funder.awardTitle,
          awardUri: funder.awardUri,
          identifier: funder.identifier,
          identifierSchemeUri: funder.identifierSchemeUri,
          identifierType: funder.identifierType,
        })),
      },

      DatasetHealthsheet: {
        create: {
          collection:
            (originalDataset.DatasetHealthsheet?.collection as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
          composition:
            (originalDataset.DatasetHealthsheet?.composition as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
          distribution:
            (originalDataset.DatasetHealthsheet?.distribution as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
          maintenance:
            (originalDataset.DatasetHealthsheet?.maintenance as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
          motivation:
            (originalDataset.DatasetHealthsheet?.motivation as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
          preprocessing:
            (originalDataset.DatasetHealthsheet?.preprocessing as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
          uses:
            (originalDataset.DatasetHealthsheet?.uses as any) ??
            JSON.stringify({
              records: [],
              version: 1,
            }),
        },
      },

      DatasetManagingOrganization: {
        create: {
          name: originalDataset.DatasetManagingOrganization?.name ?? "",
          identifier:
            originalDataset.DatasetManagingOrganization?.identifier ?? "",
          identifierScheme:
            originalDataset.DatasetManagingOrganization?.identifierScheme ?? "",
          identifierSchemeUri:
            originalDataset.DatasetManagingOrganization?.identifierSchemeUri ??
            "",
        },
      },

      DatasetMember: {
        create: originalDataset.DatasetMember.map((member) => ({
          owner: member.owner,
          role: member.role,
          userId: member.userId,
        })),
      },

      DatasetOther: {
        create: {
          acknowledgement: originalDataset.DatasetOther?.acknowledgement ?? "",
          format: originalDataset.DatasetOther?.format ?? [],
          labelingMethod: originalDataset.DatasetOther?.labelingMethod ?? "",
          language: originalDataset.DatasetOther?.language ?? "",
          resourceType: originalDataset.DatasetOther?.resourceType ?? "Dataset",
          resourceTypeName:
            originalDataset.DatasetOther?.resourceTypeName ?? "",
          size: originalDataset.DatasetOther?.size ?? [],
          standardsFollowed:
            originalDataset.DatasetOther?.standardsFollowed ?? "",
          validationInfo: originalDataset.DatasetOther?.validationInfo ?? "",
        },
      },

      DatasetRelatedIdentifier: {
        create: originalDataset.DatasetRelatedIdentifier.map((relatedId) => ({
          identifier: relatedId.identifier,
          identifierType: relatedId.identifierType,
          relatedMetadataScheme: relatedId.relatedMetadataScheme,
          relationType: relatedId.relationType,
          resourceType: relatedId.resourceType,
          schemeType: relatedId.schemeType,
          schemeUri: relatedId.schemeUri,
        })),
      },

      DatasetRights: {
        create: {
          identifier: originalDataset.DatasetRights?.identifier ?? "",
          identifierScheme:
            originalDataset.DatasetRights?.identifierScheme ?? "",
          identifierSchemeUri:
            originalDataset.DatasetRights?.identifierSchemeUri ?? "",
          licenseText: originalDataset.DatasetRights?.licenseText ?? "",
          rights: originalDataset.DatasetRights?.rights ?? "",
          uri: originalDataset.DatasetRights?.uri ?? "",
        },
      },

      DatasetSubject: {
        create: originalDataset.DatasetSubject.map((subject) => ({
          classificationCode: subject.classificationCode,
          scheme: subject.scheme,
          schemeUri: subject.schemeUri,
          subject: subject.subject,
          valueUri: subject.valueUri,
        })),
      },

      DatasetTitle: {
        create: originalDataset.DatasetTitle.map((title) => ({
          title: title.title,
          type: title.type,
        })),
      },

      description: originalDataset.description,
      imageUrl: originalDataset.imageUrl,

      StudyArm: {
        create: originalDataset.StudyArm.map((arm) => ({
          description: arm.description,
          interventionList: arm.interventionList,
          label: arm.label,
          type: arm.type,
        })),
      },

      StudyCentralContact: {
        create: originalDataset.StudyCentralContact.map((contact) => ({
          affiliation: contact.affiliation,
          affiliationIdentifier: contact.affiliationIdentifier,
          affiliationIdentifierScheme: contact.affiliationIdentifierScheme,
          affiliationIdentifierSchemeUri:
            contact.affiliationIdentifierSchemeUri,
          degree: contact.degree,
          emailAddress: contact.emailAddress,
          familyName: contact.familyName,
          givenName: contact.givenName,
          identifier: contact.identifier,
          identifierScheme: contact.identifierScheme,
          identifierSchemeUri: contact.identifierSchemeUri,
          phone: contact.phone,
          phoneExt: contact.phoneExt,
        })),
      },

      StudyCollaborators: {
        create: originalDataset.StudyCollaborators.map((collaborator) => ({
          name: collaborator.name,
          identifier: collaborator.identifier,
          scheme: collaborator.scheme,
          schemeUri: collaborator.schemeUri,
        })),
      },

      StudyConditions: {
        create: originalDataset.StudyConditions.map((condition) => ({
          name: condition.name,
          classificationCode: condition.classificationCode,
          conditionUri: condition.conditionUri,
          scheme: condition.scheme,
          schemeUri: condition.schemeUri,
        })),
      },

      StudyDescription: {
        create: {
          briefSummary: originalDataset.description,
          detailedDescription: "",
        },
      },

      StudyDesign: {
        create: {
          allocation: originalDataset.StudyDesign?.allocation ?? null,
          bioSpecDescription:
            originalDataset.StudyDesign?.bioSpecDescription ?? null,
          bioSpecRetention:
            originalDataset.StudyDesign?.bioSpecRetention ?? null,
          enrollmentCount: originalDataset.StudyDesign?.enrollmentCount ?? null,
          enrollmentType: originalDataset.StudyDesign?.enrollmentType ?? null,
          interventionModel:
            originalDataset.StudyDesign?.interventionModel ?? null,
          interventionModelDescription:
            originalDataset.StudyDesign?.interventionModelDescription ?? null,
          isPatientRegistry:
            originalDataset.StudyDesign?.isPatientRegistry ?? null,
          masking: originalDataset.StudyDesign?.masking ?? null,
          maskingDescription:
            originalDataset.StudyDesign?.maskingDescription ?? null,
          numberOfArms: originalDataset.StudyDesign?.numberOfArms ?? null,
          oberservationalModelList:
            originalDataset.StudyDesign?.oberservationalModelList ?? [],
          phaseList: originalDataset.StudyDesign?.phaseList ?? [],
          primaryPurpose: originalDataset.StudyDesign?.primaryPurpose ?? null,
          studyType: originalDataset.StudyDesign?.studyType ?? null,
          targetDuration: originalDataset.StudyDesign?.targetDuration ?? null,
          targetDurationUnit:
            originalDataset.StudyDesign?.targetDurationUnit ?? null,
          timePerspectiveList:
            originalDataset.StudyDesign?.timePerspectiveList ?? [],
          whoMaskedList: originalDataset.StudyDesign?.whoMaskedList ?? [],
        },
      },

      StudyEligibility: {
        create: {
          exclusionCriteria:
            originalDataset.StudyEligibility?.exclusionCriteria ?? [],
          genderBased: originalDataset.StudyEligibility?.genderBased ?? null,
          genderDescription:
            originalDataset.StudyEligibility?.genderDescription ?? null,
          healthyVolunteers:
            originalDataset.StudyEligibility?.healthyVolunteers ?? null,
          inclusionCriteria:
            originalDataset.StudyEligibility?.inclusionCriteria ?? [],
          maximumAgeUnit:
            originalDataset.StudyEligibility?.maximumAgeUnit ?? null,
          maximumAgeValue:
            originalDataset.StudyEligibility?.maximumAgeValue ?? null,
          minimumAgeUnit:
            originalDataset.StudyEligibility?.minimumAgeUnit ?? null,
          minimumAgeValue:
            originalDataset.StudyEligibility?.minimumAgeValue ?? null,
          samplingMethod:
            originalDataset.StudyEligibility?.samplingMethod ?? null,
          sex: originalDataset.StudyEligibility?.sex ?? null,
          studyPopulation:
            originalDataset.StudyEligibility?.studyPopulation ?? "",
        },
      },

      StudyIdentification: {
        create: originalDataset.StudyIdentification.map((identification) => ({
          identifier: identification.identifier,
          identifierDomain: identification.identifierDomain,
          identifierLink: identification.identifierLink,
          identifierType: identification.identifierType,
          isSecondary: identification.isSecondary,
        })),
      },

      StudyIntervention: {
        create: originalDataset.StudyIntervention.map((intervention) => ({
          name: intervention.name,
          description: intervention.description,
          otherNameList: intervention.otherNameList,
          type: intervention.type,
        })),
      },

      StudyKeywords: {
        create: originalDataset.StudyKeywords.map((keyword) => ({
          name: keyword.name,
          classificationCode: keyword.classificationCode,
          keywordUri: keyword.keywordUri,
          scheme: keyword.scheme,
          schemeUri: keyword.schemeUri,
        })),
      },

      StudyLocation: {
        create: originalDataset.StudyLocation.map((location) => ({
          city: location.city,
          country: location.country,
          facility: location.facility,
          identifier: location.identifier,
          identifierScheme: location.identifierScheme,
          identifierSchemeUri: location.identifierSchemeUri,
          state: location.state,
          status: location.status,
          zip: location.zip,
        })),
      },

      StudyOverallOfficials: {
        create: originalDataset.StudyOverallOfficials.map((official) => ({
          affiliation: official.affiliation,
          affiliationIdentifier: official.affiliationIdentifier,
          affiliationIdentifierScheme: official.affiliationIdentifierScheme,
          affiliationIdentifierSchemeUri:
            official.affiliationIdentifierSchemeUri,
          degree: official.degree,
          familyName: official.familyName,
          givenName: official.givenName,
          identifier: official.identifier,
          identifierScheme: official.identifierScheme,
          identifierSchemeUri: official.identifierSchemeUri,
          role: official.role,
        })),
      },

      StudyOversight: {
        create: {
          fdaRegulatedDevice:
            originalDataset.StudyOversight?.fdaRegulatedDevice ?? "",
          fdaRegulatedDrug:
            originalDataset.StudyOversight?.fdaRegulatedDrug ?? "",
          hasDmc: originalDataset.StudyOversight?.hasDmc ?? "",
          humanSubjectReviewStatus:
            originalDataset.StudyOversight?.humanSubjectReviewStatus ?? "",
        },
      },

      StudySponsors: {
        create: {
          leadSponsorIdentifier:
            originalDataset.StudySponsors?.leadSponsorIdentifier ?? "",
          leadSponsorIdentifierScheme:
            originalDataset.StudySponsors?.leadSponsorIdentifierScheme ?? "",
          leadSponsorIdentifierSchemeUri:
            originalDataset.StudySponsors?.leadSponsorIdentifierSchemeUri ?? "",
          leadSponsorName: originalDataset.StudySponsors?.leadSponsorName ?? "",
          responsiblePartyInvestigatorAffiliationIdentifier:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorAffiliationIdentifier ?? "",
          responsiblePartyInvestigatorAffiliationIdentifierScheme:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorAffiliationIdentifierScheme ?? "",
          responsiblePartyInvestigatorAffiliationIdentifierSchemeUri:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri ??
            "",
          responsiblePartyInvestigatorAffiliationName:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorAffiliationName ?? "",
          responsiblePartyInvestigatorFamilyName:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorFamilyName ?? "",
          responsiblePartyInvestigatorGivenName:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorGivenName ?? "",
          responsiblePartyInvestigatorIdentifierScheme:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorIdentifierScheme ?? "",
          responsiblePartyInvestigatorIdentifierValue:
            originalDataset.StudySponsors
              ?.responsiblePartyInvestigatorIdentifierValue ?? "",
          responsiblePartyInvestigatorTitle:
            originalDataset.StudySponsors?.responsiblePartyInvestigatorTitle ??
            "",
          responsiblePartyType:
            originalDataset.StudySponsors?.responsiblePartyType ?? "",
        },
      },

      StudyStatus: {
        create: {
          completionDate: originalDataset.StudyStatus?.completionDate ?? null,
          completionDateType:
            originalDataset.StudyStatus?.completionDateType ?? null,
          overallStatus: originalDataset.StudyStatus?.overallStatus ?? null,
          startDate: originalDataset.StudyStatus?.startDate ?? null,
          startDateType: originalDataset.StudyStatus?.startDateType ?? null,
          whyStopped: originalDataset.StudyStatus?.whyStopped ?? null,
        },
      },

      type: originalDataset.type,
      version,
    },
  });

  // Create a new container for the dataset
  const datalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );

  const fileSystemClient = datalakeServiceClient.getFileSystemClient(
    newDataset.id,
  );

  await fileSystemClient.create();

  return {
    data: { datasetId: newDataset.id },
    statusCode: 201,
  };
});
