# 项目启动
1. 项目使用node版本v20.xx。最新版本可能无法正常工作。
2. `.env`文件是必需的。您可以向Sophia或Shiyu Wang请求文件。
3. 后端（或服务端接口）在Vercel上运行。您必须使用Vercel运行项目。
4. 由于某些目录结构问题，项目在Windows上可能无法正常运行。建议使用Windows子系统（WSL）或MacOS。

### 画布实现理念
    1. 画布的主要逻辑都在InfCanva.tsx,当前这个文件内部的逻辑众多且多有重复，
      - 下一步可以考虑把变量抽离使用 **atom** 全局存储，放到/store目录下
      - 重复逻辑使用hooks封装放到 /hooks 目录下
    2. Konva的画布有自己的一套交互逻辑，当操作konva的元素（移动/旋转/放大...）,Konva会自己更新对应state/layer/shape的interface，并切保存在对应的instance上，
    3. 而为了做到export功能，undo/redo，甚至是以后的多人协作，我们需要把这些状态 读取抽离重新组织并保存下来，目前是保存在 appStateAtom 中，这是一个[新兴的最简单实用的React状态管理工具](https://jotai.org/).
    4. 3，抽象出了CNode，比较ComicNode，具体的CNodeType可以参考 **state下的CNodeType** 变量，它用来描述我们的抽象节点
      - 一个CNode 由一个活多个 Konva.Shape组成，Konva.Shape也可以写作 Konva.Node，这两者有差异，但是不大
      - CNode是我们开发者描述画布的基本单元
      - 把CNode渲染成具体的Konva.Shape,并添加到画布中，由/hooks下的各个文件完成
      - 比如一个ComicPage，它其实由一个Konva.rect做底色,内部可以叠加多个Konva.Image，但是Konva.Image们又不能和rect处于同一层，所以多个Konva.Image 包裹在一个Konva.group下，具体理念[参考官方文档](https://konvajs.org/docs/overview.html)
    6. 根据2.因为Konva.js自己处理并保存了画布上Konva.Shape的交互和状态，所以我们需要监听它们的事件，具体参考useListenTransform和InfConva.tsx下的onDragend方法。每当Konva.Shape的节点更新后，我们需要更新对应appStateAtom中对应的CNode。
       1. 注意： transformer并不会直接作用于Konva.Shape本身，比如ComicBubble和ComicPage（他们本身由Konva.Group包裹多个Konva.Shape)真正transform事件的作用元素是最外层的Konva.Group，所以在listenTransform 的时候要额外注意，但是ComicImage，它的transformer事件是直接作用在Image上的，具体可以查看hooks下的具体实现

### 功能说明
    - 创建shape，在/hooks目录下，封装了一个一系列hooks，来方便复用和**共享atom状态**，注意hooks的定义和使用规则，如果要新增hook，直接复制，修改return里面的逻辑即可，在对hooks规则了解足够多之前，不建议进行不必要的改写和重构
    - 图片的处理：
      - 图片的处理比较复杂，因为涉及到placeholder，需要在asyncImageFunc中增加了 asyncImageFunc函数，如果想要先加载一个占位图，然后异步加载图片并***完成后续更新逻辑***，请把对应的逻辑***都写到asyncImageFunc里，并返回处理好的imageUrl***
      - 图片的实际大小和在konva.image中的呈现大小并不是完全相等，要考虑
        - state的缩放，具体定义值在 constant.tsx > STAGE_SCALE_VALUE
        - layer的缩放，此处还未用到
        - 图片所在的 Konva.Image 元素是否有缩放
        - Konva.Image 从属的Konva.Group是否有缩放
      - 因为处理所有的缩放不大可能，可以有限使用 getClientRect 获取对应image的大小然后做出对应的操作
      - 注意，在Layer上直接生成图片的时候，图片没有width/height属性，此时请
        - 优先使用 getClientRect 获取占位大小
        - 如果 getClientRect 获取的width/height有问题，请逐一建议上面提到的几个缩放问题
      - 图片有以下几种存在状态
        - 1. 单独存在： 直接在Layer上 生成图片，此时图片的parent是layer，图片的attrs可能无width/height属性
        - 2. 图片存在ComicPage内部，此时所有的Konva.Image都会包裹在一个image-groups-xxxx的Konva.Group下，这是为了让图片都保存在同一个基础层级，在moveUP/moveDown的时候，不至于出现奇怪的bug
        - 3. 图片存在Bubble中，和 2 一样

### 其他问题：
    - 不推荐使用react-konva，除非对konva.js的细节有了深入的理解
    - 现在RightSidebar活着Options组建的传参太多而且复杂，应该考虑用hooks和state进行拆分

