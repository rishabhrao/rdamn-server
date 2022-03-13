/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import path from "path"

import { createAAnswer, createConsoleLog, createResponse, startUdpServer, useCache, useFallback } from "denamed"
import { HttpReverseProxy, Logger } from "http-reverse-proxy-ts"

import { DNS_HOST_NAME, FALLBACK_A_RECORD_IP, NODE_ENV, PROXY_HOST_NAME, SSL_CERT_FULLCHAIN, SSL_CERT_PRIVKEY } from "./constants"
import { redis } from "./db"

const PreviewPort = 1337

const proxy = new HttpReverseProxy({
	httpsOptions:
		NODE_ENV === "development"
			? undefined
			: {
					port: 443,
					certificates: {
						certificateStoreRoot: path.join(__dirname, "../"),
					},
					httpsServerOptions: {
						cert: Buffer.from(SSL_CERT_FULLCHAIN, "base64").toString("ascii"),
						key: Buffer.from(SSL_CERT_PRIVKEY, "base64").toString("ascii"),
					},
			  },
	log: new Logger(),
})

startUdpServer(
	useCache(
		useFallback(async dnsQuery => {
			const dnsQueryQuestions = dnsQuery.questions
			if (!dnsQueryQuestions || dnsQueryQuestions.length === 0) {
				return
			}

			const dnsQueryQuestion = dnsQueryQuestions[0]

			const slug = dnsQueryQuestion.name.split(".")[0]
			const ip = await redis.get(slug)
			if (ip) {
				proxy.addRoute(`${slug}.${PROXY_HOST_NAME}`, `http://${slug}.${DNS_HOST_NAME}:${PreviewPort}`, {
					https: {
						redirectToHttps: true,
					},
				})

				return createResponse(dnsQuery, [createAAnswer(dnsQueryQuestion, ip, 60)])
			}

			return createResponse(dnsQuery, [createAAnswer(dnsQueryQuestion, FALLBACK_A_RECORD_IP, 60)])
		}, FALLBACK_A_RECORD_IP),
	),
	{
		log: NODE_ENV === "development" ? undefined : createConsoleLog(),
		address: "::ffff:0.0.0.0",
		port: NODE_ENV === "development" ? 12345 : 53,
	},
)
