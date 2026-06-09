import { onBeforeRouteLeave } from "vue-router";

export function useUnsavedChangesGuard({ isDirty, isSubmitting }) {
  const showLeaveModal = ref(false);
  const nextNavigationTarget = ref(null);

  const handleBeforeUnload = (e) => {
    if (isDirty.value && !isSubmitting.value) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  onMounted(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value && !isSubmitting.value) {
      showLeaveModal.value = true;
      nextNavigationTarget.value = next;
    } else {
      next();
    }
  });

  const confirmLeave = () => {
    showLeaveModal.value = false;
    if (nextNavigationTarget.value) {
      nextNavigationTarget.value();
    }
  };

  const cancelLeave = () => {
    showLeaveModal.value = false;
    if (nextNavigationTarget.value) {
      nextNavigationTarget.value(false);
    }
  };

  return {
    showLeaveModal,
    confirmLeave,
    cancelLeave,
  };
}