const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = [...document.querySelectorAll(".reveal")];
const curtainHero = document.querySelector("[data-curtain-hero]");
let lenis;

if (!reducedMotion) {
  try {
    const { default: Lenis } = await import("https://cdn.jsdelivr.net/npm/lenis@1.3.26/+esm");
    lenis = new Lenis({
      autoRaf: true,
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -92 }
    });
    document.documentElement.classList.add("lenis-ready");
  } catch (error) {
    // Native scrolling remains available if the enhancement cannot load.
  }
}

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
      scroll(setCurtainProgress, { target: curtainHero, offset: ["start start", "end end"] });
    }

    const staggerGroups = [
      [".section-map", ".map-card"],
      [".home-spec-grid", ".home-spec-card"],
      [".work-list", ".work-row"],
      [".service-grid", ".service"],
      [".pricing-tracks", ".pricing-track"],
      [".team-grid", ".team-card"],
      [".principle-list", "article"],
      [".contact-details", ":scope > div"]
    ];
    const staggeredItems = new Set();

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

    try {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm"),
        import("https://cdn.jsdelivr.net/npm/gsap@3.15.0/ScrollTrigger/+esm")
      ]);
      gsap.registerPlugin(ScrollTrigger);
      lenis?.on("scroll", ScrollTrigger.update);

      gsap.utils.toArray(".home-spec-card .mini-browser").forEach((browser, index) => {
        gsap.fromTo(browser, {
          yPercent: index ? 8 : 13,
          rotate: index ? 1.2 : -1.2
        }, {
          yPercent: index ? -5 : -8,
          rotate: 0,
          ease: "none",
          scrollTrigger: {
            trigger: browser.closest(".home-spec-card"),
            start: "top bottom",
            end: "bottom top",
            scrub: .8
          }
        });
      });

      const specHero = document.querySelector("[data-spec-hero]");
      if (specHero) {
        gsap.timeline({
          scrollTrigger: {
            trigger: specHero,
            start: "top top",
            end: "bottom top",
            scrub: 1
          }
        })
          .to(".spec-hero h1", { yPercent: -16, scale: .94, transformOrigin: "left bottom", ease: "none" }, 0)
          .to(".spec-hero-bottom", { yPercent: -25, opacity: .35, ease: "none" }, 0)
          .to(".spec-orbit-one", { x: -150, y: 90, rotate: -12, ease: "none" }, 0)
          .to(".spec-orbit-two", { x: 190, y: -55, rotate: 10, ease: "none" }, 0);
      }

      gsap.matchMedia().add("(min-width: 901px)", () => {
        gsap.utils.toArray("[data-spec-case]").forEach((specCase, index) => {
          const browser = specCase.querySelector(".spec-browser");
          const copy = specCase.querySelector(".spec-case-copy");
          gsap.fromTo(browser, {
            yPercent: 9,
            rotate: index ? 1.4 : -1.4,
            scale: .94
          }, {
            yPercent: -7,
            rotate: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: specCase,
              start: "top bottom",
              end: "bottom top",
              scrub: 1
            }
          });
          gsap.fromTo(copy, { y: 70 }, {
            y: -35,
            ease: "none",
            scrollTrigger: {
              trigger: specCase,
              start: "top 80%",
              end: "bottom 25%",
              scrub: 1
            }
          });
        });
      });

      ScrollTrigger.refresh();
    } catch (error) {
      // Framer Motion and native sticky positioning provide the fallback.
    }
  } catch (error) {
    showStatic();
    setCurtainProgress(1);
  }
}
