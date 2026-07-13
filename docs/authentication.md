# Authentication flow

Customer phone numbers are normalized to `+97056xxxxxxx` or `+97059xxxxxxx`. OTP requests are keyed-hash stored, expire after five minutes, become unusable after verification, and lock after repeated wrong attempts. The development provider uses a fixed code; production responses never contain it.

Access tokens are signed JWTs with user, role, permissions, expiry and unique token ID. Refresh tokens are opaque random values stored only as keyed hashes. Every refresh rotates the token; reuse revokes the active token family. Logout revokes the supplied refresh token.

Administrative passwords use Argon2 through `pwdlib`. Failed login attempts are persisted per email/IP and lock for fifteen minutes after five failures. Admin API access checks roles, while customer queries scope every resource to the authenticated user to prevent IDOR.

