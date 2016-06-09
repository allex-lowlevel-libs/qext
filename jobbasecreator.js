function createJobBase(q) {
  'use strict';

  function JobBase(defer) {
    this.defer = (defer && q.isPromise(defer.promise)) ? defer : q.defer();
    this.result = null;
    this.error = null;
  }
  JobBase.prototype.destroy = function () {
    if (this.defer) {
      if (this.error) {
        this.defer.reject(this.error);
      } else {
        this.defer.resolve(this.result);
      }
    }
    this.error = null;
    this.result = null;
    this.defer = null;
  };
  JobBase.prototype.resolve = function (result) {
    if (!this.defer) {
      return;
    }
    this.result = result;
    this.destroy();
  };
  JobBase.prototype.reject = function (error) {
    if (!this.defer) {
      return;
    }
    this.error = error;
    this.destroy();
  };
  JobBase.prototype.notify = function (progress) {
    if (this.defer) {
      this.defer.notify(progress);
    }
  };

  return JobBase;
}

module.exports = createJobBase;
