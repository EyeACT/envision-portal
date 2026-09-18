
import OverlayConfirmDialog from "~/components/overlay/OverlayConfirmDialog.vue"

export interface ConfirmDialogOptions {
  title: string
  description?: string
}

export const useConfirmDialog = () => {
  const overlay = useOverlay()

  return (options: ConfirmDialogOptions): Promise<boolean> => {
    const modal = overlay.create(OverlayConfirmDialog, {
      destroyOnClose: true,
      props: options
    })

    return modal.open()
  }
}
