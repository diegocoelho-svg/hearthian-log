import {
  achievementIdSchema,
  curiosityIdSchema,
  factIdSchema,
  locationIdSchema,
} from "@hearthian/core";
import { z } from "zod";
import { achievementCountsSchema, countSchema, loopsSchema } from "./shared.ts";

const name = z.string().min(1);

const progressSchema = z.strictObject({
  loops: loopsSchema,
  facts: countSchema,
  unread: z.number().int().nonnegative(),
  signals: countSchema,
});

const visitedLocationSchema = z.strictObject({
  id: locationIdSchema,
  name,
  facts: countSchema,
});

const locationSchema = visitedLocationSchema.extend({ visited: z.boolean() });

const visitedCuriositySchema = z.strictObject({
  id: curiosityIdSchema,
  name,
  facts: countSchema,
});

const factTitleSchema = z.strictObject({
  id: factIdSchema,
  title: name,
  revealed: z.boolean(),
  read: z.boolean(),
});

const factFullSchema = factTitleSchema.extend({ text: z.string() });

const curiosityTitlesSchema = z.strictObject({
  id: curiosityIdSchema,
  name,
  facts: z.array(factTitleSchema),
});

const curiosityFullSchema = curiosityTitlesSchema.extend({ facts: z.array(factFullSchema) });

const achievementStatusSchema = z.enum(["unlocked", "locked", "unknown"]);

const achievementNameSchema = z.strictObject({
  id: achievementIdSchema,
  name,
  hidden: z.boolean(),
  status: achievementStatusSchema,
  reachable: z.boolean(),
});

const achievementFullSchema = achievementNameSchema.extend({
  description: z.string(),
  hints: z.tuple([z.string(), z.string(), z.string()]),
});

export const dashboardViewNoneSchema = progressSchema.extend({
  level: z.literal("none"),
  locations: z.array(visitedLocationSchema),
  curiosities: z.array(visitedCuriositySchema),
  achievements: achievementCountsSchema,
});

export const dashboardViewLocationsSchema = progressSchema.extend({
  level: z.literal("locations"),
  locations: z.array(locationSchema),
  curiosities: z.array(visitedCuriositySchema),
  achievements: achievementCountsSchema,
});

export const dashboardViewTitlesSchema = progressSchema.extend({
  level: z.literal("titles"),
  locations: z.array(locationSchema),
  curiosities: z.array(curiosityTitlesSchema),
  achievements: z.strictObject({
    counts: achievementCountsSchema,
    list: z.array(achievementNameSchema),
  }),
});

export const dashboardViewFullSchema = progressSchema.extend({
  level: z.literal("full"),
  locations: z.array(locationSchema),
  curiosities: z.array(curiosityFullSchema),
  achievements: z.strictObject({
    counts: achievementCountsSchema,
    list: z.array(achievementFullSchema),
  }),
});

export const dashboardViewSchema = z.discriminatedUnion("level", [
  dashboardViewNoneSchema,
  dashboardViewLocationsSchema,
  dashboardViewTitlesSchema,
  dashboardViewFullSchema,
]);

export type DashboardViewNone = z.output<typeof dashboardViewNoneSchema>;
export type DashboardViewLocations = z.output<typeof dashboardViewLocationsSchema>;
export type DashboardViewTitles = z.output<typeof dashboardViewTitlesSchema>;
export type DashboardViewFull = z.output<typeof dashboardViewFullSchema>;
export type DashboardView = z.output<typeof dashboardViewSchema>;
export type VisitedLocationView = z.output<typeof visitedLocationSchema>;
export type LocationView = z.output<typeof locationSchema>;
export type VisitedCuriosityView = z.output<typeof visitedCuriositySchema>;
export type FactTitleView = z.output<typeof factTitleSchema>;
export type FactFullView = z.output<typeof factFullSchema>;
export type AchievementNameView = z.output<typeof achievementNameSchema>;
export type AchievementFullView = z.output<typeof achievementFullSchema>;
export type AchievementStatus = z.output<typeof achievementStatusSchema>;
