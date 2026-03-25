/** Mock BVN validation — replace with Youverify / Smile Identity */
export function mockValidateBvn(bvn: string): { ok: boolean; reason?: string } {
  if (!/^\d{11}$/.test(bvn)) {
    return { ok: false, reason: "BVN must be 11 digits" };
  }
  /* Demo: accept any 11-digit; production calls licensed API */
  return { ok: true };
}
