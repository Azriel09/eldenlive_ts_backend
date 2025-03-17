// src/controllers/vtuberController.ts
import { Request, Response } from "express";
import { fetchDeathsData, fetchBossData } from "../database/postgres";

export const getDeathsData = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const data = await fetchDeathsData();
    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in getVtubers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getBossData = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const data = await fetchBossData();
    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in getVtubers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
