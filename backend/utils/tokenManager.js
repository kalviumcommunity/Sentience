const blacklistedTokens = new Set();

const blacklistToken = (token) => {
  blacklistedTokens.add(token);
};

const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

export { blacklistToken, isTokenBlacklisted };