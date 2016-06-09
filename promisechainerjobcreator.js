function createPromiseChainerJob(inherit, PromiseArrayFulfillerJob) {
  'use strict';

  function PromiseChainerJob(promiseproviderarry) {
    PromiseArrayFulfillerJob.call(this, promiseproviderarry);
  }
  inherit(PromiseChainerJob, PromiseArrayFulfillerJob);

  PromiseChainerJob.prototype.activatePromiseProvider = function (promiseprovider, previousresult){
    return promiseprovider(previousresult);
  };

  return PromiseChainerJob;
}

module.exports = createPromiseChainerJob;
