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

    var box = '<ul class="do-tree skin-{skin}">{li}</ul>',
        ul = '<ul :class="{open: {it}.open}">{li}</ul>',
        li = '<li :class="{open: {it}.open, dir: {it}.children}">'
        + '<em :click="$toggle({it})"></em><span '
        + ':click="$click({it})" '
        + ':text="{it}.name"></span>{child}</li>';


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
            if(child){
                
            }
            html = html.replace(/\{child\}/, child)
        })

        
        return html
    }

    return yua.component('tree', {
        $template: '',
        $construct: function(base, opt, attr){
            if(!opt.from && !attr.from){
                throw new Error('tree组件必须传入「from」属性')
            }
            
            var from = attr.from || opt.from,
                arr = base.$up[from].$model,
                tpl = repeat(arr, from)

            delete attr.from
            delete opt.from
            yua.mix(base, opt, attr)

            base.skin = base.skin || 'def'


            tpl = box.replace('{li}', tpl).replace('{skin}', base.skin)

            base.$template = tpl
            
            return base
        },
        $init: function(vm){
            
            vm.$click = function(obj){
                
                if(vm.$onClick){
                    vm.$onClick(obj)
                }
            }
        },
        $click: yua.noop,
        $toggle: function(obj){
            obj.open = !obj.open
        }
    })

})