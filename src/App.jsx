import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = () => {
  const sigCanvas = useRef(null);
  const [blackPixelCount, setBlackPixelCount] = useState(0);
  const [drawingTime, setDrawingTime] = useState(0);
  const [drawingDistance, setDrawingDistance] = useState(0);
  const [intervals, setIntervals] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const startTime = useRef(null);
  const points = useRef([]);
  const totalDistance = useRef(0);
  
  const handleBegin = () => {
    startTime.current = performance.now();
    points.current = [];
    totalDistance.current = 0;
  };

  const handleMove = (e) => {
    if (e.buttons !== 1) return;
    const canvas = sigCanvas.current.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (points.current.length > 0) {
      const lastPoint = points.current[points.current.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalDistance.current += distance;
    }
    
    points.current.push({ x, y, time: performance.now() - startTime.current });
  };

  const handleEnd = () => {
    const endTime = performance.now();
    setDrawingTime((endTime - startTime.current).toFixed(2));
    setDrawingDistance(totalDistance.current.toFixed(2));
    
    if (points.current.length > 0) {
      const totalDist = totalDistance.current;
      let coveredDist = 0;
      const timeIntervals = [];
      const absTimestamps = [];
      let nextThreshold = totalDist * 0.05;
      let lastTime = 0;
      
      for (let i = 1; i < points.current.length; i++) {
        const dx = points.current[i].x - points.current[i - 1].x;
        const dy = points.current[i].y - points.current[i - 1].y;
        coveredDist += Math.sqrt(dx * dx + dy * dy);
        
        if (coveredDist >= nextThreshold) {
          const timeDiff = points.current[i].time - lastTime;
          timeIntervals.push(timeDiff.toFixed(2));
          absTimestamps.push(points.current[i].time.toFixed(2));
          lastTime = points.current[i].time;
          nextThreshold += totalDist * 0.05;
        }
      }
      
      setIntervals(timeIntervals);
      setTimestamps(absTimestamps);
    }
    
    const canvas = sigCanvas.current.getCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] !== 0) {
        count++;
      }
    }
    setBlackPixelCount(count);
  };

  const handleClear = () => {
    sigCanvas.current.clear();
    setBlackPixelCount(0);
    setDrawingTime(0);
    setDrawingDistance(0);
    setIntervals([]);
    setTimestamps([]);
    points.current = [];
    totalDistance.current = 0;
  };

  useEffect(() => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas();
      const ctx = canvas.getContext('2d');
      ctx.globalAlpha = 1; // Full opacity for ball pen effect
      ctx.lineCap = 'round'; // Rounded edges for smooth ball pen strokes
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'black'; // Solid black color for ball pen effect
      ctx.lineWidth = 2; // Medium thickness for realistic ball pen effect
      canvas.addEventListener('pointermove', handleMove);
      return () => canvas.removeEventListener('pointermove', handleMove);
    }
  }, []);

  return (
    <div>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{ width: 500, height: 200, className: 'sigCanvas', style: { backgroundColor: 'white' } }}
        onBegin={handleBegin}
        onEnd={handleEnd}
      />
      <div>
        <button onClick={handleClear}>Clear</button>
      </div>
      <div>
        <h3>Black Pixels Count: {blackPixelCount}</h3>
        <h3>Total Drawing Time: {drawingTime} ms</h3>
        <h3>Total Drawing Distance: {drawingDistance} px</h3>
        <h3>Time Intervals Between Each 5%: {intervals.join(', ')} ms</h3>
        <h3>Absolute Timestamps at Each 5%: {timestamps.join(', ')} ms</h3>
      </div>
    </div>
  );
};

export default SignaturePad;
