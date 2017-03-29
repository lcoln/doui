/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2016-02-14 13:58:39
 *
 */
"use strict";

define(['avalon',
        'css!./doui.datepicker.min'
    ],
    function(av){
        //父级vm
        var parentVm = null

        av.component('do:datepicker', {
            $replace: true,
            $template: '<div class="do-ui-datepicker do-fn-noselect"><input class="date-input" type="text" ms-duplex="dateVal" ms-on-focus="$focus" ms-click="$cancelBubble" ms-attr-disabled="disabled" ms-css="{borderWidth: border, borderRadius: radius}"><div class="calendar" ms-if="showCalendar" ms-click="$cancelBubble"><div class="calendar-hd">请选择日期</div><div class="calendar-contrl"><a href="javascript:;" ms-click="$turn(1, -1)" class="prev-year">{{btns.prevYear}}</a><a href="javascript:;" ms-click="$turn(0, -1)" class="prev-month">{{btns.prevMonth}}</a><a href="javascript:;" ms-click="$turn(0, 1)" class="next-month">{{btns.nextMonth}}</a><a href="javascript:;" ms-click="$turn(1, 1)" class="next-year">{{btns.nextYear}}</a><span class="date-display">{{calendar.year + \'-\' + calendar.month}}</span></div><ul class="calendar-table"><li class="tr tr-hd"><span class="td">日</span><span class="td">一</span><span class="td">二</span><span class="td">三</span><span class="td">四</span><span class="td">五</span><span class="td">六</span></li><li class="tr list do-fn-cl"><span class="td" ms-class="{weeken:el.weeken, \'do-st-hand\': !el.disable, disabled: el.disable, selected: el.selected}" ms-repeat="calendar.list" ms-click="$getDate(el.disable, el.day)">{{el.day}}</span></li></ul><div class="time-contrl" ms-if="showTime"><label class="hours"><input type="text" ms-duplex-time="calendar.hour" data-format="hour"></label><label class="minutes"><input type="text" ms-duplex-time="calendar.minute" data-format="minute"></label><label class="seconds"><input type="text" ms-duplex-time="calendar.second" data-format="second"></label><a href="javascript:;" class="now" ms-click="$now">现在</a></div><span class="calendar-tips" ms-if="tips">{{tips}}</span></div></div>',
            $construct: function(opts, b, c){
                var vm = av.mix(b, c)
                /********** 获取上一级vm ***********/
                var pctrl = vm.duplex.slice(0, vm.duplex.indexOf('.'))
                parentVm = av.vmodels[pctrl]
                /**********************************/
                //获取初始值
                vm.duplex = vm.duplex.slice(vm.duplex.indexOf('.') + 1)
                var defaultVal = (new Function('v', 'return v.' + vm.duplex))(parentVm)

                //日期格式化, 默认会调用过滤器的格式'Y-m-d H:i:s'
                if(!vm.showTime && !vm.format){
                    vm.format = 'Y-m-d';
                }

                if(defaultVal === undefined){
                    if(vm.minDate){
                        defaultVal = vm.minDate, vm.format;
                    }else if(opts.maxDate){
                        defaultVal = vm.maxDate, vm.format;
                    }
                }
                opts.dateVal = defaultVal && av.filters.date(defaultVal, vm.format)
                opts.calendar = {
                    list: [],
                    year: av.filters.date(opts.dateVal, 'Y'),
                    month: av.filters.date(opts.dateVal, 'm'),
                    day: av.filters.date(opts.dateVal, 'd') || 0,
                    hour: av.filters.date(opts.dateVal, 'H') || 0,
                    minute: av.filters.date(opts.dateVal, 'i') || 0,
                    second: av.filters.date(opts.dateVal, 's') || 0,
                    minYear: vm.minDate && av.filters.date(vm.minDate, 'Y') >> 0,
                    minMonth: vm.minDate && av.filters.date(vm.minDate, 'm') >> 0,
                    minDay: vm.minDate && av.filters.date(vm.minDate, 'd') >> 0 || 1,
                    maxYear: vm.maxDate && av.filters.date(vm.maxDate, 'Y') >> 0,
                    maxMonth: vm.maxDate && av.filters.date(vm.maxDate, 'm') >> 0,
                    maxDay: vm.maxDate && av.filters.date(vm.maxDate, 'd') >> 0
                }
                //移除部分属性
                delete vm.minDate;
                delete vm.maxDate;

                return av.mix(opts, vm)
            },
            $init: function(vm, ele){
                // av.log(vm)
                var lastDate = {
                        year: vm.calendar.year >> 0,
                        month: vm.calendar.month >> 0,
                        day: vm.calendar.day >> 0
                    }
                var timer

                getCalendar() //初始化日历显示

                //日历按钮,未超出限制时切换日历
                vm.$turn = function(type, step){
                    var year = vm.calendar.year >> 0,
                        month = vm.calendar.month >> 0;

                    if(type === 1){
                        year += step;
                    }else{
                        month += step;
                        if(month < 1){
                            month = 12;
                            year--
                        }
                        if(month > 12){
                            month = 1;
                            year++
                        }
                    }
                    if(isLimited(year, month) === true){
                        vm.tips = '日期超出限制';
                        return;
                    }
                    vm.calendar.year = year;
                    vm.calendar.month = numberFormat(month, 2);
                }

                //选择日期
                vm.$getDate = function(disabled, day){
                    if(disabled)
                        return;

                    vm.calendar.day = day;

                    changeStyle(day);
                    updateTime();
                    vm.showCalendar = !1;
                }

                //输入框获取焦点时，显示日历
                vm.$focus = function(){
                    vm.showCalendar = !0;
                }

                //获取当前时间
                vm.$now = function(){
                    var year = av.filters.date(null, 'Y') >> 0,
                        month = av.filters.date(null, 'm') >> 0,
                        day = av.filters.date(null, 'd') >> 0;

                    var isLimitYM = isLimited(year, month),
                        disabled = disabledDay(day, isLimitYM);

                    if(disabled){
                        vm.tips = '今天超出了限制日期';
                        return;
                    }

                    vm.calendar.year = year;
                    vm.calendar.month = month;
                    vm.calendar.day = day;
                    vm.calendar.hour = av.filters.date(null, 'H');
                    vm.calendar.minute = av.filters.date(null, 'i');
                    vm.calendar.second = av.filters.date(null, 's');

                    changeStyle(day);
                    updateTime();

                    vm.showCalendar = !1;
                }



                /******************************************************************************/
                //计算日历数组
                function getCalendar(){
                    var year = vm.calendar.year >> 0
                    var month = vm.calendar.month >> 0
                    var nums = getNumsOfYearMonth(year, month)
                    var numsFixed = -getDayByYearMonth(year, month) + 1
                    var isLimitYM = isLimited(year, month)

                    vm.calendar.list.clear();

                    for(var i = numsFixed; i <= nums; i++){

                        var day = {
                            weeken: !1,
                            day: '',
                            selected: !1,
                            disable: !0
                        }
                        if(i > 0){
                            var d = getDayByYearMonth(year, month, i)
                            day = {
                                weeken: d == 0 || d == 6,
                                day: i,
                                selected: isSelected(i),
                                disable: disabledDay(i, isLimitYM)
                            }
                        }
                        vm.calendar.list.push(day)
                    }
                }

                //判断当前年/月是否超出限制
                function isLimited(year, month){
                    var limit = {
                            Y: vm.calendar.minYear,
                            M: vm.calendar.minMonth,
                            mY: vm.calendar.maxYear,
                            mM: vm.calendar.maxMonth,
                        }
                    var res = ''

                    if((!limit.Y && !limit.mY) || (!limit.M && !limit.mM))
                        return false

                    if(year){
                        if((limit.Y && year < limit.Y) || (limit.mY && year > limit.mY))
                            return true
                    }else{
                        return false
                    }

                    if(month){
                        if(year === limit.Y){
                            if(limit.M && month < limit.M)
                                return true

                            if(month == limit.M)
                                res += '-'
                        }

                        if(year === limit.mY){
                            if(limit.mM && month > limit.mM)
                                return true

                            if(month == limit.mM)
                                res += '+'
                        }
                    }
                    return res
                }

                //判断指定天数是否有效
                function disabledDay(day, limitedYM){
                    var minD = vm.calendar.minDay
                    var maxD = vm.calendar.maxDay

                    if(limitedYM === '-')
                        return day < minD

                    if(limitedYM === '+')
                        return maxD && day > maxD

                    if(limitedYM === '-+')
                        return day < minD || (maxD && day > maxD)

                    return limitedYM
                }

                //判断指定天数是否被选中
                function isSelected(day){
                    var year = vm.calendar.year >> 0
                    var month = vm.calendar.month >> 0

                    return !(lastDate.year !== year  || lastDate.month !== month || lastDate.day !== day)
                }

                //修改当前选中日期的样式
                function changeStyle(day){
                    vm.calendar.list.forEach(function(item){
                        if(item.day != day){
                            item.selected = !1
                        }else{
                            item.selected = !0
                        }
                    })
                }

                //更新时间
                function updateTime(){
                    var cal = vm.calendar
                    var year = cal.year
                    var month = cal.month
                    var day = cal.day
                    var hour = cal.hour
                    var minute = cal.minute
                    var second = cal.second
                    var date = year + '-' + month + '-' + day

                    if(vm.showTime){
                        date += ' ' + hour + ':' + minute + ':' + second
                    }
                    lastDate = {
                        year: year >> 0,
                        month: month >> 0,
                        day: day >> 0
                    }
                    vm.dateVal = av.filters.date(date, vm.format)
                }

                /******************************************************************************/

                vm.$watch('calendar.year', function(){
                    getCalendar();
                })

                vm.$watch('calendar.month', function(){
                    getCalendar();
                })
                vm.$watch('calendar.hour', function(v){
                    vm.calendar.hour = v
                    updateTime()
                })
                vm.$watch('calendar.minute', function(v){
                    vm.calendar.minute = v
                    updateTime()
                })
                vm.$watch('calendar.second', function(v){
                    vm.calendar.second = v
                    updateTime()
                })

                vm.$watch('showCalendar', function(v){
                    if(v || !vm.duplex)
                        return;
                    
                    eval('parentVm.' + vm.duplex + ' = "' + vm.dateVal + '"');
                    vm.callback && vm.callback(vm.dateVal);
                })

                vm.$watch('tips', function(v){
                    if(!v)
                        return;
                    clearTimeout(timer);
                    timer = setTimeout(function(){
                        vm.tips = '';
                    }, 1500)
                })

                document.addEventListener('click', function(){
                    vm.showCalendar = !1;
                })

            },
            showTime: false, //对话框上显示时间
            showCalendar: false, //显示日历对话框
            disabled: false, //是否禁用
            exclass: '', //输入框拓展样式, 用于外部调整输入框样式以适配各种场景
            tips: '',
            duplex: '',
            format: '', // 日期显示格式
            dateVal: '',
            radius: 0, //日历输入框边框圆角半径
            border: 1, //日历输入框边框大小
            btns: { //切换年份/月份的按钮上的字符
                prevYear: '<<',
                nextYear: '>>',
                prevMonth: '<',
                nextMonth: '>'
            },
            $focus: av.noop,
            $turn: av.noop,
            $getDate: av.noop,
            $now: av.noop,
            $cancelBubble: function(event){
                event.stopPropagation && event.stopPropagation() || (event.cancelBubble = true);
            },
            callback: null, //日期被修改后的回调
        })


        //获取今年的年份/月份，返回的是数组
        function getThisYearMonth(){
            var oDate = new Date()
            return [oDate.getFullYear(), oDate.getMonth() + 1]
        }

        //根据年份获取指定月份天数
        function getNumsOfYearMonth(year, month){
            return new Date(year, month, 0).getDate()
        }

        //判断指定年月第一天是星期几
        function getDayByYearMonth(year, month, day){
            day = day || 1
            return new Date(year, month - 1, day).getDay()
        }
        //数字长度补全（前面加0）
        function numberFormat(num, len){
            num += ''
            if(num.length === len)
                return num

            while(num.length < len)
                num = '0' + num
            return num
        }

        return av
})