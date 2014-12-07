/**
 *  An implementing of Node.js Url at http://www.nodejs.org/api/url.html
 */
(function() {
	var 
	extend = require('extend-deep'), 
	root = this,
	RE_URL = new RegExp(
			'(?:^(\\w+:)(?:\\/\\/\\/?)?)?' + // protocal
			// Expect user is not consist of @ and . (keep auth before host)
			'(?:([^@.]+(?::[^@]+)?)@)?' + // auth
			// Consist of letters, digits, dashes, and dash can't be at the begining or end
			'((\\w(?:[-\\w]\w)*(?:\\.\\w(?:[-\\w]*\w))+)(:\\d+)?)?' + // host
			'(([^?]+)(\\?([^#]*)))?' + // path
			'(#.+)?' // hash
	),
	RE_SLASHES_DENOTE_PATH = /^(\/\/[^?]*)/,

	// Protocol with colon-slash-slashpwcss (CSS), others mailto, xmpp, aim, sftp, foo, etc with colon
	RE_PROTOCOL = /^([^:]+)\:(?:\/\/)?/,
	RE_CD = /[^/]*$/, // Current dir
	RE_UP_DIR = /\/[^/]+\/\.{2}/,
	RE_ROOT_DIR = /^\/\.\.?\/?/, // /../, /.., /., /./
	RE_SELF_DIR = /\/\./g,

	RE_QUERY = /([^&[=]+)((?:\[[^\[\]]*\])*)(?:=([^&]*))?/g,
	RE_QUERY_SUB_KEY = /\[[^\[\]]*\]/g,

	url2 = {
			traditional: false,
			/**
			 *  Does not replace invalid characters with '_' as in PHP,
			 *  nor does it return false with a seriously malformed URL.
			 *
			 *  Example: url.parse('http://username:password@hostname:port/path?arg=value#anchor')
			 *  Returns: {
			 *    href: 'http://username:password@hostname:port/path?arg=value#anchor',
			 *    protocol: 'http:', host: 'hostname:port', hostname: 'host', port: 'port', auth: 'username:password',
			 *    path: '/path?arg=value', pathname: '/path', search: '?arg=value', hash: '#anchor'
			 *  }
			 *
			 *  See the benchmark for PK Non-RegExp-Parse PK RegExp-Parse at https://github.com/1024bit/url2/Non-RegExp-Parse_PK_RegExp-Parse.benchmark.html
			 */
			parse: function(urlStr, parseQueryStr, slashesDenoteHost) {
					if (urlStr === undefined)
							throw TypeError("Parameter 'urlStr' must be a string, not undefined");

					var key, i = 0, urlObj = u = {
							protocol: null,
							auth: null,
							host: null, hostname: null, port: null,
							path: null, pathname: null, search: null, query: null,
							hash: null
					};

					// Set slashesDenoteHost eq true,
					// to treat //foo/bar as { host: 'foo', pathname: '/bar' } rather than { pathname: '//foo/bar' }
					if (!slashesDenoteHost && RE_SLASHES_DENOTE_PATH.test(urlStr)) {
							u.path = RegExp.lastMatch;
							u.pathname = RegExp.$1;
					} else if (RE_URL.test(urlStr)) {
							for (key in u)
									u[key] = RegExp['$' + (++i)];
					}
					// Set parseQueryStr eq true, to convert 'query=string' to {'query':'string'}
					if (parseQueryStr) {
							u.query = url2.unparam(u.search);
					}
					// href
					u.href = (u.protocol ? (u.protocol.toLowerCase() + '//') : '') + (u.auth || '') + (u.host ? u.host.toLowerCase() : '') + (u.path || '') + (u.hash || '');

					return urlObj;
			},
			format: function(urlObj) {},
			// Resolved them as a browser would for an anchor tag
			resolve: function(from, to) {
					// Search part
					if (!to.indexOf('?') || !to.indexOf('#'))
							return from + to;
					var
					// Colon-Slash-Slash-Protocol (with host)
					cssp = { 'http://': '', 'https://': '', 'ftp://': '', 'gopher://': '', 'file://': '' },
					iscssp, top,
					root, path;

					from = _resolve(from);
					to = _resolve(to);

					if (to.protocol && to.protocol !== from.protocol) return to.root + to.path;

					root = !from.root.indexOf(to.root) ? from.root : to.root;
					// Top level directory
					top = !to.path.indexOf('/');
					if (top) { // Relative path or not
							path = to.path;
					} else if (to.protocol && !iscssp) { // Just for keeping the consistency with Node.js ???
							path = to.path || from.path;
							if (to.path && !from.path.indexOf('/'))
									path = '/' + to.path;
					} else {
							path = from.path.replace(RE_CD, to.path);
					}

					return root + normalize(path);

					function _resolve(url) {
							var
							matched = RE_PROTOCOL.test(url),
							root = (matched && RegExp.lastMatch) || '', path;

							if (root) {
									if (root in cssp) {
											iscssp = true;
											i = url.indexOf('/', root.length);
											root = url.substring(0, ~i ? (i) : undefined);
									}
							}

							path = url.substring(root.length);
							// Havn't path, add root path for Colon-Slash-Slash-Protocol
							if (iscssp && !path) path = '/';

							return { protocol: (matched && RegExp.$1) || '', root: root, path: path, raw: url};
					}
			},
			// Normalize a string path, taking care of '..' and '.' parts
			normalize: function(p) {
					while (RE_UP_DIR.test(p)) {
							p = p.replace(RegExp.lastMatch, '');
					}
					return p.replace(RE_ROOT_DIR, '/')
									.replace(RE_SELF_DIR, '');
			},
			// Create query object from query str like '?query=string'
			// "a[b]=1&a[c]=2&d[]=3&d[]=4&d[2][c][e]=5" => {"a":{"b":"1","c":"2"},"d":["3","4",{"c":{"e":"5"}}]}
			// In traditional mode, "a=1&a=2&a=3" => "{"a":["1","2","3"]}"
			unparam: function(query) {
				 if (!query || typeof query !== 'string') return Object(query);
					var matches, name, keys, k, v, hash, paramObj = {};

					// Correspond to param
					query = decodeURIComponent(~query.indexOf('?') ? query.substring(1) : query).replace(/\+/g, ' ');

					while ((matches = RE_QUERY.exec(query))) {
							name = matches[1];
							keys = matches[2].match(RE_QUERY_SUB_KEY) || []; // [a][1][]
							v = matches[3];
							while ((k = keys.pop())) {
									k = k.slice(1, -1);
									if (!k) k = Object(paramObj[name]).length || 0;
									hash = (+k == k) ? [] : {}; // Numeric correspond to Array

									hash[k] = v;
									v = hash;
							}

							if (url2.traditional && paramObj.hasOwnProperty(name)) {
									// a=1&a=2&a=3 => {a: [1, 2, 3]}
									paramObj[name] = [].concat(paramObj[name], v);
							} else if (typeof paramObj[name] === 'object' && typeof v === 'object') {
									extend(paramObj[name], v);
							} else {
									paramObj[name] = v;
							}
					}

					return paramObj;
			},
			// Add new queries and merge existed queries
			addQuery: function(urlStr, query) {
					if (!query)
							return urlStr;
					var
					start = urlStr.indexOf('?'),
					end = urlStr.indexOf('#'),
					hash = urlStr.substring(end);

					if (typeof query === 'string') query = url2.unparam(query);
					query = url2.param(extend(url2.unparam(urlStr.substring(start, end)), query));

					return urlStr.substring(0, ~start ? start : undefined) + '?' + query + hash;
			},
			// Use jQuery.param's source code, doc at http://api.jquery.com/jQuery.param/
			param: function(a, traditional) {
					var
					rbracket = /\[\]$/,
					prefix,
					s = [],
					add = function(key, value) {
							// If value is a function, invoke it and return its value
							value = (typeof value === 'function') ? value() : (value == null ? '' : value);
							s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
					},
					toStr = Object.prototype.toString,
					i, v;

					if (traditional === undefined) {
							traditional = url2.traditional;
					}

					// If an array was passed in, assume that it is an array of form elements.
					if (toStr(a) === '[object Array]') {
							// Serialize the form elements
							for (i in a) {
									v = a[i];
									add(v.name, v.value);
							}

					} else {
							// If traditional, encode the "old" way (the way 1.3.2 or older
							// did it), otherwise encode params recursively.
							for (prefix in a) {
									buildParams(prefix, a[prefix], traditional, add);
							}
					}

					// Return the resulting serialization
					return s.join('&').replace(r20, '+');

					function buildParams(prefix, obj, traditional, add) {
							var name, i, v;
							// arr[0][]
							if (toStr(obj) === '[object Array]') {
									// Serialize array item.
									for (i in obj) {
											v = obj[i];
											if (traditional || rbracket.test(prefix)) {
													// Treat each array item as a scalar.
													add(prefix, v);

											} else {
													// Item is non-scalar (array or object), encode its numeric index.
													buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add);
											}
									}

							} else if (!traditional && toStr(obj) === '[object Object]') {
									// Serialize object item.
									for (name in obj) {
											buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
									}

							} else {
									// Serialize scalar item.
									add(prefix, obj);
							}
					}
			}
	};
	
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = url2;
    }
    exports.url2 = url2;
  } else {
    root.url2 = url2;
  }

	if (typeof define === 'function' && (define.amd || define.cmd)) {
    define('url2', [], function() {
      return url2;
    });
  }
}.call(this)); 