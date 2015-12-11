var Cluster = require("bauer-cluster").Cluster;

var myCluster = new Cluster();

// executed when in main process 
myCluster.master(function() {

    console.log('master: this === myCluster ' + (this === myCluster)); // true 

    console.log('master: this.isMaster ' + (this.isMaster)); // true 
    this.isMaster; // true 
    console.log('master:  this.isWorker ' + (this.isWorker)); // false 
    this.isWorker; // false 

    var worker = this.fork("one", "two");

    console.log('master: worker.args ' + (worker.args));
    worker.args; // ["one","two"] 
    worker.process; // child process produced by fork 

    worker.on("message", function(message) {
        if (message.pong) {
            console.log('pong');
            console.log(this == worker);
            worker.kill();
            // worker.send({
            //     ping: true
            // });
        }
    });

    worker.send({
        ping: true
    });

});

// executed when in child process 
myCluster.worker(function(worker) {

    this === myCluster // true 

    this.isMaster; // false 
    this.isWorker; // true 
    console.log('worker: this === myCluster ' + (this === myCluster)); // true 

    console.log('worker: this.isMaster ' + (this.isMaster)); // false 
    console.log('worker:  this.isWorker ' + (this.isWorker)); // true 

    console.log('worker: worker.args ' + (worker.args));
    worker.args; // ["one","two"] 
    worker.process; // global process object 

    worker.on("message", function(message) {
        if (message.ping) {
            console.log('ping');
            worker.send({
                pong: true
            });
        }
    });

});

myCluster.start();