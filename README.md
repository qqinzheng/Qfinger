超小型的手势库的实现

无论多么复杂的手势系统,都会基于四个最基础的触摸事件touchstart,touchmove,touchend,touchcancel


var QfingerInstance = new QfingerInstance('#abc',{
    touchStart: function(){},
    touchMove: function(){},
    touchEnd: function(){},
    touchCancel: function(){},
    // 两指拉伸
    pinch: function(){},
    // 多指旋转
    rotate: function(){},
    // 多指触控,类似于多指touchstart
    multipointStart: function(){},
    // 多指离开时触发
    multipointEnd: function(){},
    // click,模拟点击时间,有大约250毫秒的延迟
    click: function(){},
    //longTap 长按事件,
    longTap: function(){},
    // 双击事件 
    doubleTap:function(){},
    // pressMove 点击旋转事件
    pressMove: function(){},
    // swipe 左滑右滑事件
    swipe: function(){},
    // tap 没有相应延迟,可以用于连连看之类的游戏，和click不一致
    tap: function(){}
});
