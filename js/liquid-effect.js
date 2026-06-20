/* todayCard 推荐卡片 - WebGL 液体扭曲效果 */
(function () {
  function initLiquidEffect() {
    var card = document.querySelector('.topGroup .todayCard');
    if (!card || card.querySelector('.liquid-canvas')) return;

    // 获取背景图片 URL
    var cardImg = card.querySelector('.todayCard-cover');
    var imgUrl = cardImg ? (cardImg.getAttribute('data-lazy-src') || cardImg.src) : null;
    if (!imgUrl || imgUrl.indexOf('data:') === 0) return;

    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    // 创建 WebGL canvas
    var canvas = document.createElement('canvas');
    canvas.className = 'liquid-canvas';
    canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;border-radius:12px;';
    card.appendChild(canvas);

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // 着色器源码
    var vsSource =
      'attribute vec2 a_position;\n' +
      'attribute vec2 a_texCoord;\n' +
      'varying vec2 v_texCoord;\n' +
      'void main() {\n' +
      '  gl_Position = vec4(a_position, 0.0, 1.0);\n' +
      '  v_texCoord = a_texCoord;\n' +
      '}\n';

    var fsSource =
      'precision mediump float;\n' +
      'varying vec2 v_texCoord;\n' +
      'uniform sampler2D u_image;\n' +
      'uniform vec2 u_mouse;\n' +
      'uniform vec2 u_resolution;\n' +
      'uniform float u_time;\n' +
      'uniform float u_intensity;\n' +
      '\n' +
      'void main() {\n' +
      '  vec2 uv = v_texCoord;\n' +
      '  vec2 mouse = u_mouse / u_resolution;\n' +
      '  float aspect = u_resolution.x / u_resolution.y;\n' +
      '  vec2 diff = uv - mouse;\n' +
      '  diff.x *= aspect;\n' +
      '  float dist = length(diff);\n' +
      '  vec2 dir = normalize(diff + 0.0001);\n' +
      '  float strength = u_intensity;\n' +
      '\n' +
      '  float ripple = 0.0;\n' +
      '  float radius = 0.4;\n' +
      '  if (dist < radius && strength > 0.01) {\n' +
      '    float fade = 1.0 - dist / radius;\n' +
      '    fade = fade * fade;\n' +
      '    ripple += sin(dist * 50.0 - u_time * 5.0) * fade * strength * 0.018;\n' +
      '    ripple += sin(dist * 35.0 - u_time * 4.0) * fade * strength * 0.012;\n' +
      '    ripple += sin(dist * 20.0 - u_time * 3.0) * fade * strength * 0.008;\n' +
      '    uv += dir * ripple;\n' +
      '    float swirl = sin(dist * 30.0 - u_time * 3.5) * fade * strength * 0.004;\n' +
      '    uv.x += -diff.y * swirl;\n' +
      '    uv.y +=  diff.x * swirl;\n' +
      '  }\n' +
      '  gl_FragColor = texture2D(u_image, uv);\n' +
      '}\n';

    function createShader(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vs = createShader(gl.VERTEX_SHADER, vsSource);
    var fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    // 顶点位置
    var posLoc = gl.getAttribLocation(program, 'a_position');
    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // 纹理坐标
    var texLoc = gl.getAttribLocation(program, 'a_texCoord');
    var texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // uniform
    var uMouse = gl.getUniformLocation(program, 'u_mouse');
    var uResolution = gl.getUniformLocation(program, 'u_resolution');
    var uTime = gl.getUniformLocation(program, 'u_time');
    var uIntensity = gl.getUniformLocation(program, 'u_intensity');

    // 加载纹理
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // 先放一个 1x1 透明像素，等图片加载
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));

    var imageLoaded = false;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      imageLoaded = true;
    };
    img.src = imgUrl;

    // 鼠标状态
    var mouseX = 0, mouseY = 0;
    var targetIntensity = 0;
    var currentIntensity = 0;
    var isHovering = false;

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      isHovering = true;
      targetIntensity = 1.0;
    });

    card.addEventListener('mouseleave', function () {
      isHovering = false;
      targetIntensity = 0;
    });

    // 尺寸
    function resize() {
      var rect = card.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // 渲染
    var startTime = Date.now();
    var animId = null;

    function render() {
      if (!imageLoaded) {
        animId = requestAnimationFrame(render);
        return;
      }

      // 平滑过渡强度
      currentIntensity += (targetIntensity - currentIntensity) * 0.08;

      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, (Date.now() - startTime) / 1000.0);
      gl.uniform1f(uIntensity, currentIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    }
    render();

    // pjax 清理
    document.addEventListener('pjax:send', function () {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiquidEffect);
  } else {
    initLiquidEffect();
  }
  document.addEventListener('pjax:complete', function () {
    setTimeout(initLiquidEffect, 300);
  });
})();
