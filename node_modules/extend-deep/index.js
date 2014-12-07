/**
 *  Merge object recursively, don't impact the sources
 */
(function() {
	var root = this;
	
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = extend;
    }
    exports.extend = extend;
  } else {
    root.extend = extend;
  }

	if (typeof define === 'function' && (define.amd || define.cmd)) {
    define('extend-deep', [], function() {
      return extend;
    });
  }
	
	function extend(target) {
		var
		sources = [].slice.call(arguments, 1),
		source, k, v, i, typeto, typefrom;
		
		for (i = 0; i < sources.length; i++) {
		source = sources[i];
			for (k in source) {
				v = source[k];
				// <=IE8, Object.prototype.toString.call(undefined|null) return [object Object|Null]
				typeto = (v === undefined || v === null) ? v : toString.call(v);
				typefrom = (target[k] === undefined || target[k] === null) ? target[k] : toString.call(target[k]);
				if ('object' === typeof v) {
					if ('object' === typeof target[k]) {
						if (typeto === typefrom) {
							extend(target[k], v);
						} 
					} 
					if (typeto !== typefrom) {
						target[k] = extend((typeto === '[object Array]' ? [] : {}), v);
					}
				} else {
					target[k] = v;
				}
			}
		}
		return target;
	}	
}.call(this))
	