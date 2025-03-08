import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = () => {
  const sigCanvas = useRef(null);
  const [strokeTimes, setStrokeTimes] = useState([]);
  const [strokeDistances, setStrokeDistances] = useState([]);
  const [savedStrokeTimes, setSavedStrokeTimes] = useState([]);
  const [savedStrokeDistances, setSavedStrokeDistances] = useState([]);
  const [timeDifference, setTimeDifference] = useState(0);
  const [distanceDifference, setDistanceDifference] = useState(0);

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
    const strokeTime = (endTime - startTime.current).toFixed(2);
    setStrokeTimes((prev) => [...prev, strokeTime]);
    setStrokeDistances((prev) => [...prev, totalDistance.current.toFixed(2)]);
    isDrawing.current = false;
  };

  const handleSave = () => {
    setSavedStrokeTimes([...strokeTimes]);
    setSavedStrokeDistances([...strokeDistances]);
  };

  const handleCalculate = () => {
    if (savedStrokeTimes.length === strokeTimes.length && savedStrokeDistances.length === strokeDistances.length) {
      let timeDiffSum = 0;
      let distanceDiffSum = 0;
      
      for (let i = 0; i < savedStrokeTimes.length; i++) {
        timeDiffSum += Math.abs(parseFloat(savedStrokeTimes[i]) - parseFloat(strokeTimes[i]));
        distanceDiffSum += Math.abs(parseFloat(savedStrokeDistances[i]) - parseFloat(strokeDistances[i]));
      }
      
      setTimeDifference(timeDiffSum.toFixed(2));
      setDistanceDifference(distanceDiffSum.toFixed(2));
    }
  };

  const handleClear = () => {
    sigCanvas.current.clear();
    setStrokeTimes([]);
    setStrokeDistances([]);
    setTimeDifference(0);
    setDistanceDifference(0);
  };

  return (
    <div>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="white"
        canvasProps={{ width: 800, height: 400, className: "sigCanvas", style: { backgroundColor: "white" } }}
        onBegin={handleBegin}
        onEnd={handleEnd}
      />
      <div>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCalculate}>Calculate</button>
      </div>
      <div>
        <h3>Stroke Times: {strokeTimes.join(", ")} ms</h3>
        <h3>Stroke Distances: {strokeDistances.join(", ")} px</h3>
        <h3>Saved Stroke Times: {savedStrokeTimes.join(", ")} ms</h3>
        <h3>Saved Stroke Distances: {savedStrokeDistances.join(", ")} px</h3>
        <h3>Time Difference: {timeDifference} ms</h3>
        <h3>Distance Difference: {distanceDifference} px</h3>
      </div>
    </div>
  );
};

export default SignaturePad;
