var $ = function(sel) {
    return document.querySelector(sel);
};

var $All = function(sel) {
    return document.querySelectorAll(sel);
};

var makeArray = function(likeArray) {
    var array = [];
    for (var i = 0; i < likeArray.length; ++i) {
        array.push(likeArray[i]);
    }
    return array;
};

//为每一条to-do赋值一个唯一的id
var guid = 0;
var CL_COMPLETED = 'completed';
var CL_SELECTED = 'selected';
var CL_EDITING = 'editing';

//展示侧边栏
function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle('active');
}

//利用回调来刷新，用于后面写的滑动手势动画
window.requestAnimFrame = (function () {
    //requestAnimationFrame可以传一个回调函数进去，隔一帧之后调用
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            //隔一帧之后调用callback
            window.setTimeout(callback, 1000 / 60);
        };
})();

//前端改变时，数据重新加载
function update() {
    //用全局变量中的数据更新服务器的数据，数据直接附在url里面，见provider-ajax.js
    model.flush();
    //获取全局变量model中的数据
    var data = model.data;
    var activeCount = 0;
    var todoList = $('.todo-list');
    todoList.innerHTML = '';

    //items: [{msg:'', completed: false}]
    data.items.forEach(function(itemData, index) {
        if (!itemData.completed) activeCount++;

        //根据过滤器作展示
        if (
            data.filter === 'All'
            || (data.filter === 'Undo' && !itemData.completed)
            || (data.filter === 'Done' && itemData.completed)
        ) {
            var item = document.createElement('section');
            item.classList.add('content');
            var id = 'item' + guid++;
            item.setAttribute('id', id);

            item.innerHTML = [
                '<div class="swipe-element">',
                '<div class="swipe-back">',
                '<button class="destroy">Delete</button>',
                '<button class="top">Top</button>',
                '</div>',
                '<p class="swipe-front">',
                '<input class="toggle" type="checkbox">',
                '<label class="todo-label">'+itemData.msg+'</label>',
                '</p>',
                '</div>'
            ].join('');

            //获取要绑定监听的dom元素
            var front = item.querySelector('.swipe-front');
            //触摸事件发生的位置
            var client = 0;
            //相对上一次的位置变化
            var deltaX = 0;
            //相对于原点的位置（原点指固定在右侧不滑动的时候）
            var transX = 0;

            front.addEventListener('touchstart', function (ev) {
                console.log(ev);
                client = ev.targetTouches[0].clientX;
            }, true);

            front.addEventListener('touchmove', function (ev) {
                //计算位置变化量
                deltaX = ev.targetTouches[0].clientX - client;
                //更新client
                client = ev.targetTouches[0].clientX;

                //利用正则表达式匹配出上一次的transX
                let reEx = /-?\d+/g;
                //input:translate(-180px)
                //prePer:["-180", index: 11, input: "translateX(-180px)", groups: undefined]
                let prePer = reEx.exec(front.style.transform);
                if (prePer !== null) {
                    prePer = parseInt(prePer[0]);
                    //transX为新的相对原点位置
                    transX = deltaX + prePer;
                }
                else {
                    transX = deltaX;
                }
                //限制一下端点
                if (transX <= (-window.shiftWidth))
                    transX = (-window.shiftWidth);
                if (transX >= 0)
                    transX = 0;
                console.log(deltaX);
                //实时更新位置属性
                front.style.transform = 'translateX( ' + transX + 'px )';
            }, true);

            front.addEventListener('touchend', function (ev) {
                //用来控制如果用户没有滑到头的话，就自动化滑到头
                if (deltaX < 0 && transX > (-window.shiftWidth)) {
                    finishLeft(front, transX)
                }
                else if (deltaX > 0 && transX < 0) {
                    finishRight(front, transX)
                }
                clientX = 0;
                deltaX = 0;
                transX = 0;
            }, true);

            var lab = item.querySelector('.todo-label');
            if (itemData.completed)
                lab.classList.add(CL_COMPLETED);

            //左滑单条to-do
            function finishLeft(ob, nowTran) {
                //每一帧移动8个pixel
                let tran = nowTran - 8;
                //限制端点
                if(tran<(-window.shiftWidth))
                    tran = (-window.shiftWidth);
                ob.style.transform = 'translateX( ' + tran + 'px )';
                if(nowTran!==tran)
                //重复执行，直到滑到头了
                    window.requestAnimationFrame(function() {
                        finishLeft(ob, tran)
                    })
            }

            //右滑单条to-do
            function finishRight(ob, nowTran) {
                let tran = nowTran + 8;
                if(tran>0)
                    tran = 0;
                ob.style.transform = 'translateX( ' + tran + 'px )';
                if(nowTran!==tran)
                //重复执行，直到滑到头了
                    window.requestAnimationFrame(function() {
                        finishRight(ob, tran)
                    })
            }

            //double tap编辑单条to-do
            var label = item.querySelector('.todo-label');
            //记录此次点击上一次点击的发生时间
            var latesttap = new Date().getTime();

            label.addEventListener('touchstart', function() {
                //记录当前时间
                var now = new Date().getTime();
                //检查两次点击时间间隔
                var timesince = now - latesttap;
                latesttap = now;
                //如果时间间隔过大，不判断为dbclick
                if(timesince >= 600 || timesince <= 0)
                    return;
                //否则就加入editing类
                label.classList.add(CL_EDITING);
                let del = item.querySelector('.swipe-front');
                //新建一个输入框
                var edit = document.createElement('input');
                var finished = false;
                edit.setAttribute('type', 'text');
                edit.setAttribute('class', 'edit');
                edit.setAttribute('value', label.innerHTML);

                //对输入框停止编辑时（如光标移开）
                function finish() {
                    if (finished) return;
                    finished = true;
                    del.removeChild(edit);
                    del.appendChild(label);
                    label.classList.remove(CL_EDITING);
                }

                //鼠标移开，编辑记录不会保存
                edit.addEventListener('blur', function() {
                    finish();
                }, false);

                //编辑完成
                edit.addEventListener('keyup', function(ev) {
                    if (ev.keyCode === 27) { // Esc
                        finish();
                    }
                    else if (ev.keyCode === 13) {// Enter
                        label.innerHTML = this.value;
                        itemData.msg = this.value;
                        //前端的数据更新到服务器
                        update();
                    }
                }, false);

                //把input框加进去，label移除
                del.appendChild(edit);
                del.removeChild(label);
                edit.focus();

            }, false);

            //单条to-do完成
            var itemToggle = item.querySelector('.toggle');
            itemToggle.checked = itemData.completed;
            itemToggle.addEventListener('change', function() {
                itemData.completed = !itemData.completed;
                //前端的数据更新到服务器
                update();
            }, false);

            //删除一条todo
            item.querySelector('.destroy').addEventListener('click', function() {
                data.items.splice(index, 1);
                update();
            }, false);

            //置顶一条todo
            item.querySelector('.top').addEventListener('click', function () {
                let tmp = data.items.splice(index, 1);
                data.items.push(tmp[0]);
                update();
            },false);

            todoList.insertBefore(item, todoList.firstChild);
        }
    });

    //将刷新前输在本地的输入框信息展示在输入框中
    var newTodo = $('.new-todo');
    newTodo.value = data.msg;

    //显示剩余to-do数量
    var completedCount = data.items.length - activeCount;
    var count = $('.todo-count');
    count.innerHTML = (activeCount || 'No') + (activeCount > 1 ? ' items' : ' item') + ' left';

    //有完成项的时候，清除完成按钮才会可见
    var clearCompleted = $('.clear-completed');
    clearCompleted.style.visibility = completedCount > 0 ? 'visible' : 'hidden';

    var toggleAll = $('.toggle-all');
    toggleAll.style.visibility = data.items.length > 0 ? 'visible' : 'hidden';
    toggleAll.checked = data.items.length === completedCount;

    //根据filter选择性展示
    var filters = makeArray($All('.filters li a'));
    filters.forEach(function(filter) {
        if (data.filter === filter.innerHTML) filter.classList.add(CL_SELECTED);
        else filter.classList.remove(CL_SELECTED);
    });
}

window.onload = function() {
    //init传入了一个回调函数，先将数据在浏览器中准备好，再执行下面的回调函数
    model.init(function(){
        var data = model.data;
        var newTodo = $('.new-todo');

        newTodo.addEventListener('keyup', function() {
            //将输入到输入框中的编辑信息存到全局变量msg
            data.msg = newTodo.value;
        });

        newTodo.addEventListener('change', function() {
            //将浏览器数据同步到后端
            model.flush();
        });

        //enter的时候存到全局变量items
        newTodo.addEventListener('keyup', function(ev) {
            if (ev.keyCode !== 13) return; // Enter

            if (data.msg === '') {
                console.warn('input msg is empty');
                return;
            }
            data.items.push({msg: data.msg, completed: false});
            data.msg = '';
            update();
        }, false);

        //这里之前有个小bug，把foreach改掉（从后向前删除）就好了
        var clearCompleted = $('.clear-completed');
        clearCompleted.addEventListener('click', function() {
            for(let i = data.items.length-1;i >= 0;i--) {
                if (data.items[i].completed) data.items.splice(i, 1);
            }
            update();
        }, false);

        var toggleAll = $('.toggle-all');
        toggleAll.addEventListener('click', function() {
            var completed = toggleAll.checked;
            data.items.forEach(function(itemData) {
                itemData.completed = completed;
            });
            update();
        }, false);

        //点击添加按钮
        var addBt = $('#add');
        addBt.addEventListener('click', function(ev) {
            if (data.msg === '') {
                console.warn('input msg is empty');
                return;
            }
            data.items.push({msg: data.msg, completed: false});
            data.msg = '';
            update();
        }, false);

        //更新过滤器中被选中的项目
        var filters = makeArray($All('.filters li a'));
        filters.forEach(function(filter) {
            filter.addEventListener('click', function() {
                data.filter = filter.innerHTML;
                filters.forEach(function(filter) {
                    filter.classList.remove(CL_SELECTED);
                });
                filter.classList.add(CL_SELECTED);
                update();
            }, false);
        });

        //前端的数据更新到服务器
        update();

        window.shiftWidth = 180;
    });
};