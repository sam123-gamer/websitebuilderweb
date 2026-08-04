const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = [...document.querySelectorAll(".reveal")];
const curtainHero = document.querySelector("[data-curtain-hero]");
const homeCoverPanel = document.querySelector("[data-home-cover]");
const coverActivateButton = document.querySelector("[data-cover-activate]");

const unlockHomeContent = () => {
  document.documentElement.classList.remove("home-content-locked");
};

coverActivateButton?.addEventListener("click", unlockHomeContent);

const setCurtainProgress = (progress) => {
  if (!curtainHero) return;
  const value = Math.min(1, Math.max(0, progress));
  const reveal = Math.min(1, Math.max(0, (value - .24) / .42));
  const proof = Math.min(1, Math.max(0, (value - .5) / .28));
  const copy = curtainHero.querySelector(".curtain-hero-copy");
  const frontmatter = curtainHero.querySelector(".curtain-frontmatter");
  const cue = curtainHero.querySelector(".curtain-scroll-cue");
  window.webloCurtainProgress = value;
  curtainHero.style.setProperty("--curtain-progress", value.toFixed(4));
  if (copy) {
    copy.style.opacity = String(reveal);
    copy.style.transform = `translate3d(0, ${(1 - reveal) * 38}px, 0)`;
    copy.style.pointerEvents = reveal > .82 ? "auto" : "none";
  }
  curtainHero.querySelectorAll(".hero-proof > div").forEach((item, index) => {
    const itemProgress = Math.min(1, Math.max(0, proof * 1.4 - index * .14));
    item.style.opacity = String(itemProgress);
    item.style.transform = `translate3d(0, ${(1 - itemProgress) * 18}px, 0)`;
  });
  if (frontmatter) {
    frontmatter.style.opacity = String(Math.max(0, 1 - value * 4.2));
    frontmatter.style.transform = `translate3d(0, ${value * -24}px, 0)`;
  }
  if (cue) cue.style.opacity = String(Math.max(0, 1 - value * 5));
};

const showStatic = () => {
  revealElements.forEach((element) => element.classList.add("visible"));
};

if (reducedMotion) {
  showStatic();
  setCurtainProgress(1);
} else {
  try {
    const { animate, inView, scroll } = await import("https://cdn.jsdelivr.net/npm/framer-motion@12.23.12/dom/+esm");
    const animeModule = homeCoverPanel
      ? await import("https://cdn.jsdelivr.net/npm/animejs@4.1.3/+esm")
      : null;
    document.documentElement.classList.add("framer-motion-ready");

    const progress = document.createElement("div");
    progress.className = "motion-scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.append(progress);
    scroll((value) => {
      progress.style.transform = `scaleX(${value})`;
    });
    if (curtainHero) {
      setCurtainProgress(0);
      scroll((value) => {
        const totalRunway = Math.max(1, curtainHero.offsetHeight - window.innerHeight);
        const drawRunway = window.innerHeight * (window.innerWidth <= 760 ? .7 : .9);
        setCurtainProgress(value * totalRunway / drawRunway);
      }, { target: curtainHero, offset: ["start start", "end end"] });
    }

    if (curtainHero && homeCoverPanel) {
      const stage = curtainHero.querySelector(".curtain-stage");
      const panelAnimation = animate(homeCoverPanel, {
        transform: ["translateY(8svh)", "translateY(0)"]
      }, { ease: "linear" });
      scroll(panelAnimation, { target: homeCoverPanel, offset: ["start end", "start start"] });

      if (stage) {
        const depthAnimation = animate(stage, {
          transform: ["scale(1)", "scale(.955)"],
          filter: ["brightness(1)", "brightness(.68)"]
        }, { ease: "linear" });
        scroll(depthAnimation, { target: homeCoverPanel, offset: ["start end", "start start"] });
      }
    }

    const staggerGroups = [
      [".work-list", ".work-row"],
      [".service-grid", ".service"],
      [".pricing-grid", ".price-card"],
      [".team-grid", ".team-card"],
      [".principle-list", "article"],
      [".contact-details", ":scope > div"]
    ];
    const staggeredItems = new Set();

    if (homeCoverPanel && animeModule) {
      const cards = [...homeCoverPanel.querySelectorAll(".map-card")];
      const activateButton = coverActivateButton;
      const panelItems = activateButton ? [...cards, activateButton] : cards;
      panelItems.forEach((item) => {
        staggeredItems.add(item);
        item.style.opacity = "0";
        item.style.transform = "translateY(42px) scale(.98)";
      });
      let cardsAnimated = false;
      inView(homeCoverPanel, () => {
        if (cardsAnimated) return;
        cardsAnimated = true;
        animeModule.animate(panelItems, {
          opacity: [0, 1],
          translateY: [42, 0],
          scale: [.98, 1],
          delay: animeModule.stagger(90),
          duration: 760,
          ease: "out(4)"
        });
      }, { amount: .18 });

      activateButton?.addEventListener("click", (event) => {
        const destination = document.querySelector(".home-section");
        if (!destination || activateButton.classList.contains("activating")) return;
        event.preventDefault();
        activateButton.classList.add("activating");

        const whoosh = document.createElement("div");
        whoosh.className = "cover-whoosh";
        whoosh.setAttribute("aria-hidden", "true");
        whoosh.innerHTML = Array.from({ length: 7 }, (_, index) => `<span style="--whoosh-index:${index}"></span>`).join("");
        document.body.append(whoosh);
        animeModule.animate([...whoosh.children], {
          opacity: [0, 1, 0],
          translateY: [0, "165vh"],
          scaleY: [.25, 1.2],
          delay: animeModule.stagger(42),
          duration: 680,
          ease: "in(3)",
          onComplete: () => whoosh.remove()
        });

        const start = window.scrollY;
        const target = destination.getBoundingClientRect().top + start - 88;
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        animate(start, target, {
          duration: 1.05,
          delay: .08,
          ease: [.76, 0, .24, 1],
          onUpdate: (value) => window.scrollTo(0, value),
          onComplete: () => {
            document.documentElement.style.scrollBehavior = previousScrollBehavior;
            activateButton.classList.remove("activating");
          }
        });
      });
    }

    staggerGroups.forEach(([groupSelector, itemSelector]) => {
      document.querySelectorAll(groupSelector).forEach((group) => {
        const items = [...group.querySelectorAll(itemSelector)];
        if (!items.length) return;
        items.forEach((item) => {
          staggeredItems.add(item);
          item.style.opacity = "0";
          item.style.transform = "translateY(28px)";
        });
        inView(group, () => {
          animate(items, {
            opacity: [0, 1],
            transform: ["translateY(28px)", "translateY(0px)"]
          }, {
            duration: .62,
            delay: (index) => index * .09,
            ease: [.22, 1, .36, 1]
          });
        }, { margin: "0px 0px -12%", amount: .12 });
      });
    });

    revealElements.filter((element) => !staggeredItems.has(element)).forEach((element) => {
      inView(element, () => {
        animate(element, {
          opacity: [0, 1],
          transform: ["translateY(34px)", "translateY(0px)"]
        }, {
          duration: .72,
          ease: [.22, 1, .36, 1]
        });
      }, { margin: "0px 0px -10%", amount: .16 });
    });

    document.querySelectorAll(".page-intro h1, .work-hero h1, .section-heading h2").forEach((heading) => {
      const section = heading.closest("header, section") || heading;
      const animation = animate(heading, {
        transform: ["translateY(18px)", "translateY(-18px)"]
      }, { ease: "linear" });
      scroll(animation, { target: section, offset: ["start end", "end start"] });
    });

    document.querySelectorAll(".cta-panel").forEach((panel) => {
      const animation = animate(panel, {
        transform: ["translateY(36px) scale(.985)", "translateY(-18px) scale(1)"]
      }, { ease: "linear" });
      scroll(animation, { target: panel, offset: ["start end", "end start"] });
    });

    const entryCopy = document.querySelector(".experience-entry-copy");
    if (entryCopy) {
      animate([...entryCopy.children], {
        opacity: [0, 1],
        transform: ["translateY(24px)", "translateY(0px)"]
      }, {
        duration: .7,
        delay: (index) => .08 + index * .1,
        ease: [.22, 1, .36, 1]
      });
    }
  } catch (error) {
    showStatic();
    setCurtainProgress(1);
  }
}
