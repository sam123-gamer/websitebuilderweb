document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const year = document.querySelector("[data-year]");

  if (year) year.textContent = new Date().getFullYear();

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
  }));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  initAssembly();

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
    const packageBudgets = { foundation: "$6k-$12k", signature: "$12k-$24k", worldbuild: "$24k-$50k" };
    const budget = form.querySelector("[name='budget']");
    if (packageBudgets[requestedPackage]) budget.value = packageBudgets[requestedPackage];
  }
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
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
    const subject = encodeURIComponent(`Project inquiry from ${data.get("name")}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\nCompany: ${data.get("company") || "Not provided"}\nBudget: ${data.get("budget")}\n\nProject:\n${data.get("message")}`);
    document.querySelector(".form-status").textContent = "Opening your email client...";
    window.location.href = `mailto:hello@placeholder.com?subject=${subject}&body=${body}`;
  });

  initWebGL();
});

function initAssembly() {
  const assembly = document.querySelector("[data-assembly] .assembly");
  if (!assembly) return;

  const blocks = [...assembly.querySelectorAll(".value-block")];
  const target = assembly.querySelector(".cube-target");
  const counter = assembly.querySelector(".cube-count");
  let placed = 0;

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
      block.style.left = `${startLeft + deltaX}px`;
      block.style.top = `${startTop + deltaY}px`;
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
