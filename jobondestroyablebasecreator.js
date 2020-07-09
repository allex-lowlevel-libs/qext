function createJobOnDestroyableBase (q, inherit, JobBase) {
  'use strict';

  function JobOnDestroyableBase (destroyable, defer) {
    JobBase.call(this, defer);
    this.destroyable = destroyable;
  }
  inherit(JobOnDestroyableBase, JobBase);
  JobOnDestroyableBase.prototype.destroy = function () {
    this.destroyable = null;
    JobBase.prototype.destroy.call(this);
  };
  JobOnDestroyableBase.prototype.peekToProceed = function () {
    var ptp = JobBase.prototype.peekToProceed.call(this);
    if (!ptp.ok) {
      return ptp.val;
    }
    try {
      if (!this._destroyableOk()) {
        ptp.ok = false;
        ptp.val = new Error('DESTROYABLE_REFERENCE_DESTROYED');
      }
    } catch (e) {
      ptp.ok = false;
      ptp.val = e;
    }
    return ptp;
  };

  return JobOnDestroyableBase;
}
module.exports = createJobOnDestroyableBase;
