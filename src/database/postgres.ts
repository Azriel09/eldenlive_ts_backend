import { Client } from "pg";
import { VtuberData, InputData, FetchedData } from "./types-postgres";
import dotenv from "dotenv";
dotenv.config();
// Initialize
const client = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASS,
  port: parseInt(process.env.PG_PORT || "5432"),
});

// Connect to the database
export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
  }
}
export default client;

// Insert data into the database
async function insertData(data: InputData) {
  try {
    // Start a transaction
    await client.query("BEGIN");

    for (const [vtuber_name, vtuberData] of Object.entries(data)) {
      console.log(vtuber_name);
      // Insert into `vtuber` table
      const vtuberRes = await client.query(
        "INSERT INTO vtubers (vtuber_name) VALUES ($1) RETURNING id",
        [vtuber_name]
      );
      const vtuberId = vtuberRes.rows[0].id;

      // Insert videos, timestamps, and enemies
      const { video_url, timestamp, enemy } = vtuberData;
      for (let i = 0; i < video_url.length; i++) {
        // Insert into `videos` table
        const videoRes = await client.query(
          "INSERT INTO videos (vtuber_id, url) VALUES ($1, $2) RETURNING id",
          [vtuberId, video_url[i]]
        );
        const videoId = videoRes.rows[0].id;

        // Insert into `timestamps` table
        await client.query(
          "INSERT INTO timestamps (video_id, timestamp) VALUES ($1, $2)",
          [videoId, timestamp[i]]
        );

        // Insert into `enemies` table
        await client.query(
          "INSERT INTO enemies (video_id, enemy) VALUES ($1, $2)",
          [videoId, enemy[i]]
        );
      }
    }

    // Commit the transaction
    await client.query("COMMIT");
    console.log("Data inserted successfully");
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query("ROLLBACK");
    console.error("Error inserting data:", error);
  }
}
// Fetch data from the database
export async function fetchData(): Promise<FetchedData | null> {
  try {
    const result = await client.query(`
      SELECT y.vtuber_name AS vtuber_name, v.url AS video_url, t.timestamp, e.enemy
      FROM vtubers y
      JOIN videos v ON y.id = v.vtuber_id
      JOIN timestamps t ON v.id = t.video_id
      JOIN enemies e ON v.id = e.video_id
    `);

    const data: FetchedData = {};
    result.rows.forEach((row) => {
      const vtuberName = row.vtuber_name;
      if (!vtuberName) return;

      if (!data[vtuberName]) {
        data[vtuberName] = {
          video_url: [],
          timestamp: [],
          enemy: [],
        };
      }

      data[vtuberName].video_url.push(row.video_url);
      data[vtuberName].timestamp.push(row.timestamp);
      data[vtuberName].enemy.push(row.enemy);
    });

    return Object.keys(data).length > 0 ? data : null;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Returns a value in case of error
  }
}

// Main function
// (async () => {
//   await connectToDatabase();

//   // Example data to insert
//   const data = {
//     vtuber1: {
//       video_url: ["url1", "url2"],
//       timestamp: ["timestamp1", "timestamp2"],
//       enemy: ["enemy1", "enemy2"],
//     },
//     vtuber2: {
//       video_url: ["url3", "url4"],
//       timestamp: ["timestamp1", "timestamp3"],
//       enemy: ["enemy1", "enemy3"],
//     },
//   };

//   await insertData(data);
//   await fetchData();

//   await client.end();
// })();
