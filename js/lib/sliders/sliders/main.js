/**
 *
 * @authors linteng (875482941@qq.com)
 * @date    2017-09-07 19:53:18
 */

define(["yua", "text!./main.htm", "css!./main"], function(yua, tpl){

    function setWidth(){

        var dom = document.querySelector('.do-sliders')
        var width = window.getComputedStyle ? window.getComputedStyle(dom).width : dom.offsetWidth + 'px'
        return width
    }

    return yua.component("sliders", {
        $template: tpl,
        $construct: function(a, b, c){
            yua.mix(a, b, c)
            return a
        },
        $init: function(vm){
            vm.slideList = [{src: '../test/images/1.jpeg'}, {src: '../test/images/2.jpg'}, {src: '../test/images/3.jpeg'}, {src: '../test/images/4.jpeg'}]
            vm.$go = function(ev, num){
                vm.curr += num
                if(vm.curr < 0){
                    vm.curr = vm.slideList.length - 1
                }else if(vm.curr > vm.slideList.length - 1){
                    vm.curr = 0
                }
            }

            vm.$jump = function(ev, i){
                vm.curr = i
            }


            vm.$watch('curr', function(val, old) {
                vm.currWidth = setWidth()
                var width
                if(vm.currWidth.indexOf('px') > -1)
                    width = vm.currWidth.slice(0, vm.currWidth.indexOf('px'))

                vm.transform = 'transform: translate(' + (-width * val) + 'px, 0);'
            })

            window.addEventListener('resize', function(){
                vm.currWidth = setWidth()
                var width
                if(vm.currWidth.indexOf('px') > -1)
                    width = vm.currWidth.slice(0, vm.currWidth.indexOf('px'))

                vm.transform = 'transform: translate(' + (-width * vm.curr) + 'px, 0);'
            }, false)

        },
        $ready: function(vm){
            vm.currWidth = setWidth()
        },
        slideList: [],
        curr: 0,
        currWidth: 0,
        transform: '',
        $jump: function(ev, i){

        },
        $go: yua.noop,
        leftButton: '',
        rightButton: ''
    })

    yua.scan()

})