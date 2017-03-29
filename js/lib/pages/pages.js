define(["avalon","text!./pages.tpl","css!./pages.css"], function (av, tpl) {

    var widget = av.ui.pages = function(ele, data, vms){

        var opts = av.mix({}, data.pagesOptions);
        var height = opts.height || '',
            skin = opts.skin || 'default';

        delete opts.skin;
        delete opts.height;
        opts.pages = []; //无论是否定义，都会清掉，有点暴力

        opts.$id = data.pagesId;
        opts.$init = function(scan){
            ele.classList.add('widget-pages', 'skin-' + skin, 'do-fn-noselect');
            height && ele.classList.add(height);//非空时才添加,避免报错
            ele.innerHTML = tpl;
            calPages(Pager);
            scan()
        };
        opts.$remove = function() {
            ele.innerHTML =  ''
        };
        opts.setUrl = function(id){
            if(!Pager.url || id === '...' || Pager.curr === id || id > Pager.total || id < 1)
                return 'javascript:;'
            return Pager.url.replace('{id}', id)
        };
        opts.onJump = function(event, id){
            event.preventDefault()
            id = id >> 0;
            jump(id, Pager);
        };
        opts.jumpPage = function(event){
            var pid = Pager.jumpTxt;     
            if(pid > Pager.total)
                Pager.jumpTxt = Pager.total;

            if(event.keyCode == 13)
                return jump(pid, Pager);
        }

        var Pager = av.define(opts);


        Pager.$watch('total', function(v, old){
            Pager.total = v >> 0 || 1; //自动转换成数字类型，防止传入的值为字符串时报错，如 '3'
            old = old >> 0;
            (v !== old) && calPages(Pager);
        })

        Pager.$watch('curr', function(v, old){
            v = v >> 0 || 1;//自动转换成数字类型
            old = old >> 0;
            Pager.curr = v;
            (v !== old) && calPages(Pager);
        })
        
        return Pager;
    }

    /**
     * [calPages 计算要显示的页码数组，并赋值给pages]
     * @param  {[type]} Pager [分页vm对象]
     */
    function calPages(Pager){
        if(Pager.total < 2){
            Pager.pages.clear();
            return;
        }

        var pageArr = [], len = (Pager.curr < Pager.max / 2) ? Pager.max : Math.floor(Pager.max / 2);

        if(Pager.curr - len > 1)
            pageArr.push('...');

        for(var i = Pager.curr - len; i < Pager.curr + len && i <= Pager.total; i++){
            if(i > 0)
                pageArr.push(i)
        }
        if(Pager.curr + len < Pager.total)
            pageArr.push('...');

        Pager.pages = pageArr;
    }

    /**
     * [jump 内部跳转函数]
     * @param  {[type]} id    [要跳转去的页码]
     * @param  {[type]} Pager [分页vm对象]
     */
    function jump(id, Pager){
        if(id < 1)
            id = Pager.jumpTxt = 1;
        if(id > Pager.total)
            id = Pager.jumpTxt = Pager.total;
        if(Pager.curr === id)
            return;

        Pager.curr = Pager.jumpTxt = id;
        Pager.callback && Pager.callback(id);

        calPages(Pager);
    }

    //默认参数
    widget.defaults = {
        curr: 1, //当前页
        total: 1, // 总页数默认为1，即页面上不会显示分页条
        max: 5, // 最多显示页码数
        url: 'javascript:;', //页码按钮上的url,如'#!/page-{id}.html',其中{id}会被替换成该页码
        pageJump: !1, //是否显示跳转表单
        simpleMode: !1, //简单模式，即只有上一页和下一页
        jumpTxt: 1, //跳转输入框显示的页码
        pages: [], //页码数组
        btns: { //除页码本身外的按钮上的字符
            prev: '<<',
            next: '>>',
            home: '首页',
            end: '末页'
        },
        callback: null //点击页码/上/下/首/末页的回调，页码无效或者为当前页的时候不会触发
    }


    return av;
})