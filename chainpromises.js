function create(q, runNext){
  /// todo: introduce policies .... reject if first rejected, reject if any rejected, but execute all, pass results to next and so on ...
  function Chainer(ftions) {
    this.d = q.defer();
    this.ftions = ftions;
    this.results = new Array(this.ftions.length);
    this.index = -1;
    runNext (this.next.bind(this), 1);
  }
  Chainer.prototype.destroy = function () {
    this.index = null;
    this.results = null;
    this.ftions = null;
    this.d = null;
  };

  Chainer.prototype.next = function (){
    if (this.index >= this.ftions.length-1) {
      this.d.resolve(this.results);
      return;
    }
    this.index++;
    try {
      var f = this.ftions[this.index];
      f().done (this._onDone.bind(this), this._onFailed.bind(this));
    }catch (e) {
      this._onFailed(e);
    }
  };


  Chainer.prototype._onDone = function (result) {
    this.results[this.index] = {'success': result};
    this.next();
  };
  Chainer.prototype._onFailed = function (error) {
    this.results[this.index] = {'error': error};
    this.next();
  };

  function dochain(arry_of_promise_returning_ftions) {
    var r = new Chainer(arry_of_promise_returning_ftions);
    var promise = r.d.promise;
    promise.done(r.destroy.bind(r));
    return promise;
  }

  return dochain;
}

module.exports = create;
