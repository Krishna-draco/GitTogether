/**
 * Validators
 */

export const validateRoomId = (roomId) => {
  if (!roomId) return { valid: false, error: "Room ID is required" };
  if (roomId.length < 3)
    return { valid: false, error: "Room ID must be at least 3 characters" };
  if (!/^[a-z0-9-]+$/.test(roomId)) {
    return {
      valid: false,
      error: "Room ID can only contain lowercase letters, numbers, and hyphens",
    };
  }
  return { valid: true };
};

export const validateUsername = (username) => {
  if (!username) return { valid: false, error: "Username is required" };
  if (username.length < 2)
    return { valid: false, error: "Username must be at least 2 characters" };
  if (username.length > 50)
    return { valid: false, error: "Username must be less than 50 characters" };
  return { valid: true };
};

export const validateCode = (code) => {
  if (!code) return { valid: false, error: "Code cannot be empty" };
  if (code.length < 10)
    return { valid: false, error: "Code must be at least 10 characters" };
  return { valid: true };
};

export const validateGitHubUser = (user) => {
  if (!user) return { valid: false, error: "User information is missing" };
  if (!user.login) return { valid: false, error: "GitHub username is missing" };
  if (!user.avatar_url)
    return { valid: false, error: "GitHub avatar is missing" };
  return { valid: true };
};

export const validateConflictMarkers = (code) => {
  const markerRegex = /^<{7}|^={7}|^>{7}/m;
  return !markerRegex.test(code);
};
