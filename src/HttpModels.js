
var crypto = require("crypto"),
    Buffer = require("buffer").Buffer,
    Iconv = require("iconv").Iconv,
    cheerio = require('cheerio');

var Request = function Request(options)
{
    options = options || {};

    this.method = (options.method || 'GET').toUpperCase();
    this.uri = options.uri || null;
    this.payload = options.payload || null;
    this.headers = options.headers || {};
};

Request.prototype.hashCode = function hashCode()
{
    var shasum = crypto.createHash("sha1");

    shasum.update(
        this.method + ":::" + this.uri + ":::" + JSON.stringify(this.payload)
    );

    return shasum.digest("hex");
};

Request.prototype.exportJson = function exportJson()
{
    return {
        method: this.method,
        uri: this.uri,
        payload: this.payload,
        headers: this.headers
    }
};


var Response = function Response(options)
{
    options = options || {};

    this.time = options.time | 0;
    this.request = options.request || null;
    this.headers = options.headers || {};
    this.status = (options.status || 0) | 0;
    var charset = "utf-8";

    if (!(this.request instanceof Request)) {
        this.request = new Request(this.request);
    }

    if (this.getHeader("content-type") && this.getHeader("content-type").indexOf("charset=") > -1) {
        charset = this.getHeader("content-type").substring(this.getHeader("content-type").indexOf("charset=") + 8).trim().toLowerCase();

        if (charset === 'windows-1251') {
            charset = 'cp1251';
        }
    }

    if (charset !== "utf8" && charset !== "utf-8" && options.payload && options.autoconvert) {
        // Converting to UTF8
        var iconv = new Iconv(charset, 'UTF-8');
        var body = new Buffer(options.payload, 'binary');
        this.payload = iconv.convert(body);
    } else {
        this.payload = options.payload || null;
    }

    this.payload = this.payload ? this.payload.toString() : null;
};

Response.prototype.getHeader = function getHeader(name)
{
    if (!name) {
        return "";
    }

    name = name.toLowerCase();

    if (!this.headers.hasOwnProperty(name)) {
        return "";
    }

    return this.headers[name];
};

Response.prototype.exportJson = function exportJson()
{
    return {
        request: this.request.exportJson(),
        time: this.time,
        headers: this.headers,
        status: this.status,
        payload: this.payload
    }
};

Response.prototype.asXml = function asXml()
{
    return this.payload ? cheerio.load(this.payload, {xmlMode: true}) : null;
};

module.exports = {
    Request: Request,
    Response: Response
};