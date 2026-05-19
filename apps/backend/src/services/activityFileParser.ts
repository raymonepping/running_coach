import type { ActivityRecord } from "../domain/types.js";

type ActivityImport = Omit<ActivityRecord, "id" | "type" | "created_at" | "updated_at" | "schema_version">;

export interface ActivityFileInput {
  athlete_id: string;
  source?: ActivityRecord["source"];
  file_name: string;
  file_type: "gpx" | "tcx";
  content: string;
}

interface TrackPoint {
  time?: string;
  distanceM?: number;
  elevationM?: number;
  heartRate?: number;
  cadence?: number;
  speedMps?: number;
  watts?: number;
  latitude?: number;
  longitude?: number;
}

interface ParsedActivityFile {
  name?: string;
  startTime?: string;
  totalTimeSec?: number;
  totalDistanceM?: number;
  maxSpeedMps?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  laps: number;
  points: TrackPoint[];
}

export function parseActivityFile(input: ActivityFileInput): ActivityImport {
  const parsed = input.file_type === "tcx" ? parseTcx(input.content) : parseGpx(input.content);
  if (parsed.points.length < 2 && !parsed.totalDistanceM) {
    throw new Error(`Unable to extract activity data from ${input.file_type.toUpperCase()} file.`);
  }

  const metrics = deriveMetrics(parsed);

  return {
    athlete_id: input.athlete_id,
    source: input.source ?? "garmin_export",
    distance_km: metrics.distanceKm,
    avg_pace_sec_per_km: metrics.avgPaceSecPerKm,
    avg_moving_pace_sec_per_km: metrics.avgMovingPaceSecPerKm,
    best_pace_sec_per_km: metrics.bestPaceSecPerKm,
    avg_speed_kmh: metrics.avgSpeedKmh,
    max_speed_kmh: metrics.maxSpeedKmh,
    total_time_sec: metrics.totalTimeSec,
    moving_time_sec: metrics.movingTimeSec,
    elapsed_time_sec: metrics.elapsedTimeSec,
    run_time_sec: metrics.runTimeSec,
    walk_time_sec: metrics.walkTimeSec,
    avg_hr: metrics.avgHr,
    max_hr: metrics.maxHr,
    beginning_stamina_pct: 100,
    ending_stamina_pct: estimateEndingStamina(metrics.exerciseLoad, metrics.avgHr),
    min_stamina_pct: estimateEndingStamina(metrics.exerciseLoad, metrics.avgHr),
    primary_benefit: classifyBenefit(metrics.avgHr, metrics.avgSpeedKmh),
    aerobic_effect: estimateAerobicEffect(metrics.totalTimeSec, metrics.avgHr),
    anaerobic_effect: estimateAnaerobicEffect(metrics.maxSpeedKmh, metrics.avgSpeedKmh),
    exercise_load: metrics.exerciseLoad,
    avg_power_w: metrics.avgPowerW,
    max_power_w: metrics.maxPowerW,
    avg_cadence_spm: metrics.avgCadenceSpm,
    max_cadence_spm: metrics.maxCadenceSpm,
    avg_stride_length_m: metrics.avgStrideLengthM,
    avg_vertical_ratio_pct: 0,
    avg_vertical_oscillation_cm: 0,
    avg_ground_contact_time_ms: 0,
    avg_gc_time_balance_left_pct: 50,
    avg_gc_time_balance_right_pct: 50,
    total_ascent_m: metrics.totalAscentM,
    total_descent_m: metrics.totalDescentM,
    source_file_name: input.file_name,
    source_format: input.file_type,
    source_started_at: parsed.startTime,
    source_track_points: parsed.points.length,
    source_laps: parsed.laps
  };
}

function parseTcx(xml: string): ParsedActivityFile {
  const lapBlocks = matchBlocks(xml, "Lap");
  const pointBlocks = matchBlocks(xml, "Trackpoint");
  const points = pointBlocks.map(parseTcxTrackPoint);
  const lapDistances = lapBlocks.map((lap) => firstNumber(lap, "DistanceMeters")).filter(isNumber);
  const lapDurations = lapBlocks.map((lap) => firstNumber(lap, "TotalTimeSeconds")).filter(isNumber);
  const lapMaxSpeeds = lapBlocks.map((lap) => firstNumber(lap, "MaximumSpeed")).filter(isNumber);
  const lapAvgHrs = lapBlocks.map((lap) => firstNestedNumber(lap, "AverageHeartRateBpm", "Value")).filter(isNumber);
  const lapMaxHrs = lapBlocks.map((lap) => firstNestedNumber(lap, "MaximumHeartRateBpm", "Value")).filter(isNumber);

  return {
    startTime: firstText(xml, "Id") ?? points[0]?.time,
    totalTimeSec: sum(lapDurations),
    totalDistanceM: sum(lapDistances) || lastNumber(points.map((point) => point.distanceM)),
    maxSpeedMps: max(lapMaxSpeeds) || max(points.map((point) => point.speedMps).filter(isNumber)),
    averageHeartRate: weightedAverage(lapAvgHrs, lapDurations),
    maxHeartRate: max(lapMaxHrs) || max(points.map((point) => point.heartRate).filter(isNumber)),
    laps: lapBlocks.length,
    points
  };
}

function parseGpx(xml: string): ParsedActivityFile {
  const pointBlocks = matchFullBlocks(xml, "trkpt");
  const points = pointBlocks.map(parseGpxTrackPoint);
  return {
    name: firstText(xml, "name"),
    startTime: firstText(xml, "time") ?? points[0]?.time,
    laps: 1,
    points
  };
}

function parseTcxTrackPoint(block: string): TrackPoint {
  return {
    time: firstText(block, "Time"),
    distanceM: firstNumber(block, "DistanceMeters"),
    elevationM: firstNumber(block, "AltitudeMeters"),
    heartRate: firstNestedNumber(block, "HeartRateBpm", "Value"),
    cadence: firstNumber(block, "RunCadence"),
    speedMps: firstNumber(block, "Speed"),
    watts: firstNumber(block, "Watts"),
    latitude: firstNumber(block, "LatitudeDegrees"),
    longitude: firstNumber(block, "LongitudeDegrees")
  };
}

function parseGpxTrackPoint(block: string): TrackPoint {
  return {
    time: firstText(block, "time"),
    elevationM: firstNumber(block, "ele"),
    heartRate: firstNumber(block, "hr"),
    cadence: firstNumber(block, "cad"),
    latitude: firstAttributeNumber(block, "lat"),
    longitude: firstAttributeNumber(block, "lon")
  };
}

function deriveMetrics(parsed: ParsedActivityFile) {
  const points = parsed.points;
  const heartRates = points.map((point) => point.heartRate).filter(isNumber);
  const cadences = normalizeCadence(points.map((point) => point.cadence).filter(isNumber));
  const watts = points.map((point) => point.watts).filter(isNumber);
  const elevations = points.map((point) => point.elevationM).filter(isNumber);
  const timeRange = deriveTimeRange(points);
  const totalDistanceM = parsed.totalDistanceM ?? deriveDistanceMeters(points);
  const totalTimeSec = round(parsed.totalTimeSec ?? timeRange.elapsedTimeSec);
  const elapsedTimeSec = round(timeRange.elapsedTimeSec || totalTimeSec);
  const movingTimeSec = round(deriveMovingTime(points, totalTimeSec));
  const distanceKm = round(totalDistanceM / 1000, 2);
  const maxSpeedMps = parsed.maxSpeedMps ?? deriveMaxSpeed(points);
  const avgHr = round(parsed.averageHeartRate ?? average(heartRates));
  const maxHr = round(parsed.maxHeartRate ?? max(heartRates));
  const avgSpeedKmh = round((totalDistanceM / Math.max(totalTimeSec, 1)) * 3.6, 1);
  const maxSpeedKmh = round(maxSpeedMps * 3.6, 1);
  const avgCadenceSpm = round(average(cadences));
  const maxCadenceSpm = round(max(cadences));
  const exerciseLoad = estimateExerciseLoad(totalTimeSec, avgHr);

  return {
    distanceKm,
    avgPaceSecPerKm: pace(totalTimeSec, distanceKm),
    avgMovingPaceSecPerKm: pace(movingTimeSec || totalTimeSec, distanceKm),
    bestPaceSecPerKm: maxSpeedMps > 0 ? round(1000 / maxSpeedMps) : pace(totalTimeSec, distanceKm),
    avgSpeedKmh,
    maxSpeedKmh,
    totalTimeSec,
    movingTimeSec,
    elapsedTimeSec,
    runTimeSec: round(deriveRunTime(points, totalTimeSec)),
    walkTimeSec: round(Math.max(0, totalTimeSec - deriveRunTime(points, totalTimeSec))),
    avgHr,
    maxHr,
    exerciseLoad,
    avgPowerW: round(average(watts)),
    maxPowerW: round(max(watts)),
    avgCadenceSpm,
    maxCadenceSpm,
    avgStrideLengthM: avgCadenceSpm > 0 ? round((avgSpeedKmh * 1000) / 60 / avgCadenceSpm, 2) : 0,
    ...deriveElevation(elevations)
  };
}

function deriveTimeRange(points: TrackPoint[]) {
  const times = points.map((point) => (point.time ? Date.parse(point.time) : undefined)).filter(isNumber);
  if (times.length < 2) return { elapsedTimeSec: 0 };
  return { elapsedTimeSec: Math.max(0, (times[times.length - 1] - times[0]) / 1000) };
}

function deriveMovingTime(points: TrackPoint[], fallbackTotalTimeSec: number): number {
  const intervals = deriveIntervals(points);
  const moving = intervals.filter((interval) => interval.speedMps >= 0.5).reduce((total, interval) => total + interval.durationSec, 0);
  return moving || fallbackTotalTimeSec;
}

function deriveRunTime(points: TrackPoint[], fallbackTotalTimeSec: number): number {
  const intervals = deriveIntervals(points);
  const running = intervals.filter((interval) => interval.speedMps >= 2).reduce((total, interval) => total + interval.durationSec, 0);
  return running || fallbackTotalTimeSec;
}

function deriveIntervals(points: TrackPoint[]) {
  const intervals: Array<{ durationSec: number; speedMps: number }> = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous.time || !current.time) continue;
    const durationSec = Math.max(0, (Date.parse(current.time) - Date.parse(previous.time)) / 1000);
    if (durationSec <= 0) continue;
    const speedMps =
      current.speedMps ??
      (isNumber(current.distanceM) && isNumber(previous.distanceM)
        ? Math.max(0, current.distanceM - previous.distanceM) / durationSec
        : distanceBetweenPoints(previous, current) / durationSec);
    intervals.push({ durationSec, speedMps });
  }
  return intervals;
}

function deriveDistanceMeters(points: TrackPoint[]): number {
  const lastDistance = lastNumber(points.map((point) => point.distanceM));
  if (lastDistance) return lastDistance;

  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceBetweenPoints(points[index - 1], points[index]);
  }
  return total;
}

function deriveMaxSpeed(points: TrackPoint[]): number {
  const direct = max(points.map((point) => point.speedMps).filter(isNumber));
  if (direct > 0) return direct;
  return max(deriveIntervals(points).map((interval) => interval.speedMps));
}

function deriveElevation(elevations: number[]) {
  let totalAscentM = 0;
  let totalDescentM = 0;
  for (let index = 1; index < elevations.length; index += 1) {
    const delta = elevations[index] - elevations[index - 1];
    if (delta > 0) totalAscentM += delta;
    if (delta < 0) totalDescentM += Math.abs(delta);
  }
  return {
    totalAscentM: round(totalAscentM),
    totalDescentM: round(totalDescentM)
  };
}

function classifyBenefit(avgHr: number, avgSpeedKmh: number): string {
  if (avgHr >= 165 || avgSpeedKmh >= 13) return "Tempo / High Aerobic";
  if (avgHr >= 145) return "Base / Aerobic";
  return "Base (Low Aerobic)";
}

function estimateExerciseLoad(totalTimeSec: number, avgHr: number): number {
  return round((totalTimeSec / 60) * Math.max(avgHr - 80, 20) * 0.018);
}

function estimateAerobicEffect(totalTimeSec: number, avgHr: number): number {
  const minutes = totalTimeSec / 60;
  const effect = 1 + minutes / 35 + Math.max(0, avgHr - 120) / 45;
  return round(Math.min(5, Math.max(0, effect)), 1);
}

function estimateAnaerobicEffect(maxSpeedKmh: number, avgSpeedKmh: number): number {
  if (avgSpeedKmh <= 0) return 0;
  return round(Math.min(3, Math.max(0, (maxSpeedKmh / avgSpeedKmh - 1.35) * 1.5)), 1);
}

function estimateEndingStamina(exerciseLoad: number, avgHr: number): number {
  return Math.max(40, round(100 - exerciseLoad * 0.12 - Math.max(0, avgHr - 135) * 0.1));
}

function pace(seconds: number, distanceKm: number): number {
  return distanceKm > 0 ? round(seconds / distanceKm) : 0;
}

function distanceBetweenPoints(a: TrackPoint, b: TrackPoint): number {
  if (!isNumber(a.latitude) || !isNumber(a.longitude) || !isNumber(b.latitude) || !isNumber(b.longitude)) return 0;
  const earthRadiusM = 6371000;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function normalizeCadence(values: number[]): number[] {
  const nonZero = values.filter((value) => value > 0);
  if (average(nonZero) > 0 && average(nonZero) < 100) return nonZero.map((value) => value * 2);
  return nonZero;
}

function matchBlocks(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, "gi"))].map(
    (match) => match[1]
  );
}

function matchFullBlocks(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`(<(?:\\w+:)?${tag}\\b[^>]*>[\\s\\S]*?<\\/(?:\\w+:)?${tag}>)`, "gi"))].map(
    (match) => match[1]
  );
}

function firstText(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, "i"));
  return match?.[1]?.trim();
}

function firstNumber(xml: string, tag: string): number | undefined {
  const value = Number(firstText(xml, tag));
  return Number.isFinite(value) ? value : undefined;
}

function firstNestedNumber(xml: string, parentTag: string, childTag: string): number | undefined {
  const block = matchBlocks(xml, parentTag)[0];
  return block ? firstNumber(block, childTag) : undefined;
}

function firstAttributeNumber(xml: string, attributeName: string): number | undefined {
  const match = xml.match(new RegExp(`${attributeName}="([^"]+)"`, "i"));
  const value = Number(match?.[1]);
  return Number.isFinite(value) ? value : undefined;
}

function sum(values: number[]): number | undefined {
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) : undefined;
}

function weightedAverage(values: number[], weights: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const totalWeight = weights.slice(0, values.length).reduce((total, weight) => total + weight, 0);
  if (totalWeight <= 0) return average(values);
  return values.reduce((total, value, index) => total + value * weights[index], 0) / totalWeight;
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function max(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

function lastNumber(values: Array<number | undefined>): number | undefined {
  return values.filter(isNumber).at(-1);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
