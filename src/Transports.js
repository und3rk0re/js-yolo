"use strict";

// Includes
var request = require("request")
    , Log = require("sgwin").with("transport")
    , Request = require("./HttpModels").Request
    , Response = require("./HttpModels").Response
    , Promise = require("promise")
    , fs = require("fs");


/**
 * User agents list
 */
var userAgents = [
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:38.0) Gecko/20100101 Firefox/38.0"
];

userAgents.random = function random() {
    return userAgents[(Math.random() * userAgents.length) | 0];
};

/**
 * Utility function to replace header value with default one
 *
 * @param {object} headers
 * @param {string} name
 * @param value
 */
var defaultHeader = function defaultHeader(headers, name, value) {
    if (!headers[name]) {
        headers[name] = typeof value === "function" ? value() : value;
    }
};

var HttpTransport = function HttpTransport(options)
{
    options = options || {};
    this.log = Log.with("httptr");
};

/**
 * Sends a request
 *
 * @param {string|Request} req
 * @return {Promise}
 */
HttpTransport.prototype.send = function send(req)
{
    if (typeof req === "string") {
        this.log.info("Folding :req info GET request", {req: req});
        req = new Request({uri: req});
    }

    // Default headers
    defaultHeader(req.headers, "User-Agent", userAgents.random());
    defaultHeader(req.headers, "Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    defaultHeader(req.headers, "Accept-Language", "en-US,en;q=0.5");
    defaultHeader(req.headers, "Connection", "close");


    // Building options array
    var options = {
        encoding: null,
        method: req.method,
        url: req.uri,
        headers: req.headers
    };

    // Sending request
    var date = new Date(), that = this;

    this.log.out("Sending :method :url", {method: options.method, url: options.url});

    return new Promise(function (resolve, reject) {
        request(options, function(error, response, body) {
            if (error) {
                that.log.fail("HTTP error :error", {error: error});
                reject(error);
            } else {
                var delta = new Date().getTime() - date.getTime();
                that.log.in("HTTP success with code :code in :time sec", {code: response.statusCode, time: delta/1000});
                var resp = new Response({
                    time: delta,
                    request: req,
                    status: response.statusCode,
                    headers: response.headers,
                    payload: body,
                    autoconvert: true
                });

                resolve(resp);
            }
        });
    });
};

var FileCachedTransport = function FileCachedTransport(options)
{
    options = options || {};

    if (options.cache && typeof options.cache === "string") {
        this.cacheFolder = options.cache.substring(options.cache.length - 1, options.cache.length) === "/" ? options.cache : options.cache + "/";
    } else {
        throw "No cache folder configured";
    }

    this.transport = options.transport || new HttpTransport(options);
    this.log = Log.with("httpfctr");
};

/**
 * Calculates filename for caching
 *
 * @param req
 * @return {string}
 */
FileCachedTransport.prototype.getCacheFilename = function getCacheFilename(req)
{
    return this.cacheFolder + req.hashCode() + ".cache";
};

/**
 * @param {Request} req
 * @return {Promise}
 */
FileCachedTransport.prototype.send = function send(req)
{
    if (typeof req === "string") {
        this.log.info("Folding :req info GET request", {req: req});
        req = new Request({uri: req});
    }

    this.log.info("Cache enabled in :folder", {folder: this.cacheFolder});
    var that = this;

    return new Promise(function (resolve, reject) {
        fs.exists(that.getCacheFilename(req), function existsCheck(result) {
            if (!result) {
                that.log.info("Cache entry :name not found ", {name: that.getCacheFilename(req)});
                that.transport.send(req).done(
                    function(x) {
                        // Storing to file cache
                        try {
                            fs.writeFile(
                                that.getCacheFilename(req),
                                JSON.stringify(x.exportJson()),
                                function (err) {
                                    if (err) {
                                        that.log.fail("Failed to cache :name :error", {name: that.getCacheFilename(req), error: err});
                                    } else {
                                        that.log.info("Cached :name", {name: that.getCacheFilename(req)});
                                    }
                                }
                            );
                        } catch (e) {

                        }
                        resolve(x);
                    },
                    function(x) {reject(x)}
                );
            } else {
                that.log.success("Cache entry :name exists, using it", {name: that.getCacheFilename(req)});
                fs.readFile(that.getCacheFilename(req), function(err, data) {
                    if (err) {
                        that.log.fail("Error reading :name :error", {name: that.getCacheFilename(req), error: err});
                        reject(err);
                    } else {
                        try {
                            resolve(new Response(JSON.parse(data)));
                            that.log.info("Cache read success");
                        } catch (e) {
                            that.log.fail(e);
                            reject(e);
                        }
                    }
                });
            }
        });
    });
};

module.exports = {
    Http: HttpTransport,
    FileCache: FileCachedTransport
};