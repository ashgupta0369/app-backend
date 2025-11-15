// Simple in-memory token blacklist
// For production, use Redis or database storage
class TokenBlacklist {
  constructor() {
    this.blacklistedTokens = new Set();
    this.tokenExpiries = new Map();
    
    // Clean up expired tokens every hour
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  // Add token to blacklist
  addToken(token, expiresAt) {
    this.blacklistedTokens.add(token);
    this.tokenExpiries.set(token, expiresAt);
  }

  // Check if token is blacklisted
  isTokenBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }

  // Remove expired tokens from blacklist
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, expiresAt] of this.tokenExpiries.entries()) {
      if (now > expiresAt) {
        this.blacklistedTokens.delete(token);
        this.tokenExpiries.delete(token);
      }
    }
  }

  // Clear all tokens (for testing purposes)
  clearAll() {
    this.blacklistedTokens.clear();
    this.tokenExpiries.clear();
  }

  // Get blacklist size (for monitoring)
  getSize() {
    return this.blacklistedTokens.size;
  }
}

// Create singleton instance
const tokenBlacklist = new TokenBlacklist();

export default tokenBlacklist;