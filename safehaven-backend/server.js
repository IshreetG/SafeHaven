const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  DynamoDBClient,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DynamoDB client (users table)
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = "users";

// Sensor table may be in a different region (e.g. ca-central-1)
const sensorRegionRaw = process.env.AWS_SENSOR_TABLE_REGION || "";
const sensorRegion = sensorRegionRaw.trim() || process.env.AWS_REGION;
const sensorDynamoClient =
  sensorRegionRaw.trim() && sensorRegion !== process.env.AWS_REGION
    ? new DynamoDBClient({
        region: sensorRegion,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : dynamoClient;
const sensorDocClient = DynamoDBDocumentClient.from(sensorDynamoClient);
const SENSOR_TABLE_NAME =
  process.env.SENSOR_TABLE_NAME || "SafeHavenSensorData";

// Device IDs we want to show on the dashboard (cpu-01 = combined sensor with door, motion, temp, water, pressure, state)
const SENSOR_DEVICE_IDS = ["cpu-01"];

function parsePayload(payload) {
  if (payload == null) return null;
  if (typeof payload === "object") return payload;
  if (typeof payload !== "string") return null;
  try {
    if (payload.startsWith("{")) return JSON.parse(payload);
    const decoded = Buffer.from(payload, "base64").toString("utf8");
    const json = decoded.replace(/^[\s\S]*?Payload:\s*/i, "").trim();
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

// Get numeric or string value from item (fields may be top-level or inside payload object/string)
function getPayload(item) {
  if (!item) return null;
  const p = item.payload;
  if (p == null) return item;
  if (typeof p === "object") return { ...item, ...p };
  const parsed = parsePayload(p);
  return parsed ? { ...item, ...parsed } : item;
}
function num(item, key) {
  const doc = getPayload(item);
  const v = doc[key];
  return v != null ? Number(v) : null;
}
function str(item, key) {
  const doc = getPayload(item);
  const v = doc[key];
  return v != null ? String(v) : null;
}

// Returns one card or an array of cards
function mapSensorToCard(deviceId, item) {
  if (!item) return [];

  // cpu-01: door, water_raw, pressure_raw, motion, water_pct, pressure_pct, state, device, tempC, ts
  if (deviceId === "cpu-01") {
    const door = num(item, "door");
    const waterRaw = num(item, "water_raw");
    const pressureRaw = num(item, "pressure_raw");
    const motion = num(item, "motion");
    const waterPct = num(item, "water_pct");
    const pressurePct = num(item, "pressure_pct");
    const state = str(item, "state");
    const tempC = num(item, "tempC");

    const cards = [];

    cards.push({
      id: `${deviceId}-temp`,
      name: "Temperature",
      reading: tempC != null ? `${tempC}°C` : "No data",
      alert: tempC != null && (tempC > 35 || tempC < 5),
    });

    cards.push({
      id: `${deviceId}-door`,
      name: "Door",
      reading: door === 1 ? "Open" : door === 0 ? "Closed" : door != null ? String(door) : "No data",
      alert: door === 1,
    });

    cards.push({
      id: `${deviceId}-motion`,
      name: "Motion",
      reading: motion === 1 ? "Detected" : motion === 0 ? "None" : motion != null ? String(motion) : "No data",
      alert: motion === 1,
    });

    cards.push({
      id: `${deviceId}-state`,
      name: "State",
      reading: state || "No data",
      alert: state === "INTRUSION",
    });

    cards.push({
      id: `${deviceId}-water`,
      name: "Water",
      reading: waterPct != null ? `${waterPct}%` : waterRaw != null ? `raw ${waterRaw}` : "No data",
      alert: (waterPct != null && waterPct > 0) || (waterRaw != null && waterRaw > 0),
    });

    cards.push({
      id: `${deviceId}-pressure`,
      name: "Pressure",
      reading: pressurePct != null ? `${pressurePct}%` : pressureRaw != null ? `raw ${pressureRaw}` : "No data",
      alert: (pressurePct != null && pressurePct > 0) || (pressureRaw != null && pressureRaw > 0),
    });

    return cards;
  }

  // Legacy device types (single card each)
  const tempThreshold = 28;
  const waterAlertThreshold = 200;

  if (deviceId === "sensor123") {
    const temp = item.temperature != null ? Number(item.temperature) : null;
    const humidity = item.humidity != null ? Number(item.humidity) : null;
    const parts = [];
    if (temp != null) parts.push(`${temp}°C`);
    if (humidity != null) parts.push(`${humidity}% humidity`);
    const reading = parts.length ? parts.join(", ") : "No data";
    const alert = temp != null && temp > tempThreshold;
    return [
      { id: deviceId, name: "Temperature & Humidity", reading, alert },
    ];
  }

  if (deviceId === "pressure") {
    const payload = parsePayload(item.payload);
    const alertStr = payload?.alert || "UNKNOWN";
    const value = payload?.pressure_value ?? payload?.pressure_raw ?? "";
    const reading = value ? `${alertStr} (${value})` : alertStr;
    const alert =
      alertStr === "OUT_OF_BED" ||
      alertStr === "MEDIUM_PRESSURE" ||
      alertStr === "LIGHT_PRESSURE";
    return [{ id: deviceId, name: "Bed pressure", reading, alert }];
  }

  if (deviceId === "water") {
    const payload = parsePayload(item.payload);
    const waterLevel =
      payload?.waterLevel != null ? Number(payload.waterLevel) : null;
    const reading =
      waterLevel != null ? `Water level ${waterLevel}` : "No data";
    const alert = waterLevel != null && waterLevel >= waterAlertThreshold;
    return [{ id: deviceId, name: "Water / flood", reading, alert }];
  }

  return [];
}

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { username: username },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.Item;

    const isValidPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Register endpoint (optional - for creating new users)
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const checkCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { username: username },
    });

    const existingUser = await docClient.send(checkCommand);
    if (existingUser.Item) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        username: username,
        id: userId,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);

    res.json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

function formatLogTime(unixSeconds) {
  if (unixSeconds == null) return "";

  const n = Number(unixSeconds);
  if (Number.isNaN(n)) return "";

  return new Date(n * 1000).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// Build one log entry from a sensor item (cpu-01 style)
function itemToLogEntry(item, index) {
  const doc = getPayload(item);
  const door = num(item, "door");
  const motion = num(item, "motion");
  const state = str(item, "state");
  const tempC = num(item, "tempC");
  const waterPct = num(item, "water_pct");
  const ts = num(item, "unixTime") ?? num(item, "ts");
  const device = str(item, "device") || str(item, "deviceId") || "cpu-01";

  const parts = [];
  if (state === "INTRUSION") parts.push("Intrusion alert");
  if (motion === 1) parts.push("Motion detected");
  if (door === 1) parts.push("Door opened");
  else if (door === 0) parts.push("Door closed");
  if (tempC != null) {
    if (tempC > 35 || tempC < 5) parts.push(`Temperature Alert: ${tempC}°C`);
    else parts.push(`Temperature: ${tempC}°C`);
  }
  if (waterPct != null && waterPct > 0) parts.push(`Water level: ${waterPct}%`);

  const message = parts.length ? parts.join(" | ") : "Sensor event";
  const time = formatLogTime(ts);
  return { id: `${device}-${ts}-${index}`, message, time };
}

// Get recent alert logs from SafeHavenSensorData (same format as before: message + time)
const LOGS_LIMIT = 50;

app.get("/api/logs", async (req, res) => {
  try {
    const logs = [];
    for (const deviceId of SENSOR_DEVICE_IDS) {
      const queryCommand = new QueryCommand({
        TableName: SENSOR_TABLE_NAME,
        KeyConditionExpression: "deviceId = :did",
        ExpressionAttributeValues: { ":did": deviceId },
        Limit: LOGS_LIMIT,
        ScanIndexForward: false,
      });
      const result = await sensorDocClient.send(queryCommand);
      const items = result.Items || [];
      items.forEach((item, i) => {
        logs.push(itemToLogEntry(item, i));
      });
    }
    // Sort by time descending (newest first); entries without time at end
    logs.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return b.time.localeCompare(a.time);
    });
    res.json(logs.slice(0, LOGS_LIMIT));
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      return res.status(503).json({
        error: "Sensor table not found. Check SENSOR_TABLE_NAME and AWS_SENSOR_TABLE_REGION in .env.",
      });
    }
    console.error("Logs error:", error);
    res.status(500).json({ error: "Failed to load alert logs" });
  }
});

// System notifications from SafeHavenSensorDatabaseV2 (deviceType: sensors, alertLog, alertsActive, health flags)
app.get("/api/notifications", async (req, res) => {
  try {
    const deviceId = "cpu-01";
    const queryCommand = new QueryCommand({
      TableName: SENSOR_TABLE_NAME,
      KeyConditionExpression: "deviceId = :did",
      ExpressionAttributeValues: { ":did": deviceId },
      Limit: 1,
      ScanIndexForward: false,
    });
    const result = await sensorDocClient.send(queryCommand);
    const item = result.Items && result.Items[0] ? result.Items[0] : null;

    if (!item) {
      return res.json({
        deviceId,
        offline: false,
        lastSeen: null,
        alertsActive: [],
        battery: { battery_pct: null, lowBattery: 0, predictedHoursLeft: null, dischargeRate: null },
        health: { intrusionDetected: 0, highTemp: 0, waterHigh: 0, pressureHigh: 0, lowBattery: 0 },
        alertLog: [],
        raw: {},
      });
    }
    const payload =
      typeof item.payload === "string"
        ? JSON.parse(item.payload)
        : item.payload || {};

    const alertLogRaw = payload.alertLog?.L || payload.alertLog;

    const alertLog = Array.isArray(alertLogRaw)
      ? alertLogRaw.map((entry, i) => {
          const e = entry.M || entry;

          return {
            id: `log-${i}-${item.unixTime || i}`,
            message: e.message?.S || e.message || "Alert",
            time: e.time?.S || e.time || "",
          };
        })
      : [];
    const alertsActiveRaw = item.alertsActive;
    const alertsActive = Array.isArray(alertsActiveRaw)
      ? alertsActiveRaw.map((a) => (typeof a === "string" ? a : String(a)))
      : [];

    const num = (v) => (v != null ? Number(v) : null);
    const battery = {
      battery_pct: num(item.battery_pct),
      lowBattery: num(item.lowBattery) || 0,
      predictedHoursLeft: num(item.predictedHoursLeft),
      dischargeRate: num(item.dischargeRate),
    };

    const health = {
      intrusionDetected: num(item.intrusionDetected) || 0,
      highTemp: num(item.highTemp) || 0,
      waterHigh: num(item.waterHigh) || 0,
      pressureHigh: num(item.pressureHigh) || 0,
      lowBattery: num(item.lowBattery) || 0,
    };

    res.json({
      deviceId: item.deviceId || deviceId,
      deviceType: item.deviceType || "sensors",
      offline: Boolean(item.offline),
      lastSeen: item.lastSeen != null ? String(item.lastSeen) : null,
      alertsActive,
      battery,
      health,
      alertLog,
      raw: {
        door: num(item.door),
        motion: num(item.motion),
        tempC: num(item.tempC),
        pressure_pct: num(item.pressure_pct),
        water_pct: num(item.water_pct),
      },
    });
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      return res.status(503).json({
        error: "Sensor table not found. Check SENSOR_TABLE_NAME and AWS_SENSOR_TABLE_REGION in .env.",
      });
    }
    console.error("Notifications error:", error);
    res.status(500).json({ error: "Failed to load system notifications" });
  }
});

// Get latest sensor data for dashboard (from safehavensensordata)
app.get("/api/sensors", async (req, res) => {
  try {
    const cards = [];

    for (const deviceId of SENSOR_DEVICE_IDS) {
      const queryCommand = new QueryCommand({
        TableName: SENSOR_TABLE_NAME,
        KeyConditionExpression: "deviceId = :did",
        ExpressionAttributeValues: { ":did": deviceId },
        Limit: 1,
        ScanIndexForward: false,
      });

      const result = await sensorDocClient.send(queryCommand);
      const item = result.Items && result.Items[0] ? result.Items[0] : null;
      const cardList = mapSensorToCard(deviceId, item);
      if (Array.isArray(cardList)) cards.push(...cardList);
    }

    res.json(cards);
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.error(
        "Sensors error: DynamoDB table not found.",
        "Table:",
        SENSOR_TABLE_NAME,
        "Region used for sensor table:",
        sensorRegion
      );
      console.error(
        "Set SENSOR_TABLE_NAME and AWS_SENSOR_TABLE_REGION (e.g. ca-central-1) in .env to match your DynamoDB table."
      );
      return res.status(503).json({
        error:
          "Sensor table not found. Check SENSOR_TABLE_NAME and AWS_SENSOR_TABLE_REGION in .env.",
      });
    }
    console.error("Sensors error:", error);
    res.status(500).json({ error: "Failed to load sensor data" });
  }
});

// Debug: list DynamoDB tables in the sensor region (to verify table name)
app.get("/api/debug-sensor-tables", async (req, res) => {
  try {
    const cmd = new ListTablesCommand({});
    const result = await sensorDynamoClient.send(cmd);
    res.json({
      region: sensorRegion,
      tableNameWeExpect: SENSOR_TABLE_NAME,
      tablesInRegion: result.TableNames || [],
      found: (result.TableNames || []).includes(SENSOR_TABLE_NAME),
    });
  } catch (err) {
    res.status(500).json({
      region: sensorRegion,
      error: err.message,
      code: err.name,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Sensor table: ${SENSOR_TABLE_NAME}, region: ${sensorRegion}`
  );
});
