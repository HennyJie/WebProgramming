//使用了model里面的数据，调用ajax.js中定义的get方法，定义函数init和flush供todo.js中的逻辑调用
(function() {
  var model = window.model;
  var Ajax = window.Ajax;
  var KEYS = ['items', 'msg', 'filter'];
  var URL = 'http://192.168.1.136:3476';
  var MSG = 'Start server by `node examples/data/server.js` on project root';

  Object.assign(model, {
    init: function(callback) {
        //ajax中get方法调用，opt是一个对象
      Ajax.get(URL + '/init', {
          //调用时data传入的ret是经过解析的从后端拿到的数据
        onSuccess: function(data) {
          console.log('inited', data);
          KEYS.forEach(function(key) {
            //先将从后端拿到的数据存储到全局变量
            if (key in data) model.data[key] = data[key];
          });
          //再检查和执行回调函数
          if (callback) callback();
        },
        onFailure: function() {
          console.error(MSG);
        }
      });
    },

    //flush方法，用浏览器中的数据更新服务器的数据，在todo.js中没有使用到callback
    flush: function(callback) {
      //encodeURIComponent对统一资源标识符（URI）的组成部分进行编码
      Ajax.get(URL + '/flush?data=' + encodeURIComponent(JSON.stringify(model.data)), {
        onSuccess: function() {
          console.log('flushed');
          if (callback) callback();
        },
        onFailure: function() {
          console.error(MSG);
        }
      });
    }
  });
})();