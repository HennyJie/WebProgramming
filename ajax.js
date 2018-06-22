(function() {
  var GET = 'get';
  window.Ajax = {
    /**
     * Basic Ajax
     * @param url {String}
     * @param [opt] {Object}
     * @param [opt.onSuccess] {Function}
     * @param [opt.onFailure] {Function}
     * @param [opt.cached] {Boolean}
     */
    //get方法用于向服务器发送请求，服务器的url，opt是一个对象
    get: function(url, opt) {
      opt = opt || {};
      if (opt.cached) {
        url += (url.indexOf('?') > -1 ? '&' : '?') + new Date().getTime() + 'r';
      }

      // 建立一个新的HTTP请求
      var request = new XMLHttpRequest();

      // 当请求的状态发生改变时，比如被响应了
      request.onreadystatechange = function() {
          //如果请求被响应
        if (request.readyState === XMLHttpRequest.DONE) {
          // 如果是一个成功的请求
          if (request.status >= 200 && request.status < 400) {
            //获取从后端返回请求中的数据
            var ret = request.responseText;

            //如果类型是json格式，则需要解析
            var contentType = request.getResponseHeader('content-type');
            if (contentType === 'application/json' || contentType === 'text/json') {
              try {
                console.log(ret);
                  //json解析
                ret = JSON.parse(ret);
                console.log(ret);
              } catch (e) {
                console.error(e);
                if (opt.onFailure) opt.onFailure(e);
              }
            }

            // 如果不是json格式的，直接调用opt的onSuccess函数，将ret传入
            if (opt.onSuccess) opt.onSuccess(ret);
          }
          else {
            if (opt.onFailure) opt.onFailure();
          }
        }
      };

      //规定请求的类型，URL以及是否异步处理请求
      request.open(GET, url, true);
      //将请求发送至服务器
      request.send(null);
    }
  }
})();

//对ajax封装，方便调用