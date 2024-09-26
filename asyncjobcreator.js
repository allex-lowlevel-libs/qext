function createAsyncJob (q, isFunction, promise2defer) {
  'use strict';

  function defined (thingy) {
    return typeof thingy !== 'undefined';
  }

  function AsyncJob (mainexecutor, mvexecutor, options) {
    this.defer = q.defer();
    this.finalResult = void 0;
    this.notStartedYet = true;
  }
  AsyncJob.prototype.destroy = function () {
    this.notStartedYet = null;
    this.finalResult = null;
    this.defer = null;
  };
  AsyncJob.prototype.resolve = function (result) {
    if (this.defer) {
      this.defer.resolve(result);
    }
    this.destroy();
  };
  AsyncJob.prototype.reject = function (reason) {
    if (this.defer) {
      this.defer.reject(reason);
    }
    this.destroy();
  };
  AsyncJob.prototype.notify = function (progress) {
    if (this.defer) {
      this.defer.notify(progress);
    }
  };
  AsyncJob.prototype.shouldContinue = function () {
    if (defined(this.finalResult)) {
      return this.finalResult;
    }
  };
  AsyncJob.prototype.isDone = function () {
    var continuation = this.shouldContinue();
    if (defined(continuation)) {
      this.resolve(continuation);
      return true;
    }
    return false;
  };
  AsyncJob.prototype.isDead = function () {
    return !this.defer;
  };
  AsyncJob.prototype.doFunc = async function (func) {
    if (this.isDead()) {
      return;
    }
    const shouldContinue = await this.shouldContinue();
    if (defined(shouldContinue)) {
      this.resolve(shouldContinue);
      return;
    }
    return func.apply(this, Array.prototype.slice.call(arguments, 1));
  };
  AsyncJob.prototype.doStep = async function (methodname) {
    return this.doFunc(async () => {
      const method = this[methodname];
      if (!isFunction(method)) {
        throw new Error('method '+methodname+' does not exist on '+this.constructor.name);
      }
      return await this[methodname].apply(this, Array.prototype.slice.call(arguments, 1));
    });
  };

  AsyncJob.prototype.asyncMain = async function () {
  };

  AsyncJob.prototype.go = function () {
    //console.log('our first async!');
    const defer = this.defer;
    if (!(defer && defer.promise)) {
      return q.reject(new Error('This instance of '+this.constructor.name+' is already destroyed'));
    }
    const ret = defer.promise;
    if (this.notStartedYet) {
      this.notStartedYet = false;
      try {
        promise2defer(this.asyncMain(), defer);
      } catch (e) {
        defer.reject(e);
      }
    }
    return ret;
  };

  return AsyncJob;
}
module.exports = createAsyncJob;