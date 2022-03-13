/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import type { JSONSchemaType } from "ajv"
import envSchema from "env-schema"

type EnvConfigType = {
	NODE_ENV?: "development"
	REDIS_URL: string
	DNS_HOST_NAME: string
	PROXY_HOST_NAME: string
	FALLBACK_A_RECORD_IP: string
	SSL_CERT_FULLCHAIN: string
	SSL_CERT_PRIVKEY: string
}

const EnvConfigSchema: JSONSchemaType<EnvConfigType> = {
	type: "object",
	properties: {
		NODE_ENV: { type: "string", pattern: "^(development)$", nullable: true },
		REDIS_URL: { type: "string", minLength: 1 },
		DNS_HOST_NAME: { type: "string", minLength: 1, nullable: true, default: "play.rdamn.cloud" },
		PROXY_HOST_NAME: { type: "string", minLength: 1, nullable: true, default: "proxy.rdamn.cloud" },
		FALLBACK_A_RECORD_IP: { type: "string", minLength: 1, nullable: true, default: "76.76.21.21" },
		SSL_CERT_FULLCHAIN: { type: "string", minLength: 1, nullable: true, default: "" },
		SSL_CERT_PRIVKEY: { type: "string", minLength: 1, nullable: true, default: "" },
	},
	required: ["REDIS_URL"],
	additionalProperties: false,
}

const envConfig: EnvConfigType = envSchema({
	data: {
		NODE_ENV: process.env.NODE_ENV,
		REDIS_URL: process.env.REDIS_URL,
		DNS_HOST_NAME: process.env.DNS_HOST_NAME,
		PROXY_HOST_NAME: process.env.PROXY_HOST_NAME,
		FALLBACK_A_RECORD_IP: process.env.FALLBACK_A_RECORD_IP,
		SSL_CERT_FULLCHAIN: process.env.SSL_CERT_FULLCHAIN,
		SSL_CERT_PRIVKEY: process.env.SSL_CERT_PRIVKEY,
	},
	schema: EnvConfigSchema,
})

export const { NODE_ENV, REDIS_URL, DNS_HOST_NAME, PROXY_HOST_NAME, FALLBACK_A_RECORD_IP, SSL_CERT_FULLCHAIN, SSL_CERT_PRIVKEY } = envConfig
