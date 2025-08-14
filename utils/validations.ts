// Validation functions uses throughout the application

/**
 * Validates if a string is a valid URL
 * @param url The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const _parsedUrl = new URL(url);

    return true;
  } catch {
    return false;
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

export const isValidORCIDValue = (orcid: string): boolean => {
  const orcidRegex = /^(orcid:)?\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;

  return orcidRegex.test(orcid);
};

export const isValidRORValue = (ror: string): boolean => {
  const rorRegex = /^0[a-z|0-9]{6}[0-9]{2}$/;

  return rorRegex.test(ror);
};

export const isValidCrossRefValue = (crossref: string): boolean => {
  const crossRefRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

  return crossRefRegex.test(crossref);
};
