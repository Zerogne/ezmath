/**
 * Digital SAT student-produced response rules:
 * - up to 5 characters for a positive answer, 6 for a negative one (the minus sign counts);
 * - fractions and decimals are interchangeable when equal (3/4, .75, 0.75), mixed numbers are not allowed;
 * - a decimal that doesn't fit is truncated or rounded so it fills the space (2/3 → .6666, .6667, 0.666, 0.667).
 */

const satFormat = /^-?(?:\d+(?:\.\d*)?|\.\d+|\d+\/\d+)$/;
const numberFormat = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
const epsilon = 1e-9;

const normalize = (value: string) => value.trim().replace(/\s+/g, "").replace(/,/g, ".").replace(/[−–]/g, "-");
const maxLength = (value: string) => value.startsWith("-") ? 6 : 5;

function toNumber(value: string) {
  const fraction = value.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[2]) === 0 ? null : Number(fraction[1]) / Number(fraction[2]);
  return numberFormat.test(value) ? Number(value) : null;
}

/** True when the value can be entered in an SAT answer box. */
export function isValidSatResponse(value: string) {
  const answer = normalize(value);
  return satFormat.test(answer) && answer.length <= maxLength(answer) && toNumber(answer) !== null;
}

export function satAnswerMatches(response: string, accepted: string) {
  const answer = normalize(response);
  const key = normalize(accepted);
  if (!answer) return false;
  if (answer.toLowerCase() === key.toLowerCase()) return true;
  if (!isValidSatResponse(answer)) return false;
  const value = toNumber(answer);
  const expected = toNumber(key);
  if (value === null || expected === null) return false;
  if (Math.abs(value - expected) < epsilon) return true;
  // A non-terminating answer counts only when it fills the whole box, truncated or rounded.
  const decimals = answer.split(".")[1]?.length ?? 0;
  if (!decimals || answer.includes("/") || answer.length !== maxLength(answer)) return false;
  const scale = 10 ** decimals;
  const truncated = Math.trunc(expected * scale + Math.sign(expected) * epsilon) / scale;
  const rounded = Math.round(expected * scale) / scale;
  return Math.abs(value - truncated) < epsilon || Math.abs(value - rounded) < epsilon;
}
