window.addEventListener('load', init, false);
function init() {
   // 创建场景，相机和渲染器
   createScene();
   // 添加光源
   createLights();
   // 添加对象
   createSea();


   loop();
}

var scene, camera, fieldOfView, aspectRatio, nearPlane,
    farPlane, HEIGHT, WIDTH, renderer, container;

function createScene() {
    // 获得屏幕的宽和高，
    // 用它们设置相机的纵横比
    // 还有渲染器的大小
    HEIGHT = window.innerHeight;  
    WIDTH = window.innerWidth;

    // 创建场景
    scene = new THREE.Scene();       

    // 在场景中添加雾的效果；样式上使用和背景一样的颜色
    scene.fog = new THREE.Fog(0x5fb2d2, 100, 950);

    // 创建相机
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;  
    farPlane = 10000;
    /**
     * PerspectiveCamera 透视相机
     * @param fieldOfView 视角
     * @param aspectRatio 纵横比
     * @param nearPlane 近平面
     * @param farPlane 远平面
     */
    camera = new THREE.PerspectiveCamera(   
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
      );

    // 设置相机的位置
    camera.position.x = 0;  
    camera.position.z = 200;  
    camera.position.y = 100;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
    // 在 css 中设置背景色透明显示渐变色
      alpha: true,
    // 开启抗锯齿，但这样会降低性能。
    // 不过，由于我们的项目基于低多边形的，那还好 :)
      antialias: true
    });

    // 定义渲染器的尺寸；在这里它会填满整个屏幕
    renderer.setSize(WIDTH, HEIGHT);

    // 打开渲染器的阴影地图
    renderer.shadowMap.enabled = true;

    // 在 HTML 创建的容器中添加渲染器的 DOM 元素
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // 监听屏幕，缩放屏幕更新相机和渲染器的尺寸
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
   // 更新渲染器的高度和宽度以及相机的纵横比
   HEIGHT = window.innerHeight;
   WIDTH = window.innerWidth;         
   renderer.setSize(WIDTH, HEIGHT);
   camera.aspect = WIDTH / HEIGHT;        
   camera.updateProjectionMatrix();
}


var hemisphereLight, shadowLight;
function createLights() {
  // 半球光就是渐变的光；
  // 第一个参数是天空的颜色，第二个参数是地上的颜色，第三个参数是光源的强度
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9);

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

   // 方向光是从一个特定的方向的照射
   // 类似太阳，即所有光源是平行的
   // 第一个参数是关系颜色，第二个参数是光源强度
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);

  // 设置光源的方向。  
   // 位置不同，方向光作用于物体的面也不同，看到的颜色也不同
   shadowLight.position.set(150, 350, 350);

   // 开启光源投影
  shadowLight.castShadow = true;

  // 定义可见域的投射阴影
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // 定义阴影的分辨率；虽然分辨率越高越好，但是需要付出更加昂贵的代价维持高性能的表现。
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  // 为了使这些光源呈现效果，只需要将它们添加到场景中
  scene.add(hemisphereLight);  
  scene.add(shadowLight);
  scene.add(ambientLight);

}


/*Sea = function(){

  // 创建一个圆柱几何体
  // 参数为：顶面半径，底面半径，高度，半径分段，高度分段
  var geom = new THREE.CylinderGeometry(600,600,800,40,10);

  // 在 x 轴旋转几何体
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

  // 创建材质
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.6,
    shading:THREE.FlatShading
  });

  // 为了在 Three.js 创建一个物体，我们必须创建网格用来组合几何体和一些材质
  this.mesh = new THREE.Mesh(geom, mat);

  // 允许大海对象接收阴影
  this.mesh.receiveShadow = true;
}*/

Sea = function(){
   var geom = new THREE.CylinderGeometry(600,600,800,40,10);
   geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

   // 重点：通过合并顶点，我们确保海浪的连续性
   geom.mergeVertices();

   // 获得顶点
   var l = geom.vertices.length;

   // 创建一个新的数组存储与每个顶点关联的值：
   this.waves = [];

   for (var i=0; i<l; i++){
       // 获取每个顶点
       var v = geom.vertices[i];

       // 存储一些关联的数值
       this.waves.push({y:v.y,
                      x:v.x,
                        z:v.z,
                        // 随机角度
                        ang:Math.random()*Math.PI*2,
                        // 随机距离
                        amp:5 + Math.random()*15,
                        // 在0.016至0.048度/帧之间的随机速度
                        speed:0.016 + Math.random()*0.032
       });
   };
   var mat = new THREE.MeshPhongMaterial({
       color:0x5fb2d2,
       transparent:true,
       opacity:.8,
       shading:THREE.FlatShading,
   });

   this.mesh = new THREE.Mesh(geom, mat);
   this.mesh.receiveShadow = true;
}

// 现在我们创建一个在每帧可以调用的函数，用于更新顶点的位置来模拟海浪。

Sea.prototype.moveWaves = function (){

   // 获取顶点
   var verts = this.mesh.geometry.vertices;
   var l = verts.length;

   for (var i=0; i<l; i++){
       var v = verts[i];

       // 获取关联的值
       var vprops = this.waves[i];

       // 更新顶点的位置
       v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
       v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;

       // 下一帧自增一个角度
       vprops.ang += vprops.speed;
   }

   // 告诉渲染器代表大海的几何体发生改变
   // 事实上，为了维持最好的性能
   // Three.js会缓存几何体和忽略一些修改
   // 除非加上这句
   this.mesh.geometry.verticesNeedUpdate=true;

   sea.mesh.rotation.z += .005;
}

function createSea(){
 sea = new Sea();

 // 在场景底部，稍微推挤一下
sea.mesh.position.y = -600;

 // 添加大海的网格至场景
 scene.add(sea.mesh);
}

function loop(){
  // 使螺旋桨旋转并转动大海和云
 //sea.mesh.rotation.z += .005;
 sea.moveWaves();

  // 渲染场景
  renderer.render(scene, camera);

  // 重新调用 render() 函数
  requestAnimationFrame(loop);
}