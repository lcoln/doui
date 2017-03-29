<div class="do-ui-pages">
	<a class="rd3" ms-if="curr > 1 && !simpleMode" ms-attr="{href: setUrl(1)}" ms-click="onJump($event, 1)">{{btns.home}}</a>
	<a class="rd3" ms-if="curr > 1" ms-attr="{href: setUrl(curr - 1)}" ms-click="onJump($event, curr - 1)">{{btns.prev}}</a>
	<a class="rd3" ms-if-loop="!simpleMode || curr === el" ms-repeat="pages" ms-attr="{href: setUrl(el)}" ms-class="curr: curr === el" ms-class-1="more: '...' === el" ms-click="onJump($event, el)">{{el}}</a>
	<a class="rd3" ms-if="curr < total" ms-attr="{href: setUrl(curr + 1)}" ms-click="onJump($event, curr + 1)">{{btns.next}}</a>
	<a class="rd3" ms-if="curr < total && !simpleMode" ms-attr="{href: setUrl(total)}" ms-click="onJump($event, total)">{{btns.end}}</a>
	<div class="page-jump" ms-if="pageJump && !simpleMode">
		<span>共{{total}}页，跳转到第</span>
		<input type="text" ms-duplex-number="jumpTxt" ms-keyup="jumpPage($event)">
		<span>页</span>
		<a class="rd3" ms-attr="{href: setUrl(jumpTxt)}" ms-click="onJump($event, jumpTxt)">确定</a>
	</div>
</div>