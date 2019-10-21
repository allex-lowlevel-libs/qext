function createJobOnComplexDestroyable (inherit, JobOnDestroyableBase) {
  'use strict';

  function JobOnComplexDestroyable (destroyable, defer) {
    JobOnDestroyableBase.call(this, destroyable, defer);
  }
  inherit(JobOnComplexDestroyable, JobOnDestroyableBase);
  JobOnComplexDestroyable.prototype._destroyableOk = function () {
    return this.destroyable && this.destroyable.aboutToDie;
  };

  return JobOnComplexDestroyable;
}
module.exports = createJobOnComplexDestroyable;
