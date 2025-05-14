<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue'

const toast = useToast()
const props = defineProps({
  studyId: {
    type: String,
    required: true
  }
})

const state = reactive({
  human_subject_review_status: '',
  fda_regulated_drug: '',
  fda_regulated_device: '',
  has_dmc: '',
})

const loading = ref(false)

const yesNoOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
]

const reviewStatusOptions = [
  { label: 'Not Submitted', value: 'Not Submitted' },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Submitted, approved', value: 'Submitted, approved' },
  { label: 'Approved', value: 'Approved' },
]

function normalize(value: string | null | undefined): string {
  if (!value) return ''
  return value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase()
}

async function fetchData() {
  try {
    const res = await fetch(`/api/studies/${props.studyId}/metadata/oversight`)
    if (!res.ok) throw new Error('Failed to fetch metadata')
    const data = await res.json()

    state.human_subject_review_status = normalize(data.humanSubjectReviewStatus)
    state.fda_regulated_drug = normalize(data.fdaRegulatedDrug)
    state.fda_regulated_device = normalize(data.fdaRegulatedDevice)
    state.has_dmc = normalize(data.hasDmc)
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Error', description: 'Failed to fetch metadata.' })
  }
}

async function onSubmit() {
  loading.value = true
  try {
    const res = await fetch(`/api/studies/${props.studyId}/metadata/oversight`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        humanSubjectReviewStatus: state.human_subject_review_status,
        isFDARegulatedDrug: state.fda_regulated_drug,
        isFDARegulatedDevice: state.fda_regulated_device,
        oversightHasDMC: state.has_dmc,
      }),
    })

    if (!res.ok) throw new Error(`[PUT] "/api/studies/${props.studyId}/metadata/oversight": ${res.statusText}`)

    toast.add({ title: 'Success', description: 'Metadata saved successfully.' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Error', description: 'Failed to save metadata.' })
  } finally {
    loading.value = false
  }
}

onBeforeMount(() => {
  fetchData()
})
</script>

<template>
  <PageBackNavigationHeader
    title="Oversight"
    description=""
    linkName="study:overview"
    :linkParams="{ studyId }"
  />

  <UForm :state="state" @submit.prevent="onSubmit" class="gap-6 flex flex-col">
    <UFormField label="Human Subject Review Status">
      <USelect
        v-model="state.human_subject_review_status"
        :items="reviewStatusOptions"
        placeholder="Request not yet submitted"
      />
    </UFormField>

    <UFormField label="Is this clinical study studying a drug product?">
      <USelect
        v-model="state.fda_regulated_drug"
        :items="yesNoOptions"
        placeholder="No"
        clearable
      />
    </UFormField>

    <UFormField label="Is this clinical study studying a medical device?">
      <USelect
        v-model="state.fda_regulated_device"
        :items="yesNoOptions"
        placeholder="No"
        clearable
      />
    </UFormField>

    <UFormField label="Does this study have a Data Monitoring Committee (DMC)?">
      <USelect
        v-model="state.has_dmc"
        :items="yesNoOptions"
        placeholder="No"
        clearable
      />
    </UFormField>

    <UButton type="submit" :loading="loading" class="w-1/9 text-center">
      <template #icon>
        <UIcon name="i-heroicons-check-circle" />
      </template>
      Save Metadata
    </UButton>
  </UForm>
</template>
