function createlib (q, inherit, runNext, Fifo, Map, containerDestroyAll, dummyFunc) {
  'use strict';

  var JobBase = require('./jobbasecreator')(q),
    JobOnDestroyableBase = require('./jobondestroyablebasecreator')(q, inherit, JobBase),
    JobOnDestroyable = require('./jobondestroyablecreator')(inherit, JobOnDestroyableBase),
    JobOnComplexDestroyable = require('./joboncomplexdestroyablecreator')(inherit, JobOnDestroyableBase),
    PromiseArrayFulfillerJob = require('./promisearrayfulfillerjob')(q, inherit, JobBase),
    PromiseChainerJob= require('./promisechainerjobcreator')(inherit, PromiseArrayFulfillerJob),
    PromiseExecutorJob= require('./promiseexecutorjobcreator')(inherit, PromiseArrayFulfillerJob),
    PromiseHistoryChainerJob = require('./promisehistorychainerjobcreator')(q, inherit, JobBase, PromiseChainerJob),
    PromiseMapperJob = require('./promisemapperjobcreator')(q, inherit, JobBase, PromiseChainerJob),
    PromiseExecutionMapperJob = require('./promisemapperjobcreator')(q, inherit, JobBase, PromiseExecutorJob);

  function returner(val) {
    var _q = q;
    return function() {
      var ret = _q(val);
      _q = null;
      val = null;
      return ret;
    }
  }
  function rejecter(val) {
    var _q = q;
    return function() {
      var ret = _q.reject(val);
      _q = null;
      val = null;
      return ret;
    }
  }
  function logandthrower (caption) {
    return function (reason) {
      console.log(require('util').inspect(caption, {depth:null}), reason);
      caption = null;
      throw reason;
    }
  }
  function errorandthrower (caption) {
    return function (reason) {
      console.error(require('util').inspect(caption, {depth:null}), reason);
      caption = null;
      throw reason;
    }
  }
  function propertyreturner(obj, propertyname) {
    var _q = q;
    return function () {
      var ret = _q(obj[propertyname]);
      obj = null;
      propertyname = null;
      _q = null;
      return ret;
    }
  }
  function resultpropertyreturner(propertyname) {
    var _q = q;
    return function (result) {
      var ret;
      if (result && 'object' === typeof result && result.hasOwnProperty(propertyname)) {
        ret = _q(result[propertyname]);
      } else {
        ret = _q(null);
      }
      propertyname = null;
      _q = null;
      return ret;
    }
  }
  function executor(fn, ctx) {
    return function () {
      var ret = fn.call(ctx);
      fn = null;
      ctx = null;
      return ret;
    }
  }
  function applier(fn, ctx) {
    return function (arry) {
      var ret = fn.apply(ctx, arry);
      fn = null;
      ctx = null;
      return ret;
    };
  }
  function caller(fn, ctx) {
    return function (result) {
      var ret = fn.call(ctx, result);
      fn = null;
      ctx = null;
      return ret;
    };
  }
  function methodinvoker(methodname) {
    var args = Array.prototype.slice.call(arguments, 1), _q = q, ist = q.isThenable;
    return function (instance) {
      var ret;
      if (instance) {
        try { 
          ret = _q(instance[methodname].apply(instance, args));
          ret = ist(ret) ? ret : _q(ret);
        } catch (e) {
          ret = _q.reject(e);
        }
      } else {
        ret = _q.reject(new Error('Promise resolved nothing that could be invoked with method '+methodname));
      }
      _q = null;
      ist = null;
      methodname = null;
      args = null;
      return ret;
    }
  }
  function promise2defer(promise, defer) {
    promise.then(
      defer.resolve.bind(defer),
      defer.reject.bind(defer),
      defer.notify.bind(defer)
    );
    return defer.promise;
  }
  function standardErrReporter(reason) {
    console.error(reason);
  }
  function promise2execution(promise, cb, errcb, notifycb) {
    var _q = q;
    return promise.then(
      function(){
        var ret;
        try{
          ret = cb();
        } catch(e) {
          console.error(e.stack);
          console.error(e);
          throw e;
        }
        cb = null;
        _q = null;
        return ret;
      },
      errcb || standardErrReporter,
      notifycb || dummyFunc
    );
  }
  function promise2console(promise, caption) {
    if (caption) {
      caption += ' ';
    } else {
      caption = '';
    }
    promise.then(
      console.log.bind(console, caption+'ok'),
      console.error.bind(console, caption+'nok'),
      console.log.bind(console, caption+'progress')
    );
    return promise;
  }
  function promiseerror2console (promise) {
    return promise.then(null, errorer);
  }
  function errorer (reason) {
    console.error(reason);
    throw reason;
  }

  function promise2decision (promise, decisionfunc, rejectionfunc, notificationfunc) {
    var ist = q.isThenable, d = q.defer(), ret = d.promise, _p2d = promise2defer, _df = decisionfunc;
    promise.then(
      function (result) {
        var res;
        if ('function' !== typeof _df) {
          d.reject(new Error('Decision function provided turned out not to be a Function at all'));
        } else {
          try {
            res = _df(result);
            if (ist(res)) {
              _p2d(res, d);
            } else {
              d.resolve(res);
            }
          } catch (e) {
            d.reject(e);
          }
        }
        _df = null;
        _p2d = null;
        d = null;
        ist = null;
      },
      ('function' === typeof rejectionfunc) ? function (reason) {
        var res;
        try {
          res = rejectionfunc(reason);
          if (ist(res)) {
            _p2d(res, d);
          } else {
            d.resolve(res);
          }
        } catch (e) {
          d.reject(e);
        }
        _p2d = null;
        d = null;
        ist = null;
      } : d.reject.bind(d),
      ('function' === typeof notificationfunc) ? function (progress) {
        d.notify(notificationfunc(progress));
      } : d.notify.bind(d)
    );
    return ret;
  }

  function thenableRead (thingy) {
    if (!q.isThenable(thingy)) {
      return q(thingy);
    }
    return thingy;
  }

  function thenAny (thingy, resolver, rejecter, notifier) {
    if (q.isThenable(thingy)) {
      return thingy.then(resolver, rejecter, notifier);
    }
    return resolver(thingy);
  }

  function waitForPromise (promise, timeout) {
    var d = q.defer();
    q.delay(timeout, new Error('Timeout after '+timeout+' msecs')).done(d.reject.bind(d));
    promise.done(d.resolve.bind(d));
    return d.promise;
  }

  function manyResultsAnalysis (manyresults, valueprocessor) {
    var ret = {values: [], errors: []}, i, res;
    if (!(manyresults && manyresults.length)) {
      return ret;
    }
    for (i=0; i<manyresults.length; i++) {
      res = manyresults[i];
      switch (res.state) {
        case 'fulfilled': 
          ret.values.push(valueprocessor ? valueprocessor(res.value) : res.value);
          break;
        case 'rejected':
          ret.errors.push(res.reason);
          break;
      }
    }
    return ret;
  }

  var ret = {
    chainPromises : require('./chainpromises')(q, runNext),
    JobBase: JobBase,
    JobOnDestroyableBase: JobOnDestroyableBase,
    JobOnDestroyable: JobOnDestroyable,
    JobOnComplexDestroyable: JobOnComplexDestroyable,
    PromiseChainerJob: PromiseChainerJob,
    PromiseExecutorJob: PromiseExecutorJob,
    PromiseHistoryChainerJob: PromiseHistoryChainerJob,
    PromiseMapperJob: PromiseMapperJob,
    PromiseExecutionMapperJob: PromiseExecutionMapperJob,
    JobCollection: require('./jobcollectioncreator')(Fifo, Map, containerDestroyAll, q),
    returner: returner,
    rejecter: rejecter,
    logandthrower: logandthrower,
    errorandthrower: errorandthrower,
    propertyreturner: propertyreturner,
    resultpropertyreturner: resultpropertyreturner,
    executor: executor,
    applier: applier,
    caller: caller,
    methodinvoker: methodinvoker,
    promise2defer: promise2defer,
    promise2execution: promise2execution,
    promise2console: promise2console,
    promiseerror2console: promiseerror2console,
    promise2decision: promise2decision,
    thenableRead : thenableRead,
    thenAny : thenAny,
    waitForPromise : waitForPromise,
    manyResultsAnalysis: manyResultsAnalysis
  };

  ret.PromiseChainMapReducerJob = require('./promiseexecutionmapreducercreator')(inherit, applier, JobBase, PromiseMapperJob);
  ret.PromiseExecutionMapReducerJob = require('./promiseexecutionmapreducercreator')(inherit, applier, JobBase, PromiseExecutionMapperJob);
  require('./steppedjobcreator')(q, inherit, runNext, ret);
  
  return ret;
}

module.exports = createlib;
