function createSteppedJob (q, inherit, isArray, isFunction, runNext, mylib) {
  'use strict';

  var JobBase = mylib.JobBase;

  function SteppedJob (config, defer) {
    JobBase.call(this, defer);
    this.config = config;
    this.shouldContinueResult = void 0;
    this.resolveListener = null;
    this.notifyListener = null;
    this.step = -1; //will be bumped to zero in first runStep
    if (config.resolve && isFunction(config.resolve.attach)){
      this.resolveListener = config.resolve.attach(this.resolve.bind(this));
    }
    if (config.notify && isFunction(config.notify.attach)){
      this.notifyListener = config.notify.attach(this.notify.bind(this));
    }
  }
  inherit(SteppedJob, JobBase);
  SteppedJob.prototype.destroy = function () {
    if (this.config && isFunction(this.config.onDesctruction)) {
      try {
        this.config.onDesctruction.call(this);
      } catch (e) {
        console.error('Error in SteppedJob.config.onDestruction', e);
      }
    }
    this.step = null;
    if (this.notifyListener) {
      this.notifyListener.destroy();
    }
    this.notifyListener = null;
    if (this.resolveListener) {
      this.resolveListener.destroy();
    }
    this.resolveListener = null;
    this.shouldContinueResult = null;
    this.config = null;    
    JobBase.prototype.destroy.call(this);
  };
  SteppedJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    runNext(this.runStep.bind(this, null));
    return ok.val;
  };
  SteppedJob.prototype.peekToProceed = function () {
    var ret = JobBase.prototype.peekToProceed.call(this);
    if (!(ret && ret.ok)) {
      return ret;
    }
    if (!this.config) {
      return {
        ok: false,
        val: new Error('No config was specified for '+this.constructor.name)
      };
    }
    if (!isArray(this.config.steps)) {
      return {
        ok: false,
        val: new Error('No config steps were specified for '+this.constructor.name)
      };
    }
    if (isFunction(this.config.shouldContinue)) {
      try {
        this.shouldContinueResult = this.config.shouldContinue.call(this);
        if (this.shouldContinueResult && this.shouldContinueResult instanceof Error) {
          return {
            ok: false,
            val: this.shouldContinueResult
          };
        }
      } catch (e) {
        return {
          ok: false,
          val: e
        }
      }
    }
    return ret;
  };
  SteppedJob.prototype.runStep = function (lastresult) {
    var func, funcres;
    if (!this.okToProceed()) {
      return;
    }
    this.step++;
    if (this.step >= this.config.steps.length) {
      this.resolve(lastresult);
      return;
    }
    if ('undefined' != typeof this.shouldContinueResult) {
      this.resolve(this.shouldContinueResult);
      return;
    }
    func = this.config.steps[this.step];
    if (!isFunction(func)) {
      this.reject(new Error('Step #'+this.step+' in config.steps was not a function'));
      return;
    }
    try {
      funcres = func.call(this, lastresult);
      if (q.isThenable(funcres)) {
        funcres.then(
          this.runStep.bind(this),
          this.reject.bind(this),
          this.notify.bind(this)
        );
        return;
      }
      this.runStep(funcres);
    } catch (e) {
      this.reject(e);
    }
  };

  mylib.Stepped = SteppedJob;

  function SteppedJobOnInstance (instance, methodnamesteps, defer) {
    SteppedJob.call(this, {
      resolve: instance.resolve,
      notify: instance.notify,
      shouldContinue: isFunction(instance.shouldContinue) ? instance.shouldContinue.bind(instance) : null,
      onDesctruction: isFunction(instance.destroy) ? instance.destroy.bind(instance) : null,
      steps: methodnamesteps.map(function(stepmethodname) {
        if (!isFunction(instance[stepmethodname])) {
          throw new Error(stepmethodname+' is not a method of '+instance.constructor.name);
        }
        return instance[stepmethodname].bind(instance);
      })
    }, defer);
  }
  inherit(SteppedJobOnInstance, SteppedJob);
  mylib.SteppedJobOnInstance = SteppedJobOnInstance;

  function SteppedJobOnSteppedInstance (instance, defer) {
    SteppedJobOnInstance.call(this, instance, instance.steps, defer);
  }
  inherit(SteppedJobOnSteppedInstance, SteppedJobOnInstance);
  mylib.SteppedJobOnSteppedInstance = SteppedJobOnSteppedInstance;

  function newSteppedJobOnInstance (instance, methodnamesteps, defer) {
    return new SteppedJobOnInstance(instance, methodnamesteps, defer);
  }

  function newSteppedJobOnSteppedInstance (instance, defer) {
    return new SteppedJobOnSteppedInstance(instance, defer);
  }
  mylib.newSteppedJobOnInstance = newSteppedJobOnInstance;
  mylib.newSteppedJobOnSteppedInstance = newSteppedJobOnSteppedInstance;
}
module.exports = createSteppedJob;
