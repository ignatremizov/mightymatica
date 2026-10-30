import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ActivityMeta, ActivityProps } from "../shared/contracts";

interface FamilyManifest { manifest: ActivityMeta[] }
interface FamilyModule { default: ComponentType<ActivityProps> }

const manifests = import.meta.glob<FamilyManifest>("../modules/*/manifest.ts", {
  eager: true,
});
const loaders = import.meta.glob<FamilyModule>("../modules/*/index.tsx");

export interface ActivityEntry extends ActivityMeta {
  family: string;
}

export const activities: ActivityEntry[] = Object.entries(manifests).flatMap(
  ([path, { manifest }]) => {
    const family = path.split("/").at(-2)!;
    return manifest.map((activity) => ({ ...activity, family }));
  },
).sort((a, b) => a.title.localeCompare(b.title));

const familyComponents = new Map<string, LazyExoticComponent<ComponentType<ActivityProps>>>();

export function getActivityComponent(family: string) {
  let component = familyComponents.get(family);
  if (!component) {
    const load = loaders[`../modules/${family}/index.tsx`];
    if (!load) throw new Error(`Activity family is unavailable: ${family}`);
    component = lazy(load);
    familyComponents.set(family, component);
  }
  return component;
}
