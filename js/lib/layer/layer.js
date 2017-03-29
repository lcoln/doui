/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-21 01:36:29
 *
 */

"use strict";


define(['avalon', 'css!./skin/def'], function(av){

    

    var prep = {
            type: {
                1: 'alert',
                2: 'confirm',
                3: 'msg',
                4: 'loading',
                5: 'iframe',
                6: 'tips',
                7: 'prompt'
            },
            init: {
                type: 1,
                shade: true,
                shadeClose: false,
                move: '.do-ui-layer-move',
                title: '温馨提示',
                content: '',
                offset: {x: '300px', y: '200px'},
                btns: ['确定', '取消'],
                yes: av.noop,
                no: av.noop,
                success: av.noop
            }
        }

    function uuid(type){
        type = type || 1
        return prep.type[type] + Math.round(Date.now()/1000).toString(16) + Math.random().toString(16).slice(2, 6)
    }



    var layer = {
            alert: function(msg, conf){
                conf = conf || {}
                return layer.open(av.mix({content: msg}, conf))
            },
            confirm: function(msg, conf){
                conf = conf || {}
                return layer.open(av.mix({content: msg}, conf))
            },
            msg: function(msg, conf){
                av.log(msg)
            },
            loading: function(msg, conf){
                av.log(msg)
            },
            iframe: function(url, conf){
                av.log(url)
            },
            tips: function(msg, conf){
                av.log(msg)
            },
            prompt: function(callback){
                av.log('23456')
            },
            use: function(conf, callback){
                require(['css!./skin/' + conf.skin], callback)
            }
        }


        var FN = function(conf){
                this.ready(conf)
            }


        FN.prototype = {
            init: {},
            create: function(){
                var layBox = document.createElement('div')
                layBox.className = 'do-ui-layer skin-def'
                layBox.style.left = this.init.offset.x
                layBox.style.top = this.init.offset.y
                layBox.setAttribute('ms-controller', this.init.$id)
                layBox.innerHTML = '<div class="layer-title">{{title}}<a class="layer-min deficon"></a><a class="layer-close deficon"></a></div>' + 
                '<div class="layer-content">' +
                '<span class="deficon icon-1"></span>' +
                '<div class="detail" ms-html="content"></div>' + 
                '</div>' + 
                '<div class="layer-btns">' + 
                    '<a href="javascript:;" class="layer-yes" ms-text="btns[0]"></a>' + 
                    '<a href="javascript:;" class="layer-no" ms-text="btns[1]"></a>' + 
                '</div>'
                return layBox
            },
            show: function(){

                var layBox = this.create()
                document.body.appendChild(layBox)
                
                av.define(this.init)
                av.scan(layBox)
            },
            ready: function(conf){
                this.init = av.mix({$id: uuid()}, prep.init, conf)
                this.show()
            },
            close: function(){

            }
        }




        layer.open = function(conf){
            av.log(conf)
            return new FN(conf).init
        }


    if(!window.layer)
        window.layer = layer



    return layer


})