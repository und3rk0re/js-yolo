
var Request = require("./src/HttpModels").Request,
    HTransport = require("./src/Transports").Http,
    FTransport = require("./src/Transports").FileCache,
    SyndicationClient = require("./src/client/SyndicationClient").Client;


var zoolog = function(msg) {
    console.log(msg);
};

var t = new FTransport({cache: "./cache/"});
var sc = new SyndicationClient({transport: t});

sc.list(process.argv[2]).done(function() {});