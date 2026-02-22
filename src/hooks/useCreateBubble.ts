import { CNode, CNodeType } from "../state";
import { useListenTransform } from "./useListenTransform";
import { useCreateComicImage } from "./useCreateComicImage";
import { useCreateText } from "./useCreateText";
import { DrawAction } from "../constants";
import { createKonvaGroupWithChildren } from "./useCreateComicPage";
import { initImage } from "../Components/InfCanva/utils";
import { loadKonva } from "../utilities/konva-loader";

export const useCreateBubble = () => {
  const listenTransform = useListenTransform()
  const createComicImage = useCreateComicImage()
  const createComicText = null; //useCreateText()

  return async (cnode: CNode) => {
    // Load Konva dynamically on client side
    const Konva = await loadKonva();
    if (!Konva) {
      return null; // Server side
    }
    const loadImage = await initImage(cnode.attrs.imageUrl!)


    const mainShape = new Konva.Image({
      id: cnode.attrs.id,
      image: loadImage,
      name: cnode.attrs.name,
      draggable: false,
      clickable: false,
      x: 0,
      y: 0,
    })

    const width = mainShape!.getClientRect().width
    const height = mainShape!.getClientRect().height
    let newWidth, newHeight;
    // first normalize the length
    const scaleX = 600 / width;
    const scaleY = 600 / height;
    const scale = Math.min(scaleX, scaleY)
    mainShape.scaleX(scale);
    mainShape.scaleY(scale);
    newWidth = mainShape!.getClientRect().width
    newHeight = mainShape!.getClientRect().height
    cnode.attrs.width = newWidth;
    cnode.attrs.height = newHeight;

    const group = new Konva.Group({
      id: `group-${cnode.attrs.id}`,
      cType: CNodeType.COMIC_BUBBLE,
      draggable: true,
      width: newWidth,
      height: newHeight,
      rotation: cnode.attrs.rotation,
      skewX: cnode.attrs.skewX, //,
      skewY: cnode.attrs.skewY,
      // 这两个不要
      scaleX: cnode.attrs.scaleX, // scale up according to cnode.attrs.scaleX
      scaleY: cnode.attrs.scaleY,
      x: cnode.attrs.x!,
      y: cnode.attrs.y!,
      // clipFunc: cnode.attrs.name === DrawAction.Bubble ? function (ctx) {
      //   // Clip by path
      //   ctx.beginPath();
      //   const pathData = cnode.attrs.data;
      //   const path = new Path2D(pathData);
      //   ctx.clip(path);
      // } : undefined,
    })
    listenTransform(group)
    group.add(mainShape!)

    if (cnode.children) {
      const konvaGroupWithChildren = await createKonvaGroupWithChildren(cnode, createComicImage, createComicText)
      if (konvaGroupWithChildren) group.add(konvaGroupWithChildren)
    }
    return group
  }
}
// export const useCreateBubble = () => {
//   return async (layer, transformer) => {
//     // 创建矩形
//     var rect = new Konva.Path({
//       data: "M191.5,202.75c0-7.167-4.023-13.389-9.933-16.545  c0.914-2.05,1.433-4.315,1.433-6.705c0-9.113-7.387-16.5-16.5-16.5c-3.256,0-6.282,0.956-8.839,2.583  C153.997,160.968,148.35,158,142,158c-5.865,0-11.123,2.54-14.781,6.561C124.52,162.945,121.374,162,118,162  c-9.941,0-18,8.059-18,18c0,6.784,3.756,12.687,9.299,15.754C101.616,198.003,96,205.09,96,213.5  c0,7.557,4.537,14.045,11.029,16.916C107.023,230.611,107,230.803,107,231c0,9.389,7.611,17,17,17c4.162,0,7.971-1.501,10.926-3.983  c2.241,1.258,4.821,1.983,7.574,1.983c6.327,0,11.76-3.797,14.169-9.231C158.627,237.556,160.76,238,163,238c9.389,0,17-7.611,17-17  c0-0.316-0.03-0.626-0.047-0.938C186.732,217.237,191.5,210.553,191.5,202.75z",
//       fill: "white",
//       stroke: 'black',
//       strokeWidth: 10,
//       draggable: false,
//       x: 0,
//       y: 0,
//     });

//     // 确保将路径添加到图层中
//     layer.add(rect);

//     // 创建三角形顶点
//     var pointA = { x: rect.getClientRect().x, y: rect.getClientRect().y + rect.getClientRect().height };
//     var pointB = { x: rect.getClientRect().x + rect.getClientRect().width, y: rect.getClientRect().y + rect.getClientRect().height };
//     var pointC = { x: (rect.getClientRect().x + rect.getClientRect().x + rect.getClientRect().width) / 2, y: rect.getClientRect().y + rect.getClientRect().height + 100 };

//     // 创建三角形
//     var triangle = new Konva.Line({
//       points: [pointA.x, pointA.y, pointC.x, pointC.y, pointB.x, pointB.y],
//       fill: 'white',
//       stroke: 'black',
//       strokeWidth: 2,
//       closed: false,
//       draggable: false,
//     });
//     layer.add(triangle);

//     // 创建可拖动的锚点
//     var anchor = new Konva.Circle({
//       x: pointC.x,
//       y: pointC.y,
//       radius: 10,
//       fill: 'transparent',
//       draggable: true,
//     });
//     layer.add(anchor);

//     // 更新三角形的顶点
//     anchor.on('dragmove', function () {
//       var newPos = anchor.position();
//       var points = [pointA.x, pointA.y, newPos.x, newPos.y, pointB.x, pointB.y];
//       triangle.points(points);
//       layer.batchDraw();
//     });

//     // 隐藏Transformer在三角形选择时
//     triangle.on('click', function () {
//       transformer.hide();
//       layer.batchDraw();
//     });

//     triangle.on('transform', function () {
//       triangle.setAttrs({
//         scaleX: 1,
//         scaleY: 1,
//       });
//     });

//     // 防止锚点改变大小
//     anchor.on('transform', function () {
//       anchor.setAttrs({
//         scaleX: 1,
//         scaleY: 1,
//       });
//     });

//     // 隐藏Transformer在锚点拖动时
//     anchor.on('dragstart', function () {
//       transformer.hide();
//       layer.batchDraw();
//     });

//     anchor.on('dragend', function () {
//       setTimeout(() => {
//         transformer.show();
//         layer.batchDraw();
//       }, 100);
//     });

//     // 渲染图层
//     layer.draw();
//   };
// };
