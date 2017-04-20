/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-19 21:17:26
 *
 */

"use strict";


define([
    'lib/layer/base',
    'css!./uploader'
    ], function(){


    var $init = function(vm){
            ME.addon.image()
        },
        html =  '<div class="do-meditor-uploader meditor-font">'
            + '<section><span class="label">语言类型</span>'
                + '<select :duplex="lang">'
                    + '<option :repeat="$lang" :attr-value="el.id">{{el.name || el.id}}</option>'
                + '</select>'
            + '</section>'
            + '<section>'
                + '<textarea :duplex="code" placeholder="在这里输入/粘贴代码"></textarea>'
            + '</section>'
            + '<section>'
                + '<a href="javascript:;" class="submit" :click="$confirm">确定</a>'
            + '</section>'
            + '</div>';



    ME.addon.image = function(elem, vm){
        layer.open({
            type: 7,
            title: '图片上传',
            content: html
        })
    }









    return $init


})