/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-14 21:04:50
 *
 */

"use strict";

define(['yua', 'css!./skin/def.css'], function(){

    //储存版本信息
    yua.ui.tree = '0.0.1'

    var box = '<ul>{li}</ul>',
        ul = '<ul :class="{open: {it}.open}">{li}</ul>',
        li = '<li :class="{open: {it}.open, dir: {it}.children}">'
            + '<em :click="$toggle({it})"></em>'
            + '<span :click="$select({it})" :class="{active: {it}.id === currItem}" :text="{it}.name"></span>'
            + '{child}</li>';


    function repeat(arr, name){
        var html = ''
        arr.forEach(function(it, i){
            var from = name + '[' + i + ']',
                child = '';
            html += li.replace(/\{it\}/g, from);

            if(it.children){
                child += repeat(it.children, from +'.children')
                child = ul.replace('{li}', child).replace('{it}', from)
            }
            html = html.replace(/\{child\}/, child)
        })

        return html
    }

    function format(arr){
        var tmp = {}, farr = []
        arr.sort(function(a, b){
            return (a.pid === b.pid) ? (a.sort - b.sort) : (a.pid - b.pid)
        })
        arr.forEach(function(it){
            tmp[it.id] = it
            var parentItem = tmp[it.pid]
            delete it.pid
            
            if(!parentItem){
                return farr.push(tmp[it.id])
            }
            parentItem.open = !!parentItem.open
            parentItem.children = parentItem.children || []
            parentItem.children.push(it)
        })
        tmp = arr = null
        return farr
    }

    return yua.component('tree', {
        $template: '<div class="do-tree" :class="{{$skin}}" :html="treeHTML"></div>',
        $init: function(vm){
            vm.$select = function(obj){
                vm.currItem = obj.id
                if(vm.$onClick){
                    vm.$onClick(obj)
                }
            }
            vm.$update = function(arr){
                vm.treeArr.clear()
                vm.treeArr.pushArray(format(arr))
                vm.currItem = -1
                var tpl = repeat(vm.treeArr.$model, 'treeArr')
                vm.treeHTML = box.replace('{li}', tpl)
            }
        },
        $ready: function(vm){
            vm.$onSuccess(vm)
        },
        $skin: 'skin-def',
        treeHTML: '',
        currItem: -1,
        treeArr: [],
        $select: yua.noop,
        $update: yua.noop,
        $onSuccess: yua.noop,
        $onClick: yua.noop,
        $toggle: function(obj){
            obj.open = !obj.open
        }
    })

})