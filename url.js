(function (global, factory) {
	'use strict';	
	// Node.js, CommonJS, CommonJS Like
	if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = factory(global, true);
	} else {
		factory(global);
	}
}(this, function (global, noGlobal) {
	// Support cmd && amd
	if (define && (define.cmd || define.amd)) {
		return define("url", [], factory);
	} 
	// Global require
	if (typeof require === 'function') {
		return factory(require);
	}
	
	function factory (require, exports) {
		var 
		$ = require('jquery'), 
		urlobj;
		
		return urlobj = {
	        /**
	         * Parse a URL and return its components  
	         * note: Based on http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
	         * note: blog post at http://blog.stevenlevithan.com/archives/parseuri
	         * note: demo at http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
	         * note: Does not replace invalid characters with '_' as in PHP, nor does it return false with
	         * note: a seriously malformed URL.
	         * note: Besides function name, is essentially the same as parseUri as well as our allowing
	         * note: an extra slash after the scheme/protocol (to allow file:/// as in PHP)
	         * example 1: parse_url('http://username:password@hostname/path?arg=value#anchor');
	         * returns 1: {scheme: 'http', host: 'hostname', user: 'username', pass: 'password', path: '/path', query: 'arg=value', fragment: 'anchor'}
	         */
	        resolve: function(str, component) {
	            var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 
	                                'relative', 'path', 'directory', 'file', 'query', 'fragment'],
	                ini = (this.php_js && this.php_js.ini) || {},
	                mode = (ini['phpjs.parse_url.mode'] && 
	                    ini['phpjs.parse_url.mode'].local_value) || 'php',
	                parser = {
	                    php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	                    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	                    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
	                };
	         
	            var m = parser[mode].exec(str),
	                componet = {
	                    scheme: '', 
	                    host: '', 
	                    hostname: '', 
	                    domain: '', 
	                    port: '', 
	                    user: '', 
	                    pass: '', 
	                    path: '', 
	                    file: '', 
	                    query: '', 
	                    fragment: ''
	                },
	                i = 14;
	            while (i--) {
	                if (m[i]) {
	                  componet[key[i]] = m[i];  
	                }
	            }
	         
	            if (component) {
	                return componet[component.replace('PHP_URL_', '').toLowerCase()];
	            }
	            if (mode !== 'php') {
	                var name = (ini['phpjs.parse_url.queryKey'] && 
	                        ini['phpjs.parse_url.queryKey'].local_value) || 'queryKey';
	                parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
	                componet[name] = {};
	                componet[key[12]].replace(parser, function ($0, $1, $2) {
	                    if ($1) {componet[name][$1] = $2;}
	                });
	            }
	            // hostname 
	            componet.host && (componet.hostname = componet.host);
	            // hostname:port
	            componet.port && (componet.host = componet.host + ':' + componet.port);
	            // http://username:password@hostname:port
	            if (componet.scheme || componet.host) {
	                componet.domain = (componet.scheme || 'http') + '://' + (componet.user ? (componet.user + ':' + componet.pass + '@') : '') + componet.host;
	            }
	            componet.file = componet.path.slice(componet.path.lastIndexOf('/') + 1);
	            // delete componet.source;
	            return componet;
	        }, 
	        unparam: function (url) {
				if (typeof url === 'object') return url;
				if (url === '') {
					return {};
				}
				
				var 
				vars = {}, hash, i,
				urlParams = url.indexOf('?') > -1 ? url.split('?')[1] : url, 
				hashes = urlParams.split('&');
				
				for (i = 0; i < hashes.length; i++) {
					hash = hashes[i].split('=');
					vars[hash[0]] = decodeURIComponent(hash[1]).replace(/\+/g, ' ');
				}
				return vars;
			}, 
	        addQuery: function(url, query) {
				
	            if (!query || isEmptyObject(query)) return url;
	            var u = urlobj.resolve(url), l = url.indexOf('?'), 
	                q, 
	                f = u.fragment ? '#' + u.fragment : '';    
	            u.query = urlobj.unparam(u.query);
	            query = (typeof query === "string") ? urlobj.unparam(query) : query;
	            q = decodeURIComponent($.param($.extend(true, {}, u.query, query)));
	            return url.substring(0, (l > -1) ? l : url.length) + '?' + q + f;
	            function isEmptyObject	(object) {
	            	var key;
	            	if (typeof object !== 'object') return false; 
            		for (key in object) return false;
            		return true;
	            }
	        }, 	        
		    getAbsoluteUrl: function (u, r) {
		        var s = (u.query ? '?' + u.query : '') + (u.fragment ? '#' + u.fragment : ''),
		            p1 = u.path,
		            p2 = r.path,
		            p,
		            key;
		
		        // ''
		        p1 = p1 ? p1.replace(/^\//, '').split('/') : [];
		        p2 = p2 ? p2.replace(/^\//, '').split('/') : [];
		
		        for (key in p1) {
		            if (p1[key] === '.') p1.splice(key, 1);
		        }
		        $.each(p1, function () {
		            p2.splice(p2.length - 1, 1);
		        });
		
		        p = p2;
		        $.each(p1, function (k, v) {
		            if (v === '..') return;
		            p.push(v);
		        });
		
		        return r.domain + '/' + p.join('/') + s;
		    },
		    getRelativeUrl: function (u) {
		        if (this.isSameDomain(u, baseUrl)) {
		            return u.source.replace(baseUrl.domain, "");
		        }
		        // Cross domain
		        return decodeURIComponent(u.source);
		    },
		    isPermittedCrossDomainRequest: function (u, crossDomainList, alias) {
		        if (this.isSameDomain(u, baseUrl)) return false;
		        var _domain = (alias) && u.domain.slice(0, -alias.length);
		        return crossDomainList === '*' || (crossDomainList !== '' && ($.inArray(_domain, crossDomainList) > -1));
		    },
		    isPermittedDomainRequest: function (u) {
		        return this.isSameDomain(u, baseUrl) || this.isPermittedCrossDomainRequest(u);
		    },
		    // Local scheme, eg: mailto:, tel:
		    isLocalUrlScheme: function (u) {
		        var schemes = ['http:', 'https:'];
		        return (~$.inArray(u.scheme, schemes)) ? true : false;
		    },
		    isRelative: function (u, alias) {
		        return !u.domain || (u.domain ===alias);
		    },
		    isExternal: function (u) {
		        if (this.isRelative(u)) return false;
		        return u.domain !== baseUrl.domain ? true : false;
		    },
		    isSameDomain: function (u1, u2) {
		        if (this.isRelative(u1)) return true;
		        return u1.domain === u2.domain;
		    }	
	    };
		
	}

}));