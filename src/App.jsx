import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = () => {
  const sigCanvas = useRef(null);
  const [strokeTimes, setStrokeTimes] = useState([]);
  const [strokeDistances, setStrokeDistances] = useState([]);
  const [savedStrokeTimes, setSavedStrokeTimes] = useState([]);
  const [savedStrokeDistances, setSavedStrokeDistances] = useState([]);
  const [medianStrokeTimes, setMedianStrokeTimes] = useState([]);
  const [medianStrokeDistances, setMedianStrokeDistances] = useState([]);
  const [timeDifferences, setTimeDifferences] = useState([]);
  const [distanceDifferences, setDistanceDifferences] = useState([]);

  const startTime = useRef(null);
  const lastPoint = useRef(null);
  const totalDistance = useRef(0);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = sigCanvas.current.getCanvas();

    const handleMove = (e) => {
      if (!isDrawing.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      
      if (lastPoint.current) {
        const segmentDist = Math.sqrt(
          Math.pow(x - lastPoint.current.x, 2) + Math.pow(y - lastPoint.current.y, 2)
        );
        totalDistance.current += segmentDist;
      }
      lastPoint.current = { x, y };
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("touchmove", handleMove);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("touchmove", handleMove);
    };
  }, []);

  const handleBegin = () => {
    startTime.current = performance.now();
    lastPoint.current = null;
    totalDistance.current = 0;
    isDrawing.current = true;
  };

  const handleEnd = () => {
    const endTime = performance.now();
    const strokeTime = parseFloat((endTime - startTime.current).toFixed(2));
    const strokeDistance = parseFloat(totalDistance.current.toFixed(2));
    
    setStrokeTimes((prev) => [...prev, strokeTime]);
    setStrokeDistances((prev) => [...prev, strokeDistance]);
    
    isDrawing.current = false;
  };

  const calculateMedian = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const handleSave = () => {
    if (strokeTimes.length > 0) {
      const updatedTimes = [...savedStrokeTimes, strokeTimes].slice(-5);
      const updatedDistances = [...savedStrokeDistances, strokeDistances].slice(-5);
      setSavedStrokeTimes(updatedTimes);
      setSavedStrokeDistances(updatedDistances);
      
      if (updatedTimes.length === 5) {
        const medianTimes = updatedTimes[0].map((_, i) => calculateMedian(updatedTimes.map(stroke => stroke[i])));
        const medianDistances = updatedDistances[0].map((_, i) => calculateMedian(updatedDistances.map(stroke => stroke[i])));
        setMedianStrokeTimes(medianTimes);
        setMedianStrokeDistances(medianDistances);
      }
    }
  };

  const handleCalculate = () => {
    if (medianStrokeTimes.length && medianStrokeDistances.length) {
      const timeDiffs = strokeTimes.map((time, i) => Math.abs(time - medianStrokeTimes[i]).toFixed(2));
      const distanceDiffs = strokeDistances.map((dist, i) => Math.abs(dist - medianStrokeDistances[i]).toFixed(2));
      setTimeDifferences(timeDiffs);
      setDistanceDifferences(distanceDiffs);
    }
  };

  const handleClear = () => {
    sigCanvas.current.clear();
    setStrokeTimes([]);
    setStrokeDistances([]);
    setTimeDifferences([]);
    setDistanceDifferences([]);
  };

  return (
    <div>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{ width: 800, height: 400, className: "sigCanvas", style: { backgroundColor: "white" } }}
        onBegin={handleBegin}
        onEnd={handleEnd}
      />
      <div>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCalculate}>Compare</button>
      </div>
      <div>
        <h3>Stroke Times: {strokeTimes.join(", ")} ms</h3>
        <h3>Stroke Distances: {strokeDistances.join(", ")} px</h3>
        <h3>Saved Stroke Times: {JSON.stringify(savedStrokeTimes)}</h3>
        <h3>Saved Stroke Distances: {JSON.stringify(savedStrokeDistances)}</h3>
        <h3>Median Stroke Times: {medianStrokeTimes.join(", ")} ms</h3>
        <h3>Median Stroke Distances: {medianStrokeDistances.join(", ")} px</h3>
        <h3>Time Differences: {timeDifferences.join(", ")} ms</h3>
        <h3>Distance Differences: {distanceDifferences.join(", ")} px</h3>
      </div>
    </div>
  );
};

export default SignaturePad;
