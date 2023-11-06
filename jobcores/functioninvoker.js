function createFunctionInvokerJobCore (inherit, isFunction, liberror, mylib) {
  'use strict';
  var Base = mylib.jobcores.InvokerBase;

  function FunctionInvokerJobCore (context, func, args) {
    Base.call(this, context, args);
    this.func = func;
  }
  inherit(FunctionInvokerJobCore, Base);
  FunctionInvokerJobCore.prototype.destroy = function () {
    this.func = null;
    Base.prototype.destroy.call(this);
  };
  FunctionInvokerJobCore.prototype.shouldContinue = function () {
    var ret = Base.prototype.shouldContinue.call(this);
    if (ret) {
      return ret;
    }
    if (!isFunction(this.func)) {
      throw new liberror('FUNC_NOT_A_FUNCTION', this.constructor.name+' must get func as a Function');
    }
  };
  FunctionInvokerJobCore.prototype.invoke = function () {
    return this.func.apply(this.context, this.args);
  };

  mylib.jobcores.FunctionInvoker = FunctionInvokerJobCore;
}
module.exports = createFunctionInvokerJobCore;