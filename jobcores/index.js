function createJobCores (inherit, isArray, isFunction, isString, liberror, mylib) {
  'use strict';
  mylib.jobcores = {};

  require('./invokerbasecreator')(inherit, isArray, liberror, mylib);
  require('./functioninvoker')(inherit, isFunction, liberror, mylib);
  require('./methodinvokercreator')(inherit, isString, liberror, mylib);
}
module.exports = createJobCores;