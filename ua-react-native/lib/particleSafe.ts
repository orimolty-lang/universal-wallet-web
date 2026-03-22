import { NativeModules } from "react-native";

const hasNativeModule = (name: string) => !!NativeModules[name];

export const isParticleAvailable =
  hasNativeModule("ParticleBasePlugin") &&
  hasNativeModule("ParticleConnectPlugin");

export function getParticleBase() {
  if (!isParticleAvailable) return null;
  try {
    return require("@particle-network/rn-base");
  } catch {
    return null;
  }
}

export function getParticleConnect() {
  if (!isParticleAvailable) return null;
  try {
    return require("@particle-network/rn-connect");
  } catch {
    return null;
  }
}

export function getParticleChains() {
  try {
    return require("@particle-network/chains");
  } catch {
    return null;
  }
}
