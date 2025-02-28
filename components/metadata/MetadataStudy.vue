<script lang="ts" setup>
// Define props
const props = defineProps<{
  metadata: any;
}>();

const sectionTitleClass = "mb-2 w-full border-b border-gray-200 font-semibold";
</script>

<template>
  <div class="space-y-6">
    <CardNuxtCollap title="testing" :collapse="false">
      <div class="space-y-6">
        <p>testing content here</p>
      </div>
    </CardNuxtCollap>

    <CardCollapsibleContent title="Design" :collapse="false">
      <div class="space-y-6">
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

        <!-- Interventional Information -->
        <div v-if="props.metadata.designModule.studyType === 'Interventional'">
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
        </div>

        <!-- Design Observation Model -->
        <div>
          <p :class="sectionTitleClass">Design Observation Model</p>

          <div v-if="props?.metadata?.designModule.observationModelList">
            <UBadge
              v-for="item in props?.metadata?.designModule.observationModelList"
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
        <div>
          <p :class="sectionTitleClass">Biospecimens</p>

          <p>{{ props.metadata.bioSpecRetention || "N/A" }}</p>
        </div>

        <!-- Biospecimens Description -->
        <div>
          <p :class="sectionTitleClass">Biospecimens Description</p>

          <p>{{ props.metadata.bioSpecDescriptions || "N/A" }}</p>
        </div>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Eligibility" :collapse="true">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Identification Information" :collapse="true">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Oversight" :collapse="true">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Sponsors and Collaborators" :collapse="true">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent
      title="View the full study_description.json file"
      :collapse="true"
    >
      <pre>{{ props.metadata }}</pre>
    </CardCollapsibleContent>
  </div>
</template>
