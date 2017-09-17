# 幻灯片组件文档

## 配置说明

```json
    {
        sliderList: [{src: '', link: '', title: '', titleStyle: ''}],       //src: 图片地址; link: 点击链接; title: 幻灯片标题(可以是文本或html); titleStyle: 标题样式
        autoSlide: boolean,     //true: 自动轮播; false: 停止轮播
        time: int,     //轮播间隔时间
        preview: boolean   //是否有预览图
    }

```


## 用法

```html
<div class="slider" :controller="test">
    <template name="sliders" config="sliderOpts"></template>
</div>
<!--  
其中config属性是指定分页组件的配置，会自动从上一层controller里找;
其他的属性（除$id, config, id, class, tabindex, style, ms-*属性,data-*属性外，也可以用以配置组件，且优先级最高）;
name属性可以设定组件的$id值，方便各模块之间进行通讯
-->
<!--  引入幻灯片组件  -->
<script src="//dist.doui.cc/js/yua.js"></script>
<script>
    require(['//dist.doui.cc/js/lib/sliders/main.js'],function(){
        var vm = yua({
            $id: "test",
            sliderOpts: {
                sliderList: [{src: '', link: '', title: '', titleStyle: ''}],
                autoSlide: false,
                time: 0,
                preview: true

            }
        })

        yua.scan()
    })
</script>
```
