/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import path from "path"

import { createAAnswer, createConsoleLog, createResponse, startUdpServer, useCache, useFallback } from "denamed"
import { HttpReverseProxy, Logger } from "http-reverse-proxy-ts"

import { FALLBACK_A_RECORD_IP, HOST_IP, HOST_NAME, NODE_ENV, PROXY_HOST_NAME, SSL_CERT_FULLCHAIN, SSL_CERT_PRIVKEY } from "./constants"
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

			if (dnsQueryQuestion.name.includes(PROXY_HOST_NAME)) {
				return createResponse(dnsQuery, [createAAnswer(dnsQueryQuestion, NODE_ENV === "development" ? `127.0.0.1` : HOST_IP, 60)])
			}

			const slug = dnsQueryQuestion.name.split(".")[0]
			const ip = await redis.get(slug)
			if (ip) {
				proxy.addRoute(`${slug}.${PROXY_HOST_NAME}`, `http://${slug}.${HOST_NAME}:${PreviewPort}`, {
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
		log: createConsoleLog(),
		address: "::ffff:0.0.0.0",
		port: NODE_ENV === "development" ? 12345 : 53,
	},
)
