/*
    http://www.JSON.org/json2.js
    2011-01-18

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*//*jslint evil: true, strict: false, regexp: false *//*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.
window.JSON||(window.JSON={}),function(){"use strict";function f(n){return n<10?"0"+n:n}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()});var JSON=window.JSON,cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){return escapable.lastIndex=0,escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c=="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];value&&typeof value=="object"&&typeof value.toJSON=="function"&&(value=value.toJSON(key)),typeof rep=="function"&&(value=rep.call(holder,key,value));switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value)return"null";gap+=indent,partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1)partial[i]=str(i,value)||"null";return v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]",gap=mind,v}if(rep&&typeof rep=="object"){length=rep.length;for(i=0;i<length;i+=1)k=rep[i],typeof k=="string"&&(v=str(k,value),v&&partial.push(quote(k)+(gap?": ":":")+v))}else for(k in value)Object.hasOwnProperty.call(value,k)&&(v=str(k,value),v&&partial.push(quote(k)+(gap?": ":":")+v));return v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}",gap=mind,v}}typeof JSON.stringify!="function"&&(JSON.stringify=function(value,replacer,space){var i;gap="",indent="";if(typeof space=="number")for(i=0;i<space;i+=1)indent+=" ";else typeof space=="string"&&(indent=space);rep=replacer;if(!replacer||typeof replacer=="function"||typeof replacer=="object"&&typeof replacer.length=="number")return str("",{"":value});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value=="object")for(k in value)Object.hasOwnProperty.call(value,k)&&(v=walk(value,k),v!==undefined?value[k]=v:delete value[k]);return reviver.call(holder,key,value)}text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return j=eval("("+text+")"),typeof reviver=="function"?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}(),function(window,undefined){"use strict";var History=window.History=window.History||{},jQuery=window.jQuery;if(typeof History.Adapter!="undefined")throw new Error("History.js Adapter has already been loaded...");History.Adapter={bind:function(el,event,callback){jQuery(el).bind(event,callback)},trigger:function(el,event,extra){jQuery(el).trigger(event,extra)},extractEventData:function(key,event,extra){var result=event&&event.originalEvent&&event.originalEvent[key]||extra&&extra[key]||undefined;return result},onDomLoad:function(callback){jQuery(callback)}},typeof History.init!="undefined"&&History.init()}(window),function(window,undefined){"use strict";var document=window.document,setTimeout=window.setTimeout||setTimeout,clearTimeout=window.clearTimeout||clearTimeout,setInterval=window.setInterval||setInterval,History=window.History=window.History||{};if(typeof History.initHtml4!="undefined")throw new Error("History.js HTML4 Support has already been loaded...");History.initHtml4=function(){if(typeof History.initHtml4.initialized!="undefined")return!1;History.initHtml4.initialized=!0,History.enabled=!0,History.savedHashes=[],History.isLastHash=function(newHash){var oldHash=History.getHashByIndex(),isLast;return isLast=newHash===oldHash,isLast},History.isHashEqual=function(newHash,oldHash){return newHash=encodeURIComponent(newHash).replace(/%25/g,"%"),oldHash=encodeURIComponent(oldHash).replace(/%25/g,"%"),newHash===oldHash},History.saveHash=function(newHash){return History.isLastHash(newHash)?!1:(History.savedHashes.push(newHash),!0)},History.getHashByIndex=function(index){var hash=null;return typeof index=="undefined"?hash=History.savedHashes[History.savedHashes.length-1]:index<0?hash=History.savedHashes[History.savedHashes.length+index]:hash=History.savedHashes[index],hash},History.discardedHashes={},History.discardedStates={},History.discardState=function(discardedState,forwardState,backState){var discardedStateHash=History.getHashByState(discardedState),discardObject;return discardObject={discardedState:discardedState,backState:backState,forwardState:forwardState},History.discardedStates[discardedStateHash]=discardObject,!0},History.discardHash=function(discardedHash,forwardState,backState){var discardObject={discardedHash:discardedHash,backState:backState,forwardState:forwardState};return History.discardedHashes[discardedHash]=discardObject,!0},History.discardedState=function(State){var StateHash=History.getHashByState(State),discarded;return discarded=History.discardedStates[StateHash]||!1,discarded},History.discardedHash=function(hash){var discarded=History.discardedHashes[hash]||!1;return discarded},History.recycleState=function(State){var StateHash=History.getHashByState(State);return History.discardedState(State)&&delete History.discardedStates[StateHash],!0},History.emulated.hashChange&&(History.hashChangeInit=function(){History.checkerFunction=null;var lastDocumentHash="",iframeId,iframe,lastIframeHash,checkerRunning;return History.isInternetExplorer()?(iframeId="historyjs-iframe",iframe=document.createElement("iframe"),iframe.setAttribute("id",iframeId),iframe.style.display="none",document.body.appendChild(iframe),iframe.contentWindow.document.open(),iframe.contentWindow.document.close(),lastIframeHash="",checkerRunning=!1,History.checkerFunction=function(){if(checkerRunning)return!1;checkerRunning=!0;var documentHash=History.getHash(),iframeHash=History.getHash(iframe.contentWindow.document.location);return documentHash!==lastDocumentHash?(lastDocumentHash=documentHash,iframeHash!==documentHash&&(lastIframeHash=iframeHash=documentHash,iframe.contentWindow.document.open(),iframe.contentWindow.document.close(),iframe.contentWindow.document.location.hash=History.escapeHash(documentHash)),History.Adapter.trigger(window,"hashchange")):iframeHash!==lastIframeHash&&(lastIframeHash=iframeHash,History.setHash(iframeHash,!1)),checkerRunning=!1,!0}):History.checkerFunction=function(){var documentHash=History.getHash();return documentHash!==lastDocumentHash&&(lastDocumentHash=documentHash,History.Adapter.trigger(window,"hashchange")),!0},History.intervalList.push(setInterval(History.checkerFunction,History.options.hashChangeInterval)),!0},History.Adapter.onDomLoad(History.hashChangeInit)),History.emulated.pushState&&(History.onHashChange=function(event){var currentUrl=event&&event.newURL||History.getLocationHref(),currentHash=History.getHashByUrl(currentUrl),currentState=null,currentStateHash=null,currentStateHashExits=null,discardObject;return History.isLastHash(currentHash)?(History.busy(!1),!1):(History.doubleCheckComplete(),History.saveHash(currentHash),currentHash&&History.isTraditionalAnchor(currentHash)?(History.Adapter.trigger(window,"anchorchange"),History.busy(!1),!1):(currentState=History.extractState(History.getFullUrl(currentHash||History.getLocationHref(),!1),!0),History.isLastSavedState(currentState)?(History.busy(!1),!1):(currentStateHash=History.getHashByState(currentState),discardObject=History.discardedState(currentState),discardObject?(History.getHashByIndex(-2)===History.getHashByState(discardObject.forwardState)?History.back(!1):History.forward(!1),!1):(History.pushState(currentState.data,currentState.title,encodeURI(currentState.url),!1),!0))))},History.Adapter.bind(window,"hashchange",History.onHashChange),History.pushState=function(data,title,url,queue){url=encodeURI(url).replace(/%25/g,"%");if(History.getHashByUrl(url))throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(queue!==!1&&History.busy())return History.pushQueue({scope:History,callback:History.pushState,args:arguments,queue:queue}),!1;History.busy(!0);var newState=History.createStateObject(data,title,url),newStateHash=History.getHashByState(newState),oldState=History.getState(!1),oldStateHash=History.getHashByState(oldState),html4Hash=History.getHash();return History.storeState(newState),History.expectedStateId=newState.id,History.recycleState(newState),History.setTitle(newState),newStateHash===oldStateHash?(History.busy(!1),!1):!History.isHashEqual(newStateHash,html4Hash)&&!History.isHashEqual(newStateHash,History.getShortUrl(History.getLocationHref()))?(History.setHash(newStateHash,!1),!1):(History.saveState(newState),History.Adapter.trigger(window,"statechange"),History.busy(!1),!0)},History.replaceState=function(data,title,url,queue){url=encodeURI(url).replace(/%25/g,"%");if(History.getHashByUrl(url))throw new Error("History.js does not support states with fragment-identifiers (hashes/anchors).");if(queue!==!1&&History.busy())return History.pushQueue({scope:History,callback:History.replaceState,args:arguments,queue:queue}),!1;History.busy(!0);var newState=History.createStateObject(data,title,url),oldState=History.getState(!1),previousState=History.getStateByIndex(-2);return History.discardState(oldState,newState,previousState),History.pushState(newState.data,newState.title,newState.url,!1),!0}),History.emulated.pushState&&History.getHash()&&!History.emulated.hashChange&&History.Adapter.onDomLoad(function(){History.Adapter.trigger(window,"hashchange")})},typeof History.init!="undefined"&&History.init()}(window),function(window,undefined){"use strict";var console=window.console||undefined,document=window.document,navigator=window.navigator,sessionStorage=window.sessionStorage||!1,setTimeout=window.setTimeout,clearTimeout=window.clearTimeout,setInterval=window.setInterval,clearInterval=window.clearInterval,JSON=window.JSON,alert=window.alert,History=window.History=window.History||{},history=window.history;JSON.stringify=JSON.stringify||JSON.encode,JSON.parse=JSON.parse||JSON.decode;if(typeof History.init!="undefined")throw new Error("History.js Core has already been loaded...");History.init=function(){return typeof History.Adapter=="undefined"?!1:(typeof History.initCore!="undefined"&&History.initCore(),typeof History.initHtml4!="undefined"&&History.initHtml4(),!0)},History.initCore=function(){if(typeof History.initCore.initialized!="undefined")return!1;History.initCore.initialized=!0,History.options=History.options||{},History.options.hashChangeInterval=History.options.hashChangeInterval||100,History.options.safariPollInterval=History.options.safariPollInterval||500,History.options.doubleCheckInterval=History.options.doubleCheckInterval||500,History.options.storeInterval=History.options.storeInterval||1e3,History.options.busyDelay=History.options.busyDelay||250,History.options.debug=History.options.debug||!1,History.options.initialTitle=History.options.initialTitle||document.title,History.intervalList=[],History.clearAllIntervals=function(){var i,il=History.intervalList;if(typeof il!="undefined"&&il!==null){for(i=0;i<il.length;i++)clearInterval(il[i]);History.intervalList=null}},History.debug=function(){(History.options.debug||!1)&&History.log.apply(History,arguments)},History.log=function(){var consoleExists=typeof console!="undefined"&&typeof console.log!="undefined"&&typeof console.log.apply!="undefined",textarea=document.getElementById("log"),message,i,n,args,arg;consoleExists?(args=Array.prototype.slice.call(arguments),message=args.shift(),typeof console.debug!="undefined"?console.debug.apply(console,[message,args]):console.log.apply(console,[message,args])):message="\n"+arguments[0]+"\n";for(i=1,n=arguments.length;i<n;++i){arg=arguments[i];if(typeof arg=="object"&&typeof JSON!="undefined")try{arg=JSON.stringify(arg)}catch(Exception){}message+="\n"+arg+"\n"}return textarea?(textarea.value+=message+"\n-----\n",textarea.scrollTop=textarea.scrollHeight-textarea.clientHeight):consoleExists||alert(message),!0},History.getInternetExplorerMajorVersion=function(){var result=History.getInternetExplorerMajorVersion.cached=typeof History.getInternetExplorerMajorVersion.cached!="undefined"?History.getInternetExplorerMajorVersion.cached:function(){var v=3,div=document.createElement("div"),all=div.getElementsByTagName("i");while((div.innerHTML="<!--[if gt IE "+ ++v+"]><i></i><![endif]-->")&&all[0]);return v>4?v:!1}();return result},History.isInternetExplorer=function(){var result=History.isInternetExplorer.cached=typeof History.isInternetExplorer.cached!="undefined"?History.isInternetExplorer.cached:Boolean(History.getInternetExplorerMajorVersion());return result},History.emulated={pushState:!Boolean(window.history&&window.history.pushState&&window.history.replaceState&&!/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i.test(navigator.userAgent)&&!/AppleWebKit\/5([0-2]|3[0-2])/i.test(navigator.userAgent)),hashChange:Boolean(!("onhashchange"in window||"onhashchange"in document)||History.isInternetExplorer()&&History.getInternetExplorerMajorVersion()<8)},History.enabled=!History.emulated.pushState,History.bugs={setHash:Boolean(!History.emulated.pushState&&navigator.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),safariPoll:Boolean(!History.emulated.pushState&&navigator.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),ieDoubleCheck:Boolean(History.isInternetExplorer()&&History.getInternetExplorerMajorVersion()<8),hashEscape:Boolean(History.isInternetExplorer()&&History.getInternetExplorerMajorVersion()<7)},History.isEmptyObject=function(obj){for(var name in obj)return!1;return!0},History.cloneObject=function(obj){var hash,newObj;return obj?(hash=JSON.stringify(obj),newObj=JSON.parse(hash)):newObj={},newObj},History.getRootUrl=function(){var rootUrl=document.location.protocol+"//"+(document.location.hostname||document.location.host);if(document.location.port||!1)rootUrl+=":"+document.location.port;return rootUrl+="/",rootUrl},History.getBaseHref=function(){var baseElements=document.getElementsByTagName("base"),baseElement=null,baseHref="";return baseElements.length===1&&(baseElement=baseElements[0],baseHref=baseElement.href.replace(/[^\/]+$/,"")),baseHref=baseHref.replace(/\/+$/,""),baseHref&&(baseHref+="/"),baseHref},History.getBaseUrl=function(){var baseUrl=History.getBaseHref()||History.getBasePageUrl()||History.getRootUrl();return baseUrl},History.getPageUrl=function(){var State=History.getState(!1,!1),stateUrl=(State||{}).url||History.getLocationHref(),pageUrl;return pageUrl=stateUrl.replace(/\/+$/,"").replace(/[^\/]+$/,function(part,index,string){return/\./.test(part)?part:part+"/"}),pageUrl},History.getBasePageUrl=function(){var basePageUrl=History.getLocationHref().replace(/[#\?].*/,"").replace(/[^\/]+$/,function(part,index,string){return/[^\/]$/.test(part)?"":part}).replace(/\/+$/,"")+"/";return basePageUrl},History.getFullUrl=function(url,allowBaseHref){var fullUrl=url,firstChar=url.substring(0,1);return allowBaseHref=typeof allowBaseHref=="undefined"?!0:allowBaseHref,/[a-z]+\:\/\//.test(url)||(firstChar==="/"?fullUrl=History.getRootUrl()+url.replace(/^\/+/,""):firstChar==="#"?fullUrl=History.getPageUrl().replace(/#.*/,"")+url:firstChar==="?"?fullUrl=History.getPageUrl().replace(/[\?#].*/,"")+url:allowBaseHref?fullUrl=History.getBaseUrl()+url.replace(/^(\.\/)+/,""):fullUrl=History.getBasePageUrl()+url.replace(/^(\.\/)+/,"")),fullUrl.replace(/\#$/,"")},History.getShortUrl=function(url){var shortUrl=url,baseUrl=History.getBaseUrl(),rootUrl=History.getRootUrl();return History.emulated.pushState&&(shortUrl=shortUrl.replace(baseUrl,"")),shortUrl=shortUrl.replace(rootUrl,"/"),History.isTraditionalAnchor(shortUrl)&&(shortUrl="./"+shortUrl),shortUrl=shortUrl.replace(/^(\.\/)+/g,"./").replace(/\#$/,""),shortUrl},History.getLocationHref=function(doc){return doc=doc||document,doc.URL===doc.location.href?doc.location.href:doc.location.href===decodeURIComponent(doc.URL)?doc.URL:doc.location.hash&&decodeURIComponent(doc.location.href.replace(/^[^#]+/,""))===doc.location.hash?doc.location.href:doc.URL||doc.location.href},History.store={},History.idToState=History.idToState||{},History.stateToId=History.stateToId||{},History.urlToId=History.urlToId||{},History.storedStates=History.storedStates||[],History.savedStates=History.savedStates||[],History.normalizeStore=function(){History.store.idToState=History.store.idToState||{},History.store.urlToId=History.store.urlToId||{},History.store.stateToId=History.store.stateToId||{}},History.getState=function(friendly,create){typeof friendly=="undefined"&&(friendly=!0),typeof create=="undefined"&&(create=!0);var State=History.getLastSavedState();return!State&&create&&(State=History.createStateObject()),friendly&&(State=History.cloneObject(State),State.url=State.cleanUrl||State.url),State},History.getIdByState=function(newState){var id=History.extractId(newState.url),str;if(!id){str=History.getStateString(newState);if(typeof History.stateToId[str]!="undefined")id=History.stateToId[str];else if(typeof History.store.stateToId[str]!="undefined")id=History.store.stateToId[str];else{for(;;){id=(new Date).getTime()+String(Math.random()).replace(/\D/g,"");if(typeof History.idToState[id]=="undefined"&&typeof History.store.idToState[id]=="undefined")break}History.stateToId[str]=id,History.idToState[id]=newState}}return id},History.normalizeState=function(oldState){var newState,dataNotEmpty;if(!oldState||typeof oldState!="object")oldState={};if(typeof oldState.normalized!="undefined")return oldState;if(!oldState.data||typeof oldState.data!="object")oldState.data={};newState={},newState.normalized=!0,newState.title=oldState.title||"",newState.url=History.getFullUrl(oldState.url?decodeURIComponent(oldState.url):History.getLocationHref()),newState.hash=History.getShortUrl(newState.url),newState.data=History.cloneObject(oldState.data),newState.id=History.getIdByState(newState),newState.cleanUrl=newState.url.replace(/\??\&_suid.*/,""),newState.url=newState.cleanUrl,dataNotEmpty=!History.isEmptyObject(newState.data);if(newState.title||dataNotEmpty)newState.hash=History.getShortUrl(newState.url).replace(/\??\&_suid.*/,""),/\?/.test(newState.hash)||(newState.hash+="?"),newState.hash+="&_suid="+newState.id;return newState.hashedUrl=History.getFullUrl(newState.hash),(History.emulated.pushState||History.bugs.safariPoll)&&History.hasUrlDuplicate(newState)&&(newState.url=newState.hashedUrl),newState},History.createStateObject=function(data,title,url){var State={data:data,title:title,url:encodeURIComponent(url||"")};return State=History.normalizeState(State),State},History.getStateById=function(id){id=String(id);var State=History.idToState[id]||History.store.idToState[id]||undefined;return State},History.getStateString=function(passedState){var State,cleanedState,str;return State=History.normalizeState(passedState),cleanedState={data:State.data,title:passedState.title,url:passedState.url},str=JSON.stringify(cleanedState),str},History.getStateId=function(passedState){var State,id;return State=History.normalizeState(passedState),id=State.id,id},History.getHashByState=function(passedState){var State,hash;return State=History.normalizeState(passedState),hash=State.hash,hash},History.extractId=function(url_or_hash){var id,parts,url;return parts=/(.*)\&_suid=([0-9]+)$/.exec(url_or_hash),url=parts?parts[1]||url_or_hash:url_or_hash,id=parts?String(parts[2]||""):"",id||!1},History.isTraditionalAnchor=function(url_or_hash){var isTraditional=!/[\/\?\.]/.test(url_or_hash);return isTraditional},History.extractState=function(url_or_hash,create){var State=null,id,url;return create=create||!1,id=History.extractId(url_or_hash),id&&(State=History.getStateById(id)),State||(url=History.getFullUrl(url_or_hash),id=History.getIdByUrl(url)||!1,id&&(State=History.getStateById(id)),!State&&create&&!History.isTraditionalAnchor(url_or_hash)&&(State=History.createStateObject(null,null,url))),State},History.getIdByUrl=function(url){var id=History.urlToId[url]||History.store.urlToId[url]||undefined;return id},History.getLastSavedState=function(){return History.savedStates[History.savedStates.length-1]||undefined},History.getLastStoredState=function(){return History.storedStates[History.storedStates.length-1]||undefined},History.hasUrlDuplicate=function(newState){var hasDuplicate=!1,oldState;return oldState=History.extractState(newState.url),hasDuplicate=oldState&&oldState.id!==newState.id,hasDuplicate},History.storeState=function(newState){return History.urlToId[newState.url]=newState.id,History.storedStates.push(History.cloneObject(newState)),newState},History.isLastSavedState=function(newState){var isLast=!1,newId,oldState,oldId;return History.savedStates.length&&(newId=newState.id,oldState=History.getLastSavedState(),oldId=oldState.id,isLast=newId===oldId),isLast},History.saveState=function(newState){return History.isLastSavedState(newState)?!1:(History.savedStates.push(History.cloneObject(newState)),!0)},History.getStateByIndex=function(index){var State=null;return typeof index=="undefined"?State=History.savedStates[History.savedStates.length-1]:index<0?State=History.savedStates[History.savedStates.length+index]:State=History.savedStates[index],State},History.getHash=function(location){location||(location=document.location);var href=location.href.replace(/^[^#]*/,"");return href.substr(1)},History.unescapeHash=function(hash){var result=History.normalizeHash(hash);return result=decodeURIComponent(result),result},History.normalizeHash=function(hash){var result=hash.replace(/[^#]*#/,"").replace(/#.*/,"");return result},History.setHash=function(hash,queue){var State,pageUrl;return queue!==!1&&History.busy()?(History.pushQueue({scope:History,callback:History.setHash,args:arguments,queue:queue}),!1):(History.busy(!0),State=History.extractState(hash,!0),State&&!History.emulated.pushState?History.pushState(State.data,State.title,State.url,!1):History.getHash()!==hash&&(History.bugs.setHash?(pageUrl=History.getPageUrl(),History.pushState(null,null,pageUrl+"#"+hash,!1)):document.location.hash=hash),History)},History.escapeHash=function(hash){var result=History.normalizeHash(hash);return result=window.encodeURIComponent(result),History.bugs.hashEscape||(result=result.replace(/\%21/g,"!").replace(/\%26/g,"&").replace(/\%3D/g,"=").replace(/\%3F/g,"?")),result},History.getHashByUrl=function(url){var hash=String(url).replace(/([^#]*)#?([^#]*)#?(.*)/,"$2");return hash=History.unescapeHash(hash),hash},History.setTitle=function(newState){var title=newState.title,firstState;title||(firstState=History.getStateByIndex(0),firstState&&firstState.url===newState.url&&(title=firstState.title||History.options.initialTitle));try{document.getElementsByTagName("title")[0].innerHTML=title.replace("<","&lt;").replace(">","&gt;").replace(" & "," &amp; ")}catch(Exception){}return document.title=title,History},History.queues=[],History.busy=function(value){typeof value!="undefined"?History.busy.flag=value:typeof History.busy.flag=="undefined"&&(History.busy.flag=!1);if(!History.busy.flag){clearTimeout(History.busy.timeout);var fireNext=function(){var i,queue,item;if(History.busy.flag)return;for(i=History.queues.length-1;i>=0;--i){queue=History.queues[i];if(queue.length===0)continue;item=queue.shift(),History.fireQueueItem(item),History.busy.timeout=setTimeout(fireNext,History.options.busyDelay)}};History.busy.timeout=setTimeout(fireNext,History.options.busyDelay)}return History.busy.flag},History.busy.flag=!1,History.fireQueueItem=function(item){return item.callback.apply(item.scope||History,item.args||[])},History.pushQueue=function(item){return History.queues[item.queue||0]=History.queues[item.queue||0]||[],History.queues[item.queue||0].push(item),History},History.queue=function(item,queue){return typeof item=="function"&&(item={callback:item}),typeof queue!="undefined"&&(item.queue=queue),History.busy()?History.pushQueue(item):History.fireQueueItem(item),History},History.clearQueue=function(){return History.busy.flag=!1,History.queues=[],History},History.stateChanged=!1,History.doubleChecker=!1,History.doubleCheckComplete=function(){return History.stateChanged=!0,History.doubleCheckClear(),History},History.doubleCheckClear=function(){return History.doubleChecker&&(clearTimeout(History.doubleChecker),History.doubleChecker=!1),History},History.doubleCheck=function(tryAgain){return History.stateChanged=!1,History.doubleCheckClear(),History.bugs.ieDoubleCheck&&(History.doubleChecker=setTimeout(function(){return History.doubleCheckClear(),History.stateChanged||tryAgain(),!0},History.options.doubleCheckInterval)),History},History.safariStatePoll=function(){var urlState=History.extractState(History.getLocationHref()),newState;if(!History.isLastSavedState(urlState))return newState=urlState,newState||(newState=History.createStateObject()),History.Adapter.trigger(window,"popstate"),History;return},History.back=function(queue){return queue!==!1&&History.busy()?(History.pushQueue({scope:History,callback:History.back,args:arguments,queue:queue}),!1):(History.busy(!0),History.doubleCheck(function(){History.back(!1)}),history.go(-1),!0)},History.forward=
function(queue){return queue!==!1&&History.busy()?(History.pushQueue({scope:History,callback:History.forward,args:arguments,queue:queue}),!1):(History.busy(!0),History.doubleCheck(function(){History.forward(!1)}),history.go(1),!0)},History.go=function(index,queue){var i;if(index>0)for(i=1;i<=index;++i)History.forward(queue);else{if(!(index<0))throw new Error("History.go: History.go requires a positive or negative integer passed.");for(i=-1;i>=index;--i)History.back(queue)}return History};if(History.emulated.pushState){var emptyFunction=function(){};History.pushState=History.pushState||emptyFunction,History.replaceState=History.replaceState||emptyFunction}else History.onPopState=function(event,extra){var stateId=!1,newState=!1,currentHash,currentState;return History.doubleCheckComplete(),currentHash=History.getHash(),currentHash?(currentState=History.extractState(currentHash||History.getLocationHref(),!0),currentState?History.replaceState(currentState.data,currentState.title,currentState.url,!1):(History.Adapter.trigger(window,"anchorchange"),History.busy(!1)),History.expectedStateId=!1,!1):(stateId=History.Adapter.extractEventData("state",event,extra)||!1,stateId?newState=History.getStateById(stateId):History.expectedStateId?newState=History.getStateById(History.expectedStateId):newState=History.extractState(History.getLocationHref()),newState||(newState=History.createStateObject(null,null,History.getLocationHref())),History.expectedStateId=!1,History.isLastSavedState(newState)?(History.busy(!1),!1):(History.storeState(newState),History.saveState(newState),History.setTitle(newState),History.Adapter.trigger(window,"statechange"),History.busy(!1),!0))},History.Adapter.bind(window,"popstate",History.onPopState),History.pushState=function(data,title,url,queue){if(History.getHashByUrl(url)&&History.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(queue!==!1&&History.busy())return History.pushQueue({scope:History,callback:History.pushState,args:arguments,queue:queue}),!1;History.busy(!0);var newState=History.createStateObject(data,title,url);return History.isLastSavedState(newState)?History.busy(!1):(History.storeState(newState),History.expectedStateId=newState.id,history.pushState(newState.id,newState.title,newState.url),History.Adapter.trigger(window,"popstate")),!0},History.replaceState=function(data,title,url,queue){if(History.getHashByUrl(url)&&History.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(queue!==!1&&History.busy())return History.pushQueue({scope:History,callback:History.replaceState,args:arguments,queue:queue}),!1;History.busy(!0);var newState=History.createStateObject(data,title,url);return History.isLastSavedState(newState)?History.busy(!1):(History.storeState(newState),History.expectedStateId=newState.id,history.replaceState(newState.id,newState.title,newState.url),History.Adapter.trigger(window,"popstate")),!0};if(sessionStorage){try{History.store=JSON.parse(sessionStorage.getItem("History.store"))||{}}catch(err){History.store={}}History.normalizeStore()}else History.store={},History.normalizeStore();History.Adapter.bind(window,"beforeunload",History.clearAllIntervals),History.Adapter.bind(window,"unload",History.clearAllIntervals),History.saveState(History.storeState(History.extractState(History.getLocationHref(),!0))),sessionStorage&&(History.onUnload=function(){var currentStore,item;try{currentStore=JSON.parse(sessionStorage.getItem("History.store"))||{}}catch(err){currentStore={}}currentStore.idToState=currentStore.idToState||{},currentStore.urlToId=currentStore.urlToId||{},currentStore.stateToId=currentStore.stateToId||{};for(item in History.idToState){if(!History.idToState.hasOwnProperty(item))continue;currentStore.idToState[item]=History.idToState[item]}for(item in History.urlToId){if(!History.urlToId.hasOwnProperty(item))continue;currentStore.urlToId[item]=History.urlToId[item]}for(item in History.stateToId){if(!History.stateToId.hasOwnProperty(item))continue;currentStore.stateToId[item]=History.stateToId[item]}History.store=currentStore,History.normalizeStore(),sessionStorage.setItem("History.store",JSON.stringify(currentStore))},History.intervalList.push(setInterval(History.onUnload,History.options.storeInterval)),History.Adapter.bind(window,"beforeunload",History.onUnload),History.Adapter.bind(window,"unload",History.onUnload));if(!History.emulated.pushState){History.bugs.safariPoll&&History.intervalList.push(setInterval(History.safariStatePoll,History.options.safariPollInterval));if(navigator.vendor==="Apple Computer, Inc."||(navigator.appCodeName||"")==="Mozilla")History.Adapter.bind(window,"hashchange",function(){History.Adapter.trigger(window,"popstate")}),History.getHash()&&History.Adapter.onDomLoad(function(){History.Adapter.trigger(window,"hashchange")})}},History.init()}(window);