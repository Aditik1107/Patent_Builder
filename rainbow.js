const fs = require('fs');

// --- Update styles.css ---
let css = fs.readFileSync('public/styles.css', 'utf8');

const oldGlowCssMain = `/* Colorful 3D Glow Background */
.glow-background {
  position: absolute;
  top: 50%;
  right: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle at 50% 50%, rgba(66, 133, 244, 0.4), rgba(234, 67, 53, 0.3), rgba(251, 188, 5, 0.2), rgba(52, 168, 83, 0.1), transparent 70%);
  filter: blur(80px);
  transform: translateY(-50%);
  z-index: 0;
  pointer-events: none;
  animation: pulseGlow 10s infinite alternate;
}

@keyframes pulseGlow {
  0% { transform: translateY(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateY(-50%) scale(1.2); opacity: 1; }
}`;

const newGlowCssMain = `/* Colorful 3D Glow Background */
.glow-background {
  position: absolute;
  top: 50%;
  right: 0%;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: conic-gradient(
    #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
  );
  filter: blur(120px);
  z-index: 0;
  pointer-events: none;
  animation: spinGlow 12s linear infinite;
  opacity: 0.45;
}

@keyframes spinGlow {
  0% { transform: translateY(-50%) rotate(0deg) scale(1); }
  50% { transform: translateY(-50%) rotate(180deg) scale(1.1); }
  100% { transform: translateY(-50%) rotate(360deg) scale(1); }
}`;

css = css.replace(oldGlowCssMain, newGlowCssMain);
fs.writeFileSync('public/styles.css', css);

// --- Update login.html ---
let html = fs.readFileSync('public/login.html', 'utf8');

const newLoginStyle = `<style>
    body { 
      display: flex; justify-content: center; align-items: center; 
      min-height: 100vh; background: #000000; margin: 0;
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e3e3e3;
      overflow: hidden;
      position: relative;
    }
    .glow-background {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      background: conic-gradient(
        #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
      );
      filter: blur(100px);
      z-index: 0;
      pointer-events: none;
      animation: spinGlowLogin 12s linear infinite;
      opacity: 0.45;
    }
    @keyframes spinGlowLogin {
      0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
      100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
    }
    .auth-wrapper {
      width: 100%; max-width: 420px; padding: 20px;
      position: relative;
      z-index: 1;
    }
    .auth-container { 
      background: rgba(30, 31, 32, 0.65); padding: 40px; border-radius: 12px; 
      backdrop-filter: blur(25px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.8); 
      border-top: 5px solid #a8c7fa;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .auth-container h2 { margin-top: 0; color: #e3e3e3; font-size: 1.8em; margin-bottom: 25px; text-shadow: 0 0 10px rgba(255,255,255,0.2); }
    .auth-container input { 
      width: 100%; padding: 14px; margin-bottom: 20px; 
      border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; 
      box-sizing: border-box; font-size: 16px; transition: all 0.3s ease;
      background: rgba(0,0,0,0.4); color: #e3e3e3;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    }
    .auth-container input:focus {
      border-color: #a8c7fa; outline: none;
      background: rgba(0,0,0,0.6);
      box-shadow: 0 0 0 3px rgba(168, 199, 250, 0.15), inset 0 2px 4px rgba(0,0,0,0.3);
    }
    .auth-container button { 
      width: 100%; padding: 14px; font-size: 16px; font-weight: 600;
      background: linear-gradient(135deg, #a8c7fa, #8ab4f8); color: #000; border: none;
      border-radius: 6px; cursor: pointer; transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(168, 199, 250, 0.3);
    }
    .auth-container button:hover { 
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(168, 199, 250, 0.5);
      background: linear-gradient(135deg, #b9d3fb, #9bc0f9);
    }
    .auth-container button:disabled { background: #3c4043; cursor: not-allowed; box-shadow: none; transform: none; color: #777;}
    .auth-switch { margin-top: 25px; font-size: 0.95em; color: #a8a8a8; }
    .auth-switch a { color: #a8c7fa; cursor: pointer; text-decoration: none; font-weight: 600; transition: color 0.3s ease; }
    .auth-switch a:hover { text-decoration: underline; color: #fff; }
    .error { color: #ff8a8a; background: rgba(255, 138, 138, 0.1); padding: 10px; border-radius: 4px; font-size: 0.9em; display: none; margin-bottom: 15px; border: 1px solid rgba(255, 138, 138, 0.3); }
    .error.active { display: block; }
    .brand-subtitle { font-size: 0.9em; color: #a8a8a8; margin-top: -20px; margin-bottom: 25px; }
  </style>`;

html = html.replace(/<style>[\s\S]*?<\/style>/, newLoginStyle);
fs.writeFileSync('public/login.html', html);

console.log('Rainbow glow applied!');
