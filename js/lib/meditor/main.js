/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-17 16:37:12
 *
 */

"use strict";

var log = console.log;
define([
    'yua',
    'text!./meditor.htm',
    'lib/prism/main',
    'lib/marked',
    'css!./skin/main',
], function(yua, tpl){

    marked.setOptions({
        highlight: function(code, lang){
            return Prism.highlight(code, Prism.languages[lang] || Prism.languages['clike'])
        }
    })

    yua.ui.meditor = '0.0.1'
    //存放编辑器公共静态资源
    window.ME = {
        version: yua.ui.meditor,
        toolbar: { //工具栏title
            pipe: '',
            h1: '标题',
            bold: '粗体',
            italic: '斜体',
            through: '删除线',
            unordered: '无序列表',
            ordered: '有序列表',
            hr: '横线',
            time: '插入当前时间',
            face: '表情',
            table: '插入表格',
            image: '插入图片',
            file: '插入附件',
            inlinecode: '行内代码',
            blockcode: '代码块',
            preview: '预览',
            fullscreen: '全屏',
            about: '关于编辑器',
        },
        addon: {}, //已有插件
        //往文本框中插入内容
        insert: function(dom, val){
            if(document.selection){
                dom.focus()
                var range = document.selection.createRange()
                range.text = val
                dom.focus()
                range.moveStart('character', -1)

            }else if(dom.selectionStart || dom.selectionStart === 0) {
                var startPos = dom.selectionStart,
                    endPos = dom.selectionEnd,
                    scrollTop = dom.scrollTop;

                dom.value = dom.value.slice(0, startPos)
                    + val
                    + dom.value.slice(endPos, dom.value.length);

                dom.focus()
                dom.selectionStart = startPos + val.length
                dom.selectionEnd = startPos + val.length
                dom.scrollTop = scrollTop
            }else{
                dom.value += val;
                dom.focus()
            }
        },
        /**
         * [selection 获取选中的文本]
         * @param  {[type]} dom  [要操作的元素]
         * @param  {[type]} line [是否强制选取整行]
         */
        selection: function(dom, line){
            if(document.selection){
                return document.selection.createRange().text
            }else{
                var startPos = dom.selectionStart,
                    endPos = dom.selectionEnd;

                if(endPos){
                    //强制选择整行
                    if(line) {
                        startPos = dom.value.slice(0, startPos).lastIndexOf('\n');

                        var tmpEnd = dom.value.slice(endPos).indexOf('\n');
                        tmpEnd = tmpEnd < 0 ? 0 : tmpEnd

                        startPos += 1 //把\n加上
                        endPos += tmpEnd;

                        dom.selectionStart = startPos
                        dom.selectionEnd = endPos
                    }
                }else{
                    //强制选择整行
                    if(line) {
                        endPos = dom.value.indexOf('\n')
                        endPos = endPos < 0 ? dom.value.length : endPos
                        dom.selectionEnd = endPos
                    }
                }
                return dom.value.slice(startPos, endPos)
            }
        }
    }
    //获取真实的引用路径,避免因为不同的目录结构导致加载失败的情况
    for(var i in yua.modules){
        if(/meditor/.test(i)) {
            ME.path = i.slice(0, i.lastIndexOf('/'))
            break;
        }
    }

    require([
        ME.path + '/addon/base'
    ], function(){


        var defaultToolbar = ['h1', 'quote', '|',
            'bold', 'italic', 'through', '|',
            'unordered', 'ordered', '|',
            'hr', 'link', 'time', 'face', '|',
            'table','image', 'file','inlinecode', 'blockcode','|',
            'preview',  'fullscreen', '|',
            'about'
            ],
            extraAddons = [];

        
        function tool(name){
            name = (name + '').trim().toLowerCase()
            name = '|' === name ? 'pipe' : name
            return '<span title="' + ME.toolbar[name] + '" class="edicon icon-' + name+ '" '
                + (name !== 'pipe' ? (':click="$onToolbarClick(\'' + name + '\')"') : '')
                + '></span>'
        }



        yua.component('meditor', {
            $template: tpl,
            $$template: function(txt){
                
                var toolbar = (this.toolbar || defaultToolbar).map(function(it){
                        return tool(it)
                    }).join('')

                delete this.toolbar
                return txt.replace(/\{uuid\}/g, this.$id).replace(/\{toolbar\}/g, toolbar)
            },
            $construct: function(base, opt, attr){
                yua.mix(base, opt, attr)
                if(base.$addons && Array.isArray(base.$addons)){
                    extraAddons = base.$addons.map(function(name){
                        return ME.path + '/addon/' + name
                    })
                    delete base.$addons
                }
                return base
            },
            $init: function(vm){

                //自动加载额外的插件
                require(extraAddons, function(){
                    var args = Array.prototype.slice.call(arguments, 0)
                    args.forEach(function(addon){
                        addon && addon(vm)
                    })
                })

                vm.$watch('plainTxt', function(val){
                    vm.$compile()
                    //只有开启实时预览,才会赋值给htmlTxt
                    if(vm.preview){
                        vm.htmlTxt = vm.$htmlTxt
                    }
                    vm.$onUpdate(vm.plainTxt, vm.$htmlTxt)
                })

                vm.$onToolbarClick = function(name){
                    if(ME.addon[name]){
                        ME.addon[name].call(ME.addon, this, vm)
                    }else{
                        console.log('%c没有对应的插件%c[%s]', 'color:#f00;', '',name)
                    }
                }
            },
            $ready: function(vm){
                vm.$editor = document.querySelector('#' + vm.$id)
                
                
                yua(vm.$editor).bind('keydown', function(ev){
                    //tab键改为插入4个空格,阻止默认事件,防止焦点失去
                    if(ev.keyCode === 9){
                        ME.insert(this, '    ')
                        ev.preventDefault()
                    }
                    
                })
            },
            $compile: function(){
                //只解析,不渲染
                this.$htmlTxt = marked(this.plainTxt.trim())
            },
            $onToolbarClick: yua.noop,
            $onUpdate: yua.noop,
            disabled: false, //禁用编辑器
            fullscreen: true, //是否全屏
            preview: false, //是否显示预览
            $editor: null, //编辑器元素
            $htmlTxt: '', //临时储存html文本
            htmlTxt: '', //用于预览渲染
            plainTxt: '' //纯md文本


        })



    })

})
