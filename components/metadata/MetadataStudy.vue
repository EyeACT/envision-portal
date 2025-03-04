<script lang="ts" setup>
// Define props
const props = defineProps<{
  metadata: any;
}>();

const sectionTitleClass = "mb-2 w-full border-b border-gray-200 font-semibold";
</script>

<template>
  <div class="h-auto space-y-6">
    <CardCollapsibleContent title="Design">
      <div class="h-auto space-y-6">
        <!-- Study Type -->
        <div>
          <p :class="sectionTitleClass">Study Type</p>

          <p>{{ props.metadata.designModule.studyType }}</p>
        </div>

        <!-- Enrollment Count -->
        <div>
          <p :class="sectionTitleClass">
            Enrollment Count ({{
              props.metadata.designModule.enrollmentType || "Type Unknown"
            }})
          </p>

          <p>{{ props.metadata.designModule.enrollmentCount || "N/A" }}</p>
        </div>

        <!-- Target Duration -->
        <div v-if="props.metadata.designModule.targetDuration">
          <p :class="sectionTitleClass">Target Duration</p>

          <p>{{ props.metadata.designModule.targetDuration }}</p>
        </div>

        <div v-if="props.metadata.designModule.numberGroupsCohorts">
          <p :class="sectionTitleClass">Number of Cohort Groups</p>

          <p>{{ props.metadata.designModule.numberGroupsCohorts }}</p>
        </div>

        <!-- Interventional Design Module -->
        <div
          v-if="props.metadata.designModule.studyType === 'Interventional'"
          class="space-y-6"
        >
          <!-- Interventional Phase List -->
          <div v-if="props.metadata.designModule.phaseList">
            <p :class="sectionTitleClass">Phase List</p>

            <div>
              <UBadge
                v-for="item in props?.metadata?.designModule.phaseList"
                :key="item.phaseName"
                color="primary"
                size="sm"
                variant="outline"
              >
                {{ item }}
              </UBadge>
            </div>
          </div>

          <div v-if="props.metadata.designModule.designInfo">
            <!-- Design Allocation -->
            <div>
              <p :class="sectionTitleClass">Design Allocation</p>

              <p>
                {{ props.metadata.designModule.designInfo.designAllocation }}
              </p>
            </div>

            <!-- Design Intervention Model -->
            <div>
              <p :class="sectionTitleClass">Design Intervention Model</p>

              <p>
                {{
                  props.metadata.designModule.designInfo.designInterventionModel
                }}
              </p>
            </div>

            <!-- Design Primary Purpose -->
            <div>
              <p :class="sectionTitleClass">Design Primary Purpose</p>

              <p>
                {{
                  props.metadata.designModule.designInfo.designPrimaryPurpose
                }}
              </p>
            </div>

            <!-- Design Masking -->
            <div>
              <p :class="sectionTitleClass">Design Masking</p>

              <p>
                {{
                  props.metadata.designModule.designInfo.designMaskingInfo
                    ?.designMasking
                }}
              </p>
            </div>

            <!-- Who Masked List -->
            <div>
              <p :class="sectionTitleClass">Who Masked List</p>

              <div>
                <UBadge
                  v-for="item in props?.metadata?.designModule.designInfo
                    .designMaskingInfo.whoMaskedList"
                  :key="item.whoMasked"
                  color="primary"
                  size="sm"
                  variant="outline"
                >
                  {{ item }}
                </UBadge>
              </div>
            </div>

            <div
              v-if="
                props.metadata.designModule.designInfo.designMaskingInfo
                  ?.designMaskingDescription
              "
            >
              <p :class="sectionTitleClass">Masking Description</p>

              <p>
                {{
                  props.metadata.designModule.designInfo.designMaskingInfo
                    .designMaskingDescription
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Observational Design Module -->
        <div
          v-if="props.metadata.designModule.studyType === 'Observational'"
          class="space-y-6"
        >
          <div v-if="props.metadata.designModule.designInfo.designAllocation">
            <p :class="sectionTitleClass">Design Allocation</p>

            <p>{{ props.metadata.designModule.designInfo.designAllocation }}</p>
          </div>

          <!-- Design Observation Model -->
          <div>
            <p :class="sectionTitleClass">Design Observation Model</p>

            <div v-if="props?.metadata?.designModule.observationModelList">
              <UBadge
                v-for="item in props?.metadata?.designModule
                  .observationModelList"
                :key="item.observationModelName"
                color="primary"
                size="sm"
                variant="outline"
              >
                {{ item }}
              </UBadge>
            </div>

            <p v-else>N/A</p>
          </div>

          <!-- Design Time Perspective -->
          <div>
            <p :class="sectionTitleClass">Design Time Perspective</p>

            <div v-if="props?.metadata?.designModule?.designTimePerspective">
              <UBadge
                v-for="item in props?.metadata?.designModule
                  .designTimePerspective"
                :key="item.designTimePerspective"
                color="primary"
                size="sm"
                variant="outline"
              >
                {{ item }}
              </UBadge>
            </div>

            <p v-else>N/A</p>
          </div>

          <!-- Biospecimens -->
          <div v-if="props.metadata?.bioSpec?.bioSpecRetention">
            <p :class="sectionTitleClass">Biospecimens</p>

            <p>{{ props.metadata.bioSpecRetention || "N/A" }}</p>
          </div>

          <!-- Biospecimens Description -->
          <div v-if="props.metadata.designModule?.bioSpec?.bioSpecDescription">
            <p :class="sectionTitleClass">Biospecimens Description</p>

            <p>{{ props.metadata.bioSpecDescriptions || "N/A" }}</p>
          </div>
        </div>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Eligibility">
      <div class="space-y-6">
        <!-- Sex -->
        <div>
          <p :class="sectionTitleClass">Sex</p>

          <p>{{ props.metadata.eligibilityModule.sex }}</p>
        </div>

        <!-- Gender Based -->
        <div>
          <p :class="sectionTitleClass">Gender Based</p>

          <p>{{ props.metadata.eligibilityCriteria?.genderBased || "N/A" }}</p>
        </div>

        <!-- Gender Description -->
        <div v-if="props.metadata.eligibilityModule.genderDescription">
          <p :class="sectionTitleClass">Gender Description</p>

          <p>{{ props.metadata.eligibilityModule.genderDescription }}</p>
        </div>

        <!-- Minimum Age -->
        <div>
          <p :class="sectionTitleClass">Minimum Age</p>

          <p>{{ props.metadata.eligibilityModule.minimumAge }}</p>
        </div>

        <!-- Maximum Age -->
        <div>
          <p :class="sectionTitleClass">Maximum Age</p>

          <p>{{ props.metadata.eligibilityModule.maximumAge }}</p>
        </div>

        <!-- Healthy Volunteers -->
        <div v-if="props.metadata.eligibilityModule.healthyVolunteers">
          <p :class="sectionTitleClass">Healthy Volunteers</p>

          <p>{{ props.metadata.eligibilityModule.healthyVolunteers }}</p>
        </div>

        <!-- Inclusion Criteria -->
        <div>
          <p :class="sectionTitleClass">Inclusion Criteria</p>

          <div class="space-y-2 space-x-2">
            <UBadge
              v-for="(item, index) in props.metadata.eligibilityModule
                .eligibilityCriteria.eligibilityCriteriaInclusion"
              :key="index"
            >
              {{ item }}
            </UBadge>
          </div>
        </div>

        <!-- Exclusion Criteria -->
        <div>
          <p :class="sectionTitleClass">Exclusion Criteria</p>

          <div class="space-y-2 space-x-2">
            <UBadge
              v-for="(item, index) in props.metadata.eligibilityModule
                .eligibilityCriteria.eligibilityCriteriaExclusion"
              :key="index"
            >
              {{ item }}
            </UBadge>
          </div>
        </div>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Identification Information">
      <div class="space-y-6">
        <!-- Org Study ID -->
        <div>
          <p :class="sectionTitleClass">Organization Study ID</p>

          <p>
            {{ props.metadata.identificationModule.orgStudyIdInfo.orgStudyId }}
          </p>
        </div>

        <!-- Org Study Type -->
        <div>
          <p :class="sectionTitleClass">Organization Study Type</p>

          <p>
            {{
              props.metadata.identificationModule.orgStudyIdInfo.orgStudyIdType
            }}
          </p>
        </div>

        <!-- Secondary Id -->
        <div v-if="props.metadata.identificationModule.secondaryIdInfoList">
          <p :class="sectionTitleClass">Secondary ID</p>

          <UTable
            :data="props.metadata.identificationModule.secondaryIdInfoList"
            class="flex-1"
          />
        </div>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Oversight">
      <div class="space-y-6">
        <!-- Human Subject Review Status -->
        <div>
          <p :class="sectionTitleClass">
            Has the clinical study been reviewed and approved by at least one
            human subjects protection review board?
          </p>

          <p>{{ props.metadata.oversightModule.humanSubjectReviewStatus }}</p>
        </div>

        <!-- FDA Regulated Drug -->
        <div>
          <p :class="sectionTitleClass">
            Is this clincal study for a drug product?
          </p>

          <p>{{ props.metadata.oversightModule.isFDARegulatedDrug }}</p>
        </div>

        <!-- FDA Regulated Device -->
        <div>
          <p :class="sectionTitleClass">
            Is this clinical study for a medical device?
          </p>

          <p>{{ props.metadata.oversightModule.isFDARegulatedDevice }}</p>
        </div>

        <!-- Oversight has DMC -->
        <div>
          <p :class="sectionTitleClass">
            Was a data monitoring committee appointed for this study?
          </p>

          <p>{{ props.metadata.oversightModule.oversightHasDMC }}</p>
        </div>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Sponsors and Collaborators">
      <div class="space-y-6">
        <!-- Lead Sponsor -->
        <div>
          <p :class="sectionTitleClass">Sponsor</p>

          <p>
            {{
              props.metadata.sponsorCollaboratorsModule.leadSponsor
                .leadSponsorName
            }}
          </p>
        </div>

        <!-- Collaborators -->
        <div>
          <p :class="sectionTitleClass">Collaborators</p>

          <UTable
            :data="props.metadata.sponsorCollaboratorsModule.collaboratorList"
            class="flex-1"
          />
        </div>

        <!-- Responsible Party -->
        <div>
          <p :class="sectionTitleClass">Responsible Party</p>

          <UTable :data="props.metadata.responsibleParty" class="flex-1" />
        </div>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent
      title="View the full study_description.json file"
      :collapse="true"
    >
      <pre>{{ props.metadata }}</pre>
    </CardCollapsibleContent>
  </div>
</template>
