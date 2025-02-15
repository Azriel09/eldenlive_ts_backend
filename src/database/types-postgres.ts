export interface VtuberData {
  video_url: string[];
  timestamp: string[];
  enemy: string[];
}

export interface InputData {
  [vtuber_name: string]: VtuberData;
}

export interface FetchedData {
  [vtuberName: string]: {
    video_url: string[];
    timestamp: string[];
    enemy: string[];
  };
}
