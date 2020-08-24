import React, { useRef, useEffect, useCallback } from 'react';
import './App.css';
import colorsImg from './colors.png';

import Canvas from './components/Canvas';
import { memoizeRGB, handleDebounce } from './utils/helpers';
import { 
  ARC_OPTIONS,
  CLEAR_OPTIONS,
  SCALE_OPTIONS,
  CURSOR_OPTIONS,
  IMAGE_DATA_OPTIONS,
} from './constants';


const App = () => {
  const zoomCanvasRef = useRef(null);
  const cursorCanvasRef = useRef(null);
  const backgroundCanvasRef = useRef(null);
  
  const mouseHistory = [];

  const getMemoizedRBG = memoizeRGB();
  const debounce = handleDebounce();

  const image = new Image();
  
  const draw = useCallback((ctxZoom, position = {x: 0, y: 0}, hex, mouseHistory, ctxCursor) => {
    image.src = colorsImg;
    image.onload = function() {
      mouseHistory.forEach(historyItem => {
        ctxZoom.clearRect(
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
      ctxZoom.save();
        drawArc(ctxZoom, position, hex, ARC_OPTIONS);
        zoom(ctxZoom, position, image, SCALE_OPTIONS);
        fillHexColorText(ctxZoom, position, hex);
      ctxZoom.restore();
      drawCursor(ctxCursor, position, CURSOR_OPTIONS);
    }
  }, [image]);

  const handleMainDraw = useCallback(({pageX, pageY}) => {
    const canvasZoom = zoomCanvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;

    const ctxZoom = canvasZoom.getContext('2d');
    const ctxCursor = cursorCanvas.getContext('2d');

    const cursorPosition = {x: pageX, y: pageY};

    mouseHistory.push(cursorPosition);
    debounce(() => mouseHistory.splice(0, mouseHistory.length - 1), 1000);

    const image = ctxZoom.getImageData(
      pageX,
      pageY,
      IMAGE_DATA_OPTIONS.width,
      IMAGE_DATA_OPTIONS.height,
    );
    const pixelData = image.data;

    const hex = getMemoizedRBG(pixelData[0], pixelData[1], pixelData[2]);

    draw(ctxZoom, cursorPosition, hex, mouseHistory, ctxCursor);    
  }, [draw, mouseHistory, getMemoizedRBG, debounce])


  useEffect(() => {
    const cursorCanvas = cursorCanvasRef.current;

    const backgroundCanvas = backgroundCanvasRef.current;
    const ctxBackground = backgroundCanvas.getContext('2d');

    image.src = colorsImg;
    image.onload = () => drawBGImage(ctxBackground, image);

    cursorCanvas.addEventListener('mousemove', handleMainDraw);
    return () => cursorCanvas.removeEventListener('mousemove', handleMainDraw);
  }, [handleMainDraw, image]);
  

  const drawArc = (ctxZoom, {x: cursorX, y: cursorY}, hex, ARC_OPTIONS) => {  
    ctxZoom.beginPath();
    ctxZoom.lineWidth = ARC_OPTIONS.lineWidth;
    ctxZoom.strokeStyle = hex;
    ctxZoom.arc(
      cursorX,
      cursorY,
      ARC_OPTIONS.radius,
      ARC_OPTIONS.startAngle,
      ARC_OPTIONS.endAngle,
    );
    ctxZoom.stroke();
    ctxZoom.clip();
    ctxZoom.closePath();
  };

  const drawCursor = (ctxZoom, {x: cursorX, y: cursorY}, CURSOR_OPTIONS) => {
    ctxZoom.beginPath();
    ctxZoom.lineWidth = CURSOR_OPTIONS.lineWidth;
    ctxZoom.strokeStyle = '#ffffff';
    ctxZoom.rect(
      cursorX - CURSOR_OPTIONS.x, 
      cursorY - CURSOR_OPTIONS.y, 
      CURSOR_OPTIONS.width, 
      CURSOR_OPTIONS.height
    );
    ctxZoom.stroke();
    ctxZoom.closePath();
  };

  const drawBGImage = (ctxBackground, img) => {
    ctxBackground.drawImage(img, 0, 0, img.width, img.height);
  }

  const fillHexColorText = (ctxZoom, cursorPosition, hex) => {
    ctxZoom.fillText(hex, cursorPosition.x - 20, cursorPosition.y + 30);
  };

  const zoom = (ctxZoom, {x: positionX, y: positionY}, img, SCALE_OPTIONS) => {
    ctxZoom.imageSmoothingEnabled = false;
    ctxZoom.drawImage(
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

  return (
    <div>
      <Canvas
        ref={zoomCanvasRef}
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
      <Canvas
        ref={backgroundCanvasRef}
        id="bg-layer"
        width={1080}
        height={916}
      />
    </div>
  )
};

export default App;
