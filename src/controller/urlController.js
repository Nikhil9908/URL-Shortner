const shortener = require('shortid')
const validUrl = require('valid-url')
const urlModel = require('../models/urlModel')
const redis = require("redis");

const { promisify } = require("util");

//1. Connect to the redis server
const redisClient = redis.createClient(
    10721,
    "redis-10721.c16.us-east-1-3.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("wGuCtqcu61tfLx321OV9DK24x0hV0qwc", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});



//2. Prepare the functions for each command

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const createShortUrl = async function (req, res) {
    try {
        let data = req.body
        let { longUrl } = data

        if (!longUrl) return res.status(400).send({ status: false, message: "longUrl is required !!!" })

        if (typeof longUrl != 'string') return res.status(400).send({ status: false, message: "Long url must be a string" });

        if (!validUrl.isUri(longUrl)) return res.status(400).send({ status: false, message: "Invalid longUrl !!!" })

        let createdUrl = await GET_ASYNC(`${longUrl}`)
        if (createdUrl) {
        return res.status(200).send({ status: false, message: "Short URL is already present.", data: urlData })
        }

        let urlData = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        if (urlData) return res.status(200).send({ status: false, message: "Short URL is already present.", data: urlData })

        let baseUrl = "http://localhost:3000/"
        let urlCode = shortener.generate()
        let shortUrl = baseUrl + urlCode

        let shortUrlData = await urlModel.findOne({ shortUrl: shortUrl, urlCode: urlCode })
        if (shortUrlData) return res.status(400).send({ status: false, message: "Please try again, the generated shortUrl already exist for another longUrl !!!" })

        data.shortUrl = shortUrl
        data.urlCode = urlCode

        let savedData = await urlModel.create(data)

        // await SET_ASYNC(`${longUrl}`, JSON.stringify(short))

        const resultData = {
            longUrl: savedData.longUrl,
            shortUrl: savedData.shortUrl,
            urlCode: savedData.urlCode
        }
        return res.status(201).send({ status: true, data: resultData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const redirectShortUrl = async function (req, res) {
    try {

        let urlCode = req.params.urlCode.toLowerCase()
        if (!urlCode) return res.status(400).send({ status: false, msg: "url code not present in params" })

        let findUrl = await GET_ASYNC(`${urlCode}`)
        console.log(findUrl)
        if (findUrl) {
            let ul = findUrl
            return res.status(302).redirect(ul)
        } else {
            let urlData = await urlModel.findOne({ urlCode: urlCode })
            // console.log(urlData)
            if (!urlData) return res.status(404).send({ status: false, message: "URL not found !!!" })

            await SET_ASYNC(`${urlCode}`, urlData.longUrl)

            return res.status(302).redirect(urlData.longUrl)
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createShortUrl, redirectShortUrl }