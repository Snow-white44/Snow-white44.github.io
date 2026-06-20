/* 分类按钮动态玻璃折射效果 */
(function () {
  function initGlassEffect() {
    var items = document.querySelectorAll('.categoryItem');
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = item.querySelector('.categoryButton');
      if (!btn) return;

      // 创建高光层
      var shine = document.createElement('div');
      shine.className = 'glass-shine';
      shine.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;border-radius:12px;pointer-events:none;z-index:2;opacity:0;transition:opacity 0.3s;';
      item.style.position = 'relative';
      item.style.transformStyle = 'preserve-3d';
      item.appendChild(shine);

      item.addEventListener('mousemove', function (e) {
        var rect = item.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -12;
        var rotateY = ((x - centerX) / centerX) * 12;

        item.style.transform =
          'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.05)';
        item.style.transition = 'transform 0.1s ease';

        shine.style.opacity = '1';
        shine.style.background =
          'radial-gradient(circle at ' +
          x +
          'px ' +
          y +
          'px, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)';
      });

      item.addEventListener('mouseleave', function () {
        item.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
        item.style.transition = 'transform 0.5s cubic-bezier(0.39, 0.575, 0.565, 1)';
        shine.style.opacity = '0';
      });
    });
  }

  // 初始化 + pjax 兼容
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlassEffect);
  } else {
    initGlassEffect();
  }
  document.addEventListener('pjax:complete', initGlassEffect);
})();
