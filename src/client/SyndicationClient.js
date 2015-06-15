
var SyndicationItem = function SyndicationItem(options)
{
    this.title = options.title || null;
    this.link = options.link || null;
    this.description = options.description || null;
    this.pubDate = options.pubDate ? new Date(options.pubDate) : null;
};

var SyndicationClient = function SyndicationClient(options)
{
    options = options || {};
    this.transport = options.transport;
    this.url = options.url;

    if (!this.transport) {
        throw "options.transport not set"
    }
};

/**
 * @param {string|function} url
 *
 * @return {Promise}
 */
SyndicationClient.prototype.list = function list(url)
{
    return this.transport.send(url || this.url).then(this.parse);
};

/**
 * @param {Response} response
 */
SyndicationClient.prototype.parse = function parse(response)
{
    var $ = response.asXml();
    var nodes = $("item");

    var done = [], i, j;

    for (i=0; i < nodes.length; i++) {
        j = $(nodes[i]);

        done.push(new SyndicationItem({
            title: j.find("title").text(),
            link: j.find("link").text(),
            description: j.find("description").text(),
            pubDate: j.find("pubDate").text(),
            guid: j.find("guid").text()
        }));
    }

    return done;
};


module.exports = {
    Client: SyndicationClient,
    Item: SyndicationItem
};