function createPromiseExecutorJob(inherit, PromiseArrayFulfillerJob) {
  'use strict';

  function PromiseExecutorJob(promiseproviderarry) {
    PromiseArrayFulfillerJob.call(this, promiseproviderarry);
  }
  inherit(PromiseExecutorJob, PromiseArrayFulfillerJob);

  PromiseExecutorJob.prototype.activatePromiseProvider = function (promiseprovider, previousresult) {
    return promiseprovider();
  };

  return PromiseExecutorJob;
}

module.exports = createPromiseExecutorJob;
