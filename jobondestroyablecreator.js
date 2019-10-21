function createJobOnDestroyable (inherit, JobOnDestroyableBase) {
  'use strict';

  function JobOnDestroyable (destroyable, defer) {
    JobOnDestroyableBase.call(this, destroyable, defer);
  }
  inherit(JobOnDestroyable, JobOnDestroyableBase);
  JobOnDestroyable.prototype._destroyableOk = function () {
    return this.destroyable && this.destroyable.destroyed;
  };

  return JobOnDestroyable;
}
module.exports = createJobOnDestroyable;
