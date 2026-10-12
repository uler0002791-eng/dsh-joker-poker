// Background swirl (WebGL, rendered at low resolution and upscaled for the pixel look) and synthesized
// sound effects (WebAudio). Both degrade to nothing when the browser lacks the API.
const JokerPokerFx = (() => {
  const { useEffect, useRef } = React;
  const h = React.createElement;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `precision mediump float;
uniform vec2 res;uniform float time;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;
void main(){
  vec2 uv=gl_FragCoord.xy/res;
  vec2 p=(uv-.5)*vec2(res.x/res.y,1.)*2.2;
  float t=time*.22;
  float r=length(p);
  float a=atan(p.y,p.x)+.6*sin(t*.7)+(1.7-r)*1.3;
  p=vec2(cos(a),sin(a))*r;
  for(int i=0;i<6;i++){
    float f=float(i)+1.;
    p+=vec2(sin(p.y*1.4+t*1.1+f*1.3),cos(p.x*1.3-t*.9+f*.7))*(.5/sqrt(f));
  }
  float v=sin(p.x*1.6+p.y*1.2);
  float w=sin(length(p)*2.3-t*1.5);
  vec3 col=mix(c2,c1,smoothstep(-.12,.12,v));
  col=mix(col,c3,smoothstep(.5,.62,w)*smoothstep(-.3,.3,v));
  col=mix(col,c2*.8,(1.-smoothstep(0.,.07,abs(v)))*.35);
  gl_FragColor=vec4(col,1.);
}`;

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  /** Full-bleed animated swirl; `colors` are three hex strings and fade over ~0.8s when they change. */
  function Swirl({ colors, paused }) {
    const canvasRef = useRef(null);
    const target = useRef(colors.map(hexToRgb));
    const pausedRef = useRef(paused);
    target.current = colors.map(hexToRgb);
    pausedRef.current = paused;

    useEffect(() => {
      const canvas = canvasRef.current;
      let gl = null;
      try {
        gl = canvas && canvas.getContext && canvas.getContext('webgl', { antialias: false, alpha: false });
      } catch {
        gl = null;
      }
      if (!gl) return undefined;
      const compile = (type, src) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
      };
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = (name) => gl.getUniformLocation(program, name);
      const uRes = u('res'), uTime = u('time'), uC = [u('c1'), u('c2'), u('c3')];
      const current = target.current.map((c) => c.slice());
      let frame = 0;
      let last = 0;
      const start = performance.now();
      const loop = (now) => {
        frame = requestAnimationFrame(loop);
        if (pausedRef.current || document.hidden || now - last < 33) return;
        last = now;
        const w = Math.max(1, Math.round(canvas.clientWidth / 4));
        const hh = Math.max(1, Math.round(canvas.clientHeight / 4));
        if (canvas.width !== w || canvas.height !== hh) {
          canvas.width = w;
          canvas.height = hh;
          gl.viewport(0, 0, w, hh);
        }
        for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) current[i][k] += (target.current[i][k] - current[i][k]) * 0.08;
        gl.uniform2f(uRes, w, hh);
        gl.uniform1f(uTime, (now - start) / 1000);
        current.forEach((c, i) => gl.uniform3f(uC[i], c[0], c[1], c[2]));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      frame = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(frame);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      };
    }, []);

    return h('canvas', {
      ref: canvasRef,
      className: 'jkp-swirl',
      style: { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` },
      'aria-hidden': true,
    });
  }

  // ---- Sound ----------------------------------------------------------------
  let audio = null;
  let volume = 0.5;

  function ctx(force) {
    if (volume <= 0 && !force) return null;
    try {
      if (!audio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audio = new AC();
      }
      if (audio.state === 'suspended') audio.resume();
      return audio;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type = 'square', gain = 0.08, delay = 0, slide = 0) {
    const ac = ctx();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * volume, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain = 0.05, freq = 1800) {
    const ac = ctx();
    if (!ac) return;
    const length = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = gain * volume;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start();
  }

  const semis = (base, n) => base * Math.pow(2, n / 12);

  const sfx = {
    setVolume(v) { volume = v; },
    hover() { tone(1400, 0.025, 'triangle', 0.025); },
    select() { tone(740, 0.05, 'square', 0.05); tone(1110, 0.04, 'triangle', 0.03, 0.02); },
    deselect() { tone(520, 0.05, 'square', 0.045); },
    button() { tone(320, 0.06, 'square', 0.05); noise(0.03, 0.03, 2400); },
    card() { noise(0.07, 0.06, 2200); },
    chips(i) { tone(semis(440, Math.min(i, 24)), 0.09, 'triangle', 0.09); tone(semis(880, Math.min(i, 24)), 0.05, 'sine', 0.03, 0.01); },
    mult(i) { tone(semis(330, Math.min(i, 24)), 0.11, 'sawtooth', 0.05); },
    xmult() { tone(220, 0.16, 'sawtooth', 0.07, 0, 220); tone(440, 0.12, 'square', 0.04, 0.05); },
    debuff() { tone(160, 0.14, 'square', 0.05, 0, -60); },
    money() { tone(988, 0.07, 'square', 0.05); tone(1319, 0.12, 'square', 0.05, 0.07); },
    total() { [0, 4, 7, 12].forEach((n, i) => tone(semis(523, n), 0.12, 'triangle', 0.07, i * 0.05)); },
    win() { [0, 4, 7, 12, 16].forEach((n, i) => tone(semis(523, n), 0.18, 'square', 0.05, i * 0.08)); },
    lose() { [7, 3, 0, -5].forEach((n, i) => tone(semis(330, n), 0.25, 'triangle', 0.08, i * 0.16)); },
    shuffle() { for (let i = 0; i < 5; i++) setTimeout(() => noise(0.05, 0.04, 2600), i * 45); },
  };

  // ---- Music ----------------------------------------------------------------------------
  // A looping four-bar groove synthesised on the fly: pad chords, walking bass, arpeggio and soft drums.
  // `mode` swaps the progression and filter: main play, the shop, and a darker Boss Blind version.
  const PROGRESSIONS = {
    main: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]],
    shop: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]],
    boss: [[57, 60, 63, 67], [56, 60, 63, 66], [53, 56, 60, 63], [55, 58, 62, 65]],
  };
  const BPM = { main: 96, shop: 92, boss: 100 };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const music = (() => {
    let timer = null;
    let master = null;
    let filter = null;
    let step = 0;
    let next = 0;
    let mode = 'main';
    let level = 0.35;

    function voice(ac, freq, at, dur, type, gain, dest, attack = 0.01) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g).connect(dest);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    }

    function hat(ac, at, gain) {
      const length = Math.floor(ac.sampleRate * 0.04);
      const buffer = ac.createBuffer(1, length, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6000;
      const g = ac.createGain();
      g.gain.value = gain;
      src.connect(hp).connect(g).connect(master);
      src.start(at);
    }

    function kick(ac, at) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.frequency.setValueAtTime(120, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      g.gain.setValueAtTime(0.5, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + 0.25);
    }

    function schedule(ac, at, sixteenth) {
      const bar = Math.floor(step / 16) % 4;
      const beat = step % 16;
      const chord = PROGRESSIONS[mode][bar];
      if (beat === 0) for (const note of chord) voice(ac, mtof(note), at, sixteenth * 16, 'sawtooth', 0.025, filter, 0.35);
      if ([0, 6, 8, 14].includes(beat)) voice(ac, mtof(chord[0] - 24 + (beat === 14 ? 7 : 0)), at, sixteenth * 2.2, 'triangle', 0.22, master);
      if ([0, 3, 6, 10, 12].includes(beat) && mode !== 'shop') voice(ac, mtof(chord[(beat / 3) % 4 | 0] + 12), at, sixteenth * 1.6, 'sine', 0.05, master);
      if (mode === 'shop' && beat % 4 === 2) voice(ac, mtof(chord[(beat / 4) % 4 | 0] + 12), at, sixteenth * 3, 'sine', 0.05, master);
      if (beat % 2 === 0) hat(ac, at, beat % 4 === 2 ? 0.05 : 0.025);
      if (beat === 0 || beat === 8 || (mode === 'boss' && beat === 11)) kick(ac, at);
    }

    function tick() {
      if (!audio || !master) return;
      const sixteenth = 60 / BPM[mode] / 4;
      while (next < audio.currentTime + 0.25) {
        schedule(audio, next, sixteenth);
        next += sixteenth;
        step += 1;
      }
    }

    return {
      /** Start (or keep) playing; needs a user gesture before the browser allows sound. */
      start() {
        if (timer || level <= 0) return;
        const ac = ctx(true);
        if (!ac) return;
        master = ac.createGain();
        master.gain.value = level * 0.6;
        filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = mode === 'boss' ? 900 : 1600;
        filter.connect(master);
        master.connect(ac.destination);
        next = ac.currentTime + 0.1;
        step = 0;
        timer = setInterval(tick, 60);
      },
      stop() {
        if (timer) clearInterval(timer);
        timer = null;
        if (master) {
          try { master.gain.setTargetAtTime(0.0001, audio.currentTime, 0.2); } catch { /* closed */ }
          const old = master;
          setTimeout(() => old.disconnect(), 800);
        }
        master = null;
      },
      setMode(next2) {
        if (!PROGRESSIONS[next2] || next2 === mode) return;
        mode = next2;
        if (filter && audio) filter.frequency.setTargetAtTime(mode === 'boss' ? 900 : 1600, audio.currentTime, 0.5);
      },
      setVolume(v) {
        level = v;
        if (master && audio) master.gain.setTargetAtTime(v * 0.6, audio.currentTime, 0.1);
        if (v <= 0) this.stop();
      },
      get playing() { return Boolean(timer); },
    };
  })();

  return { Swirl, sfx, music };
})();
