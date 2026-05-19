import { describe, expect, it } from "vitest";
import { parseActivityFile } from "../src/services/activityFileParser.js";

const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase>
  <Activities>
    <Activity Sport="Running">
      <Id>2026-05-18T17:51:22.000Z</Id>
      <Lap StartTime="2026-05-18T17:51:22.000Z">
        <TotalTimeSeconds>600</TotalTimeSeconds>
        <DistanceMeters>1500</DistanceMeters>
        <MaximumSpeed>4</MaximumSpeed>
        <AverageHeartRateBpm><Value>142</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>158</Value></MaximumHeartRateBpm>
        <Track>
          <Trackpoint>
            <Time>2026-05-18T17:51:22.000Z</Time>
            <Position><LatitudeDegrees>52.0</LatitudeDegrees><LongitudeDegrees>4.7</LongitudeDegrees></Position>
            <AltitudeMeters>1</AltitudeMeters>
            <DistanceMeters>0</DistanceMeters>
            <HeartRateBpm><Value>120</Value></HeartRateBpm>
            <Extensions><ns3:TPX><ns3:Speed>2.5</ns3:Speed><ns3:RunCadence>80</ns3:RunCadence><ns3:Watts>180</ns3:Watts></ns3:TPX></Extensions>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-05-18T18:01:22.000Z</Time>
            <Position><LatitudeDegrees>52.01</LatitudeDegrees><LongitudeDegrees>4.71</LongitudeDegrees></Position>
            <AltitudeMeters>5</AltitudeMeters>
            <DistanceMeters>1500</DistanceMeters>
            <HeartRateBpm><Value>158</Value></HeartRateBpm>
            <Extensions><ns3:TPX><ns3:Speed>4</ns3:Speed><ns3:RunCadence>86</ns3:RunCadence><ns3:Watts>220</ns3:Watts></ns3:TPX></Extensions>
          </Trackpoint>
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx>
  <metadata><time>2026-05-18T17:51:22.000Z</time></metadata>
  <trk><trkseg>
    <trkpt lat="52.0" lon="4.7"><ele>1</ele><time>2026-05-18T17:51:22.000Z</time><extensions><ns3:TrackPointExtension><ns3:hr>120</ns3:hr><ns3:cad>80</ns3:cad></ns3:TrackPointExtension></extensions></trkpt>
    <trkpt lat="52.01" lon="4.71"><ele>5</ele><time>2026-05-18T18:01:22.000Z</time><extensions><ns3:TrackPointExtension><ns3:hr>158</ns3:hr><ns3:cad>86</ns3:cad></ns3:TrackPointExtension></extensions></trkpt>
  </trkseg></trk>
</gpx>`;

describe("parseActivityFile", () => {
  it("normalizes TCX activity files into activity records", () => {
    const activity = parseActivityFile({
      athlete_id: "demo-athlete",
      content: tcx,
      file_name: "run.tcx",
      file_type: "tcx"
    });

    expect(activity.distance_km).toBe(1.5);
    expect(activity.total_time_sec).toBe(600);
    expect(activity.avg_hr).toBe(142);
    expect(activity.max_hr).toBe(158);
    expect(activity.max_speed_kmh).toBe(14.4);
    expect(activity.avg_cadence_spm).toBe(166);
    expect(activity.source_track_points).toBe(2);
  });

  it("derives GPX distance from track point coordinates", () => {
    const activity = parseActivityFile({
      athlete_id: "demo-athlete",
      content: gpx,
      file_name: "run.gpx",
      file_type: "gpx"
    });

    expect(activity.distance_km).toBeGreaterThan(1);
    expect(activity.avg_hr).toBe(139);
    expect(activity.source_format).toBe("gpx");
  });
});
