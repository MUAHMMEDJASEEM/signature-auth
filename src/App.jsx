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
  const [distanceDifferences, setDistanceDifferences] = useState([]);
  const [timeDifferences, setTimeDifferences] = useState([]);
  const [relativeDistanceDifference, setRelativeDistanceDifference] = useState(0);
  const [relativeTimeDifference, setRelativeTimeDifference] = useState(0);

  const startTime = useRef(null);
  const lastPoint = useRef(null);
  const totalDistance = useRef(0);
  const isDrawing = useRef(false);

  const drawGrid = () => {
    const canvas = sigCanvas.current.getCanvas();
    const ctx = canvas.getContext("2d");
    const gridSize = 50;
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.5;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawGrid();
  }, []);

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

  const normalizeMedianDistances = (medians) => {
    const total = medians.reduce((sum, val) => sum + val, 0);
    if (total === 0) return medians;
    return medians.map(val => (val / total) * 10000);
  };

  const handleSave = () => {
    if (strokeTimes.length > 0) {
      const updatedTimes = [...savedStrokeTimes, strokeTimes].slice(-5);
      const updatedDistances = [...savedStrokeDistances, strokeDistances].slice(-5);
      setSavedStrokeTimes(updatedTimes);
      setSavedStrokeDistances(updatedDistances);

      if (updatedTimes.length === 5) {
        const medianTimes = updatedTimes[0].map((_, i) => calculateMedian(updatedTimes.map(stroke => stroke[i])));
        let medianDistances = updatedDistances[0].map((_, i) => calculateMedian(updatedDistances.map(stroke => stroke[i])));

        // Normalize the median distances
        medianDistances = normalizeMedianDistances(medianDistances);

        setMedianStrokeTimes(medianTimes);
        setMedianStrokeDistances(medianDistances);
      }
    }
  };

  const handleCalculate = () => {
    if (medianStrokeDistances.length) {
      const totalMedianDistance = medianStrokeDistances.reduce((sum, val) => sum + val, 0);
      if (totalMedianDistance === 0) return;

      // Normalize new stroke distances
      const totalNewDistance = strokeDistances.reduce((sum, val) => sum + val, 0);
      const normalizedStrokeDistances = strokeDistances.map(val => (val / totalNewDistance) * 10000);

      const distanceDiffs = normalizedStrokeDistances.map((dist, i) =>
        Math.abs(dist - medianStrokeDistances[i]).toFixed(2)
      );

      setDistanceDifferences(distanceDiffs);

      const totalDistanceDifference = distanceDiffs.reduce((sum, val) => sum + parseFloat(val), 0);

      setRelativeDistanceDifference(((totalDistanceDifference / 10000) * 100).toFixed(2));

      // Calculate Relative Time Difference
      if (medianStrokeTimes.length > 0) {
        const timeDiffs = strokeTimes.map((time, i) =>
          Math.abs(time - medianStrokeTimes[i]).toFixed(2)
        );

        setTimeDifferences(timeDiffs);

        const totalTimeDiff = timeDiffs.reduce((sum, val) => sum + parseFloat(val), 0);
        const totalMedianTime = medianStrokeTimes.reduce((sum, val) => sum + val, 0);

        setRelativeTimeDifference(((totalTimeDiff / totalMedianTime) * 100).toFixed(2));
      }
    }
  };

  const handleClear = () => {
    sigCanvas.current.clear();
    drawGrid();
    setStrokeTimes([]);
    setStrokeDistances([]);
    setDistanceDifferences([]);
    setTimeDifferences([]);
    setRelativeDistanceDifference(0);
    setRelativeTimeDifference(0);
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
        <h3>Normanized Median Stroke Distances: {medianStrokeDistances.join(", ")} </h3>
        <h3>Relative Distance Difference: {relativeDistanceDifference}%</h3>
        <h3>Relative Time Difference: {relativeTimeDifference}%</h3>
        {relativeDistanceDifference !== 0 && relativeTimeDifference !== 0 && (
          <>
            {relativeDistanceDifference < 10 && relativeTimeDifference < 10 ? (
              <h2 style={{ color: "green" }}>✅ Accepted</h2>
            ) : (
              <h2 style={{ color: "red" }}>❌ Rejected</h2>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
