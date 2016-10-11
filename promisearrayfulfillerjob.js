function createPromiseArrayFulfillerJob(q, inherit, JobBase) {
  'use strict';

  function PromiseArrayFulfillerJob(promiseproviderarry) {
    JobBase.call(this);
    this.promiseproviderarry = promiseproviderarry;
  }
  inherit(PromiseArrayFulfillerJob, JobBase);
  PromiseArrayFulfillerJob.prototype.destroy = function () {
    this.promiseproviderarry = null;
    JobBase.prototype.destroy.call(this);
  };
  PromiseArrayFulfillerJob.prototype.go = function () {
    var p = this.defer.promise;
    this.doPromise(0);
    return p;
  };
  PromiseArrayFulfillerJob.prototype.doPromise = function (index, result) {
    //console.log('doing promise at', index, 'out of', this.promiseproviderarry.length);
    if (!this.promiseproviderarry){
      //in case Job was destroyed ....
      return;
    }
    if (index >= this.promiseproviderarry.length) {
      this.resolve(result);
      return;
    }
    var promiseprovider = this.promiseproviderarry[index],
      promise = this.activatePromiseProvider(promiseprovider, result);
    promise.then(
      this.doPromise.bind(this, index+1),
      this.reject.bind(this),
      this.notify.bind(this)
    );
  };

  return PromiseArrayFulfillerJob;
}

module.exports = createPromiseArrayFulfillerJob;

