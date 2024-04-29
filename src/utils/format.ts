/**
 * Get app URL from any link
 *
 * @param link Link to get the app url from
 */
export function getAppURL(link: string) {
  if (!link) return "";

  const url = new URL(link);

  return url.host;
}

/**
 * Get community url formatted
 *
 * @param link Link to get the app url from
 */
export function getCommunityUrl(link: string) {
  if (!link) return "";

  const url = new URL(link);

  return url.hostname + ((url.pathname !== "/" && url.pathname) || "");
}

/**
 * Beautify addresses
 *
 * @param address Address to beautify
 *
 * @returns Formatted address
 */
export function formatAddress(address: string, count = 13) {
  return (
    address.substring(0, count) +
    "..." +
    address.substring(address.length - count, address.length)
  );
}

/**
 * Returns if a string is a valid Arweave address or ID
 *
 * This does not throw an error if the input is not a valid
 * address, unlike the "isAddress" assertion, in the assertion
 * utils.
 *
 * @param addr String to validate
 * @returns Valid address or not
 */
export const isAddressFormat = (addr: string) => /[a-z0-9_-]{43}/i.test(addr);

/**
 * Capitalizes first letters of settings name and replaces "_" with " "
 *
 * @param name String to format
 * @returns Formatted name
 */
export const formatSettingName = (name: string) => {
  if (!name) return "";

  if (name === "arconfetti") {
    return "ArConfetti";
  }

  if (name === "ao_support") {
    return "ao support";
  }

  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Abbreviates large numbers into a more readable format, using M, B, and T for millions, billions, and trillions respectively.
 *
 * @param value The numeric value to abbreviate, as a number or string.
 * @returns The abbreviated string representation of the number.
 */
export function abbreviateNumber(value: number): string {
  let suffix = "";
  let abbreviatedValue = value;

  if (value >= 1e12) {
    // Trillions
    suffix = "T";
    abbreviatedValue = value / 1e12;
  } else if (value >= 1e9) {
    // Billions
    suffix = "B";
    abbreviatedValue = value / 1e9;
  } else if (value >= 1e6) {
    // Millions
    suffix = "M";
    abbreviatedValue = value / 1e6;
  }

  if (abbreviatedValue % 1 === 0) {
    return `${abbreviatedValue}${suffix}`;
  } else {
    return `${abbreviatedValue.toFixed(1)}${suffix}`;
  }
}
