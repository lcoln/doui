/**
 *
 * @authors linteng (875482941@qq.com)
 * @date    2017-09-07 19:53:18
 */

define(["yua", "text!./main.htm", "css!./main"], function(yua, tpl){

    var auto

    /**
     * [获取当前幻灯片元素宽度]
     */
    function getWidth(){

        var dom = document.querySelector('.do-sliders')
        var width = window.getComputedStyle ? window.getComputedStyle(dom).width : dom.offsetWidth + 'px'
        return width
    }

    /**
     * [根据当前幻灯片索引获取填充底下按钮数据]
     * @param  {Object} vm [vm对象]
     * @return {[Array]}    [填充到按钮的数据]
     */
    function getBtnList(vm){
        var currWidth = vm.currWidth.slice(0, -2)
        vm.maxNum = Math.floor(currWidth / 160)
        var curr = vm.curr + 1
        if(!vm.preview)
            return vm.sliderList

        if(vm.maxNum >= vm.sliderList.length){
            return vm.sliderList
        }else{
            if(curr > vm.maxNum){
                return vm.sliderList.slice(curr - vm.maxNum, curr)
            }else if(curr <= vm.maxNum){
                return vm.sliderList.slice(0, vm.maxNum)
            }
        }
        return vm.sliderList
    }

    /**
     * [设置自动轮播]
     * @param  {[type]} vm [description]
     * @return {[type]}    [description]
     */
    function autoSlide(vm){
        var timer = setInterval(function(){
            vm.$go(1)
        }, vm.time)
        return timer
    }

    return yua.component("sliders", {
        $template: tpl,
        $init: function(vm){
            vm.$go = function(num){
                vm.curr += num
                if(vm.curr < 0){
                    vm.curr = vm.sliderList.length - 1
                }else if(vm.curr > vm.sliderList.length - 1){
                    vm.curr = 0
                }
            }

            vm.$jump = function(i){
                var curr = vm.curr + 1
                if(curr > vm.maxNum && vm.preview){
                    var distance = vm.maxNum - (i + 1)
                    vm.curr -= distance
                }else{
                    vm.curr = i
                }
            }

            vm.$stopSlide = function(){
                if(vm.autoSlide){
                    clearInterval(auto)
                }
            }

            vm.$startSlide = function(){
                if(vm.autoSlide)
                    auto = autoSlide(vm)
            }

            vm.$watch('curr', function(val, old) {
                vm.currWidth = getWidth()
                var width
                if(vm.currWidth.indexOf('px') > -1)
                    width = vm.currWidth.slice(0, vm.currWidth.indexOf('px'))

                vm.transform = 'transform: translate(' + (-width * val) + 'px, 0);'
                if(vm.preview)
                    vm.sliderBtnList = getBtnList(vm)
            })

            window.addEventListener('resize', function(){
                vm.currWidth = getWidth()
                var width
                if(vm.currWidth.indexOf('px') > -1)
                    width = vm.currWidth.slice(0, vm.currWidth.indexOf('px'))

                vm.transform = 'transform: translate(' + (-width * vm.curr) + 'px, 0);'
                if(vm.preview)
                    vm.sliderBtnList = getBtnList(vm)
            }, false)

        },
        $ready: function(vm){
            vm.currWidth = getWidth()
            if(vm.autoSlide)
                auto = autoSlide(vm)

            vm.sliderBtnList = getBtnList(vm)
        },
        currWidth: 0,
        transform: '',
        curr: 0,
        sliderBtnList: [],
        maxNum: '',

        sliderList: [],
        autoSlide: '',
        time: 3000,
        preview: true,

        $jump: yua.noop,
        $stopSlide: yua.noop,
        $startSlide: yua.noop,
        $go: yua.noop,
    })

    yua.scan()

})