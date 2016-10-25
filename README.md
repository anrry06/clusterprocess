#clusterprocess

Process an array on different clusters

##Example

```javascript
var clusterprocess = require('./index.js');

var start = new Date().getTime();

var options = {
    'getData': function(cb) {
        var data = [];
        for(var i = 0; i < 10; i++){
            data.push(i);
        }
        cb(data);
    },
    'nbWorker': 2,
    'process': function(i, d, cb) {
        console.log('process ' + d);
        return cb(d * 2);
    },
    'done': function(result) {
        console.log(result);
        console.log(((new Date().getTime()) - start) / 1000);
        process.exit();
    }
};

new clusterprocess(options);

//1 : 0.429
//2 : 0.324
//3 : 0.245
```

##Dependencies

- [bauer-cluster](https://github.com/yneves/node-bauer-cluster) - Just another cluster library
