function createJobCollection(Fifo, Map, containerDestroyAll, q) {
  'use strict';

  function destructionDrainer (j) {
    j.reject(new Error('JOB_COLLECTION_DESTROYING'));
  }

  function Lock(locks, name) {
    this.locks = locks;
    this.name = name;
    this.defer = null;
    this.q = new Fifo();
    this.nexter = this.next.bind(this);
    this.activator = this.activate.bind(this);
  }
  Lock.prototype.destroy = function () {
    this.activator = null;
    this.nexter = null;
    this.q.drain(destructionDrainer);
    this.q.destroy();
    this.defer = null;
    if (this.locks && this.name) {
      this.locks.remove(this.name);
    }
    this.name = null;
    this.locks = null;
  };
  Lock.prototype.add = function (job) {
    if (this.defer) {
      this.q.push(job);
    } else {
      this.activate(job);
    }
  };
  Lock.prototype.activate = function (job) {
    var p;
    if (!job) {
      console.log('no job to activate, going next');
      this.nexter();
      return;
    }
    if (!job.defer) {
      console.log('job', job.constructor.name, 'has no defer, going next');
      this.nexter();
      return;
    }
    if (!job.defer.promise) {
      console.log('job', job.constructor.name, 'has no promise on defer, going next');
      this.nexter();
      return;
    }
    p = job.defer.promise;
    p.then(
      this.nexter,
      this.nexter
    );
    this.defer = p;
    job.go();
  };
  Lock.prototype.next = function () {
    this.defer = null;
    if (this.q.length) {
      this.q.pop(this.activator);
    } else {
      this.destroy();
    }
  };
  Lock.prototype.lastPendingJob = function () {
    if (!this.q) {
      return null;
    }
    return this.q.last();
  };

  function JobCollection () {
    this.__locks = new Map();
  }
  JobCollection.prototype.destroy = function () {
    containerDestroyAll(this.__locks);
    this.__locks.destroy();
  };
  JobCollection.prototype.run = function (jobclassname, job) {
    var lock = this.__locks.get(jobclassname),
      p = job.defer.promise;
    if (!lock) {
      lock = new Lock(this.__locks, jobclassname);
      this.__locks.add(jobclassname, lock);
    }
    lock.add(job);
    return p;
  };
  JobCollection.prototype.lastPendingJobFor = function (jobclassname) {
    var lock = this.__locks.get(jobclassname);
    if (!lock) {
      return null;
    }
    return lock.lastPendingJob();
  };
  JobCollection.prototype.runMany = function (jobclassname, jobarry) {
    var d, ret, i, _i, last, results;
    results = [];
    if (!(jobarry && jobarry.length>0)) {
      return q(results);
    }
    d = q.defer();
    ret = d.promise;
    for (i=0; i<jobarry.length; i++) {
      _i = i;
      last = this.run('.', jobarry[i]).then(
        resolve_arryer.bind(results),
        reject_arryer.bind(results),
        notify_arryer.bind(d, results, _i)        
      );
      _i = null;
    }
    results = null;
    last.then(d.resolve.bind(d), d.reject.bind(d));
    d = null;
    return ret;
  }
  //static, this is array
  function resolve_arryer (res) {
    this.push({state: 'fulfilled', value: res});
    return this;
  }
  //static, this is array
  function reject_arryer (reason) {
    this.push({state: 'rejected', value: reason});
    return this;
  }  
  //static, this is defer
  function notify_arryer (arry, index, progress) {
    arry.push({state: 'rejected', value: res});
    this.notify({
      results: arry,
      index: index,
      progress: progress
    })
  }
  
  return JobCollection;
}

module.exports = createJobCollection;
