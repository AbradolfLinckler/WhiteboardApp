import { Component, OnInit } from '@angular/core';
import Konva from 'konva';
import { ShapeService } from '../shape.service';
import { TextNodeService } from '../text-node.service';
@Component({
  selector: 'app-whiteboard-page',
  templateUrl: './whiteboard-page.component.html',
  styleUrls: ['./whiteboard-page.component.css']
})
export class WhiteboardPageComponent implements OnInit {
  shapes: any = [];
  stage: any;
  layer: Konva.Layer;
  selectedButton: any = {
    'circle': false,
    'rectangle': false,
    'line': false,
    'undo': false,
    'erase': false,
    'text': false,
    'arrow': false
  }
  // reshape: Konva.Transformer = new Konva.Transformer();
  erase: boolean = false;
  transformers: Konva.Transformer[] = [];
  constructor(
    private shapeService: ShapeService,
    private textNodeService: TextNodeService
  ) { }
  ngOnInit() {
    let width = window.innerWidth * 0.9;
    let height = window.innerHeight;
    this.stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.addLineListeners();
  }
  clearSelection() {
    Object.keys(this.selectedButton).forEach(key => {
      this.selectedButton[key] = false;
    })
  }
  setSelection(type: string) {
    this.selectedButton[type] = true;
  }
  addShape(type: string) {
    this.clearSelection();
    this.setSelection(type);
    if (type == 'circle') {
      this.addCircle();
    }
    else if (type == 'line') {
      this.addLine();
    }
    else if (type == 'rectangle') {
      this.addRectangle();
    }
    else if (type == 'text') {
      this.addText();
    }
    else if(type == 'arrow') {
      this.addArrow();
    }
  }
  addText() {
    const text = this.textNodeService.textNode(this.stage, this.layer);
    this.shapes.push(text.textNode);
    this.transformers.push(text.tr);
  }
  addCircle() {
    const circle = this.shapeService.circle();
    this.shapes.push(circle);
    this.layer.add(circle);
    this.stage.add(this.layer);
    this.addTransformerListeners();
  }
  addArrow() {
    const arrow = this.shapeService.arrow();
    this.shapes.push(arrow);
    this.layer.add(arrow);
    this.stage.add(this.layer);
    this.addTransformerListeners();
  }
  addRectangle() {
    const rectangle = this.shapeService.rectangle();
    this.shapes.push(rectangle);
    this.layer.add(rectangle);
    this.stage.add(this.layer);
    this.addTransformerListeners();
    
  }
  addLine() {
    this.selectedButton['line'] = true;
  }
  addLineListeners() {
    const component = this;
    let lastLine;
    let isPaint;
    this.stage.on('mousedown touchstart', function (e) {
      if (!component.selectedButton['line'] && !component.erase) {
        return;
      }
      isPaint = true;
      let pos = component.stage.getPointerPosition();
      const mode = component.erase ? 'erase' : 'brush';
      lastLine = component.shapeService.line(pos, mode)
      component.shapes.push(lastLine);
      component.layer.add(lastLine);
    });
    this.stage.on('mouseup touchend', function () {
      isPaint = false;
    });
    // and core function - drawing
    this.stage.on('mousemove touchmove', function () {
      if (!isPaint) {
        return;
      }
      const pos = component.stage.getPointerPosition();
      var newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
      component.layer.batchDraw();
    });
  }
  undo() {
    const removedShape = this.shapes.pop();
    this.transformers.forEach(t => {
      t.detach();
    });
    if (removedShape) {
      removedShape.remove();
    }
    this.layer.draw();
  }
  
  imgUpload(e: any) {
    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(e.target.files[0]);
    var img = new Image();
    img.src = url;
    var shapes = this.shapes;
    var layer = this.layer;
    var stage=this.stage;
    var _this=this;
    console.log(e);
    
    img.onload = function(rs) {
      // CleanBG();
      var w=rs.currentTarget['width']; //Taking width and height of the image.
      var h=rs.currentTarget['height'];
      _this.resizeStage(w,h);// Resizing stage according to the width and height of image.
      console.log("Image width: "+w);
      console.log("Image height: "+h);
      var theImg = new Konva.Image({
        image: img,
        type: 'Image',
        x: 0,
        y: 0,
        width: w,
        height: h
        });
      shapes.push(theImg);
      layer.add(theImg);
      stage.add(layer);
    }
  }
  resizeStage(w: any,h:any){
    this.stage.width(w);
    this.stage.height(h);
  }
  
  addTransformerListeners() {
    const component = this;
    const tr = new Konva.Transformer();
    this.stage.on('click', function (e) {
      console.log(e.target);
      console.log('ID: '+e.target._id);
      // console.log('Click start shape ID: '+this.clickStartShape._id);
      // if (!this.clickStartShape) {
      //   console.log('Not clickStartShape');
      //   return;
      // }
      if (e.target._id!==1) { // 1 is the id of stage and was causing stack overflow error.
        component.addDeleteListener(e.target);
        component.layer.add(tr);
        tr.attachTo(e.target);
        component.transformers.push(tr);
        // tr.nodes([e.target]);
        component.layer.draw();
      }
      else {
        tr.detach();
        component.layer.draw();
      }
    });
  }
  addDeleteListener(shape: any) {
    const component = this;
    window.addEventListener('keydown', function (e) {
      if (e.keyCode === 46) {
        shape.remove();
        component.transformers.forEach(t => {
          t.detach();
        });
        const selectedShape = component.shapes.find(s => s._id == shape._id);
        selectedShape.remove();
        e.preventDefault();
      }
      component.layer.batchDraw();
    });
  }
}

