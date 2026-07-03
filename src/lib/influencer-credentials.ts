import type { Influencer } from "./types";
import { slugifyName } from "./influencer-slug";

export interface InfluencerCredentials {
  platformUrl: string;
  login: string;
  password: string;
}

const CREDENTIALS_BY_KEY: Record<string, InfluencerCredentials> = {
  steshka: {
    platformUrl: "https://www.sayyo.ru/steshkaaaaaa",
    login: "steshkaaaaaa",
    password: "Senha123@",
  },
  steshkaaaaaa: {
    platformUrl: "https://www.sayyo.ru/steshkaaaaaa",
    login: "steshkaaaaaa",
    password: "Senha123@",
  },
  danya: {
    platformUrl: "https://www.sayyo.ru/danya_bakhteev",
    login: "danya_bakhteev",
    password: "Senha123@",
  },
  danya_bakhteev: {
    platformUrl: "https://www.sayyo.ru/danya_bakhteev",
    login: "danya_bakhteev",
    password: "Senha123@",
  },
  "danya-bakhteev": {
    platformUrl: "https://www.sayyo.ru/danya_bakhteev",
    login: "danya_bakhteev",
    password: "Senha123@",
  },
  timur: {
    platformUrl: "https://www.sayyo.ru/timurtopaboy",
    login: "timurtopaboy",
    password: "Senha123@",
  },
  timurtopaboy: {
    platformUrl: "https://www.sayyo.ru/timurtopaboy",
    login: "timurtopaboy",
    password: "Senha123@",
  },
  go: {
    platformUrl: "https://www.sayyo.ru/vashaago",
    login: "vashaago",
    password: "Senha123@",
  },
  vashaago: {
    platformUrl: "https://www.sayyo.ru/vashaago",
    login: "vashaago",
    password: "Senha123@",
  },
  amik: {
    platformUrl: "https://www.sayyo.ru/ameeaaep",
    login: "ameeaaep",
    password: "Senha123@",
  },
  ameeaaep: {
    platformUrl: "https://www.sayyo.ru/ameeaaep",
    login: "ameeaaep",
    password: "Senha123@",
  },
  yana: {
    platformUrl: "https://www.sayyo.ru/yanamisineva",
    login: "yanamisineva",
    password: "Senha123@",
  },
  yanamisineva: {
    platformUrl: "https://www.sayyo.ru/yanamisineva",
    login: "yanamisineva",
    password: "Senha123@",
  },
  nastya: {
    platformUrl: "https://www.sayyo.ru/makaryshaa",
    login: "makaryshaa",
    password: "Senha123@",
  },
  makaryshaa: {
    platformUrl: "https://www.sayyo.ru/makaryshaa",
    login: "makaryshaa",
    password: "Senha123@",
  },
  kristimas: {
    platformUrl: "https://www.sayyo.ru/nastuyshkakristmas",
    login: "nastuyshkakristmas",
    password: "Senha123@",
  },
  kristmas: {
    platformUrl: "https://www.sayyo.ru/nastuyshkakristmas",
    login: "nastuyshkakristmas",
    password: "Senha123@",
  },
  nastuyshkakristmas: {
    platformUrl: "https://www.sayyo.ru/nastuyshkakristmas",
    login: "nastuyshkakristmas",
    password: "Senha123@",
  },
};

function lookupKey(key: string): InfluencerCredentials | null {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return null;
  return CREDENTIALS_BY_KEY[normalized] ?? null;
}

export function getInfluencerCredentials(
  influencer: Pick<Influencer, "slug" | "name">
): InfluencerCredentials | null {
  const candidates = [
    influencer.slug ?? "",
    slugifyName(influencer.name),
    influencer.name.trim().toLowerCase(),
    influencer.name.trim().toLowerCase().split(/\s+/)[0] ?? "",
  ];

  for (const candidate of candidates) {
    const found = lookupKey(candidate);
    if (found) return found;
  }

  return null;
}
