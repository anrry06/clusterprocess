var Cluster = require("bauer-cluster").Cluster;

var clusterprocess = function clusterprocess(options) {
    console.log('clusterprocess');
    options = options || {};
    this.data = options.data || null;
    this.nbWorker = options.nbWorker || 1;
    this.process = options.process || null;
    this.done = options.done || null;
    this.getData = options.getData || null;
    
    if(this.getData == null){
        return false;
    }
    
    this.workers = [];
    this.processedData = {};
    this.processedCounter = 0;
    
    this.myCluster = new Cluster();
    this.initMaster();
    this.initWorker();
    
    this.myCluster.start();
};

clusterprocess.prototype = {
    'initMaster' : function initMaster() {
        var that = this;
        this.myCluster.master(function() {
            console.log('master');
            console.log(this === that.myCluster);
            
            that.getData(function(data) {
                that.data = data;
                
                that.chunks = that.chunkArray(that.data, that.nbWorker);
                for(var i = 0; i < that.nbWorker; i++){
                    // console.log(chunk);
                    // console.log('fork ' + i);
                    var worker = that.myCluster.fork(i);
                    worker.on("message", function(message) {
                        if (message.done) {
                            this.kill();
                            that.regroup(message.data, message.id);
                        }
                        else if (message.ready) {
                            var chunk = that.chunks[message.id];
                            this.send({
                                data: chunk
                            });
                        }
                    });

                    that.workers.push(worker);
                }
            })
        });
    },
    
    'initWorker' : function initWorker() {
        var that = this;
        this.myCluster.worker(function(worker) {
            console.log('worker');
            // console.log(worker.args);
            var id = worker.args[0];
            worker.on("message", function(message) {
                if (message.data) {
                    var data = message.data;
                    var _data = [];
                    var run = function(index, next) {
                        if(typeof data[index] == 'undefined'){
                            return next();
                        }
                        
                        that.process(index, data[index], function(result) {
                            _data.push(result);
                            
                            if(index % 1000 === 0) {
                                return setTimeout( function() {
                                    run(index + 1, next); 
                                }, 0);
                            }
                            
                            run(index + 1, next);
                        });
                    };
                    
                    run(0, function() {
                        // console.log('worker done');
                        worker.send({
                            done: true,
                            data: _data,
                            id: id
                        });
                    });                    
                }
            });
            
            worker.send({
                ready: true,
                id: id
            });
        });
    },
    
    'regroup': function regroup(a, id) {
        this.processedData[id] = a;
        this.processedCounter++;
        if(this.processedCounter == this.nbWorker){
            // console.log('DONE');
            this.myCluster = null;
            this.workers = null;
            this.data = null;
            var values = [];
            for(var i in this.processedData){
                values = values.concat(this.processedData[i]);
            }
            this.done(values);
        }
    },
    
    'chunkArray': function chunkArray(a, n) {
        var len = a.length,out = [], i = 0;
        while (i < len) {
            var size = Math.ceil((len - i) / n--);
            out.push(a.slice(i, i += size));
        }
        return out;
    }
};

module.exports = clusterprocess;