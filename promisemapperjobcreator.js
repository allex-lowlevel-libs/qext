function createPromiseMapper(q, inherit, JobBase, PromiseArrayFulfillerJob) {
  'use strict';
  
  function PromiseMapperJob(promiseproviderarry, paramarry) {
    JobBase.call(this);
    this.promiseproviderarry = promiseproviderarry;
    this.paramarry = paramarry || [];
  }
  inherit(PromiseMapperJob, JobBase);
  PromiseMapperJob.prototype.destroy = function () {
    this.paramarry = null;
    this.promiseproviderarry = null;
    JobBase.prototype.destroy.call(this);
  };
  PromiseMapperJob.prototype.go = function () {
    var result = this.paramarry, p = this.defer.promise;
    var chainer = new PromiseArrayFulfillerJob(this.promiseproviderarry.map(this.resultPutter.bind(this, result)));
    chainer.defer.promise.then(
      this.resolve.bind(this, result),
      this.reject.bind(this)
    );
    result = null;
    chainer.go();
    return p;
  };
  PromiseMapperJob.prototype.resultPutter = function (result, promiseprovider) {
    var _q = q;
    return function (input) {
      try {
      return promiseprovider(input)
        .then(function (resolved) {
          var ret = _q(resolved);
          result.push(resolved);
          _q = null;
          result = null;
          return ret;
        });
      } catch(e) {
        console.error(e);
      }
    }
  };

  return PromiseMapperJob;
}

module.exports = createPromiseMapper;
