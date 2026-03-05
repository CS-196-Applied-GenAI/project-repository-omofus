import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [targetColor, setTargetColor] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [capturedImage, setCapturedImage] = useState(null);
  const [score, setScore] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(6);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const timezoneOffset = -(new Date().getTimezoneOffset() / 60);

  useEffect(() => {
    fetchTargetColor();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraAvailable(true);
    }
  }, []);

  async function fetchTargetColor() {
    try {
      const res = await fetch(`${API_BASE}/target?timezone_offset=${timezoneOffset}`);
      const data = await res.json();
      setTargetColor(data.data);
      setPhase('hunt');
    } catch (e) {
      setError("Could not load today's color. Is the server running?");
      setPhase('hunt');
    }
  }

async function startCamera() {
  // On web, skip camera and go straight to file picker
  fileInputRef.current?.click();
}

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedImage({ blob, url });
      stopCamera();
      setPhase('preview');
    }, 'image/jpeg', 0.92);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImage({ blob: file, url });
    setPhase('preview');
    e.target.value = '';
  }

  function retake() {
    setCapturedImage(null);
    setScore(null);
    setError(null);
    if (cameraAvailable) {
      startCamera();
    } else {
      setPhase('hunt');
    }
  }

  async function analyzeImage() {
    if (!capturedImage) return;
    setAnalyzing(true);
    setError(null);

    try {
      let userId = localStorage.getItem('colorhunt_user_id');
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('colorhunt_user_id', userId);
      }

      const formData = new FormData();
      formData.append('image', capturedImage.blob, 'photo.jpg');
      formData.append('user_id', userId);
      formData.append('timezone_offset', timezoneOffset.toString());

      const res = await fetch(`${API_BASE}/analysis`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed');
      } else {
        setScore(data.data.score);
        setAttemptsRemaining(data.data.attemptsRemaining ?? attemptsRemaining);
        setPhase('result');
      }
    } catch (e) {
      setError('Could not analyze image. Try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setCapturedImage(null);
    setScore(null);
    setError(null);
    setPhase('hunt');
  }

  const colorStyle = targetColor
    ? { backgroundColor: `rgb(${targetColor.rgb.r}, ${targetColor.rgb.g}, ${targetColor.rgb.b})` }
    : { backgroundColor: '#e5e5e5' };

  const scoreLabel = score === null ? null
    : score > 800 ? 'Perfect match'
    : score > 400 ? 'Great find'
    : score > 100 ? 'Good eye'
    : 'Keep hunting';

  return (
    <div className="app">
      <header className="header">
        <span className="logo">colorhunt</span>
        <span className="attempts">
          {attemptsRemaining}
          <span className="attempts-label"> left today</span>
        </span>
      </header>

      <main className="main">

        {phase === 'loading' && (
          <div className="center-content">
            <div className="spinner" />
          </div>
        )}

        {phase === 'hunt' && (
          <div className="hunt-view">
            <div className="color-reveal">
              <div className="color-swatch" style={colorStyle} />
              <div className="color-info">
                <p className="color-label">today's color</p>
                {targetColor && (
                  <p className="color-rgb">
                    {targetColor.rgb.r} · {targetColor.rgb.g} · {targetColor.rgb.b}
                  </p>
                )}
              </div>
            </div>

            <div className="instructions">
              <p>Find something in the world that matches this color.</p>
              <p>Photograph it. Score points for accuracy.</p>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="actions">
              {cameraAvailable ? (
                <button className="btn-primary" onClick={startCamera}>
                  Take a photo
                </button>
              ) : (
                <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                  Upload a photo
                </button>
              )}
              {cameraAvailable && (
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  Upload image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {phase === 'camera' && (
          <div className="camera-view">
            <div className="viewfinder">
              <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
              <div className="color-pill" style={colorStyle} />
              <div className="crosshair" />
            </div>
            <div className="camera-actions">
              <button className="btn-ghost" onClick={() => { stopCamera(); setPhase('hunt'); }}>
                Cancel
              </button>
              <button className="shutter" onClick={capturePhoto} />
            </div>
          </div>
        )}

        {phase === 'preview' && capturedImage && (
          <div className="preview-view">
            <div className="preview-frame">
              <img src={capturedImage.url} alt="Your capture" className="preview-img" />
              <div className="color-pill" style={colorStyle} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions">
              <button className="btn-primary" onClick={analyzeImage} disabled={analyzing}>
                {analyzing ? 'Analyzing…' : 'Submit'}
              </button>
              <button className="btn-ghost" onClick={retake}>Retake</button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="result-view">
            <div className="result-image-wrap">
              <img src={capturedImage?.url} alt="Your find" className="result-img" />
              <div className="score-overlay">
                <span className="score-number">{Math.round(score)}</span>
                <span className="score-pts">pts</span>
              </div>
            </div>
            <div className="result-info">
              <p className="score-label-text">{scoreLabel}</p>
              <p className="attempts-note">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining today
              </p>
            </div>
            <div className="actions">
              {attemptsRemaining > 0 && (
                <button className="btn-primary" onClick={reset}>Hunt again</button>
              )}
              <button className="btn-secondary">See the feed</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;