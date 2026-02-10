const SCHEMA_URL = "https://schema.aireadi.org/v0.1.0/study_description.json";

const generateStudyDescription = async (datasetId: string, userId: string) => {
  const studyDescription: any = {};

  // Get the study from the database
  const study = await prisma.dataset.findUnique({
    include: {
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
      StudyLocation: {
        include: {
          StudyLocationContactList: true,
        },
      },
      StudyOverallOfficials: true,
      StudyOversight: true,
      StudySponsors: true,
      StudyStatus: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!study) {
    throw createError({
      statusCode: 404,
      statusMessage: "Study not found",
    });
  }

  // Schema URL (required)
  studyDescription.schema = SCHEMA_URL;

  // Identification Module (required)
  const primaryIdentification = study.StudyIdentification.find(
    (id) => !id.isSecondary,
  );
  const secondaryIdentifications = study.StudyIdentification.filter(
    (id) => id.isSecondary,
  );

  if (primaryIdentification) {
    studyDescription.identificationModule = {
      orgStudyIdInfo: {
        orgStudyId: primaryIdentification.identifier,
        orgStudyIdType: primaryIdentification.identifierType,
        ...(primaryIdentification.identifierDomain && {
          orgStudyIdDomain: primaryIdentification.identifierDomain,
        }),
        ...(primaryIdentification.identifierLink && {
          orgStudyIdLink: primaryIdentification.identifierLink,
        }),
      },
      ...(secondaryIdentifications.length > 0 && {
        secondaryIdInfoList: secondaryIdentifications.map((secId) => ({
          secondaryId: secId.identifier,
          secondaryIdType: secId.identifierType,
          ...(secId.identifierDomain && {
            secondaryIdDomain: secId.identifierDomain,
          }),
          ...(secId.identifierLink && {
            secondaryIdLink: secId.identifierLink,
          }),
        })),
      }),
    };
  }

  // Status Module (required)
  if (study.StudyStatus) {
    studyDescription.statusModule = {
      overallStatus: study.StudyStatus.overallStatus,
      ...(study.StudyStatus.whyStopped && {
        whyStopped: study.StudyStatus.whyStopped,
      }),
      startDateStruct: {
        startDate: study.StudyStatus.startDate
          ? study.StudyStatus.startDate.toISOString().split("T")[0]
          : "",
        startDateType: study.StudyStatus.startDateType,
      },
      completionDateStruct: {
        completionDate: study.StudyStatus.completionDate
          ? study.StudyStatus.completionDate.toISOString().split("T")[0]
          : "",
        completionDateType: study.StudyStatus.completionDateType,
      },
    };
  }

  // Sponsor Collaborators Module (required)
  if (study.StudySponsors) {
    const sponsorModule: any = {
      leadSponsor: {
        leadSponsorName: study.StudySponsors.leadSponsorName,
        ...(study.StudySponsors.leadSponsorIdentifier && {
          leadSponsorIdentifier: {
            leadSponsorIdentifierValue:
              study.StudySponsors.leadSponsorIdentifier,
            leadSponsorIdentifierScheme:
              study.StudySponsors.leadSponsorIdentifierScheme,
            ...(study.StudySponsors.leadSponsorIdentifierSchemeUri && {
              schemeURI: study.StudySponsors.leadSponsorIdentifierSchemeUri,
            }),
          },
        }),
      },
      responsibleParty: {
        responsiblePartyType: study.StudySponsors.responsiblePartyType,
        ...(study.StudySponsors.responsiblePartyInvestigatorGivenName && {
          responsiblePartyInvestigatorFirstName:
            study.StudySponsors.responsiblePartyInvestigatorGivenName,
        }),
        ...(study.StudySponsors.responsiblePartyInvestigatorFamilyName && {
          responsiblePartyInvestigatorLastName:
            study.StudySponsors.responsiblePartyInvestigatorFamilyName,
        }),
        ...(study.StudySponsors.responsiblePartyInvestigatorTitle && {
          responsiblePartyInvestigatorTitle:
            study.StudySponsors.responsiblePartyInvestigatorTitle,
        }),
        ...(study.StudySponsors.responsiblePartyInvestigatorIdentifierValue && {
          responsiblePartyInvestigatorIdentifier: [
            {
              responsiblePartyInvestigatorIdentifierValue:
                study.StudySponsors.responsiblePartyInvestigatorIdentifierValue,
              responsiblePartyInvestigatorIdentifierScheme:
                study.StudySponsors
                  .responsiblePartyInvestigatorIdentifierScheme,
            },
          ],
        }),
        ...(study.StudySponsors.responsiblePartyInvestigatorAffiliationName && {
          responsiblePartyInvestigatorAffiliation: {
            responsiblePartyInvestigatorAffiliationName:
              study.StudySponsors.responsiblePartyInvestigatorAffiliationName,
            ...(study.StudySponsors
              .responsiblePartyInvestigatorAffiliationIdentifier && {
              responsiblePartyInvestigatorAffiliationIdentifier: {
                responsiblePartyInvestigatorAffiliationIdentifierValue:
                  study.StudySponsors
                    .responsiblePartyInvestigatorAffiliationIdentifier,
                responsiblePartyInvestigatorAffiliationIdentifierScheme:
                  study.StudySponsors
                    .responsiblePartyInvestigatorAffiliationIdentifierScheme,
                ...(study.StudySponsors
                  .responsiblePartyInvestigatorAffiliationIdentifierSchemeUri && {
                  schemeURI:
                    study.StudySponsors
                      .responsiblePartyInvestigatorAffiliationIdentifierSchemeUri,
                }),
              },
            }),
          },
        }),
      },
    };

    if (study.StudyCollaborators.length > 0) {
      const collaborators = study.StudyCollaborators.map((collab) => ({
        collaboratorName: collab.name,
        ...(collab.identifier && {
          collaboratorNameIdentifier: {
            collaboratorNameIdentifierValue: collab.identifier,
            collaboratorNameIdentifierScheme: collab.scheme,
            ...(collab.schemeUri && { schemeURI: collab.schemeUri }),
          },
        }),
      }));

      // Assumes collaborators are unique by name and identifier
      sponsorModule.collaboratorList = collaborators;
    }

    studyDescription.sponsorCollaboratorsModule = sponsorModule;
  }

  // Oversight Module (optional)
  if (study.StudyOversight) {
    studyDescription.oversightModule = {
      ...(study.StudyOversight.fdaRegulatedDrug && {
        isFDARegulatedDrug: study.StudyOversight.fdaRegulatedDrug,
      }),
      ...(study.StudyOversight.fdaRegulatedDevice && {
        isFDARegulatedDevice: study.StudyOversight.fdaRegulatedDevice,
      }),
      ...(study.StudyOversight.humanSubjectReviewStatus && {
        humanSubjectReviewStatus: study.StudyOversight.humanSubjectReviewStatus,
      }),
      ...(study.StudyOversight.hasDmc && {
        oversightHasDMC: study.StudyOversight.hasDmc,
      }),
    };
  }

  // Description Module (required)
  if (study.StudyDescription) {
    studyDescription.descriptionModule = {
      briefSummary: study.StudyDescription.briefSummary,
      ...(study.StudyDescription.detailedDescription && {
        detailedDescription: study.StudyDescription.detailedDescription,
      }),
    };
  }

  // Design Module (required)
  if (study.StudyDesign) {
    const designModule: any = {
      studyType: study.StudyDesign.studyType,
    };

    if (study.StudyDesign.studyType === "Interventional") {
      // Interventional design info
      designModule.designInfo = {
        ...(study.StudyDesign.allocation && {
          designAllocation: study.StudyDesign.allocation,
        }),
        ...(study.StudyDesign.interventionModel && {
          designInterventionModel: study.StudyDesign.interventionModel,
        }),
        ...(study.StudyDesign.interventionModelDescription && {
          designInterventionModelDescription:
            study.StudyDesign.interventionModelDescription,
        }),
        ...(study.StudyDesign.primaryPurpose && {
          designPrimaryPurpose: study.StudyDesign.primaryPurpose,
        }),
        designMaskingInfo: {
          designMasking: study.StudyDesign.masking,
          ...(study.StudyDesign.whoMaskedList.length > 0 && {
            designWhoMaskedList: study.StudyDesign.whoMaskedList,
          }),
          ...(study.StudyDesign.maskingDescription && {
            designMaskingDescription: study.StudyDesign.maskingDescription,
          }),
        },
      };

      if (study.StudyDesign.phaseList.length > 0) {
        designModule.phaseList = study.StudyDesign.phaseList;
      }

      designModule.enrollmentInfo = {
        enrollmentCount: study.StudyDesign.enrollmentCount?.toString(),
        enrollmentType: study.StudyDesign.enrollmentType,
      };

      if (study.StudyDesign.numberOfArms !== null) {
        designModule.numberArms = study.StudyDesign.numberOfArms.toString();
      }
    } else if (study.StudyDesign.studyType === "Observational") {
      // Observational design info
      if (study.StudyDesign.isPatientRegistry) {
        designModule.isPatientRegistry = study.StudyDesign.isPatientRegistry;
      }

      designModule.designInfo = {
        ...(study.StudyDesign.oberservationalModelList.length > 0 && {
          designObservationalModelList:
            study.StudyDesign.oberservationalModelList,
        }),
        ...(study.StudyDesign.timePerspectiveList.length > 0 && {
          designTimePerspectiveList: study.StudyDesign.timePerspectiveList,
        }),
      };

      designModule.bioSpec = {
        ...(study.StudyDesign.bioSpecRetention && {
          bioSpecRetention: study.StudyDesign.bioSpecRetention,
        }),
        ...(study.StudyDesign.bioSpecDescription && {
          bioSpecDescription: study.StudyDesign.bioSpecDescription,
        }),
      };

      designModule.enrollmentInfo = {
        enrollmentCount: study.StudyDesign.enrollmentCount?.toString(),
        enrollmentType: study.StudyDesign.enrollmentType,
      };

      if (
        study.StudyDesign.targetDuration !== null &&
        study.StudyDesign.targetDurationUnit
      ) {
        designModule.targetDuration = `${study.StudyDesign.targetDuration} ${study.StudyDesign.targetDurationUnit}`;
      }
    }

    studyDescription.designModule = designModule;
  }

  // Arms Interventions Module (required)
  if (study.StudyArm.length > 0 || study.StudyIntervention.length > 0) {
    studyDescription.armsInterventionsModule = {
      armGroupList: study.StudyArm.map((arm) => ({
        armGroupLabel: arm.label,
        ...(arm.type && { armGroupType: arm.type }),
        armGroupDescription: arm.description,
        ...(arm.interventionList.length > 0 && {
          armGroupInterventionList: arm.interventionList,
        }),
      })),
      interventionList: study.StudyIntervention.map((intervention) => ({
        ...(intervention.type && { interventionType: intervention.type }),
        interventionName: intervention.name,
        interventionDescription: intervention.description,
        ...(intervention.otherNameList.length > 0 && {
          interventionOtherNameList: intervention.otherNameList,
        }),
      })),
    };
  }

  // Conditions Module (required)
  if (study.StudyConditions.length > 0) {
    const conditionsModule: any = {
      conditionList: study.StudyConditions.map((condition) => ({
        conditionName: condition.name,
        ...(condition.classificationCode && {
          conditionIdentifier: {
            conditionClassificationCode: condition.classificationCode,
            conditionScheme: condition.scheme,
            ...(condition.schemeUri && { schemeURI: condition.schemeUri }),
            ...(condition.conditionUri && {
              conditionURI: condition.conditionUri,
            }),
          },
        }),
      })),
    };

    if (study.StudyKeywords.length > 0) {
      conditionsModule.keywordList = study.StudyKeywords.map((keyword) => ({
        keywordValue: keyword.name,
        ...(keyword.classificationCode && {
          keywordIdentifier: {
            keywordClassificationCode: keyword.classificationCode,
            keywordScheme: keyword.scheme,
            ...(keyword.schemeUri && { schemeURI: keyword.schemeUri }),
            ...(keyword.keywordUri && { keywordURI: keyword.keywordUri }),
          },
        }),
      }));
    }

    studyDescription.conditionsModule = conditionsModule;
  }

  // Eligibility Module (required)
  if (study.StudyEligibility) {
    const formatAge = (value: number | null, unit: string | null): string => {
      if (value === null) return "N/A";
      return unit ? `${value} ${unit}` : `${value}`;
    };

    studyDescription.eligibilityModule = {
      sex: study.StudyEligibility.sex,
      genderBased: study.StudyEligibility.genderBased,
      ...(study.StudyEligibility.genderDescription && {
        genderDescription: study.StudyEligibility.genderDescription,
      }),
      minimumAge: formatAge(
        study.StudyEligibility.minimumAgeValue,
        study.StudyEligibility.minimumAgeUnit,
      ),
      maximumAge: formatAge(
        study.StudyEligibility.maximumAgeValue,
        study.StudyEligibility.maximumAgeUnit,
      ),
      healthyVolunteers: study.StudyEligibility.healthyVolunteers,
      eligibilityCriteria: {
        eligibilityCriteriaInclusion: study.StudyEligibility.inclusionCriteria,
        eligibilityCriteriaExclusion: study.StudyEligibility.exclusionCriteria,
      },
      ...(study.StudyEligibility.studyPopulation && {
        studyPopulation: study.StudyEligibility.studyPopulation,
      }),
      ...(study.StudyEligibility.samplingMethod && {
        samplingMethod: study.StudyEligibility.samplingMethod,
      }),
    };
  }

  // Contacts Locations Module (required)
  const contactsLocationsModule: any = {};

  if (study.StudyCentralContact.length > 0) {
    contactsLocationsModule.centralContactList = study.StudyCentralContact.map(
      (contact) => ({
        centralContactFirstName: contact.givenName,
        centralContactLastName: contact.familyName,
        ...(contact.degree && { centralContactDegree: contact.degree }),
        ...(contact.identifier && {
          centralContactIdentifier: [
            {
              centralContactIdentifierValue: contact.identifier,
              centralContactIdentifierScheme: contact.identifierScheme,
              ...(contact.identifierSchemeUri && {
                schemeURI: contact.identifierSchemeUri,
              }),
            },
          ],
        }),
        centralContactAffiliation: {
          centralContactAffiliationName: contact.affiliation,
          ...(contact.affiliationIdentifier && {
            centralContactAffiliationIdentifier: {
              centralContactAffiliationIdentifierValue:
                contact.affiliationIdentifier,
              centralContactAffiliationIdentifierScheme:
                contact.affiliationIdentifierScheme,
              ...(contact.affiliationIdentifierSchemeUri && {
                schemeURI: contact.affiliationIdentifierSchemeUri,
              }),
            },
          }),
        },
        ...(contact.phone && { centralContactPhone: contact.phone }),
        ...(contact.phoneExt && { centralContactPhoneExt: contact.phoneExt }),
        centralContactEMail: contact.emailAddress,
      }),
    );
  }

  if (study.StudyOverallOfficials.length > 0) {
    contactsLocationsModule.overallOfficialList =
      study.StudyOverallOfficials.map((official) => ({
        overallOfficialFirstName: official.givenName,
        overallOfficialLastName: official.familyName,
        ...(official.degree && { overallOfficialDegree: official.degree }),
        ...(official.identifier && {
          overallOfficialIdentifier: [
            {
              overallOfficialIdentifierValue: official.identifier,
              overallOfficialIdentifierScheme: official.identifierScheme,
              ...(official.identifierSchemeUri && {
                schemeURI: official.identifierSchemeUri,
              }),
            },
          ],
        }),
        overallOfficialAffiliation: {
          overallOfficialAffiliationName: official.affiliation,
          ...(official.affiliationIdentifier && {
            overallOfficialAffiliationIdentifier: {
              overallOfficialAffiliationIdentifierValue:
                official.affiliationIdentifier,
              overallOfficialAffiliationIdentifierScheme:
                official.affiliationIdentifierScheme,
              ...(official.affiliationIdentifierSchemeUri && {
                schemeURI: official.affiliationIdentifierSchemeUri,
              }),
            },
          }),
        },
        overallOfficialRole: official.role,
      }));
  }

  if (study.StudyLocation.length > 0) {
    contactsLocationsModule.locationList = study.StudyLocation.map(
      (location) => ({
        locationFacility: location.facility,
        ...(location.status && { locationStatus: location.status }),
        locationCity: location.city,
        ...(location.state && { locationState: location.state }),
        ...(location.zip && { locationZip: location.zip }),
        locationCountry: location.country,
        ...(location.identifier && {
          locationIdentifier: {
            locationIdentifierValue: location.identifier,
            locationIdentifierScheme: location.identifierScheme,
            ...(location.identifierSchemeUri && {
              schemeURI: location.identifierSchemeUri,
            }),
          },
        }),
        ...(location.StudyLocationContactList.length > 0 && {
          locationContactList: location.StudyLocationContactList.map(
            (contact) => ({
              locationContactFirstName: contact.givenName,
              locationContactLastName: contact.familyName,
              ...(contact.identifier && {
                locationContactIdentifier: [
                  {
                    locationContactIdentifierValue: contact.identifier,
                    locationContactIdentifierScheme: contact.identifierScheme,
                    ...(contact.identifierSchemeUri && {
                      schemeURI: contact.identifierSchemeUri,
                    }),
                  },
                ],
              }),
              locationContactRole: contact.role,
              locationContactPhone: contact.phone,
              ...(contact.phoneExt && {
                locationContactPhoneExt: contact.phoneExt,
              }),
              locationContactEMail: contact.emailAddress,
            }),
          ),
        }),
      }),
    );
  }

  if (Object.keys(contactsLocationsModule).length > 0) {
    studyDescription.contactsLocationsModule = contactsLocationsModule;
  }

  return JSON.stringify(studyDescription, null, 2);
};

export default generateStudyDescription;
