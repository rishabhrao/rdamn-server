/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import path from "path"

import { createAAnswer, createConsoleLog, createResponse, startUdpServer, useCache, useFallback } from "denamed"
import { HttpReverseProxy, Logger, RouteRegistrationOptions } from "http-reverse-proxy-ts"

import { redis } from "./db"

const proxy = new HttpReverseProxy({
	httpsOptions: {
		port: 443,
		certificateFilename: path.join(__dirname, "../SSL_CERT.pem"),
		keyFilename: path.join(__dirname, "../SSL_KEY.pem"),
		certificates: {
			certificateStoreRoot: path.join(__dirname, "../"),
		},
	},
	log: new Logger(),
})

const routingOptions: RouteRegistrationOptions = {
	https: {
		redirectToHttps: true,
	},
}

startUdpServer(
	useCache(
		useFallback(async dnsQuery => {
			const dnsQueryQuestions = dnsQuery.questions
			if (!dnsQueryQuestions || dnsQueryQuestions.length === 0) {
				return
			}

			const dnsQueryQuestion = dnsQueryQuestions[0]

			if (dnsQueryQuestion.name.includes(`proxy.rdamn.cloud`)) {
				return createResponse(dnsQuery, [createAAnswer(dnsQueryQuestion, process.env.NODE_ENV === "development" ? `127.0.0.1` : `3.111.106.129`, 60)])
			}

			const slug = dnsQueryQuestion.name.split(".")[0]
			const ip = await redis.get(slug)
			if (ip) {
				proxy.addRoute(`${slug}.proxy.rdamn.cloud`, `http://${slug}.rdamn.cloud:1337`, routingOptions)

				return createResponse(dnsQuery, [createAAnswer(dnsQueryQuestion, ip, 60)])
			}

			return createResponse(dnsQuery, [createAAnswer(dnsQueryQuestion, "76.76.21.21", 60)])
		}, "76.76.21.21"),
	),
	{
		log: createConsoleLog(),
		address: "::ffff:0.0.0.0",
		port: process.env.NODE_ENV === "development" ? 12345 : 53,
	},
)
