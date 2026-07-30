import type { HomeData } from "../../types";
import { api } from "./client";

export function getHomeData() {
  return api<HomeData>("/home");
}
