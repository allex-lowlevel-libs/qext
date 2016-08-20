function createJobCollection(Fifo, Map, containerDestroyAll) {
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
    this.emptycb = null;
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
    var p = job.defer.promise;
    p.then(
      this.next.bind(this),
      this.next.bind(this)
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
  
  return JobCollection;
}

module.exports = createJobCollection;
