import type { FlightConfig } from '../../types/flight'

const DEG = Math.PI / 180

/** M0-T3 starting point. Values are model-space and are tuned by feel, not by
 *  physics — the system is a scale model, so the HUD's km/s is too. */
export const DEFAULT_FLIGHT_CONFIG: FlightConfig = {
  maxSpeedKmS: 1200,
  accelRampS: 18,
  pitchYawRateRadS: 22 * DEG,
  rollRateRadS: 45 * DEG,
  rateRampS: 0.15,
  assistLateralDampS: 0.35,
  assistCoastDecayS: 20,
  rcsStrafeAccelKmS2: 20,
  fineControlScale: 0.1,
}
