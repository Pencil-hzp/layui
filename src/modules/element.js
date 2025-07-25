/**
 * element
 * 常用元素操作组件
 */

layui.define('jquery', function(exports) {
  'use strict';

  var $ = layui.$;
  var hint = layui.hint();
  var device = layui.device();

  var MOD_NAME = 'element';
  var THIS = 'layui-this';
  var SHOW = 'layui-show';
  var TITLE = '.layui-tab-title';

  var Element = function(){
    this.config = {};
  };

  // 全局设置
  Element.prototype.set = function(options){
    var that = this;
    $.extend(true, that.config, options);
    return that;
  };

  // 表单事件
  Element.prototype.on = function(events, callback){
    return layui.onevent.call(this, MOD_NAME, events, callback);
  };

  // 外部 Tab 新增
  Element.prototype.tabAdd = function(filter, options){
    var tabElem = $('.layui-tab[lay-filter='+ filter +']');
    var titElem = tabElem.children(TITLE);
    var barElem = titElem.children('.layui-tab-bar');
    var contElem = tabElem.children('.layui-tab-content');
    var li = '<li'+ function(){
      var layAttr = [];
      layui.each(options, function(key, value){
        if(/^(title|content)$/.test(key)) return;
        layAttr.push('lay-'+ key +'="'+ value +'"');
      });
      if(layAttr.length > 0) layAttr.unshift(''); //向前插，预留空格
      return layAttr.join(' ');
    }() +'>'+ (options.title || 'unnaming') +'</li>';

    barElem[0] ? barElem.before(li) : titElem.append(li);
    contElem.append('<div class="layui-tab-item" ' + (options.id ? 'lay-id="' + options.id + '"' : '') + '>'+ (options.content || '') +'</div>');
    // call.hideTabMore(true);
    // 是否添加即切换
    options.change && this.tabChange(filter, options.id);
    titElem.data('LAY_TAB_CHANGE', options.change);
    call.tabAuto(options.change ? 'change' : null, tabElem);
    return this;
  };

  /**
   * 外部 Tab 删除
   * @param {string} filter - 标签主容器 lay-filter 值
   * @param {string} layid - 标签头 lay-id 值
   * @param {boolean} force - 是否强制删除
   * @returns {this}
   */
  Element.prototype.tabDelete = function(filter, layid, force){
    var tabElem = $('.layui-tab[lay-filter='+ filter +']');
    var titElem = tabElem.children(TITLE);
    var liElem = titElem.find('>li[lay-id="'+ layid +'"]');
    call.tabDelete.call(liElem[0], {
      liElem: liElem,
      force: force
    });
    return this;
  };

  /**
   * 外部 Tab 切换
   * @param {string} filter - 标签主容器 lay-filter 值
   * @param {string} layid - 标签头 lay-id 值
   * @param {boolean} force - 是否强制切换
   * @returns {this}
   */
  Element.prototype.tabChange = function(filter, layid, force){
    var tabElem = $('.layui-tab[lay-filter='+ filter +']');
    var titElem = tabElem.children(TITLE);
    var liElem = titElem.find('>li[lay-id="'+ layid +'"]');

    call.tabClick.call(liElem[0], {
      liElem: liElem,
      force: force
    });
    return this;
  };

  // 自定义 Tab 选项卡
  Element.prototype.tab = function(options){
    options = options || {};
    dom.on('click', options.headerElem, function(e){
      var index = $(options.headerElem).index($(this));
      call.tabClick.call(this, {
        index: index,
        options: options
      });
    });
  };


  // 动态改变进度条
  Element.prototype.progress = function(filter, percent){
    var ELEM = 'layui-progress';
    var elem = $('.'+ ELEM +'[lay-filter='+ filter +']');
    var elemBar = elem.find('.'+ ELEM +'-bar');
    var text = elemBar.find('.'+ ELEM +'-text');

    elemBar.css('width', function(){
      return /^.+\/.+$/.test(percent)
        ? (new Function('return '+ percent)() * 100) + '%'
     : percent;
    }).attr('lay-percent', percent);
    text.text(percent);
    return this;
  };

  var NAV_ELEM = '.layui-nav';
  var NAV_ITEM = 'layui-nav-item';
  var NAV_BAR = 'layui-nav-bar';
  var NAV_TREE = 'layui-nav-tree';
  var NAV_CHILD = 'layui-nav-child';
  var NAV_CHILD_C = 'layui-nav-child-c';
  var NAV_MORE = 'layui-nav-more';
  var NAV_DOWN = 'layui-icon-down';
  var NAV_ANIM = 'layui-anim layui-anim-upbit';

  // 基础事件体
  var call = {
    // Tab 点击
    tabClick: function(obj){
      obj = obj || {};
      var options = obj.options || {};
      var othis = obj.liElem || $(this);
      var parents = options.headerElem
        ? othis.parent()
      : othis.parents('.layui-tab').eq(0);
      var item = options.bodyElem
        ? $(options.bodyElem)
      : parents.children('.layui-tab-content').children('.layui-tab-item');
      var elemA = othis.find('a');
      var isJump = elemA.attr('href') !== 'javascript:;' && elemA.attr('target') === '_blank'; // 是否存在跳转
      var unselect = typeof othis.attr('lay-unselect') === 'string'; // 是否禁用选中
      var filter = parents.attr('lay-filter');
      var hasId = othis.attr('lay-id');

      // 下标
      var index = 'index' in obj
        ? obj.index
      : othis.parent().children('li').index(othis);

      // 若非强制切换，则根据 tabBeforeChange 事件的返回结果决定是否切换
      if (!obj.force) {
        var liThis = othis.siblings('.' + THIS);
        var shouldChange = layui.event.call(this, MOD_NAME, 'tabBeforeChange('+ filter +')', {
          elem: parents,
          from: {
            index: othis.parent().children('li').index(liThis),
            id: liThis.attr('lay-id')
          },
          to: {
            index: index,
            id: hasId
          },
        });
        if(shouldChange === false) return;
      }

      // 执行切换
      if(!(isJump || unselect)){
        othis.addClass(THIS).siblings().removeClass(THIS);
        if(hasId){
          var contentElem = item.filter('[lay-id="' +  hasId + '"]');
          contentElem = contentElem.length ? contentElem : item.eq(index);
          contentElem.addClass(SHOW).siblings().removeClass(SHOW);
        }else{
          item.eq(index).addClass(SHOW).siblings().removeClass(SHOW);
        }
      }

      layui.event.call(this, MOD_NAME, 'tab('+ filter +')', {
        elem: parents,
        index: index,
        id: hasId
      });
    }

    // Tab 删除
    ,tabDelete: function(obj){
      obj = obj || {};

      var li = obj.liElem || $(this).parent();
      var index = li.parent().children('li').index(li);
      var tabElem = li.closest('.layui-tab');
      var item = tabElem.children('.layui-tab-content').children('.layui-tab-item');
      var filter = tabElem.attr('lay-filter');
      var hasId = li.attr('lay-id');

      // 若非强制删除，则根据 tabBeforeDelete 事件的返回结果决定是否删除
      if (!obj.force) {
        var shouldClose = layui.event.call(li[0], MOD_NAME, 'tabBeforeDelete('+ filter +')', {
          elem: tabElem,
          index: index,
          id: hasId
        });
        if(shouldClose === false) return;
      }

      if(li.hasClass(THIS)){
        if (li.next()[0] && li.next().is('li')){
          call.tabClick.call(li.next()[0], {
            index: index + 1
          });
        } else if (li.prev()[0] && li.prev().is('li')){
          call.tabClick.call(li.prev()[0], null, index - 1);
        }
      }

      li.remove();
      if(hasId){
        var contentElem = item.filter('[lay-id="' +  hasId + '"]');
        contentElem = contentElem.length ? contentElem : item.eq(index)
        contentElem.remove()
      }else{
        item.eq(index).remove();
      }
      setTimeout(function(){
        call.tabAuto(null, tabElem);
      }, 50);

      layui.event.call(this, MOD_NAME, 'tabDelete('+ filter +')', {
        elem: tabElem,
        index: index,
        id: hasId
      });
    }

    // Tab 自适应
    ,tabAuto: function(spread, elem){
      var SCROLL = 'layui-tab-scroll';
      var MORE = 'layui-tab-more';
      var BAR = 'layui-tab-bar';
      var CLOSE = 'layui-tab-close';
      var that = this;
      var targetElem = elem || $('.layui-tab');

      targetElem.each(function(){
        var othis = $(this);
        var title = othis.children('.layui-tab-title');
        var item = othis.children('.layui-tab-content').children('.layui-tab-item');
        var STOPE = 'lay-stope="tabmore"';
        var span = $('<span class="layui-unselect layui-tab-bar" '+ STOPE +'><i '+ STOPE +' class="layui-icon">&#xe61a;</i></span>');

        if(that === window && device.ie != 8){
          // call.hideTabMore(true)
        }

        // 开启关闭图标
        var allowclose = othis.attr('lay-allowclose');
        if(allowclose && allowclose !== 'false'){
          title.find('li').each(function(){
            var li = $(this);
            if(!li.find('.'+CLOSE)[0] && li.attr('lay-allowclose') !== 'false'){
              var close = $('<i class="layui-icon layui-icon-close layui-unselect '+ CLOSE +'"></i>');
              close.on('click', function(e) {
                call.tabDelete.call(this, {
                  e: e
                });
              });
              li.append(close);
            }
          });
        }

        if(typeof othis.attr('lay-unauto') === 'string') return;

        // 响应式
        if(
          title.prop('scrollWidth') > title.outerWidth() + 1 || (
            title.find('li').length && title.height() > function(height){
              return height + height/2;
            }(title.find('li').eq(0).height())
          )
        ){
          // 若执行是来自于切换，则自动展开
          (
            spread === 'change' && title.data('LAY_TAB_CHANGE')
          ) && title.addClass(MORE);

          if(title.find('.'+BAR)[0]) return;
          title.append(span);
          othis.attr('overflow', '');

          // 展开图标事件
          span.on('click', function(e){
            var isSpread = title.hasClass(MORE);
            title[isSpread ? 'removeClass' : 'addClass'](MORE);
          });
        } else {
          title.find('.'+ BAR).remove();
          othis.removeAttr('overflow');
        }
      });
    }
    // 隐藏更多 Tab
    ,hideTabMore: function(e){
      var tsbTitle = $('.layui-tab-title');
      if(e === true || $(e.target).attr('lay-stope') !== 'tabmore'){
        tsbTitle.removeClass('layui-tab-more');
        tsbTitle.find('.layui-tab-bar').attr('title','');
      }
    }

    //点击一级菜单
    /*
    ,clickThis: function(){
      var othis = $(this), parents = othis.parents(NAV_ELEM)
      ,filter = parents.attr('lay-filter')
      ,elemA = othis.find('a')
      ,unselect = typeof othis.attr('lay-unselect') === 'string';

      if(othis.find('.'+NAV_CHILD)[0]) return;

      if(!(elemA.attr('href') !== 'javascript:;' && elemA.attr('target') === '_blank') && !unselect){
        parents.find('.'+THIS).removeClass(THIS);
        othis.addClass(THIS);
      }

      layui.event.call(this, MOD_NAME, 'nav('+ filter +')', othis);
    }
    )
    */

    // 点击菜单 - a 标签触发
    ,clickThis: function() {
      var othis = $(this);
      var parents = othis.closest(NAV_ELEM);
      var filter = parents.attr('lay-filter');
      var parent = othis.parent() ;
      var child = othis.siblings('.'+ NAV_CHILD);
      var unselect = typeof parent.attr('lay-unselect') === 'string'; // 是否禁用选中

      // 满足点击选中的条件
      if (!(othis.attr('href') !== 'javascript:;' && othis.attr('target') === '_blank') && !unselect) {
        if (!child[0]) {
          parents.find('.'+ THIS).removeClass(THIS);
          parent.addClass(THIS);
        }
      }

      // 若为垂直菜单
      if (parents.hasClass(NAV_TREE)) {
        var NAV_ITEMED = NAV_ITEM + 'ed'; // 用于标注展开状态
        var needExpand = !parent.hasClass(NAV_ITEMED); // 是否执行展开
        var ANIM_MS = 200; // 动画过渡毫秒数

        // 动画执行完成后的操作
        var complete = function() {
          $(this).css({
            "display": "" // 剔除动画生成的 style display，以适配外部样式的状态重置
          });
          // 避免导航滑块错位
          parents.children('.'+ NAV_BAR).css({
            opacity: 0
          })
        };

        // 是否正处于动画中的状态
        if (child.is(':animated')) return;

        // 剔除可能存在的 CSS3 动画类
        child.removeClass(NAV_ANIM);

        // 若有子菜单，则对其执行展开或收缩
        if (child[0]) {
          if (needExpand) {
            // 先执行 slideDown 动画，再标注展开状态样式，避免元素 `block` 状态导致动画无效
            child.slideDown(ANIM_MS, complete);
            parent.addClass(NAV_ITEMED);
          } else {
            // 先取消展开状态样式，再将元素临时显示，避免 `none` 状态导致 slideUp 动画无效
            parent.removeClass(NAV_ITEMED);
            child.show().slideUp(ANIM_MS, complete);
          }

          // 手风琴 --- 收缩兄弟展开项
          if (typeof parents.attr('lay-accordion') === 'string' || parents.attr('lay-shrink') === 'all') {
            var parentSibs = parent.siblings('.'+ NAV_ITEMED);
            parentSibs.removeClass(NAV_ITEMED);
            parentSibs.children('.'+ NAV_CHILD).show().stop().slideUp(ANIM_MS, complete);
          }
        }
      }

      layui.event.call(this, MOD_NAME, 'nav('+ filter +')', othis);
    }

    // 折叠面板
    ,collapse: function() {
      var othis = $(this);
      var wrapper = othis.closest('.layui-collapse');
      var filter = wrapper.attr('lay-filter');

      var ANIM_MS = 200; // 动画过渡毫秒数
      var CLASS_ITEM = '.layui-colla-item';
      var CLASS_CONTENT = '.layui-colla-content';

      var thisItemElem = othis.parent(CLASS_ITEM);
      var thisContentElem = othis.siblings(CLASS_CONTENT);
      var isNone = thisContentElem.css('display') === 'none';
      var isAccordion = typeof wrapper.attr('lay-accordion') === 'string';

      // 动画执行完成后的操作
      var complete = function() {
        $(this).css('display', ''); // 剔除动画生成的 style display，以适配外部样式的状态重置
      };

      // 是否正处于动画中的状态
      if (thisContentElem.is(':animated')) return;

      // 展开或收缩
      if (isNone) {
        // 先执行 slideDown 动画，再标注展开状态样式，避免元素 `block` 状态导致动画无效
        thisContentElem.slideDown(ANIM_MS, complete);
        thisItemElem.addClass(SHOW);
      } else {
        // 先取消展开状态样式，再将元素临时显示，避免 `none` 状态导致 slideUp 动画无效
        thisItemElem.removeClass(SHOW);
        thisContentElem.show().slideUp(ANIM_MS, complete);
      }

      // 是否开启手风琴
      if (isAccordion) {
        var itemSiblings = thisItemElem.siblings('.'+ SHOW);
        itemSiblings.removeClass(SHOW);
        itemSiblings.children(CLASS_CONTENT).show().slideUp(ANIM_MS, complete);
      }

      // 事件
      layui.event.call(this, MOD_NAME, 'collapse('+ filter +')', {
        title: othis,
        content: thisContentElem,
        show: isNone
      });
    }
  };

  // 初始化元素操作
  Element.prototype.init = function(type, filter){
    var that = this, elemFilter = function(){
      return (typeof filter === 'string' && filter) ? ('[lay-filter="' + filter +'"]') : '';
    }(), items = {

      // Tab 选项卡
      tab: function(elem){
        var TAB_ELEM = '.layui-tab';
        var targetElem = elem || $(TAB_ELEM + elemFilter);
        call.tabAuto.call({}, null, targetElem);
      }

      // 导航菜单
      ,nav: function(elem){
        var TIME = 200;
        var timer = {};
        var timerMore = {};
        var timeEnd = {};
        var NAV_TITLE = 'layui-nav-title';

        // 滑块跟随
        var follow = function(bar, nav, index) {
          var othis = $(this);
          var child = othis.find('.'+NAV_CHILD);

          // 是否垂直导航菜单
          if (nav.hasClass(NAV_TREE)) {
            // 无子菜单时跟随
            if (!child[0]) {
              var thisA = othis.children('.'+ NAV_TITLE);
              bar.css({
                top: othis.offset().top - nav.offset().top,
                height: (thisA[0] ? thisA : othis).outerHeight(),
                opacity: 1
              });
            }
          } else {
            child.addClass(NAV_ANIM);

            // 若居中对齐
            if (child.hasClass(NAV_CHILD_C)) {
              child.css({
                left: -(child.outerWidth() - othis.width()) / 2
              });
            }

            // 滑块定位
            if (child[0]) { // 若有子菜单，则滑块消失
              bar.css({
                left: bar.position().left + bar.width() / 2,
                width: 0,
                opacity: 0
              });
            } else { // bar 跟随
              bar.css({
                left: othis.position().left + parseFloat(othis.css('marginLeft')),
                top: othis.position().top + othis.height() - bar.height()
              });
            }

            // 渐显滑块并适配宽度
            timer[index] = setTimeout(function() {
              bar.css({
                width: child[0] ? 0 : othis.width(),
                opacity: child[0] ? 0 : 1
              });
            }, device.ie && device.ie < 10 ? 0 : TIME);

            // 显示子菜单
            clearTimeout(timeEnd[index]);
            if (child.css('display') === 'block') {
              clearTimeout(timerMore[index]);
            }
            timerMore[index] = setTimeout(function(){
              child.addClass(SHOW);
              othis.find('.'+NAV_MORE).addClass(NAV_MORE+'d');
            }, 300);
          }
        };

        // 遍历导航
        var targetElem = elem || $(NAV_ELEM + elemFilter);
        targetElem.each(function(index) {
          var othis = $(this);
          var bar = $('<span class="'+ NAV_BAR +'"></span>');
          var itemElem = othis.find('.'+NAV_ITEM);

          // hover 滑动效果
          var hasBarElem = othis.find('.'+NAV_BAR);
          if (hasBarElem[0]) hasBarElem.remove();
          othis.append(bar);
          ( othis.hasClass(NAV_TREE)
            ? itemElem.find('dd,>.'+ NAV_TITLE)
            : itemElem
          ).off('mouseenter.lay_nav').on('mouseenter.lay_nav', function() {
            follow.call(this, bar, othis, index);
          }).off('mouseleave.lay_nav').on('mouseleave.lay_nav', function() { // 鼠标移出
            // 是否为垂直导航
            if (othis.hasClass(NAV_TREE)) {
              bar.css({
                height: 0,
                opacity: 0
              });
            } else {
              // 隐藏子菜单
              clearTimeout(timerMore[index]);
              timerMore[index] = setTimeout(function(){
                othis.find('.'+ NAV_CHILD).removeClass(SHOW);
                othis.find('.'+ NAV_MORE).removeClass(NAV_MORE +'d');
              }, 300);
            }
          });

          // 鼠标离开当前菜单时
          othis.off('mouseleave.lay_nav').on('mouseleave.lay_nav', function() {
            clearTimeout(timer[index])
            timeEnd[index] = setTimeout(function() {
              if (!othis.hasClass(NAV_TREE)) {
                bar.css({
                  width: 0,
                  left: bar.position().left + bar.width() / 2,
                  opacity: 0
                });
              }
            }, TIME);
          });

          // 展开子菜单
          itemElem.find('a').each(function() {
            var thisA = $(this);
            var parent = thisA.parent();
            var child = thisA.siblings('.'+ NAV_CHILD);

            // 输出小箭头
            if (child[0] && !thisA.children('.'+ NAV_MORE)[0]) {
              thisA.append('<i class="layui-icon '+ NAV_DOWN +' '+ NAV_MORE +'"></i>');
            }

            thisA.off('click', call.clickThis).on('click', call.clickThis); // 点击菜单
          });
        });
      }

      //面包屑
      ,breadcrumb: function(elem){
        var ELEM = '.layui-breadcrumb';
        var targetElem = elem || $(ELEM + elemFilter);

        targetElem.each(function(){
          var othis = $(this)
          ,ATTE_SPR = 'lay-separator'
          ,separator = othis.attr(ATTE_SPR) || '/'
          ,aNode = othis.find('a');
          if(aNode.next('span['+ ATTE_SPR +']')[0]) return;
          aNode.each(function(index){
            if(index === aNode.length - 1) return;
            $(this).after('<span '+ ATTE_SPR +'>'+ separator +'</span>');
          });
          othis.css('visibility', 'visible');
        });
      }

      //进度条
      ,progress: function(elem){
        var ELEM = 'layui-progress';
        var targetElem = elem || $('.' + ELEM + elemFilter);

        targetElem.each(function(){
          var othis = $(this)
          ,elemBar = othis.find('.layui-progress-bar')
          ,percent = elemBar.attr('lay-percent');

          elemBar.css('width', function(){
            return /^.+\/.+$/.test(percent)
              ? (new Function('return '+ percent)() * 100) + '%'
           : percent;
          });

          if(othis.attr('lay-showpercent')){
            setTimeout(function(){
              elemBar.html('<span class="'+ ELEM +'-text">'+ percent +'</span>');
            },350);
          }
        });
      }

      // 折叠面板
      ,collapse: function(elem) {
        var ELEM = 'layui-collapse';
        var targetElem = elem || $('.' + ELEM + elemFilter);

        targetElem.each(function() {
          var elemItem = $(this).find('.layui-colla-item');
          elemItem.each(function() {
            var othis = $(this)
            var elemTitle = othis.find('.layui-colla-title');
            var elemCont = othis.find('.layui-colla-content');
            var isNone = elemCont.css('display') === 'none';

            // 初始状态
            elemTitle.find('.layui-colla-icon').remove();
            elemTitle.append('<i class="layui-icon layui-icon-right layui-colla-icon"></i>');
            othis[isNone ? 'removeClass' : 'addClass'](SHOW);

            // 兼容旧版（ < 2.11.3）
            if (elemCont.hasClass(SHOW)) {
              elemCont.removeClass(SHOW);
            }

            // 点击标题
            elemTitle.off('click', call.collapse).on('click', call.collapse);
          });
        });
      }
    };

    if(type && typeof filter === 'object' && filter instanceof $){
      var targetElem = filter;
      return items[type](targetElem);
    }

    return items[type] ? items[type]() : layui.each(items, function(index, item){
      item();
    });
  };

  Element.prototype.render = Element.prototype.init;

  var element = new Element();
  var dom = $(document);

  $(function(){
    element.render();
  });

  dom.on('click', '.layui-tab-title li', call.tabClick); // Tab 切换
  // dom.on('click', call.hideTabMore); // 隐藏展开的 Tab
  $(window).on('resize', call.tabAuto); // 自适应

  exports(MOD_NAME, element);
});

