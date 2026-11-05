type BadgeColor = "success" | "error" | "warning" | "info" | "neutral";

export const requestStatusColor = (status: string): BadgeColor => {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "revoked":
      return "warning";
    case "pending":
      return "info";
    default:
      return "neutral";
  }
};

// Upload one agreement file as multipart form data
export const uploadAgreementFile = (url: string, file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  return $fetch(url, { body: formData, method: "POST" });
};
