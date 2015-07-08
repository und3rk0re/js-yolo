
var Request = require("./../lib/HttpModels").Request
    , FTransport = require("./../lib/Transports").FileCache
    , SyndicationClient = require("./../lib/client/SyndicationClient").Client
    , Out = require("sgwin")
    ;


var t = new FTransport({cache: "./cache/"});
var sc = new SyndicationClient({transport: t});
var url = process.argv[2];

sc.list(url).done(function(x) {
    Out.fancyPrint(
        "Requested URL ",
        {text: url, bold:true, fg: "green"},
        " responded with ",
        {text: x.length, bold: true, fg: "cyan"},
        " entries"
    );
    Out.print(JSON.stringify(x[0], null, 2));
});