"use strict";
define(["yua","text!./pages.htm", "css!./pages"], function(yua, tpl) {

    //计算页码列表
    function calculate(vm){
        if (vm.total < 2)
            return vm.pageList.clear();

        var arr = [],
            mid = vm.curr < vm.max / 2 ? vm.max - vm.curr : Math.floor(vm.max / 2);

        if(vm.curr - mid > 1){
            arr.push('...')
        }
        for (var i = vm.curr - mid; i < vm.curr + mid + 1 && i <= vm.total; i++){
            if(i > 0){
                arr.push(i)
            }
        }
        if(vm.curr + mid < vm.total){
            arr.push('...')
        }
        vm.pageList = arr
    }

    function update(pid, vm) {
        if(pid < 1){
            pid = vm.input = 1
        }
        if(pid > vm.total){
            pid = vm.input = vm.total
        }
        if(pid !== vm.curr){
            vm.curr = vm.input = pid
            vm.$onJump(pid)
        }
    }

    return yua.component('pages', {
        $template: tpl,
        $init: function(vm) {

            calculate(vm)

            vm.$setUrl = function(val) {
                if(!vm.url
                    || '...' === val
                    || vm.curr === val
                    || val > vm.total
                    || 1 > val) {

                    return 'javascript:;'
                }else{
                    return vm.url.replace('{id}', val)
                }
            }

            vm.$jump = function(ev, val) {
                if ('...' !== val) {
                    var link = this.getAttribute('href') || this.getAttribute('xlink:href')

                    if (val !== void 0){
                        if('javascript:;' !== link){
                            location.hash = link
                        }
                        var pid = val >> 0;
                        update(pid, vm)
                    } else {
                        vm.input = vm.input >>> 0 || 1;
                        if(13 == ev.keyCode){
                            update(vm.input, vm)
                        }
                    }
                }
            }
            vm.$watch('curr', function(val, old) {
                val = (val >>> 0) || 1
                old = old >>> 0
                if(val !== old){
                    calculate(vm)
                }
            })

            vm.$watch('total', function(val, old) {
                val = (val >>> 0) || 1
                old = old >>> 0
                if(val !== old){
                    calculate(vm)
                }
            })
        },
        curr: 1,
        total: 1,
        max: 5,
        url: "javascript:;",
        inputJump: !1,
        simpleMode: !1,
        input: 1,
        pageList: [],
        btns: {
            prev: "<<",
            next: ">>",
            home: "首页",
            end: "末页"
        },
        $skipArray: ['max', 'btns', 'url'],
        $setUrl: yua.noop,
        $jump: yua.noop,
        $onJump: yua.noop
    })
});