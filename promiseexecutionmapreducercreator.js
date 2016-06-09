function createPromiseExecutionMapReducer (inherit, applier, JobBase, MapperJob) {

  function PromiseExecutionMapReducer(promiseproviderarry, paramarry, fn, ctx) {
    JobBase.call(this);
    this.mapper = new MapperJob(promiseproviderarry, paramarry);
    this.applier = applier(fn, ctx);
  }
  inherit(PromiseExecutionMapReducer, JobBase);

  PromiseExecutionMapReducer.prototype.destroy = function () {
    this.applier = null;
    this.mapper = null;
    JobBase.prototype.destroy.call(this);
  };

  PromiseExecutionMapReducer.prototype.go = function () {
    var p = this.defer.promise;
    this.mapper.go().then(
      this.applier
    ).then(
      this.resolve.bind(this),
      this.reject.bind(this)
    );
    return p;
  };

  return PromiseExecutionMapReducer;
};

module.exports = createPromiseExecutionMapReducer;
