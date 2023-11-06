function createMethodInvokerJobCore (inherit, isString, liberror, mylib) {
  'use strict';
  var Base = mylib.jobcores.InvokerBase;

  function MethodInvokerJobCore (context, method, args) {
    Base.call(this, context, args);
    this.method = method;
  }
  inherit(MethodInvokerJobCore, Base);
  MethodInvokerJobCore.prototype.destroy = function () {
    this.method = null;
    Base.prototype.destroy.call(this);
  };
  MethodInvokerJobCore.prototype.shouldContinue = function () {
    var ret = Base.prototype.shouldContinue.call(this);
    if (ret) {
      return ret;
    }
    if (!isString(this.method)) {
      throw new liberror('METHODNAME_NOT_A_STRING', this.constructor.name+' must get method as a String');
    }
  };
  MethodInvokerJobCore.prototype.invoke = function () {
    return this.context[this.method].apply(this.context, this.args);
  };

  mylib.MethodInvoker = MethodInvokerJobCore;
}
module.exports = createMethodInvokerJobCore;