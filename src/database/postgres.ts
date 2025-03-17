import { Client } from "pg";

import dotenv from "dotenv";
interface EnemyDeath {
  [enemy_name: string]: number;
}

interface VtuberDeaths {
  [vtuber_name: string]: EnemyDeath[];
}
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
export async function fetchDeathsData(): Promise<any> {
  try {
    const result = await client.query(`
      WITH ordered_timestamps AS (
          SELECT 
            v.id as vtuber_id,
            v.vtuber_name,
            vid.id as video_id,
            vid.url as video_url,
            array_agg(t.timestamp ORDER BY t.id) as timestamps,
            array_agg(e.enemy_name ORDER BY t.id) as enemies
          FROM vtubers v
          JOIN videos vid ON v.id = vid.vtuber_id
          JOIN timestamps t ON vid.id = t.video_id
          JOIN enemies e ON t.enemy_id = e.id
          GROUP BY v.id, v.vtuber_name, vid.id, vid.url
          ORDER BY vid.id
        )
        SELECT 
          vtuber_id,
          vtuber_name,
          array_agg(
            json_build_object(
              'video_id', video_id,
              'video_url', video_url,
              'timestamps', timestamps,
              'enemies', enemies
            )
            ORDER BY video_id
          ) as videos
        FROM ordered_timestamps
        GROUP BY vtuber_id, vtuber_name
        ORDER BY vtuber_id;
    `);
    const data = result.rows.map((row) => {
      const videosData = row.videos.reduce((acc: any, video: any) => {
        acc[video.video_url] = {
          timestamps: video.timestamps,
          enemies: video.enemies,
        };
        return acc;
      }, {});

      return {
        [row.vtuber_name]: videosData,
      };
    });

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Returns a value in case of error
  }
}

export async function fetchBossData(): Promise<any> {
  try {
    const result = await client.query(`
        SELECT 
        v.vtuber_name,
        REPLACE(e.enemy_name, ' Boss', '') AS enemy_name,
        COUNT(*) as death_count
      FROM 
        vtubers v
      JOIN 
        videos vid ON v.id = vid.vtuber_id
      JOIN 
        timestamps t ON vid.id = t.video_id
      JOIN 
        enemies e ON t.enemy_id = e.id
      WHERE
        e.enemy_name LIKE '% Boss%'
      GROUP BY 
        v.vtuber_name, REPLACE(e.enemy_name, ' Boss', '')
      ORDER BY 
        v.vtuber_name, death_count DESC
    `);
    const formattedData: VtuberDeaths = {};

    result.rows.forEach((row) => {
      if (!formattedData[row.vtuber_name]) {
        formattedData[row.vtuber_name] = [];
      }

      formattedData[row.vtuber_name].push({
        [row.enemy_name]: parseInt(row.death_count),
      });
    });
    return formattedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Returns a value in case of error
  }
}
