/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import Redis from "ioredis"

import { REDIS_URL } from "./constants"

/**
 * A redis db instance
 *
 * @export
 * @returns {Redis.Redis} ioredis client instance
 * @example
 * Set value of key:
 * ```ts
 * await redis.set("key", "val")
 * ```
 * @example
 * Get value of key:
 * ```ts
 * const myVal = await redis.get("key")
 * ```
 */
export const redis: Redis.Redis = new Redis(REDIS_URL, {
	connectTimeout: 60000,
})
