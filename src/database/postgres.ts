import { Client } from "pg";

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

// Connect to database
export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
  }
}
export default client;

// Fetch data from database
export async function fetchData(): Promise<any> {
  try {
    const result = await client.query(`
  WITH ordered_data AS (
          SELECT 
            v.vtuber_name,
            vid.id as video_id,
            vid.url as video_url,
            t.timestamp,
            e.enemy_name,
            ROW_NUMBER() OVER (PARTITION BY v.vtuber_name, vid.url ORDER BY t.id) as rn
          FROM vtubers v
          JOIN videos vid ON v.id = vid.vtuber_id
          JOIN timestamps t ON vid.id = t.video_id
          JOIN enemies e ON t.enemy_id = e.id
          ORDER BY vid.id
        ),
        video_data AS (
          SELECT 
            vtuber_name,
            video_url,
            array_agg(timestamp ORDER BY rn) as timestamps,
            array_agg(enemy_name ORDER BY rn) as enemies
          FROM ordered_data
          GROUP BY vtuber_name, video_id, video_url
          ORDER BY video_id
        )
        SELECT 
          vtuber_name,
          json_object_agg(
            video_url,
            json_build_object(
              'timestamps', timestamps,
              'enemies', enemies
            )
          ) as video_data
        FROM video_data
        GROUP BY vtuber_name;
    `);

    const data = result.rows.map((row) => ({
      [row.vtuber_name]: row.video_data,
    }));

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Returns a value in case of error
  }
}
