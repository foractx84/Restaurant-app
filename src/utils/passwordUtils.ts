/**
 * Check if password format is valid satisfying the following requirements:
 * -length needs to be more than 8 characters
 * -has at least 1 number
 * -has at least 1 uppercase
 * -has at least 1 lowercase
 * -has at least 1 special character
 * @param {string} password password text
 * @param {function} callback error response for invalid password
 * @returns {boolean} whether password is valid
 */
export const passwordIsValid = (password: string): boolean => {
  const hasNumber = testString => {
    return /\d/.test(testString);
  };
  const hasLowerCase = testString => {
    return /[a-z]/.test(testString);
  };
  const hasUpperCase = testString => {
    return /[A-Z]/.test(testString);
  };
  const haveSpecialCharacters = testString => {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(testString);
  };

  if (password.length < 9) {
    return false;
  }
  if (!hasNumber(password)) {
    return false;
  }
  if (!hasUpperCase(password)) {
    return false;
  }
  if (!hasLowerCase(password)) {
    return false;
  }
  if (!haveSpecialCharacters(password)) {
    return false;
  }

  return true;
};
