export {
  CAPTURE_KEY_LIVE_PREFIX,
  CAPTURE_KEY_PREFIX,
  LEGACY_CAPTURE_KEY_PREFIX,
  captureBearerPattern,
  capturePublicKeyValidationMessage,
  generateCapturePublicKeyToken,
  isCapturePublicKey,
  isLegacyCapturePublicKey,
  legacyCaptureKeysAllowedFromEnv,
  normalizeCapturePublicKeyInput,
} from "@spotting/shared/constants/capture-keys";

import { captureBearerPattern } from "@spotting/shared/constants/capture-keys";

/** Default bearer pattern (legacy allowed). Prefer captureBearerPattern() for strict mode. */
export const CAPTURE_PUBLIC_KEY_BEARER_PATTERN = captureBearerPattern();
