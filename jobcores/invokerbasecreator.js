function  createInvokerJobCoreBase (inherit, isArray, liberror, mylib) {
  'use strict';

  function InvokerJobCoreBase (context, args) {
    this.context = context;
    this.args = args;
  }
  InvokerJobCoreBase.prototype.destroy = function () {
    this.args = null;
    this.context = null;
  };
  InvokerJobCoreBase.prototype.shouldContinue = function () {
    if (this.context && this.context.constructor && ('destroyed' in this.context) && this.context.destroyed==null) {
      throw new liberror('DESTROYABLE_DESTROYED', this.context.constructor.name+' is already destroyed');
    }
    if (!isArray(this.args)) {
      throw new liberror('ARGS_NOT_AN_ARRAY', this.constructor.name+' must get args as an Array');
    }
  };
  InvokerJobCoreBase.prototype.doInvoke = function () {
    try {
      return this.invoke();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  InvokerJobCoreBase.prototype.steps = [
    'doInvoke'
  ];

  InvokerJobCoreBase.prototype.invoke = function () {
    throw new liberror('NOT_IMPLEMENTED', this.constructor.name+' has to implement invoke');
  };

  mylib.jobcores.InvokerBase = InvokerJobCoreBase;
}
module.exports =  createInvokerJobCoreBase;