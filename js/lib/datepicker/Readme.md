# 日历组件文档

## 配置说明

```json
    {
        showTime: false, //对话框上显示时间
        showCalendar: false, //显示日历对话框
        disabled: false, //是否禁用
        exclass: '', //输入框拓展样式, 用于外部调整输入框样式以适配各种场景
        duplex: '',
        format: '', // 日期显示格式
        radius: 0, //日历输入框边框圆角半径
        border: 1, //日历输入框边框大小
        btns: { //切换年份/月份的按钮上的字符
            prevYear: '<<',
            nextYear: '>>',
            prevMonth: '<',
            nextMonth: '>'
        },
        callback: function(date){/*...*/}, //日期被修改后的回调,参数是被修改后的值
    }

```


## 用法

```html
<!-- 把do:datepicker 标签放到想要放的地方即可 -->
<section>
    <span class="label">示例1:</span>
    <do:datepicker config="dp" duplex="ex1" border="1" class="date" radius="3"></do:datepicker>
</section>
<!--  
其中config属性是指定日历组件的配置，会自动从上一层controller里找,如果该属性为空，则自动从上层controller中找与组件同名的属性（找不到则使用组件默认配置）;
其他的属性（除$id, config, id, class, tabindex, style, ms-*属性,data-*属性外，也可以用以配置组件，且优先级最高）;
$id或identifier属性可以设定组件的$id值，方便各模块之间进行通讯
-->
<!--  引入分页组件  -->
<script>
    require(['存放路径/doui.datepicker'], function(){

    })
</script>
```
