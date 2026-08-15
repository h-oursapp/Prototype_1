/** A random 5-digit verification code (TODO #2.3), zero-padded so e.g. 42 reads as "00042" —
 *  five digits, not two. Not cryptographically meaningful: the prototype never checks this code
 *  against anything, it just needs to look and read like a real one. */
export function generateVerificationCode(): string {
  const code = Math.floor(Math.random() * 100000)
  return code.toString().padStart(5, '0')
}
