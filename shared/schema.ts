import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Decryption request schema
export const decryptionRequestSchema = z.object({
  mediaKey: z.string().min(1, "Media key is required"),
  mediaType: z.enum(["audio", "video", "image", "voice", "document"]),
});

export type DecryptionRequest = z.infer<typeof decryptionRequestSchema>;

// Decryption response schema
export const decryptionResponseSchema = z.object({
  success: z.boolean(),
  originalSize: z.number().optional(),
  decryptedSize: z.number().optional(),
  mediaType: z.string().optional(),
  error: z.string().optional(),
});

export type DecryptionResponse = z.infer<typeof decryptionResponseSchema>;
