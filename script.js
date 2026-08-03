document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 18);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "Close" : "Menu";
  });

  mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "Menu";
  }));

  initSiteLoader();

  const preview = document.querySelector(".work-preview");
  document.querySelectorAll(".work-row[data-art]").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      preview.className = `work-preview visible`;
      preview.firstElementChild.className = `project-art ${row.dataset.art}`;
    });
    row.addEventListener("mouseleave", () => preview.classList.remove("visible"));
    row.addEventListener("mousemove", (event) => {
      preview.style.left = `${event.clientX}px`;
      preview.style.top = `${event.clientY}px`;
    });
  });

  const form = document.querySelector("[data-contact-form]");
  const requestedPackage = new URLSearchParams(window.location.search).get("package");
  if (form && requestedPackage) {
    const packageBudgets = { foundation: "INR 15,000", signature: "INR 39,999", worldbuild: "INR 46,999", custom: "Custom pricing", "free-sample": "Free — sample homepage" };
    const budget = form.querySelector("[name='budget']");
    if (packageBudgets[requestedPackage]) budget.value = packageBudgets[requestedPackage];
  }
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    const submitButton = form.querySelector("button[type='submit']");
    let valid = true;
    form.querySelectorAll("[required]").forEach((field) => {
      const error = field.parentElement.querySelector(".field-error");
      const missing = !field.value.trim();
      field.setAttribute("aria-invalid", String(missing));
      error.textContent = missing ? "Please complete this field." : "";
      valid = valid && !missing;
    });
    const email = form.querySelector("[type='email']");
    if (email.value && !email.validity.valid) {
      email.setAttribute("aria-invalid", "true");
      email.parentElement.querySelector(".field-error").textContent = "Enter a valid email address.";
      valid = false;
    }
    if (!valid) return;

    const data = new FormData(form);
    const company = String(data.get("company") || "").trim();
    const payload = {
      userName: String(data.get("name") || "").trim(),
      userEmail: String(data.get("email") || "").trim(),
      userChoices: [
        ...(company ? [{ company }] : []),
        { budget: String(data.get("budget") || "").trim() }
      ],
      userAnswers: [String(data.get("message") || "").trim()],
      website: String(data.get("website") || ""),
      submissionId: typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    };
    status.textContent = "Sending your project brief...";
    submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { Accept: "application/json", "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Form submission failed");

      form.reset();
      status.textContent = "Brief sent. Please check your email for confirmation.";
    } catch (error) {
      status.textContent = "Could not send automatically. Email us at contact@theweblo.com.";
    } finally {
      submitButton.disabled = false;
    }
  });

  initCurtainWebGL();
  initExperience();
  initAmbientWebGL();
  initProjectStages();
  initCursorSurfaces();
});

function initCursorSurfaces() {
  if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("[data-cursor-surface]").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
      surface.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
    }, { passive: true });
  });
}

function signalCurtainReady() {
  if (document.documentElement.classList.contains("curtain-ready")) return;
  document.documentElement.classList.add("curtain-ready");
  window.dispatchEvent(new Event("weblo:curtain-ready"));
}

function initSiteLoader() {
  const loader = document.querySelector("[data-site-loader]");
  if (!loader) return;
  if (document.documentElement.classList.contains("loader-bypassed")) {
    loader.remove();
    return;
  }

  const canvas = loader.querySelector("[data-loader-grid]");
  const context = canvas?.getContext("2d");
  const glow = loader.querySelector("[data-loader-glow]");
  const count = loader.querySelector("[data-loader-count]");
  const startedAt = performance.now();
  const minimumDuration = 5000;
  const maximumDuration = 12000;
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = { ...pointer };
  let curtainReady = document.documentElement.classList.contains("curtain-ready");
  let frame;
  let finished = false;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let ratio = 1;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    if (!canvas || !context) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const movePointer = (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
  };

  const bendPoint = (x, y) => {
    const deltaX = x - pointer.x;
    const deltaY = y - pointer.y;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    const radius = Math.min(240, Math.max(150, width * .14));
    const influence = Math.exp(-distanceSquared / (radius * radius));
    const distance = Math.sqrt(distanceSquared) || 1;
    const force = influence * 30;
    return [x + deltaX / distance * force, y + deltaY / distance * force];
  };

  const drawGrid = () => {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const spacing = width < 700 ? 34 : 46;
    const step = 14;
    context.lineWidth = 1;
    context.strokeStyle = "rgba(216, 200, 168, 0.105)";

    for (let x = -spacing; x <= width + spacing; x += spacing) {
      context.beginPath();
      for (let y = -step; y <= height + step; y += step) {
        const [pointX, pointY] = bendPoint(x, y);
        if (y === -step) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.stroke();
    }
    for (let y = -spacing; y <= height + spacing; y += spacing) {
      context.beginPath();
      for (let x = -step; x <= width + step; x += step) {
        const [pointX, pointY] = bendPoint(x, y);
        if (x === -step) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.stroke();
    }
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.add("exiting");
    try {
      sessionStorage.setItem("weblo-loader-seen", "true");
    } catch (error) {
      // The loader can still finish when storage is unavailable.
    }
    window.removeEventListener("pointermove", movePointer);
    window.removeEventListener("resize", resize);
    window.removeEventListener("weblo:curtain-ready", markReady);
    window.setTimeout(() => {
      document.documentElement.classList.remove("loader-pending");
      document.documentElement.classList.add("loader-bypassed");
      loader.remove();
      cancelAnimationFrame(frame);
    }, 1400);
  };

  const markReady = () => {
    curtainReady = true;
    if (performance.now() - startedAt >= minimumDuration) finish();
  };

  const render = (time) => {
    pointer.x += (target.x - pointer.x) * .12;
    pointer.y += (target.y - pointer.y) * .12;
    drawGrid();
    if (glow) glow.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
    const elapsed = time - startedAt;
    const progress = Math.min(100, elapsed / minimumDuration * 100);
    loader.style.setProperty("--loader-progress", progress.toFixed(2));
    if (count) count.textContent = String(Math.floor(progress)).padStart(2, "0");
    if ((elapsed >= minimumDuration && curtainReady) || elapsed >= maximumDuration) finish();
    if (!finished) frame = requestAnimationFrame(render);
  };

  resize();
  window.addEventListener("pointermove", movePointer, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("weblo:curtain-ready", markReady, { once: true });
  frame = requestAnimationFrame(render);
}

function initExperience() {
  const enterButton = document.querySelector("[data-enter-experience]");
  const world = document.querySelector("[data-experience-world]");
  if (!enterButton || !world) return;

  enterButton.addEventListener("click", () => {
    if (!window.THREE || world.classList.contains("active")) return;
    const fullscreenTarget = document.documentElement;
    const fullscreenRequest = fullscreenTarget.requestFullscreen?.() || fullscreenTarget.webkitRequestFullscreen?.();
    if (fullscreenRequest?.catch) fullscreenRequest.catch(() => {});
    enterButton.disabled = true;
    document.body.classList.add("experience-active");
    world.classList.add("active");
    window.scrollTo({ top: 0, behavior: "auto" });
    const audio = createExperienceAudio(world);
    requestAnimationFrame(() => initExperienceWorld(world, audio));
  });
}

function createExperienceAudio(world) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return { playSplash() {} };

  const context = new AudioContext();
  context.resume();
  const master = context.createGain();
  master.gain.value = .13;
  master.connect(context.destination);

  const ambience = context.createGain();
  ambience.gain.value = .42;
  const lowPass = context.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 1550;
  lowPass.Q.value = .7;
  const delay = context.createDelay(3);
  delay.delayTime.value = .72;
  const feedback = context.createGain();
  feedback.gain.value = .31;
  delay.connect(feedback);
  feedback.connect(delay);
  ambience.connect(lowPass);
  lowPass.connect(master);
  lowPass.connect(delay);
  delay.connect(master);

  [110, 164.81, 220, 329.63].forEach((frequency, index) => {
    const voice = context.createOscillator();
    const voiceGain = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    voice.type = index < 2 ? "sine" : "triangle";
    voice.frequency.value = frequency;
    voice.detune.value = index % 2 ? 7 : -5;
    voiceGain.gain.value = index < 2 ? .055 : .022;
    lfo.frequency.value = .035 + index * .018;
    lfoGain.gain.value = index < 2 ? .018 : .009;
    lfo.connect(lfoGain);
    lfoGain.connect(voiceGain.gain);
    voice.connect(voiceGain);
    voiceGain.connect(ambience);
    voice.start();
    lfo.start();
  });

  const airBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const airData = airBuffer.getChannelData(0);
  let lastSample = 0;
  for (let index = 0; index < airData.length; index += 1) {
    lastSample = lastSample * .985 + (Math.random() * 2 - 1) * .015;
    airData[index] = lastSample;
  }
  const air = context.createBufferSource();
  const airFilter = context.createBiquadFilter();
  const airGain = context.createGain();
  air.buffer = airBuffer;
  air.loop = true;
  airFilter.type = "bandpass";
  airFilter.frequency.value = 820;
  airFilter.Q.value = .45;
  airGain.gain.value = .12;
  air.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(ambience);
  air.start();

  let muted = false;
  const toggle = world.querySelector("[data-experience-audio]");
  toggle?.addEventListener("click", () => {
    muted = !muted;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : .13, context.currentTime + .25);
    toggle.textContent = muted ? "Sound / Off" : "Sound / On";
  });

  const playSplash = () => {
    if (muted) return;
    const now = context.currentTime;
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 1.6, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      const decay = Math.pow(1 - index / noiseData.length, 2.4);
      noiseData[index] = (Math.random() * 2 - 1) * decay;
    }
    const noise = context.createBufferSource();
    const splashFilter = context.createBiquadFilter();
    const splashGain = context.createGain();
    noise.buffer = noiseBuffer;
    splashFilter.type = "bandpass";
    splashFilter.frequency.setValueAtTime(1900, now);
    splashFilter.frequency.exponentialRampToValueAtTime(420, now + 1.2);
    splashFilter.Q.value = .65;
    splashGain.gain.setValueAtTime(.72, now);
    splashGain.gain.exponentialRampToValueAtTime(.001, now + 1.5);
    noise.connect(splashFilter);
    splashFilter.connect(splashGain);
    splashGain.connect(master);
    noise.start(now);

    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(155, now);
    body.frequency.exponentialRampToValueAtTime(48, now + .55);
    bodyGain.gain.setValueAtTime(.38, now);
    bodyGain.gain.exponentialRampToValueAtTime(.001, now + .7);
    body.connect(bodyGain);
    bodyGain.connect(master);
    body.start(now);
    body.stop(now + .72);

    for (let index = 0; index < 7; index += 1) {
      const drop = context.createOscillator();
      const dropGain = context.createGain();
      const start = now + .04 + Math.random() * .32;
      drop.type = "sine";
      drop.frequency.setValueAtTime(900 + Math.random() * 1700, start);
      drop.frequency.exponentialRampToValueAtTime(280 + Math.random() * 240, start + .12);
      dropGain.gain.setValueAtTime(.045 + Math.random() * .045, start);
      dropGain.gain.exponentialRampToValueAtTime(.001, start + .16);
      drop.connect(dropGain);
      dropGain.connect(master);
      drop.start(start);
      drop.stop(start + .18);
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) context.suspend();
    else if (!muted) context.resume();
  });

  return { playSplash };
}

function initExperienceWorld(world, audio) {
  const canvas = world.querySelector(".experience-canvas");
  const depthLabel = world.querySelector(".experience-depth");
  const compactDevice = window.matchMedia("(max-width: 760px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020817);
  scene.fog = new THREE.FogExp2(0x061329, .026);

  const camera = new THREE.PerspectiveCamera(compactDevice ? 48 : 39, 1, .1, 100);
  camera.position.set(0, .15, compactDevice ? 16.5 : 17.5);
  camera.lookAt(0, -.4, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !compactDevice, powerPreference: "high-performance" });
  } catch (error) {
    world.classList.add("splash-complete");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice ? 1.1 : 1.6));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const reflectionFaces = [
    ["#45dcff", "#063e91"], ["#07112b", "#ff5b21"],
    ["#80ecff", "#1e73ff"], ["#020716", "#6d2dff"],
    ["#5de7e2", "#087fc7"], ["#10052b", "#d72d9c"]
  ].map(([start, end]) => {
    const face = document.createElement("canvas");
    face.width = 128;
    face.height = 128;
    const context = face.getContext("2d");
    const gradient = context.createRadialGradient(38, 28, 4, 64, 64, 96);
    gradient.addColorStop(0, start);
    gradient.addColorStop(.3, "#7df4ff");
    gradient.addColorStop(.46, "#2459bd");
    gradient.addColorStop(1, end);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return face;
  });
  const environment = new THREE.CubeTexture(reflectionFaces);
  environment.needsUpdate = true;
  scene.environment = environment;

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = 256;
  normalCanvas.height = 256;
  const normalContext = normalCanvas.getContext("2d");
  const normalImage = normalContext.createImageData(256, 256);
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const waveX = Math.cos(x * .11 + y * .035) * .11 + Math.cos((x - y) * .047) * .055;
      const waveY = Math.cos(y * .14 - x * .028) * .14 - Math.cos((x + y) * .052) * .052;
      const normalX = -waveX * 2.4;
      const normalY = -waveY * 2.4;
      const normalLength = Math.hypot(normalX, normalY, 1);
      const offset = (y * 256 + x) * 4;
      normalImage.data[offset] = (normalX / normalLength * .5 + .5) * 255;
      normalImage.data[offset + 1] = (normalY / normalLength * .5 + .5) * 255;
      normalImage.data[offset + 2] = 1 / normalLength * 255;
      normalImage.data[offset + 3] = 255;
    }
  }
  normalContext.putImageData(normalImage, 0, 0);
  const spiralNormalMap = new THREE.CanvasTexture(normalCanvas);
  spiralNormalMap.wrapS = THREE.RepeatWrapping;
  spiralNormalMap.wrapT = THREE.RepeatWrapping;
  spiralNormalMap.repeat.set(3, 18);
  spiralNormalMap.needsUpdate = true;
  const dropletNormalMap = spiralNormalMap.clone();
  dropletNormalMap.repeat.set(2.2, 3.2);
  dropletNormalMap.needsUpdate = true;

  scene.add(new THREE.HemisphereLight(0x4edfff, 0x16072e, 1.55));
  const keyLight = new THREE.DirectionalLight(0x73dfff, 2.45);
  keyLight.position.set(4, 7, 8);
  const orangeLight = new THREE.PointLight(0xff7a3d, 3.2, 18);
  orangeLight.position.set(-3, 0, 4);
  const blueLight = new THREE.PointLight(0x3f8cff, 3.4, 20);
  blueLight.position.set(3, -2, 5);
  const forestLight = new THREE.PointLight(0x39ff88, 2.3, 18);
  forestLight.position.set(-7, -1, 3);
  const magentaLight = new THREE.PointLight(0xff36a8, 1.8, 18);
  magentaLight.position.set(7, 2, 2);
  scene.add(keyLight, orangeLight, blueLight, forestLight, magentaLight);

  const spiralPoints = [];
  const spiralSteps = compactDevice ? 150 : 260;
  for (let index = 0; index <= spiralSteps; index += 1) {
    const progress = index / spiralSteps;
    const angle = progress * Math.PI * 14 - Math.PI / 2;
    const topRadius = compactDevice ? 2.75 : 3.85;
    const bottomRadius = compactDevice ? .48 : .62;
    const radius = bottomRadius + (topRadius - bottomRadius) * Math.pow(1 - progress, .7);
    const organicWobble = Math.sin(progress * Math.PI * 7) * .12 * (1 - progress);
    spiralPoints.push(new THREE.Vector3(Math.cos(angle) * (radius + organicWobble), 5.8 - progress * 11.6, Math.sin(angle) * (radius - organicWobble)));
  }
  const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
  const spiralGeometry = new THREE.TubeGeometry(spiralCurve, compactDevice ? 180 : 320, compactDevice ? .11 : .16, compactDevice ? 7 : 10, false);
  const spiralBasePositions = new Float32Array(spiralGeometry.attributes.position.array);
  const spiralWaterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x159ee8,
    envMap: environment,
    envMapIntensity: 2.7,
    metalness: 0,
    roughness: .018,
    transmission: .98,
    thickness: 2.1,
    ior: 1.333,
    clearcoat: 1,
    clearcoatRoughness: .018,
    normalMap: spiralNormalMap,
    normalScale: new THREE.Vector2(.34, .34),
    attenuationColor: new THREE.Color(0x0378d4),
    attenuationDistance: 2.8,
    transparent: true,
    opacity: .91,
    side: THREE.DoubleSide
  });
  spiralWaterMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.waterTime = { value: 0 };
    shader.vertexShader = `uniform float waterTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed += normal * (sin(position.y * 5.0 + waterTime * 2.2) + sin(position.x * 7.0 - waterTime * 1.6)) * 0.012;"
    );
    spiralWaterMaterial.userData.shader = shader;
  };
  const spiral = new THREE.Mesh(spiralGeometry, spiralWaterMaterial);
  scene.add(spiral);

  const vortexTendrils = new THREE.Group();
  const tendrilStart = spiralPoints[0];
  const tendrilCount = compactDevice ? 2 : 4;
  for (let index = 0; index < tendrilCount; index += 1) {
    const side = index % 2 ? 1 : -1;
    const spread = (compactDevice ? 2.4 : 3.7) + index * .35;
    const points = [
      tendrilStart.clone(),
      new THREE.Vector3(side * spread * .45, 6.05 + index * .1, tendrilStart.z * .7),
      new THREE.Vector3(side * spread, 6.45 + index * .12, -.5 + index * .22),
      new THREE.Vector3(side * spread * 1.1, 6.8 + index * .08, .7 + index * .16)
    ];
    const tendril = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), compactDevice ? 22 : 34, compactDevice ? .045 : .07, 7, false),
      spiralWaterMaterial
    );
    vortexTendrils.add(tendril);
  }
  scene.add(vortexTendrils);

  const waterFilmMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      shallowColor: { value: new THREE.Color(0x21f0e5) },
      deepColor: { value: new THREE.Color(0x0747c9) }
    },
    vertexShader: `
      uniform float time;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        float ripple = sin(position.y * 6.0 - time * 2.8 + position.x * 3.5) * 0.012;
        ripple += sin(position.z * 9.0 + time * 1.9) * 0.008;
        vec3 displaced = position + normal * (0.018 + ripple);
        vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 shallowColor;
      uniform vec3 deepColor;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDirection), 0.0), 2.7);
        float causticA = sin(vWorldPosition.y * 13.0 - time * 5.2 + vWorldPosition.x * 4.0);
        float causticB = sin(vWorldPosition.y * 8.0 - time * 3.4 - vWorldPosition.z * 7.0);
        float caustic = smoothstep(1.15, 1.78, causticA + causticB);
        vec3 color = mix(deepColor, shallowColor, fresnel * 0.8 + caustic * 0.35);
        float alpha = 0.035 + fresnel * 0.31 + caustic * 0.12;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const waterFilm = new THREE.Mesh(spiralGeometry, waterFilmMaterial);
  waterFilm.renderOrder = 2;
  spiral.add(waterFilm);

  const echoSpiral = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(spiralPoints.filter((_, index) => index % 2 === 0)),
    new THREE.LineBasicMaterial({ color: 0x32e8ff, transparent: true, opacity: .34, blending: THREE.AdditiveBlending })
  );
  echoSpiral.scale.setScalar(1.025);
  scene.add(echoSpiral);

  const flowCount = compactDevice ? 90 : 180;
  const flowPositions = new Float32Array(flowCount * 3);
  const flowSeeds = Array.from({ length: flowCount }, () => ({ offset: Math.random(), radius: .03 + Math.random() * .13, phase: Math.random() * Math.PI * 2 }));
  const flowGeometry = new THREE.BufferGeometry();
  flowGeometry.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
  const flow = new THREE.Points(flowGeometry, new THREE.PointsMaterial({ color: 0x48f3e5, size: compactDevice ? .055 : .072, transparent: true, opacity: .92, blending: THREE.AdditiveBlending, depthWrite: false }));
  spiral.add(flow);

  const bubbleCount = compactDevice ? 38 : 85;
  const bubblePositions = new Float32Array(bubbleCount * 3);
  const bubbleSeeds = Array.from({ length: bubbleCount }, (_, index) => ({
    x: (Math.random() - .5) * (compactDevice ? 4.2 : 5.8),
    y: -5.8 + Math.random() * 11.6,
    z: (Math.random() - .5) * 3.2,
    speed: .08 + Math.random() * .18,
    phase: Math.random() * Math.PI * 2,
    index
  }));
  const bubbleGeometry = new THREE.BufferGeometry();
  bubbleGeometry.setAttribute("position", new THREE.BufferAttribute(bubblePositions, 3));
  const bubbles = new THREE.Points(
    bubbleGeometry,
    new THREE.PointsMaterial({ color: 0x37d8ff, size: compactDevice ? .035 : .052, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(bubbles);

  const dropletProfile = [
    [0, -1.06], [.42, -1.01], [.72, -.74], [.82, -.25], [.78, .18], [.62, .57], [.4, .92], [.19, 1.27], [0, 1.66]
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x27b9f5,
    envMap: environment,
    envMapIntensity: 2.1,
    metalness: 0,
    roughness: .035,
    transmission: 1,
    thickness: 1.8,
    ior: 1.333,
    clearcoat: 1,
    clearcoatRoughness: .025,
    normalMap: dropletNormalMap,
    normalScale: new THREE.Vector2(.2, .2),
    attenuationColor: new THREE.Color(0x087ce5),
    attenuationDistance: 1.8,
    transparent: true,
    opacity: .96
  });
  const dropletGeometry = new THREE.LatheGeometry(dropletProfile, compactDevice ? 36 : 64);
  const droplet = new THREE.Mesh(dropletGeometry, waterMaterial);
  droplet.scale.setScalar(compactDevice ? .48 : .58);
  droplet.position.y = 5.45;
  scene.add(droplet);

  const dropletRim = new THREE.Mesh(dropletGeometry, new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 3.1);
        vec3 rimColor = mix(vec3(0.08, 0.72, 1.0), vec3(0.25, 1.0, 0.82), rim);
        gl_FragColor = vec4(rimColor, rim * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  }));
  dropletRim.scale.setScalar(1.012);
  droplet.add(dropletRim);

  const innerBubbleCount = compactDevice ? 48 : 110;
  const innerBubblePositions = new Float32Array(innerBubbleCount * 3);
  for (let index = 0; index < innerBubbleCount; index += 1) {
    const y = -1 + Math.random() * 2.25;
    const width = .68 * Math.sqrt(Math.max(0, 1 - Math.pow((y + .08) / 1.3, 2)));
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * width * .72;
    innerBubblePositions[index * 3] = Math.cos(angle) * radius;
    innerBubblePositions[index * 3 + 1] = y;
    innerBubblePositions[index * 3 + 2] = Math.sin(angle) * radius;
  }
  const innerBubbles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(innerBubblePositions, 3)),
    new THREE.PointsMaterial({ color: 0x75eaff, size: compactDevice ? .014 : .021, transparent: true, opacity: .78, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  droplet.add(innerBubbles);

  const satelliteGeometry = new THREE.SphereGeometry(1, compactDevice ? 18 : 28, compactDevice ? 12 : 20);
  const satellites = [
    { offset: 1.75, scale: .14, x: -.08 },
    { offset: -1.55, scale: .11, x: .06 },
    { offset: 2.65, scale: .075, x: .1 }
  ].map((settings) => {
    const material = waterMaterial.clone();
    material.opacity = 0;
    const satellite = new THREE.Mesh(satelliteGeometry, material);
    satellite.userData = settings;
    scene.add(satellite);
    return satellite;
  });

  const impact = new THREE.Mesh(
    new THREE.CircleGeometry(compactDevice ? 2.4 : 3.4, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x053d73, envMap: environment, envMapIntensity: 2.35, metalness: .05, roughness: .025, transmission: .72, thickness: .5, ior: 1.333, clearcoat: 1, transparent: true, opacity: .76, side: THREE.DoubleSide })
  );
  impact.position.set(0, -5.9, 0);
  impact.rotation.x = -Math.PI / 2;
  scene.add(impact);

  const rings = Array.from({ length: 3 }, (_, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.92, 1, 64),
      new THREE.MeshBasicMaterial({ color: index === 1 ? 0xff5b21 : 0x20d9ff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.position.set(0, -5.82 + index * .008, 0);
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(.1);
    scene.add(ring);
    return ring;
  });

  const crownMaterial = waterMaterial.clone();
  crownMaterial.transmission = .72;
  crownMaterial.opacity = 0;
  crownMaterial.side = THREE.DoubleSide;
  const splashCrown = new THREE.Group();
  const crownCount = compactDevice ? 9 : 16;
  for (let index = 0; index < crownCount; index += 1) {
    const angle = index / crownCount * Math.PI * 2 + (Math.random() - .5) * .16;
    const radius = (compactDevice ? 1.65 : 2.35) * (.78 + Math.random() * .34);
    const height = (compactDevice ? 1.1 : 1.65) * (.72 + Math.random() * .42);
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const points = [
      new THREE.Vector3(0, 0, 0),
      direction.clone().multiplyScalar(radius * .25).setY(height * .72),
      direction.clone().multiplyScalar(radius * .58).setY(height),
      direction.clone().multiplyScalar(radius).setY(height * .22)
    ];
    const sheet = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), compactDevice ? 16 : 24, compactDevice ? .035 : .05, 6, false), crownMaterial);
    splashCrown.add(sheet);
  }
  splashCrown.position.y = -5.76;
  splashCrown.scale.setScalar(.05);
  scene.add(splashCrown);

  const splashCount = compactDevice ? 44 : 90;
  const splashPositions = new Float32Array(splashCount * 3);
  const splashSeeds = Array.from({ length: splashCount }, (_, index) => ({
    angle: Math.random() * Math.PI * 2,
    distance: .7 + Math.random() * (compactDevice ? 2.6 : 4.1),
    lift: .3 + Math.random() * 1.7,
    delay: Math.random() * .24,
    z: (Math.random() - .5) * 1.2,
    index
  }));
  const splashGeometry = new THREE.BufferGeometry();
  splashGeometry.setAttribute("position", new THREE.BufferAttribute(splashPositions, 3));
  const splash = new THREE.Points(
    splashGeometry,
    new THREE.PointsMaterial({ color: 0x38cfff, size: compactDevice ? .075 : .095, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(splash);

  const flora = new THREE.Group();
  const floraClusters = [];
  const stemGeometry = new THREE.CylinderGeometry(.025, .045, 1, 6);
  const leafGeometry = new THREE.SphereGeometry(.13, 8, 6);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x176643, roughness: .82 });
  const leafMaterials = [0x22a85d, 0x62cf72, 0x147548].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .72, side: THREE.DoubleSide }));
  const floraCount = compactDevice ? 16 : 36;
  for (let index = 0; index < floraCount; index += 1) {
    const cluster = new THREE.Group();
    const height = .65 + Math.random() * 1.25;
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.scale.y = height;
    stem.position.y = height * .5;
    cluster.add(stem);
    for (let leafIndex = 0; leafIndex < 3; leafIndex += 1) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterials[(index + leafIndex) % leafMaterials.length]);
      const side = leafIndex % 2 ? 1 : -1;
      leaf.scale.set(.9, .32, .45);
      leaf.position.set(side * (.12 + leafIndex * .025), height * (.35 + leafIndex * .2), 0);
      leaf.rotation.z = side * (.55 + leafIndex * .12);
      cluster.add(leaf);
    }
    const side = index % 2 ? 1 : -1;
    cluster.position.set(side * (compactDevice ? 2.9 + Math.random() * .55 : 4.75 + Math.random() * 3.2), -5.7 + Math.random() * 10.6, -2.4 + Math.random() * 4.1);
    cluster.rotation.z = side * (-.08 + Math.random() * .16);
    cluster.userData = { phase: Math.random() * Math.PI * 2, baseRotation: cluster.rotation.z };
    flora.add(cluster);
    floraClusters.push(cluster);
  }
  scene.add(flora);

  const trees = new THREE.Group();
  const treeCrowns = [];
  const branchAxis = new THREE.Vector3(0, 1, 0);
  const branchGeometry = new THREE.CylinderGeometry(.045, .065, 1, compactDevice ? 6 : 8);
  const barkCanvas = document.createElement("canvas");
  barkCanvas.width = 128;
  barkCanvas.height = 256;
  const barkContext = barkCanvas.getContext("2d");
  const barkGradient = barkContext.createLinearGradient(0, 0, 128, 0);
  barkGradient.addColorStop(0, "#2e2119");
  barkGradient.addColorStop(.3, "#76503a");
  barkGradient.addColorStop(.58, "#422d22");
  barkGradient.addColorStop(1, "#231914");
  barkContext.fillStyle = barkGradient;
  barkContext.fillRect(0, 0, 128, 256);
  for (let index = 0; index < 190; index += 1) {
    const x = Math.random() * 128;
    const y = Math.random() * 256;
    barkContext.strokeStyle = `rgba(${Math.random() > .5 ? "18,12,8" : "180,128,82"},${.08 + Math.random() * .22})`;
    barkContext.lineWidth = .4 + Math.random() * 2.2;
    barkContext.beginPath();
    barkContext.moveTo(x, y);
    barkContext.bezierCurveTo(x + (Math.random() - .5) * 8, y + 18, x + (Math.random() - .5) * 7, y + 36, x + (Math.random() - .5) * 5, y + 58 + Math.random() * 42);
    barkContext.stroke();
  }
  const barkTexture = new THREE.CanvasTexture(barkCanvas);
  barkTexture.wrapS = THREE.RepeatWrapping;
  barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.repeat.set(2, 3.5);
  barkTexture.needsUpdate = true;
  const barkMaterials = [0xd88645, 0xad5b32, 0x7f3d26].map((color) => new THREE.MeshStandardMaterial({ color, map: barkTexture, bumpMap: barkTexture, bumpScale: .065, roughness: .96 }));

  const leafCanvas = document.createElement("canvas");
  leafCanvas.width = 128;
  leafCanvas.height = 128;
  const leafContext = leafCanvas.getContext("2d");
  const leafGradient = leafContext.createLinearGradient(20, 108, 108, 18);
  leafGradient.addColorStop(0, "#07562e");
  leafGradient.addColorStop(.52, "#2fbd5f");
  leafGradient.addColorStop(1, "#c1ea62");
  leafContext.fillStyle = leafGradient;
  leafContext.beginPath();
  leafContext.moveTo(17, 105);
  leafContext.bezierCurveTo(18, 42, 63, 10, 111, 16);
  leafContext.bezierCurveTo(112, 62, 78, 105, 17, 105);
  leafContext.fill();
  leafContext.strokeStyle = "rgba(222,240,170,.65)";
  leafContext.lineWidth = 2;
  leafContext.beginPath();
  leafContext.moveTo(19, 104);
  leafContext.lineTo(104, 21);
  leafContext.stroke();
  for (let index = 0; index < 5; index += 1) {
    leafContext.lineWidth = 1;
    leafContext.beginPath();
    leafContext.moveTo(38 + index * 12, 85 - index * 11);
    leafContext.lineTo(29 + index * 10, 57 - index * 5);
    leafContext.stroke();
  }
  const leafTexture = new THREE.CanvasTexture(leafCanvas);
  leafTexture.needsUpdate = true;
  const leafSpriteMaterials = [0x8bf273, 0x4fd668, 0x21a95b].map((color) => new THREE.SpriteMaterial({ map: leafTexture, color, transparent: true, alphaTest: .18, depthWrite: false }));
  const canopyGeometry = new THREE.IcosahedronGeometry(.5, compactDevice ? 0 : 1);
  const canopyMaterials = [0x0c6637, 0x138447, 0x20a956, 0x64bd4b].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .88, flatShading: true }));
  const rockGeometry = new THREE.DodecahedronGeometry(.18, 0);
  const rockMaterials = [0x4b5553, 0x66706a, 0x3a4542].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .98 }));

  const addBranch = (parent, start, end, radius, material) => {
    const direction = end.clone().sub(start);
    const length = direction.length();
    const branch = new THREE.Mesh(branchGeometry, material);
    branch.position.copy(start).add(end).multiplyScalar(.5);
    branch.quaternion.setFromUnitVectors(branchAxis, direction.normalize());
    branch.scale.set(radius / .055, length, radius / .055);
    parent.add(branch);
    return branch;
  };

  const treeCount = compactDevice ? 6 : 10;
  for (let index = 0; index < treeCount; index += 1) {
    const tree = new THREE.Group();
    const crown = new THREE.Group();
    const bark = barkMaterials[index % barkMaterials.length];
    const height = 1.8 + Math.random() * 1.4;
    const trunkTop = new THREE.Vector3((Math.random() - .5) * .14, height, 0);
    addBranch(tree, new THREE.Vector3(0, 0, 0), trunkTop, .11 + height * .016, bark);

    for (let rootIndex = 0; rootIndex < 4; rootIndex += 1) {
      const angle = rootIndex / 4 * Math.PI * 2 + index;
      addBranch(tree, new THREE.Vector3(0, .08, 0), new THREE.Vector3(Math.cos(angle) * .48, -.06, Math.sin(angle) * .48), .035, bark);
    }
    for (let rockIndex = 0; rockIndex < 3; rockIndex += 1) {
      const angle = rockIndex / 3 * Math.PI * 2 + index * .4;
      const rock = new THREE.Mesh(rockGeometry, rockMaterials[(index + rockIndex) % rockMaterials.length]);
      rock.position.set(Math.cos(angle) * (.34 + Math.random() * .18), .02, Math.sin(angle) * (.34 + Math.random() * .18));
      rock.scale.set(.8 + Math.random() * .7, .45 + Math.random() * .35, .7 + Math.random() * .8);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      tree.add(rock);
    }

    const branchCount = compactDevice ? 4 : 5;
    for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
      const angle = branchIndex / branchCount * Math.PI * 2 + index * .7;
      const startHeight = height * (.48 + branchIndex / branchCount * .34);
      const start = new THREE.Vector3(trunkTop.x * startHeight / height, startHeight, 0);
      const reach = .5 + Math.random() * .42;
      const end = new THREE.Vector3(Math.cos(angle) * reach, startHeight + .28 + Math.random() * .35, Math.sin(angle) * reach);
      addBranch(tree, start, end, .045 - branchIndex * .002, bark);

      for (let twigIndex = 0; twigIndex < 2; twigIndex += 1) {
        const twigAngle = angle + (twigIndex ? .42 : -.42);
        const twigEnd = end.clone().add(new THREE.Vector3(Math.cos(twigAngle) * .32, .22 + Math.random() * .16, Math.sin(twigAngle) * .32));
        addBranch(tree, end, twigEnd, .017, bark);
        for (let leafIndex = 0; leafIndex < (compactDevice ? 1 : 2); leafIndex += 1) {
          const leafMaterial = leafSpriteMaterials[(index + branchIndex + leafIndex) % leafSpriteMaterials.length].clone();
          leafMaterial.rotation = twigAngle + leafIndex * .7;
          const leaf = new THREE.Sprite(leafMaterial);
          leaf.position.copy(twigEnd).add(new THREE.Vector3((Math.random() - .5) * .26, (Math.random() - .5) * .24, (Math.random() - .5) * .22));
          const leafScale = .24 + Math.random() * .17;
          leaf.scale.set(leafScale * 1.35, leafScale, 1);
          crown.add(leaf);
        }
      }

      const foliage = new THREE.Mesh(canopyGeometry, canopyMaterials[(index + branchIndex) % canopyMaterials.length]);
      foliage.position.copy(end);
      foliage.scale.set(1.05 + Math.random() * .65, .28 + Math.random() * .34, .62 + Math.random() * .45);
      foliage.rotation.set(Math.random(), Math.random(), Math.random());
      crown.add(foliage);
    }

    for (let crownIndex = 0; crownIndex < 3; crownIndex += 1) {
      const foliage = new THREE.Mesh(canopyGeometry, canopyMaterials[(index + crownIndex + 1) % canopyMaterials.length]);
      foliage.position.set((Math.random() - .5) * .65, height + crownIndex * .16, (Math.random() - .5) * .55);
      const tierScale = 1.35 - crownIndex * .18;
      foliage.scale.set(tierScale + Math.random() * .25, .34 + Math.random() * .24, .78 + Math.random() * .28);
      foliage.rotation.set(Math.random(), Math.random(), Math.random());
      crown.add(foliage);
    }
    tree.add(crown);
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const rowCount = Math.ceil(treeCount / 2);
    const rowY = -5.8 + row * (10.2 / Math.max(1, rowCount - 1));
    tree.position.set(side * (compactDevice ? 3 + Math.random() * .45 : 5.25 + Math.random() * 2.8), rowY, -3 + Math.random() * 4.2);
    const treeScale = .72 + Math.random() * .42;
    tree.scale.setScalar(treeScale);
    tree.rotation.y = side * (.12 + Math.random() * .3);
    crown.userData = { phase: Math.random() * Math.PI * 2, baseX: crown.rotation.x, baseZ: crown.rotation.z };
    treeCrowns.push(crown);
    trees.add(tree);
  }
  scene.add(trees);

  const flowerCanvas = document.createElement("canvas");
  flowerCanvas.width = 128;
  flowerCanvas.height = 128;
  const flowerContext = flowerCanvas.getContext("2d");
  flowerContext.translate(64, 64);
  for (let petal = 0; petal < 5; petal += 1) {
    flowerContext.save();
    flowerContext.rotate(petal / 5 * Math.PI * 2);
    const petalGradient = flowerContext.createRadialGradient(0, -8, 3, 0, -26, 30);
    petalGradient.addColorStop(0, "#ffe1ed");
    petalGradient.addColorStop(.45, "#ff84b0");
    petalGradient.addColorStop(1, "rgba(192,38,103,0)");
    flowerContext.fillStyle = petalGradient;
    flowerContext.beginPath();
    flowerContext.ellipse(0, -25, 15, 28, 0, 0, Math.PI * 2);
    flowerContext.fill();
    flowerContext.restore();
  }
  flowerContext.fillStyle = "#ffd36b";
  flowerContext.beginPath();
  flowerContext.arc(0, 0, 8, 0, Math.PI * 2);
  flowerContext.fill();
  const flowerTexture = new THREE.CanvasTexture(flowerCanvas);
  flowerTexture.needsUpdate = true;
  const flowerMaterials = [0xffffff, 0xffd7e8, 0xf4bbff].map((color) => new THREE.SpriteMaterial({ map: flowerTexture, color, transparent: true, depthWrite: false, alphaTest: .08 }));

  const vines = new THREE.Group();
  const vineGroups = [];
  const vineCount = compactDevice ? 5 : 10;
  const vineMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x3c3227, map: barkTexture, bumpMap: barkTexture, bumpScale: .035, roughness: .94 }),
    new THREE.MeshStandardMaterial({ color: 0x4e6737, roughness: .86 })
  ];
  for (let index = 0; index < vineCount; index += 1) {
    const vine = new THREE.Group();
    const side = index % 2 ? 1 : -1;
    const phase = index * 1.37;
    const strands = [];
    for (let strandIndex = 0; strandIndex < 2; strandIndex += 1) {
      const strandPoints = [];
      for (let pointIndex = 0; pointIndex <= 18; pointIndex += 1) {
        const progress = pointIndex / 18;
        const y = -6.2 + progress * 12.8;
        const twist = progress * Math.PI * 5 + phase + strandIndex * Math.PI;
        strandPoints.push(new THREE.Vector3(Math.sin(twist) * (.16 + strandIndex * .035), y, Math.cos(twist) * (.13 + strandIndex * .04)));
      }
      const curve = new THREE.CatmullRomCurve3(strandPoints);
      const strand = new THREE.Mesh(new THREE.TubeGeometry(curve, compactDevice ? 70 : 110, strandIndex ? .024 : .036, 6, false), vineMaterials[strandIndex]);
      vine.add(strand);
      strands.push({ curve, points: strandPoints });
    }

    for (let leafIndex = 2; leafIndex < 18; leafIndex += 2) {
      const progress = leafIndex / 18;
      const point = strands[0].curve.getPointAt(progress);
      const leafMaterial = leafSpriteMaterials[(index + leafIndex) % leafSpriteMaterials.length].clone();
      leafMaterial.rotation = phase + leafIndex * .58;
      const leaf = new THREE.Sprite(leafMaterial);
      const leafSide = leafIndex % 4 ? 1 : -1;
      leaf.position.copy(point).add(new THREE.Vector3(leafSide * (.2 + Math.random() * .12), 0, (Math.random() - .5) * .15));
      const scale = .28 + Math.random() * .18;
      leaf.scale.set(scale * 1.4, scale, 1);
      vine.add(leaf);

      if (leafIndex % 6 === 0) {
        const flower = new THREE.Sprite(flowerMaterials[(index + leafIndex) % flowerMaterials.length].clone());
        flower.position.copy(point).add(new THREE.Vector3(-leafSide * .14, .18, .04));
        flower.scale.setScalar(.25 + Math.random() * .12);
        vine.add(flower);
      }
    }

    const curlStart = strands[0].curve.getPointAt(.52);
    const curlPoints = [];
    for (let curlIndex = 0; curlIndex <= 18; curlIndex += 1) {
      const curlProgress = curlIndex / 18;
      const angle = curlProgress * Math.PI * 3.5;
      curlPoints.push(curlStart.clone().add(new THREE.Vector3(Math.cos(angle) * (.28 - curlProgress * .18), curlProgress * .55, Math.sin(angle) * (.28 - curlProgress * .18))));
    }
    vine.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curlPoints), 28, .014, 5, false), vineMaterials[1]));

    vine.position.set(side * (compactDevice ? 3 + Math.random() * .4 : 5.05 + Math.random() * 3), 0, -2.5 + Math.random() * 4.4);
    vine.userData = { phase, baseX: vine.position.x, baseRotation: vine.rotation.z };
    vines.add(vine);
    vineGroups.push(vine);
  }
  scene.add(vines);

  const butterflies = [];
  const wingGeometry = new THREE.CircleGeometry(compactDevice ? .12 : .17, 12, 0, Math.PI);
  const butterflyColors = [0xff7a3d, 0xb8f5dc, 0xc6b7ff];
  const butterflyCount = compactDevice ? 6 : 14;
  for (let index = 0; index < butterflyCount; index += 1) {
    const butterfly = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: butterflyColors[index % butterflyColors.length], transparent: true, opacity: .76, side: THREE.DoubleSide });
    const leftWing = new THREE.Mesh(wingGeometry, material);
    const rightWing = new THREE.Mesh(wingGeometry, material);
    leftWing.position.x = -.11;
    rightWing.position.x = .11;
    rightWing.rotation.z = Math.PI;
    butterfly.add(leftWing, rightWing);
    const side = index % 2 ? 1 : -1;
    const base = new THREE.Vector3(side * (compactDevice ? 3 + Math.random() * .5 : 4.8 + Math.random() * 3.1), -4.8 + Math.random() * 9.6, -1.2 + Math.random() * 3.8);
    butterfly.position.copy(base);
    butterfly.userData = { base, phase: Math.random() * Math.PI * 2, leftWing, rightWing, speed: .55 + Math.random() * .55 };
    scene.add(butterfly);
    butterflies.push(butterfly);
  }

  const fireflyCount = compactDevice ? 70 : 160;
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  for (let index = 0; index < fireflyCount; index += 1) {
    const side = index % 2 ? 1 : -1;
    fireflyPositions[index * 3] = side * (compactDevice ? 2.9 + Math.random() * .6 : 4.45 + Math.random() * 3.8);
    fireflyPositions[index * 3 + 1] = -5.5 + Math.random() * 11;
    fireflyPositions[index * 3 + 2] = -2 + Math.random() * 4;
  }
  const fireflies = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3)),
    new THREE.PointsMaterial({ color: 0xffc37a, size: compactDevice ? .035 : .05, transparent: true, opacity: .68, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(fireflies);

  const pointer = { x: 0, y: 0 };
  const pointerNdc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const disruptionPoint = new THREE.Vector3(999, 999, 999);
  const flowPoint = new THREE.Vector3();
  const flowDisplacement = new THREE.Vector3();
  let disruptionStrength = 0;
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth - .5;
    pointer.y = event.clientY / window.innerHeight - .5;
    pointerNdc.set(pointer.x * 2, -pointer.y * 2);
    raycaster.setFromCamera(pointerNdc, camera);
    const hit = raycaster.intersectObject(spiral, false)[0];
    if (hit) {
      disruptionPoint.copy(hit.point);
      spiral.worldToLocal(disruptionPoint);
      disruptionStrength = 1;
    }
  }, { passive: true });

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let currentFall = 0;
  let splashSoundPlayed = false;
  let frame;
  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    const rect = world.getBoundingClientRect();
    const rawProgress = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    const targetFall = Math.pow(Math.min(rawProgress / .9, 1), 1.65);
    currentFall += (targetFall - currentFall) * (reducedMotion ? 1 : .075);
    const fallSpeed = Math.abs(targetFall - currentFall);
    const splashProgress = THREE.MathUtils.smoothstep(rawProgress, .875, .965);
    const satelliteVisibility = THREE.MathUtils.smoothstep(rawProgress, .48, .7) * (1 - THREE.MathUtils.smoothstep(rawProgress, .86, .93));
    if (!splashSoundPlayed && splashProgress > .06) {
      splashSoundPlayed = true;
      audio.playSplash();
    }

    droplet.position.y = THREE.MathUtils.lerp(5.45, -5.7, currentFall);
    droplet.position.x = Math.sin(elapsed * 1.8) * .045 * (1 - splashProgress);
    droplet.rotation.y = elapsed * .22;
    const baseScale = compactDevice ? .48 : .58;
    droplet.scale.set(baseScale * (1 - splashProgress * .72), baseScale * (1 + fallSpeed * 7 - splashProgress * .88), baseScale * (1 - splashProgress * .72));
    waterMaterial.opacity = .96 * (1 - splashProgress);
    dropletRim.visible = splashProgress < .97;
    innerBubbles.material.opacity = .72 * (1 - splashProgress);
    satellites.forEach((satellite, index) => {
      const settings = satellite.userData;
      satellite.position.set(droplet.position.x + settings.x + Math.sin(elapsed * 1.4 + index) * .025, droplet.position.y + settings.offset, droplet.position.z);
      const satelliteScale = settings.scale * (1 + Math.sin(elapsed * 2.1 + index) * .08);
      satellite.scale.setScalar(satelliteScale);
      satellite.material.opacity = satelliteVisibility * .86;
      satellite.visible = satelliteVisibility > .002;
    });
    splashCrown.scale.setScalar(.05 + splashProgress * .95);
    crownMaterial.opacity = splashProgress * .78;
    impact.material.opacity = .5 + splashProgress * .28;

    spiralNormalMap.offset.x = (elapsed * .018) % 1;
    spiralNormalMap.offset.y = (-elapsed * .075) % 1;
    dropletNormalMap.offset.x = Math.sin(elapsed * .22) * .08;
    dropletNormalMap.offset.y = (-elapsed * .028) % 1;
    if (spiralWaterMaterial.userData.shader) spiralWaterMaterial.userData.shader.uniforms.waterTime.value = elapsed;
    waterFilmMaterial.uniforms.time.value = elapsed;
    disruptionStrength *= reducedMotion ? 0 : .925;
    const spiralPositionAttribute = spiralGeometry.attributes.position;
    const spiralPositionArray = spiralPositionAttribute.array;
    for (let index = 0; index < spiralPositionArray.length; index += 3) {
      const baseX = spiralBasePositions[index];
      const baseY = spiralBasePositions[index + 1];
      const baseZ = spiralBasePositions[index + 2];
      const deltaX = baseX - disruptionPoint.x;
      const deltaY = baseY - disruptionPoint.y;
      const deltaZ = baseZ - disruptionPoint.z;
      const distance = Math.hypot(deltaX, deltaY, deltaZ);
      const influence = Math.max(0, 1 - distance / .92) * disruptionStrength;
      const inverseDistance = 1 / Math.max(distance, .08);
      const turbulence = Math.sin(index * .37 + elapsed * 8) * influence * .12;
      spiralPositionArray[index] = baseX + deltaX * inverseDistance * influence * .62 + turbulence;
      spiralPositionArray[index + 1] = baseY + deltaY * inverseDistance * influence * .34 + turbulence * .55;
      spiralPositionArray[index + 2] = baseZ + deltaZ * inverseDistance * influence * .62 - turbulence;
    }
    spiralPositionAttribute.needsUpdate = true;
    if (disruptionStrength > .001) spiralGeometry.computeVertexNormals();

    flowSeeds.forEach((seed, index) => {
      const progress = (seed.offset + elapsed * .065) % 1;
      const point = spiralCurve.getPointAt(progress, flowPoint);
      const currentAngle = progress * Math.PI * 24 + seed.phase;
      point.x += Math.cos(currentAngle) * seed.radius;
      point.z += Math.sin(currentAngle) * seed.radius;
      const distance = point.distanceTo(disruptionPoint);
      if (distance < 1.05 && disruptionStrength > .01) {
        flowDisplacement.copy(point).sub(disruptionPoint).normalize();
        point.addScaledVector(flowDisplacement, (1 - distance / 1.05) * disruptionStrength * .78);
      }
      flowPositions[index * 3] = point.x;
      flowPositions[index * 3 + 1] = point.y;
      flowPositions[index * 3 + 2] = point.z;
    });
    flowGeometry.attributes.position.needsUpdate = true;
    bubbleSeeds.forEach((seed) => {
      const y = ((seed.y + elapsed * seed.speed + 5.8) % 11.6) - 5.8;
      bubblePositions[seed.index * 3] = seed.x + Math.sin(elapsed * .55 + seed.phase) * .08;
      bubblePositions[seed.index * 3 + 1] = y;
      bubblePositions[seed.index * 3 + 2] = seed.z + Math.cos(elapsed * .43 + seed.phase) * .06;
    });
    bubbleGeometry.attributes.position.needsUpdate = true;

    spiral.rotation.y = elapsed * .16 + rawProgress * .8;
    vortexTendrils.rotation.y = spiral.rotation.y;
    vortexTendrils.rotation.z = Math.sin(elapsed * .45) * .018;
    echoSpiral.rotation.y = spiral.rotation.y * .78;
    echoSpiral.material.opacity = .2 + Math.sin(elapsed * 1.4) * .08;
    floraClusters.forEach((cluster) => {
      cluster.rotation.z = cluster.userData.baseRotation + Math.sin(elapsed * .7 + cluster.userData.phase) * .045;
    });
    treeCrowns.forEach((crown) => {
      crown.rotation.z = crown.userData.baseZ + Math.sin(elapsed * .42 + crown.userData.phase) * .026;
      crown.rotation.x = crown.userData.baseX + Math.cos(elapsed * .36 + crown.userData.phase) * .014;
    });
    vineGroups.forEach((vine) => {
      vine.rotation.z = vine.userData.baseRotation + Math.sin(elapsed * .32 + vine.userData.phase) * .024;
      vine.position.x = vine.userData.baseX + Math.sin(elapsed * .22 + vine.userData.phase) * .035;
    });
    butterflies.forEach((butterfly) => {
      const data = butterfly.userData;
      butterfly.position.x = data.base.x + Math.sin(elapsed * data.speed + data.phase) * .28;
      butterfly.position.y = data.base.y + Math.cos(elapsed * data.speed * .72 + data.phase) * .22;
      butterfly.rotation.z = Math.sin(elapsed * .55 + data.phase) * .16;
      const flap = Math.sin(elapsed * 8 * data.speed + data.phase) * .82;
      data.leftWing.rotation.y = flap;
      data.rightWing.rotation.y = -flap;
    });
    fireflies.rotation.y = Math.sin(elapsed * .08) * .08;
    fireflies.material.opacity = .5 + Math.sin(elapsed * 1.2) * .18;
    camera.position.x += (pointer.x * .45 - camera.position.x) * .025;
    camera.position.y = .15 + pointer.y * -.22;
    camera.lookAt(0, -.4, 0);

    rings.forEach((ring, index) => {
      const ringProgress = THREE.MathUtils.clamp((splashProgress - index * .11) / (1 - index * .11), 0, 1);
      ring.scale.setScalar(.1 + ringProgress * (compactDevice ? 2.8 : 4.3));
      ring.material.opacity = Math.sin(ringProgress * Math.PI) * .52;
    });

    splashSeeds.forEach((seed) => {
      const progress = THREE.MathUtils.clamp((splashProgress - seed.delay) / (1 - seed.delay), 0, 1);
      const radius = seed.distance * progress;
      splashPositions[seed.index * 3] = Math.cos(seed.angle) * radius;
      splashPositions[seed.index * 3 + 1] = -5.68 + Math.sin(seed.angle) * radius * .32 + Math.sin(progress * Math.PI) * seed.lift;
      splashPositions[seed.index * 3 + 2] = seed.z * progress;
    });
    splashGeometry.attributes.position.needsUpdate = true;
    splash.material.opacity = Math.sin(splashProgress * Math.PI) * .95;

    depthLabel.textContent = `Depth / ${String(Math.round(rawProgress * 999)).padStart(3, "0")}`;
    world.classList.toggle("splash-complete", rawProgress > .965);
    renderer.render(scene, camera);
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  render();
  if (reducedMotion) window.addEventListener("scroll", render, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!reducedMotion) render();
  });
}

function initProjectStages() {
  if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll("[data-tilt]").forEach((stage) => {
    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      stage.style.transform = `perspective(1100px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) scale(1.015)`;
    });
    stage.addEventListener("pointerleave", () => {
      stage.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
  });
}

function initWorkCubes() {
  const stages = [...document.querySelectorAll(".project-stage")];
  const dock = document.querySelector(".cube-dock");
  if (!stages.length || !dock || !window.THREE) return;

  const canvas = document.createElement("canvas");
  canvas.className = "work-cubes-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const compactDevice = window.matchMedia("(max-width: 760px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.z = 8;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (error) {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice ? 1.15 : 1.6));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.autoClear = false;

  scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x101426, 1.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 6, 7);
  const blueLight = new THREE.PointLight(0x235cff, 2.8, 14);
  blueLight.position.set(-4, 1, 4);
  const warmLight = new THREE.PointLight(0xff8b6f, 1.8, 12);
  warmLight.position.set(4, -2, 3);
  scene.add(keyLight, blueLight, warmLight);

  const reflectionFaces = [
    ["#f8fbff", "#235cff"], ["#141722", "#b8f5dc"],
    ["#ffffff", "#6d7898"], ["#080a10", "#ff6b4a"],
    ["#dff5ff", "#839dff"], ["#090b13", "#c6b7ff"]
  ].map(([start, end]) => {
    const face = document.createElement("canvas");
    face.width = 128;
    face.height = 128;
    const context = face.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 128, 128);
    gradient.addColorStop(0, start);
    gradient.addColorStop(.42, "#ffffff");
    gradient.addColorStop(.5, "#202534");
    gradient.addColorStop(1, end);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return face;
  });
  const environment = new THREE.CubeTexture(reflectionFaces);
  environment.needsUpdate = true;
  scene.environment = environment;

  const cubeSize = compactDevice ? .27 : .4;
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const edgeGeometry = new THREE.EdgesGeometry(cubeGeometry);
  const palette = [0x9aa8c7, 0xd8e4f2, 0x6d7f9f, 0xc8d0df, 0x7f91b2];
  const cubes = Array.from({ length: 9 }, (_, index) => {
    const cube = new THREE.Mesh(
      cubeGeometry,
      new THREE.MeshPhysicalMaterial({
        color: palette[index % palette.length],
        envMap: environment,
        envMapIntensity: 1.8,
        metalness: .92,
        roughness: .12,
        clearcoat: 1,
        clearcoatRoughness: .08
      })
    );
    cube.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xeaf4ff, transparent: true, opacity: .48 })));
    cube.userData.target = new THREE.Vector3();
    cube.userData.velocity = new THREE.Vector3();
    cube.userData.targetScale = 1;
    scene.add(cube);
    return cube;
  });

  const trailPositions = new Float32Array(cubes.length * 3);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: 0xc9e8ff, transparent: true, opacity: .28 }));
  scene.add(trail);

  const raycaster = new THREE.Raycaster();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointer = new THREE.Vector2();
  const pointerWorld = new THREE.Vector3();
  const dragOffset = new THREE.Vector3();
  const springDelta = new THREE.Vector3();
  let draggedCube = null;
  let currentClipRect = dock.getBoundingClientRect();
  let displayedStageIndex = 0;
  let transitionTimer = null;

  const screenToWorld = (screenX, screenY) => {
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;
    return new THREE.Vector3(
      (screenX / window.innerWidth - .5) * visibleWidth,
      -(screenY / window.innerHeight - .5) * visibleHeight,
      0
    );
  };

  const updateTargets = () => {
    const hero = document.querySelector(".work-hero");
    const heroRect = hero.getBoundingClientRect();
    const gridMode = heroRect.bottom > window.innerHeight * .18;

    if (gridMode) {
      canvas.style.opacity = "1";
      currentClipRect = dock.getBoundingClientRect();
      const centerX = currentClipRect.left + currentClipRect.width * .5;
      const centerY = currentClipRect.top + currentClipRect.height * .46;
      const spacing = Math.min(currentClipRect.width, currentClipRect.height) * .2;
      cubes.forEach((cube, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        cube.userData.target.copy(screenToWorld(centerX + (column - 1) * spacing, centerY + (row - 1) * spacing));
        cube.userData.target.z = (column + row) * -.08;
        cube.userData.targetScale = 1;
      });
      return;
    }

    const viewportCenter = window.innerHeight * .5;
    const candidate = stages.reduce((closest, stage, index) => {
      const rect = stage.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height * .5 - viewportCenter);
      return !closest || distance < closest.distance ? { index, rect, distance } : closest;
    }, null);

    if (candidate.index !== displayedStageIndex && !transitionTimer) {
      canvas.style.opacity = "0";
      transitionTimer = window.setTimeout(() => {
        displayedStageIndex = candidate.index;
        currentClipRect = stages[displayedStageIndex].getBoundingClientRect();
        canvas.style.opacity = "1";
        transitionTimer = null;
      }, 280);
    }

    const rect = stages[displayedStageIndex].getBoundingClientRect();
    currentClipRect = rect;
    canvas.style.opacity = !transitionTimer && rect.bottom > -100 && rect.top < window.innerHeight + 100 ? "1" : "0";
    const startX = rect.left + rect.width * .13;
    const endX = rect.right - rect.width * .13;
    const lineY = rect.top + rect.height * .72;
    cubes.forEach((cube, index) => {
      const progress = index / (cubes.length - 1);
      cube.userData.target.copy(screenToWorld(startX + (endX - startX) * progress, lineY));
      cube.userData.target.z = Math.sin(progress * Math.PI) * .18;
      cube.userData.targetScale = compactDevice ? .72 : .82;
    });
  };

  const updatePointer = (event) => {
    pointer.x = event.clientX / window.innerWidth * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  window.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    const hit = raycaster.intersectObjects(cubes, false)[0];
    if (!hit) return;
    draggedCube = hit.object;
    raycaster.ray.intersectPlane(dragPlane, pointerWorld);
    dragOffset.copy(draggedCube.position).sub(pointerWorld);
    draggedCube.userData.velocity.set(0, 0, 0);
    document.body.classList.add("cube-dragging");
    event.preventDefault();
  });

  window.addEventListener("pointermove", (event) => {
    updatePointer(event);
    if (!draggedCube) {
      const hit = raycaster.intersectObjects(cubes, false)[0];
      document.body.classList.toggle("cube-hover", Boolean(hit));
      return;
    }
    raycaster.ray.intersectPlane(dragPlane, pointerWorld);
    const next = pointerWorld.add(dragOffset);
    const topLeft = screenToWorld(currentClipRect.left + 18, currentClipRect.top + 18);
    const bottomRight = screenToWorld(currentClipRect.right - 18, currentClipRect.bottom - 18);
    draggedCube.position.x = THREE.MathUtils.clamp(next.x, topLeft.x, bottomRight.x);
    draggedCube.position.y = THREE.MathUtils.clamp(next.y, bottomRight.y, topLeft.y);
    event.preventDefault();
  }, { passive: false });

  const releaseCube = () => {
    if (!draggedCube) return;
    draggedCube = null;
    document.body.classList.remove("cube-dragging", "cube-hover");
  };
  window.addEventListener("pointerup", releaseCube);
  window.addEventListener("pointercancel", releaseCube);
  window.addEventListener("blur", releaseCube);

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    updateTargets();
    cubes.forEach((cube) => cube.position.copy(cube.userData.target));
  };
  resize();
  window.addEventListener("resize", resize);

  let frame;
  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    updateTargets();
    cubes.forEach((cube, index) => {
      if (cube !== draggedCube) {
        if (reducedMotion) {
          cube.position.copy(cube.userData.target);
        } else {
          springDelta.copy(cube.userData.target).sub(cube.position);
          cube.userData.velocity.addScaledVector(springDelta, .022);
          cube.userData.velocity.multiplyScalar(.84);
          cube.position.add(cube.userData.velocity);
        }
      }
      const scale = cube.scale.x + (cube.userData.targetScale - cube.scale.x) * .1;
      cube.scale.setScalar(scale);
      cube.rotation.x = elapsed * (.22 + index * .008) + index * .16;
      cube.rotation.y = elapsed * (.3 + index * .008) - index * .12;
      trailPositions[index * 3] = cube.position.x;
      trailPositions[index * 3 + 1] = cube.position.y;
      trailPositions[index * 3 + 2] = cube.position.z;
    });
    trailGeometry.attributes.position.needsUpdate = true;
    renderer.setScissorTest(false);
    renderer.clear();
    const clipLeft = Math.max(0, currentClipRect.left);
    const clipTop = Math.max(0, currentClipRect.top);
    const clipRight = Math.min(window.innerWidth, currentClipRect.right);
    const clipBottom = Math.min(window.innerHeight, currentClipRect.bottom);
    const clipWidth = Math.max(0, clipRight - clipLeft);
    const clipHeight = Math.max(0, clipBottom - clipTop);
    if (clipWidth && clipHeight) {
      renderer.setScissor(clipLeft, window.innerHeight - clipBottom, clipWidth, clipHeight);
      renderer.setScissorTest(true);
      renderer.render(scene, camera);
      renderer.setScissorTest(false);
    }
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  render();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!reducedMotion) render();
  });
}

function initAmbientWebGL() {
  if (!window.THREE || document.querySelector("[data-experience-world]")) return;

  const canvas = document.createElement("canvas");
  canvas.className = "ambient-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactDevice = window.matchMedia("(max-width: 760px)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.z = 9;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compactDevice, powerPreference: "low-power" });
  } catch (error) {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice ? 1.1 : 1.35));

  const pageName = location.pathname.split("/").pop() || "index.html";
  const pagePalettes = {
    "index.html": [0x4169d8, 0xd8c8a8, 0xc9784a],
    "work.html": [0xc9784a, 0x4169d8, 0xd8c8a8],
    "pricing.html": [0xd8c8a8, 0xaebbd2, 0x4169d8],
    "about.html": [0xaebbd2, 0xc9784a, 0xd8c8a8],
    "contact.html": [0xd89a63, 0xd8c8a8, 0x4169d8]
  };
  const palette = pagePalettes[pageName] || pagePalettes["index.html"];

  const sculpture = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 1),
    new THREE.MeshBasicMaterial({ color: palette[0], wireframe: true, transparent: true, opacity: .22 })
  );
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(.9, .2, 90, 10),
    new THREE.MeshBasicMaterial({ color: palette[1], wireframe: true, transparent: true, opacity: .17 })
  );
  sculpture.add(shell, knot);

  const draftingRings = new THREE.Group();
  [2.05, 2.55, 3.08].forEach((radius, index) => {
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, pointIndex) => {
        const angle = pointIndex / 96 * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      })),
      new THREE.LineBasicMaterial({ color: palette[index], transparent: true, opacity: .12 - index * .018 })
    );
    ring.rotation.set(index * .72 + .3, index * .55, index * .9);
    draftingRings.add(ring);
  });
  sculpture.add(draftingRings);

  const teamOrbit = new THREE.Group();
  const teamNodeGeometry = new THREE.SphereGeometry(compactDevice ? .11 : .14, 10, 8);
  const teamNodes = [palette[2], palette[1], 0xaebbd2, palette[0]].map((color) => {
    const node = new THREE.Mesh(teamNodeGeometry, new THREE.MeshBasicMaterial({ color }));
    teamOrbit.add(node);
    return node;
  });
  const orbitLinePositions = new Float32Array((teamNodes.length + 1) * 3);
  const orbitLineGeometry = new THREE.BufferGeometry();
  orbitLineGeometry.setAttribute("position", new THREE.BufferAttribute(orbitLinePositions, 3));
  const orbitLine = new THREE.Line(orbitLineGeometry, new THREE.LineBasicMaterial({ color: 0xf3f0e8, transparent: true, opacity: .14 }));
  teamOrbit.add(orbitLine);
  sculpture.add(teamOrbit);
  scene.add(sculpture);

  const shardField = new THREE.Group();
  const shardGeometry = new THREE.OctahedronGeometry(compactDevice ? .2 : .28, 0);
  const shardMaterials = palette.map((color, index) => new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: .1 + index * .025
  }));
  const shardCount = compactDevice ? 8 : 16;
  const shards = Array.from({ length: shardCount }, (_, index) => {
    const shard = new THREE.Mesh(shardGeometry, shardMaterials[index % shardMaterials.length]);
    const column = index % 4;
    const row = Math.floor(index / 4);
    shard.position.set(-7.8 + column * 5.1 + Math.sin(index * 2.3), 5.2 - row * 3.4 + Math.cos(index) * .8, -2.5 - index % 3);
    shard.scale.setScalar(.55 + (index % 5) * .2);
    shard.userData.baseY = shard.position.y;
    shard.userData.phase = index * .73;
    shardField.add(shard);
    return shard;
  });
  scene.add(shardField);

  const constellationPoints = Array.from({ length: compactDevice ? 14 : 26 }, (_, index) => {
    const angle = index * 2.39996;
    const radius = 2.6 + (index % 7) * .72;
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * .62, -4 - index % 4);
  });
  const constellation = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(constellationPoints),
    new THREE.LineBasicMaterial({ color: palette[1], transparent: true, opacity: .075 })
  );
  scene.add(constellation);

  const activeProjectColor = new THREE.Color(palette[0]);
  const projectColorObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target.dataset.webglColor) {
        activeProjectColor.set(entry.target.dataset.webglColor);
      }
    });
  }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
  document.querySelectorAll("[data-webgl-color]").forEach((project) => projectColorObserver.observe(project));

  const particleCount = compactDevice ? 170 : 360;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particlePositions.length; index += 3) {
    particlePositions[index] = (Math.random() - .5) * 20;
    particlePositions[index + 1] = (Math.random() - .5) * 14;
    particlePositions[index + 2] = (Math.random() - .5) * 7 - 3;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: palette[2], size: compactDevice ? .025 : .032, transparent: true, opacity: .58 })
  );
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth - .5;
    pointer.y = event.clientY / window.innerHeight - .5;
  }, { passive: true });

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    sculpture.position.x = window.innerWidth < 760 ? 1.8 : 4.5;
    sculpture.scale.setScalar(window.innerWidth < 760 ? .75 : 1);
  };
  resize();
  window.addEventListener("resize", resize);

  let frame;
  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    const scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    sculpture.rotation.x = elapsed * .07 + pointer.y * .3;
    sculpture.rotation.y = elapsed * .1 + pointer.x * .45;
    sculpture.position.y = 1.2 - scroll * 2.4;
    shell.material.color.lerp(activeProjectColor, .035);
    knot.rotation.z = -elapsed * .14;
    draftingRings.rotation.x = elapsed * .025 - pointer.y * .18;
    draftingRings.rotation.z = elapsed * .04;
    teamNodes.forEach((node, index) => {
      const angle = elapsed * .34 + index * (Math.PI * 2 / teamNodes.length);
      node.position.set(Math.cos(angle) * 2.35, Math.sin(angle) * 1.45, Math.sin(angle * 1.3) * .65);
      const pulse = 1 + Math.sin(elapsed * 1.8 + index) * .16;
      node.scale.setScalar(pulse);
      const lineIndex = index * 3;
      orbitLinePositions[lineIndex] = node.position.x;
      orbitLinePositions[lineIndex + 1] = node.position.y;
      orbitLinePositions[lineIndex + 2] = node.position.z;
    });
    orbitLinePositions[teamNodes.length * 3] = teamNodes[0].position.x;
    orbitLinePositions[teamNodes.length * 3 + 1] = teamNodes[0].position.y;
    orbitLinePositions[teamNodes.length * 3 + 2] = teamNodes[0].position.z;
    orbitLineGeometry.attributes.position.needsUpdate = true;
    teamOrbit.rotation.y = pointer.x * .35;
    shards.forEach((shard, index) => {
      shard.position.y = shard.userData.baseY + Math.sin(elapsed * .28 + shard.userData.phase) * .45 + scroll * ((index % 3) - 1) * 3.2;
      shard.rotation.x = elapsed * (.045 + index * .002) + pointer.y * .3;
      shard.rotation.y = elapsed * (.06 + index * .002) + pointer.x * .4;
    });
    shardField.position.x = pointer.x * -.8;
    constellation.rotation.z = elapsed * -.006;
    constellation.position.set(pointer.x * .35, -scroll * 1.2 + pointer.y * -.25, 0);
    particles.rotation.y = elapsed * .008;
    particles.position.y = scroll * 1.5;
    renderer.render(scene, camera);
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  render();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!reducedMotion) render();
  });
}

function initAssembly() {
  const assembly = document.querySelector("[data-assembly] .assembly");
  if (!assembly) return;

  const blocks = [...assembly.querySelectorAll(".value-block")];
  const target = assembly.querySelector(".cube-target");
  const counter = assembly.querySelector(".cube-count");
  let placed = 0;

  try {
    if (sessionStorage.getItem("weblo-assembly-complete") === "true") {
      blocks.forEach((block) => block.classList.add("placed"));
      assembly.classList.add("complete");
      assembly.closest(".hero").classList.add("assembled", "session-complete");
      return;
    }
  } catch (error) {
    // Continue with the interactive assembly when storage is unavailable.
  }

  const placeBlock = (block) => {
    if (block.classList.contains("placed")) return;
    block.classList.remove("dragging");
    block.classList.add("placed");
    placed += 1;
    target.dataset.cubeCount = String(placed);
    counter.textContent = `${placed} / ${blocks.length}`;
    if (placed === blocks.length) {
      assembly.style.opacity = "1";
      assembly.classList.add("complete");
      assembly.closest(".hero").classList.add("assembled");
      try {
        sessionStorage.setItem("weblo-assembly-complete", "true");
      } catch (error) {
        // The completed state still works for the current page without storage.
      }
    }
  };

  blocks.forEach((block) => {
    let originX = 0;
    let originY = 0;
    let startLeft = 0;
    let startTop = 0;
    let moved = false;

    block.addEventListener("pointerdown", (event) => {
      if (block.classList.contains("placed")) return;
      const assemblyRect = assembly.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      originX = event.clientX;
      originY = event.clientY;
      startLeft = blockRect.left - assemblyRect.left;
      startTop = blockRect.top - assemblyRect.top;
      block.style.left = `${startLeft}px`;
      block.style.top = `${startTop}px`;
      block.style.right = "auto";
      block.style.bottom = "auto";
      block.classList.add("dragging");
      block.setPointerCapture(event.pointerId);
      moved = false;
    });

    block.addEventListener("pointermove", (event) => {
      if (!block.classList.contains("dragging")) return;
      const deltaX = event.clientX - originX;
      const deltaY = event.clientY - originY;
      moved = moved || Math.abs(deltaX) + Math.abs(deltaY) > 6;
      const nextLeft = Math.max(0, Math.min(assembly.clientWidth - block.offsetWidth, startLeft + deltaX));
      const nextTop = Math.max(0, Math.min(assembly.clientHeight - block.offsetHeight, startTop + deltaY));
      block.style.left = `${nextLeft}px`;
      block.style.top = `${nextTop}px`;
    });

    block.addEventListener("pointerup", (event) => {
      if (!block.classList.contains("dragging")) return;
      block.releasePointerCapture(event.pointerId);
      block.classList.remove("dragging");
      const blockRect = block.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const distance = Math.hypot(
        blockRect.left + blockRect.width / 2 - (targetRect.left + targetRect.width / 2),
        blockRect.top + blockRect.height / 2 - (targetRect.top + targetRect.height / 2)
      );
      if (distance < Math.max(125, targetRect.width * .28)) placeBlock(block);
    });

    block.addEventListener("click", () => {
      if (!moved) placeBlock(block);
    });
  });

  const updateHandoff = () => {
    if (assembly.classList.contains("complete")) return;
    const hero = assembly.closest(".hero");
    const progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * .68)));
    const staggerWindow = 1 - (blocks.length - 1) * .09;
    blocks.forEach((block, index) => {
      const staggered = Math.min(1, Math.max(0, (progress - index * .09) / staggerWindow));
      block.style.setProperty("--hero-progress", staggered.toFixed(3));
    });
    assembly.style.opacity = String(1 - progress * .72);
  };
  updateHandoff();
  window.addEventListener("scroll", updateHandoff, { passive: true });
}

function initCurtainWebGL() {
  const canvas = document.querySelector("#curtain-canvas");
  if (!canvas) return;
  if (!window.THREE) {
    canvas.remove();
    document.querySelector("[data-curtain-hero]")?.classList.add("curtain-fallback");
    signalCurtainReady();
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactDevice = window.matchMedia("(max-width: 760px)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(compactDevice ? 48 : 43, 1, .1, 50);
  camera.position.set(0, 0, compactDevice ? 7.8 : 7.2);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compactDevice, powerPreference: "high-performance" });
  } catch (error) {
    canvas.remove();
    document.querySelector("[data-curtain-hero]")?.classList.add("curtain-fallback");
    signalCurtainReady();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice ? 1.2 : 1.6));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const vertexShader = `
    uniform float uTime;
    uniform float uOpen;
    uniform float uSide;
    uniform float uTravel;
    uniform vec2 uPointer;
    varying vec2 vUv;
    varying float vFold;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vec3 p = position;
      float opened = uOpen * uOpen * (3.0 - 2.0 * uOpen);
      float inner = uSide < 0.0 ? uv.x : 1.0 - uv.x;
      float innerPull = pow(inner, 1.65);
      float foldPhase = uv.x * (56.5487 + opened * 8.0) + uSide * 0.7;
      float fold = sin(foldPhase);
      float gather = 0.19 + (1.0 - opened) * 0.12;
      p.z += fold * gather * (0.82 + 0.18 * cos(uv.y * 3.14159));
      p.z += sin(uTime * 0.48 + uv.y * 3.4 + uv.x * 2.0) * 0.018 * (1.0 - opened * 0.7);
      p.z += innerPull * opened * sin(uv.y * 3.14159) * 0.22;
      float pointerY = uPointer.y * 0.5 + 0.5;
      float pointerPressure = exp(-pow(uv.y - pointerY, 2.0) * 22.0) * inner;
      p.z += uPointer.x * uSide * pointerPressure * 0.085 * (1.0 - opened * 0.72);
      p.y += uPointer.y * inner * sin(uv.y * 3.14159) * 0.025 * (1.0 - opened);
      p.x += uSide * opened * (0.35 + innerPull * uTravel);
      p.x += uSide * sin(uv.y * 3.14159) * 0.11 * (1.0 - inner) * (1.0 - opened);
      p.y += opened * innerPull * sin(uv.y * 3.14159) * 0.075;
      p.y -= (1.0 - uv.y) * (1.0 - uv.y) * 0.12;
      p.y -= abs(fold) * 0.035 * (1.0 - uv.y);
      vFold = fold;
      vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
      vViewPosition = viewPosition.xyz;
      gl_Position = projectionMatrix * viewPosition;
    }
  `;
  const fragmentShader = `
    uniform float uOpen;
    uniform float uSide;
    varying vec2 vUv;
    varying float vFold;
    varying vec3 vViewPosition;
    void main() {
      vec3 midnight = vec3(0.012, 0.03, 0.07);
      vec3 navy = vec3(0.055, 0.16, 0.3);
      vec3 copper = vec3(0.55, 0.26, 0.11);
      float ridge = 0.5 + 0.5 * vFold;
      float broadLight = smoothstep(0.0, 1.0, ridge) * 0.72;
      float topLight = 0.18 + vUv.y * 0.2;
      float weave = sin(vUv.x * 1100.0) * sin(vUv.y * 820.0) * 0.018;
      float inner = uSide < 0.0 ? vUv.x : 1.0 - vUv.x;
      float edgeShadow = 1.0 - smoothstep(0.92, 1.0, inner) * (1.0 - uOpen) * 0.5;
      vec3 color = mix(midnight, navy, broadLight + topLight) * edgeShadow;
      vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
      vec3 lightDirection = normalize(vec3(-uSide * 0.28, 0.48, 1.0));
      float clothLight = 0.42 + abs(dot(normal, lightDirection)) * 0.58;
      float grazingSheen = pow(1.0 - min(1.0, abs(normal.z)), 2.0);
      color *= clothLight;
      color += weave;
      float velvetSheen = pow(max(0.0, ridge), 9.0) * (0.12 + vUv.y * 0.1);
      color += vec3(0.16, 0.2, 0.27) * velvetSheen;
      color += vec3(0.16, 0.2, 0.28) * grazingSheen * 0.12;
      color += copper * smoothstep(0.72, 1.0, inner) * (0.025 + uOpen * 0.055) * ridge;
      color *= 1.0 - (1.0 - smoothstep(0.0, 0.035, vUv.y)) * 0.35;
      color *= 0.9 + smoothstep(0.0, .12, vUv.y) * 0.1;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const curtainGroup = new THREE.Group();
  const panelGeometry = new THREE.PlaneGeometry(compactDevice ? 6.2 : 7.5, 9.2, compactDevice ? 48 : 80, compactDevice ? 42 : 72);
  const panels = [-1, 1].map((side) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpen: { value: reducedMotion ? 1 : 0 },
        uSide: { value: side },
        uTravel: { value: compactDevice ? 2.2 : 5.15 },
        uPointer: { value: new THREE.Vector2() }
      },
      vertexShader,
      fragmentShader,
      extensions: { derivatives: true },
      side: THREE.DoubleSide
    });
    const panel = new THREE.Mesh(panelGeometry, material);
    panel.position.x = side * (compactDevice ? 3.1 : 3.75);
    panel.position.y = -.15;
    curtainGroup.add(panel);
    return panel;
  });
  scene.add(curtainGroup);

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(.055, .065, compactDevice ? 13 : 16, 18),
    new THREE.MeshBasicMaterial({ color: 0x93846d })
  );
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 2.82, .35);
  scene.add(rod);

  const dustCount = compactDevice ? 70 : 150;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    dustPositions[index * 3] = (Math.random() - .5) * 11;
    dustPositions[index * 3 + 1] = (Math.random() - .5) * 6.5;
    dustPositions[index * 3 + 2] = Math.random() * 2.3 + .3;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: 0xe6d3ad, size: compactDevice ? .018 : .024, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scene.add(dust);

  const pointer = new THREE.Vector2();
  window.addEventListener("pointermove", (event) => {
    pointer.set(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight * 2 - 1));
  }, { passive: true });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const clock = new THREE.Clock();
  let frame;
  let active = true;
  let currentOpen = reducedMotion ? 1 : 0;
  let readySignaled = false;
  const render = () => {
    const elapsed = clock.getElapsedTime();
    const targetOpen = reducedMotion ? 1 : (window.webloCurtainProgress || 0);
    currentOpen += (targetOpen - currentOpen) * .09;
    panels.forEach((panel) => {
      panel.material.uniforms.uTime.value = elapsed;
      panel.material.uniforms.uOpen.value = currentOpen;
      panel.material.uniforms.uPointer.value.lerp(pointer, .035);
    });
    rod.position.y = 2.82 + Math.sin(elapsed * .35) * .002;
    dust.material.opacity = .025 + currentOpen * .32;
    dust.rotation.y = elapsed * .012;
    dust.position.y = Math.sin(elapsed * .16) * .12;
    renderer.render(scene, camera);
    if (!readySignaled) {
      readySignaled = true;
      signalCurtainReady();
    }
    if (!reducedMotion && active) frame = requestAnimationFrame(render);
  };
  render();

  const heroObserver = new IntersectionObserver(([entry]) => {
    if (reducedMotion) return;
    const nextActive = entry.isIntersecting;
    if (nextActive === active) return;
    active = nextActive;
    if (active) render();
    else cancelAnimationFrame(frame);
  }, { threshold: 0 });
  heroObserver.observe(canvas.closest(".curtain-hero"));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!reducedMotion && active) render();
  });
}

function initWebGL() {
  const canvas = document.querySelector("#hero-canvas");
  if (!canvas || !window.THREE) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const group = new THREE.Group();
  group.position.set(0, .2, 0);
  scene.add(group);

  const colors = [0x235cff, 0xff6b4a, 0xb8f5dc, 0xf3f0e8];
  for (let index = 0; index < 7; index += 1) {
    const width = 4.8 - index * .18;
    const shape = new THREE.Shape();
    const radius = .12;
    shape.moveTo(-width / 2 + radius, -1.55);
    shape.lineTo(width / 2 - radius, -1.55);
    shape.quadraticCurveTo(width / 2, -1.55, width / 2, -1.55 + radius);
    shape.lineTo(width / 2, 1.55 - radius);
    shape.quadraticCurveTo(width / 2, 1.55, width / 2 - radius, 1.55);
    shape.lineTo(-width / 2 + radius, 1.55);
    shape.quadraticCurveTo(-width / 2, 1.55, -width / 2, 1.55 - radius);
    shape.lineTo(-width / 2, -1.55 + radius);
    shape.quadraticCurveTo(-width / 2, -1.55, -width / 2 + radius, -1.55);
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: colors[index % colors.length],
      transparent: true,
      opacity: index === 0 ? .72 : .18,
      wireframe: index !== 0,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = -index * .62;
    plane.position.y = index * .16;
    plane.rotation.z = index * .025;
    plane.userData = { offset: index, baseY: plane.position.y, baseZ: plane.position.z, baseRotation: plane.rotation.z };
    group.add(plane);
  }

  const dotsGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(240 * 3);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - .5) * 18;
    positions[i + 1] = (Math.random() - .5) * 11;
    positions[i + 2] = (Math.random() - .5) * 6 - 2;
  }
  dotsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dots = new THREE.Points(dotsGeometry, new THREE.PointsMaterial({ color: 0xf3f0e8, size: .025, transparent: true, opacity: .5 }));
  scene.add(dots);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - .5) * 2;
    pointer.y = (event.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    group.userData.collapsedX = width < 800 ? 1.3 : 3.3;
    group.userData.collapsedScale = width < 620 ? .72 : 1;
    group.userData.expandedScale = width < 620 ? 1.75 : (width < 900 ? 2.1 : 2.75);
    if (!canvas.closest(".hero").classList.contains("assembled")) {
      group.position.x = 0;
      group.scale.setScalar(group.userData.expandedScale);
    }
  };
  resize();
  window.addEventListener("resize", resize);

  let frame;
  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    const hero = canvas.closest(".hero");
    const scrollProgress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * .72)));
    const assembled = hero.classList.contains("assembled");
    const targetGroupX = assembled ? group.userData.collapsedX : 0;
    const targetGroupScale = assembled ? group.userData.collapsedScale : group.userData.expandedScale;
    group.position.x += (targetGroupX - group.position.x) * .035;
    const nextScale = group.scale.x + (targetGroupScale - group.scale.x) * .035;
    group.scale.setScalar(nextScale);
    group.children[0].material.opacity += ((assembled ? .72 : .42) - group.children[0].material.opacity) * .035;
    group.rotation.y += ((pointer.x * .17) - group.rotation.y) * .04;
    group.rotation.x += ((-pointer.y * .12) - group.rotation.x) * .04;
    group.children.forEach((plane) => {
      const index = plane.userData.offset;
      const breakProgress = Math.min(1, Math.max(0, (scrollProgress - index * .08) / .55));
      plane.position.x = (index - 3) * breakProgress * .72;
      plane.position.y = plane.userData.baseY + Math.sin(elapsed * .65 + index) * .035 + (index % 2 ? 1 : -1) * breakProgress * 1.15;
      plane.position.z = plane.userData.baseZ + breakProgress * index * .24;
      plane.rotation.z = plane.userData.baseRotation + (index - 3) * breakProgress * .12;
    });
    dots.rotation.y = elapsed * .008;
    renderer.render(scene, camera);
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  render();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!reducedMotion) render();
  });
}
