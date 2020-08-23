import React, { useRef, useEffect, useCallback } from 'react';
import './App.css';
import colorsImg from './colors.png';

import Canvas from './components/Canvas';
import { memoizeRGB, handleDebounce } from './utils/helpers';
import { SCALE_OPTIONS, CURSOR_OPTIONS, ARC_OPTIONS, IMAGE_DATA_OPTIONS, CLEAR_OPTIONS } from './constants';


const App = () => {
  const canvasRef = useRef(null);
  const cursorCanvasRef = useRef(null);
  
  const mouseHistory = [];

  const getMemoizedRBG = memoizeRGB();
  const debounce = handleDebounce();

  const image = new Image();
  
  const draw = useCallback((ctx, position = {x: 0, y: 0}, hex, mouseHistory, ctxCursor) => {
    image.src = colorsImg;
    image.onload = function() {
      mouseHistory.forEach(historyItem => {
        ctx.clearRect(
          historyItem.x - (CLEAR_OPTIONS.arcRadius / 2), 
          historyItem.y - (CLEAR_OPTIONS.arcRadius / 2), 
          CLEAR_OPTIONS.arcRadius, 
          CLEAR_OPTIONS.arcRadius,
        );
        ctxCursor.clearRect(
          historyItem.x - (CLEAR_OPTIONS.cursorRadius / 2),
          historyItem.y - (CLEAR_OPTIONS.cursorRadius / 2),
          CLEAR_OPTIONS.cursorRadius,
          CLEAR_OPTIONS.cursorRadius,
        );
      });

      ctx.save();
        drawArc(ctx, position, hex, ARC_OPTIONS);
        zoom(ctx, position, image, SCALE_OPTIONS);
        fillHexColorText(ctx, position, hex);
      ctx.restore();
      drawCursor(ctxCursor, position, CURSOR_OPTIONS);
    }
  }, [image]);

  const handleMainDraw = useCallback(({pageX, pageY}) => {
    const canvas = canvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;

    const ctx = canvas.getContext('2d');
    const ctxCursor = cursorCanvas.getContext('2d');

    const cursorPosition = {x: pageX, y: pageY};

    mouseHistory.push(cursorPosition);
    debounce(() => mouseHistory.splice(0, mouseHistory.length - 1), 1000);

    const image = ctx.getImageData(
      pageX,
      pageY,
      IMAGE_DATA_OPTIONS.width,
      IMAGE_DATA_OPTIONS.height,
    );
    const pixelData = image.data;

    const hex = getMemoizedRBG(pixelData[0], pixelData[1], pixelData[2]);

    draw(ctx, cursorPosition, hex, mouseHistory, ctxCursor);    
  }, [draw, mouseHistory, getMemoizedRBG, debounce])


  useEffect(() => {
    const cursorCanvas = cursorCanvasRef.current;
    cursorCanvas.addEventListener('mousemove', handleMainDraw);
    return () => cursorCanvas.removeEventListener('mousemove', handleMainDraw);
  }, [handleMainDraw]);
  

  const drawArc = (ctx, {x: cursorX, y: cursorY}, hex, ARC_OPTIONS) => {  
    ctx.beginPath();
    ctx.lineWidth = ARC_OPTIONS.lineWidth;
    ctx.strokeStyle = hex;
    ctx.arc(
      cursorX,
      cursorY,
      ARC_OPTIONS.radius,
      ARC_OPTIONS.startAngle,
      ARC_OPTIONS.endAngle,
    );
    ctx.stroke();
    ctx.clip();
    ctx.closePath();
  };

  const drawCursor = (ctx, {x: cursorX, y: cursorY}, CURSOR_OPTIONS) => {
    ctx.beginPath();
    ctx.lineWidth = CURSOR_OPTIONS.lineWidth;
    ctx.strokeStyle = '#ffffff';
    ctx.rect(
      cursorX - CURSOR_OPTIONS.x, 
      cursorY - CURSOR_OPTIONS.y, 
      CURSOR_OPTIONS.width, 
      CURSOR_OPTIONS.height
    );
    ctx.stroke();
    ctx.closePath();
  };

  const fillHexColorText = (ctx, cursorPosition, hex) => {
    ctx.fillText(hex, cursorPosition.x - 20, cursorPosition.y + 30);
  };

  const zoom = (ctx, {x: positionX, y: positionY}, img, SCALE_OPTIONS) => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      Math.min(Math.max(0, positionX - SCALE_OPTIONS.cropPosition), img.width - SCALE_OPTIONS.cropSize),
      Math.min(Math.max(0, positionY - SCALE_OPTIONS.cropPosition), img.height - SCALE_OPTIONS.cropSize),
      SCALE_OPTIONS.width, 
      SCALE_OPTIONS.height,
      positionX - SCALE_OPTIONS.destinationX, 
      positionY - SCALE_OPTIONS.destinationY,
      SCALE_OPTIONS.destinationWidth, 
      SCALE_OPTIONS.destinationHeight,
    );
  };

  /**
   * Added background image with plain css for performance reasons
   * Also created two canvas layers for better performance
   */
  return (
    <div id="wrapper" style={{ backgroundImage: `url(${colorsImg})`}}>
      <Canvas
        ref={canvasRef}
        id="zoom-layer"
        width={1080}
        height={916}
      />
      <Canvas
        ref={cursorCanvasRef}
        id="cursor-layer"
        width={1080}
        height={916}
      />
    </div>
  )
};

export default App;
