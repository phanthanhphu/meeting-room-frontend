export const PASSWORD_POLICY = {
  minLength: 12,
  message: 'At least 12 characters with uppercase, lowercase, number and special character.'
};

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '@#$%&*!?';
const ALL = `${UPPER}${LOWER}${DIGITS}${SPECIAL}`;

function randomInt(max) {
  if (max <= 0) return 0;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const array = new Uint32Array(1);
    cryptoApi.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pick(chars) {
  return chars[randomInt(chars.length)];
}

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isValidPassword(password) {
  const value = String(password || '');
  return value.length >= PASSWORD_POLICY.minLength
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /\d/.test(value)
    && /[@#$%&*!?]/.test(value)
    && !/\s/.test(value);
}

export function generateRandomPassword(length = PASSWORD_POLICY.minLength) {
  const safeLength = Math.max(Number(length) || PASSWORD_POLICY.minLength, PASSWORD_POLICY.minLength);
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];
  while (chars.length < safeLength) chars.push(pick(ALL));
  const password = shuffle(chars).join('');
  return isValidPassword(password) ? password : generateRandomPassword(safeLength);
}
