// 自定义简易版手势库 参考alloyfinger



; (function () {

    function log(name) {
        var overlay5 = document.querySelector('.overlay5');
        overlay5.innerText =  overlay5.innerText + name + '___';
    }
    // 手势库中可能用到一些向量方法



    // 获取向量的模长
    function getLen(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    // 向量点乘

    function dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    // 向量叉乘

    function cha(v1, v2) {
        return v1.x * v2.y - v2.x * v1.y;
    }


    // 向量叉乘
    // 点向量求角度,根据向量点乘求角度, |A||B| cosX  =  x1 * x2 + y1 * y2 获取角度值

    function getAngle(v1, v2) {
        var mr = getLen(v1) * getLen(v2);
        var r = dot(v1, v2) / mr;
        return Math.acos(r); // 获取的是弧度值
    }


    function getRotateAngle(v1, v2) {
        var angle = getAngle(v1, v2);
        if (cha(v1, v2) < 0) { // 叉乘大于0 表示 v1像v2 逆时针旋转,表现在css上就表示transform 负数的角度
            angle *= -1;
        }
        return angle * 180 / Math.PI;
    }

    // 首先实现一个观察者模型
    function EventEmitter(element) {
        this.handler = {};
        this.element = element;
    }

    // 存入以这个name命名的对象中,例如{'rotate': [handler1,handler2],'singleTap': []}
    EventEmitter.prototype.add = function (name, handler) {
        if (!this.handler[name]) {
            this.handler[name] = [];
        }
        this.handler[name].push(handler);
    }

    EventEmitter.prototype.isExit = function (name) {
        return typeof this.handler[name] === 'undefined';
    }

    // 删除某个handler,例如rotate属性下的某一个handler

    EventEmitter.prototype.del = function (name, handler) {
        if (arguments.length === 0) {
            this.handler = {};
        } else {
            if (name && typeof handler === 'undefined') {
                this.handler[name] === [];
            } else {
                if (this.isExit(name)) {
                    for (var i = 0, k = this.handler[name].length; i < k; i++) {
                        if (handler === this.handler[name][i]) {
                            this.handler.split(i, 1);
                        }
                    }
                }
            }
        }
    };

    //  获取所有的监听函数
    EventEmitter.prototype.getListeners = function (name) {
        if (name == null || name == '') {
            return [];
        } else {
            var handlers = this.handler[name];
            if (!handlers) {
                handlers = this.handler[name] = [];
            }
            return handlers;
        }
    }

    // 触发相应的所有函数
    EventEmitter.prototype.dispatch = function (name) {
        var listeners = this.getListeners(name);

        for (var i = 0, j = listeners.length; i < j; i++) {
            var handler = listeners[i];
            if (typeof handler == 'function') {
                handler.apply(this.element, Array.prototype.slice.call(arguments, 1));
            }
        }
    }

    // 开始定义手势库需要的参数,element表示绑定的

    function Qfinger(element, options) {

        this.element = typeof element == 'string' ? document.querySelector(element) : element;

        this.options = options;

        this.start = this.start.bind(this);

        this.move = this.move.bind(this);

        this.end = this.end.bind(this);

        this.cancel = this.cancel.bind(this);

        var registerFingers = this.registerFingers = ['touchStart', 'touchMove', 'touchEnd', 'touchCancel', 'multipointStart', 'multipointEnd', 'pinch', 'click', 'rotate', 'longTap', 'doubleTap', 'pressMove', 'swipe', 'tap'];

        this.eventEmitter = new EventEmitter(this.element);

        var noop = function () { };

        for (var thisFinger of registerFingers) {
            var handler = this.options[thisFinger] || noop;
            this.eventEmitter.add(thisFinger, handler);
        }

        this.element.addEventListener('touchstart', this.start, false);
        this.element.addEventListener('touchmove', this.move, false);
        this.element.addEventListener('touchcancel', this.cancel, false);
        this.element.addEventListener('touchend', this.end, false);


        this.preV = { x: null, y: null }; // 初始化向量

        this.tapDuration = null; // 这边定义了点击的间隔

        this.preTapPosition = { x: null, y: null } // 这边定义了上次点击的位置

        this.isDoubleTap = false;

        this.longTapTimeout = null;

        this.zoom = 1;

        this.pinchStartLen = null;

    }

    // 绑定开始的触发函数
    Qfinger.prototype.start = function (evt) {
        log('touchstart');
        // 部分android机可能不支持touch事件
        if (!evt.touches) return;
        this.eventEmitter.dispatch('touchStart');
        var len = evt.touches.length;
        var now = Date.now();
        // 点击间隔,按照当前时间剪去上一次点击的时间戳来计算
        this.tapDuration = now - (this.last || now);
        // 记录点击时候的手指位置,后面可能会用到,包括双击
        this.x1 = evt.touches[0].pageX;
        this.y1 = evt.touches[0].pageY;

        // 如果上一次存在 两次间隔时间小于250毫秒,并且在30像素之内,理解为双击
        if (this.preTapPosition.x) {
            this.isDoubleTap = (this.tapDuration > 0 && this.tapDuration < 250 && Math.abs(this.x1 - this.preTapPosition.x) < 30 && Math.abs(this.y1 - this.preTapPosition.y) < 30);
            log('idDoubleTap1' + this.isDoubleTap);
        }
        this.last = now;

        this.preTapPosition = { x: this.x1, y: this.y1 };
        // 两指逻辑
        if (len > 1) {
            log('multipointStart');
            var secondFinger = { x: evt.touches[1].pageX, y: evt.touches[1].pageY };

            // 向量为两个点的x和两个点的y相减
            this.preV = { x: secondFinger.x - this.x1, y: secondFinger.y - this.y1 };

            // 触发多点触发
            this.eventEmitter.dispatch('multipointStart', evt);

            // 初始化两指的长度
            this.pinchStartLen = getLen(this.preV);
        }

        // 用setTimeout来异步模拟时间差,方面后面清除操作。
        this.longTapTimeout = setTimeout(function () {
            this.eventEmitter.dispatch('longTap', evt);
        }.bind(this), 750);
    }

    // 绑定移动的触发函数

    Qfinger.prototype.move = function (evt) {
        if (!evt.touches) return;
        log('move');
        this.eventEmitter.dispatch('touchMove', evt);
        var len = evt.touches.length;
        var currentX = evt.touches[0].pageX;
        var currentY = evt.touches[0].pageY;
        this.isDoubleTap = false;
        if (len > 1) {
            log('multipointMove');
            // 后面两个点的向量值
            var v = { x: evt.touches[1].pageX - currentX, y: evt.touches[1].pageY - currentY };
            if (this.preV !== null) {
                var angle = getRotateAngle(this.preV, v); // 表示prev到v的角度值,也就是旋转的角度

                evt.angle = angle;

                this.eventEmitter.dispatch('rotate', evt);
                if (this.pinchStartLen) {
                    // 获取旋转缩放比率
                    this.zoom = getLen(v) / this.pinchStartLen;
                    evt.zoom = this.zoom;
                    this.eventEmitter.dispatch('pinch', evt);
                }
            }
            this.preV.x = v.x;
            this.preV.y = v.y;
        } else {
            log('singleMove');
            if (this.x2 != null) {
                evt.deltaX = currentX - this.x2;
                evt.deltaY = currentY - this.y2;
            } else { // 有一种情况,一开始双指,然后移开一指,触发end事件,会清空this.x2,走下面这个逻辑,这时候this.x1也为空,导致问题,默认为0,就是没有移动
                // evt.deltaX = currentX - this.x1;
                // evt.deltaY = currentY - this.y1;
                evt.deltaX = 0;
                evt.deltaY = 0;
            }
            this.x2 = currentX;
            this.y2 = currentY;
            this.eventEmitter.dispatch('pressMove', evt);

        }
        this.cancelLongTap();
        // 阻止两指也能移动
        if (len > 1) {
            evt.preventDefault();
        }
    }

    //  绑定end的触发函数,evt.touches表示事件发生时,屏幕上的手指信息数组,evt.changedTouches,表示事件发生时产生变化的手指列表,end事件发生时,屏幕上不会有手指了,因此这个属性很关键

    Qfinger.prototype.end = function (evt) { //所有单机 双击操作,都是在end事件中完成的
        if (!evt.changedTouches) return;
        this.cancelLongTap();

        // 只要发生离开事件就会触发
        this.eventEmitter.dispatch('touchEnd', evt);

        // 多指离开事件
        if (evt.changedTouches.length > 1) {
            this.eventEmitter.dispatch('multipointEnd', evt);
        }
        log('isDoubleTap2' + this.isDoubleTap);

        //swipe动作,滑动抬手触发,相对来说比较容易控制,以移动30px以上就触发

        if ((this.x2 && Math.abs(this.x2 - this.x1) > 30) ||
            (this.y2 && Math.abs(this.y2 - this.y1) > 30)) {
            evt.direction = this.getDirection(this.x1, this.y1, this.x2, this.y2);
            // 异步执行,为后面的cancel事件服务的
            this.swipeTimeout = setTimeout(function () {
                this.eventEmitter.dispatch('swipe', evt);
            }, 0);
        } else {
            this.tapTimeout = setTimeout(function(){
                this.eventEmitter.dispatch('tap',evt);
                log('isDoubleTap3' + this.isDoubleTap);
                if (this.isDoubleTap) {
                    clearTimeout(this.click);
                    this.eventEmitter.dispatch('doubleTap',evt);
                    this.isDoubleTap = false;
                }
            }.bind(this),0);

            if (!this.isDoubleTap) {
                this.click = setTimeout(function(){
                    this.eventEmitter.dispatch('click',evt);
                }.bind(this),250);
            }
        }

        // 清空preV的值
        this.preV = { x: null, y: null };
        this.pinchStartLen = null;
        this.x1 = this.y1 = this.x2 = this.y2 = null;
    }

    // 绑定cancel的触发函数

    Qfinger.prototype.cancel = function () {
        if (this.swipeTimeout) clearTimeout(this.swipeTimeout);
        if (this.longTapTimeout) clearTimeout(this.longTapTimeout);
        if (this.click) clearTimeout(this.click);
        if (this.tapTimeout) clearTimeout(this.tapTimeout);
        this.eventEmitter.dispatch('touchCancel',evt);
    }

    // 确定swipe方向的函数

    Qfinger.prototype.getDirection = function (x1, y1, x2, y2) {
        if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
            if (x2 > x1) {
                return 'right';
            } else {
                return 'left';
            }
        } else {
            if (y2 > y1) {
                return 'down';
            } else {
                return 'up';
            }
        }
    }



    // 取消 长按的计时器触发

    Qfinger.prototype.cancelLongTap = function () {
        if (this.longTapTimeout) clearTimeout(this.longTapTimeout);
    }

    if (typeof module !== 'undefined' && typeof exports == 'object') {
        module.exports = Qfinger;
    } else {
        window.Qfinger = Qfinger;
    }


}());