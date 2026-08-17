document.addEventListener("DOMContentLoaded", () => {
  const data = window.webloPricingData;
  const packageGrid = document.querySelector("[data-package-grid]");
  if (!data || !packageGrid) return;

  const formatter = new Intl.NumberFormat(data.locale);
  const selections = { foundation: "none", signature: "carePro", worldbuild: "none" };
  let activeTrack = "hospitality";
  let activePackage = "signature";

  const money = (value) => `₹${formatter.format(value)}`;
  const careKey = (bundle) => bundle === "none" ? "none" : bundle === "carePro" ? "care-pro" : "care";
  const displayedPrice = (pkg, bundle) => bundle === "none" ? pkg.basePrice : pkg.bundlePrices[bundle];
  const monthlyPrice = (bundle) => data.bundleOptions[bundle].monthlyPrice;
  const track = () => data.tracks[activeTrack];

  const emit = (eventName, detail = {}) => {
    const payload = { event: eventName, ...detail };
    window.dispatchEvent(new CustomEvent("weblo:analytics", { detail: payload }));
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
  };

  const analyticsPayload = (packageKey, bundle) => {
    const pkg = track().packages[packageKey];
    return {
      track: activeTrack,
      website_package: packageKey,
      care_plan: careKey(bundle),
      displayed_one_time_price: displayedPrice(pkg, bundle),
      displayed_monthly_price: monthlyPrice(bundle)
    };
  };

  const contactUrl = (packageKey, bundle) => {
    const pkg = track().packages[packageKey];
    const params = new URLSearchParams({
      package: bundle === "none" ? packageKey : `${packageKey}-${careKey(bundle)}`,
      track: activeTrack,
      care: careKey(bundle),
      base_price: String(pkg.basePrice),
      website_price: String(displayedPrice(pkg, bundle)),
      monthly_price: String(monthlyPrice(bundle)),
      promotion: bundle === "none" ? "none" : "care-bundle"
    });
    return `contact.html?${params.toString()}`;
  };

  const configureFoundingOffer = () => {
    const offer = document.querySelector("[data-founding-offer]");
    if (!offer) return;
    const config = data.foundingOffer;
    offer.hidden = !config.enabled || config.discountPercent === 0;
    offer.querySelector("[data-founding-percent]").textContent = `${config.discountPercent}%`;
    offer.querySelector("[data-founding-label]").textContent = `Limited founding window / First ${config.clientLimit} clients`;
    offer.querySelector("[data-founding-copy]").textContent = `The first ${config.clientLimit} homestay or café clients receive ${config.discountPercent}% off their selected website package in exchange for an honest testimonial, case-study permission, and one referral introduction.`;
    offer.querySelector("[data-founding-rule]").textContent = config.combinableWithBundles
      ? "The founding offer can combine with Care bundle pricing when confirmed in writing."
      : "The founding offer and Care bundle discount do not combine. We apply the better eligible website price in writing.";
  };

  const renderCarePlans = () => {
    const careGrid = document.querySelector("[data-care-grid]");
    if (!careGrid) return;
    careGrid.innerHTML = Object.entries(data.carePlans).map(([key, plan], index) => {
      const isPro = key === "carePro";
      const slug = isPro ? "care-pro" : "care";
      const packageSlug = isPro ? "care-pro" : "care-plan";
      return `<article class="care-card${isPro ? " care-card-pro" : ""}">
        <span class="care-code">${plan.name} / C_0${index + 1}</span>
        ${isPro ? '<span class="value-pill is-visible">For active sites</span>' : ""}
        <div class="care-card-price"><strong>${money(plan.price)}</strong><span>/ month</span></div>
        <h3>${isPro ? "Turn upkeep into momentum." : "Quiet, reliable upkeep."}</h3>
        <p>${plan.audience}</p>
        <strong class="care-allowance">${plan.allowance}</strong>
        <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join("")}<li>${plan.support}</li></ul>
        <a class="button ${isPro ? "dark" : "ghost"}" data-care-cta="${slug}" href="contact.html?package=${packageSlug}&care=${slug}&monthly_price=${plan.price}">Choose ${plan.name}</a>
      </article>`;
    }).join("");
  };

  const optionMarkup = (packageKey, pkg, bundle) => {
    const option = data.bundleOptions[bundle];
    const price = displayedPrice(pkg, bundle);
    const monthly = monthlyPrice(bundle);
    return `<button class="bundle-option" type="button" role="radio" aria-checked="${selections[packageKey] === bundle}" data-bundle="${bundle}">
      <span>${option.label}</span>
      <strong>${money(price)}</strong>
      <small>${monthly ? `+ ${money(monthly)}/mo` : option.description}</small>
    </button>`;
  };

  const cardMarkup = (packageKey, pkg) => {
    const bundle = selections[packageKey];
    const price = displayedPrice(pkg, bundle);
    const monthly = monthlyPrice(bundle);
    const savings = pkg.basePrice - price;
    const care = bundle === "none" ? null : data.carePlans[bundle];
    const recommended = packageKey === "signature" && bundle === "carePro";
    const ctaSuffix = bundle === "none" ? "" : ` + ${data.bundleOptions[bundle].shortLabel}`;

    return `<article class="package-card${packageKey === "signature" ? " package-card-signature" : ""}" data-package-card="${packageKey}">
      <header class="package-card-heading">
        <span class="package-code">${pkg.name} / ${pkg.code}</span>
        <span class="value-pill${recommended ? " is-visible" : ""}" aria-hidden="${!recommended}">Best value</span>
        <h3>${pkg.headline}</h3>
      </header>
      <div class="package-price" aria-live="polite">
        <span class="base-price-label">Normal website</span>
        <span class="base-price${bundle !== "none" ? " is-discounted" : ""}">${money(pkg.basePrice)}</span>
        <span class="current-price-label">${bundle === "none" ? "One-time website price" : "Bundled website price"}</span>
        <strong class="current-price" data-current-price>${money(price)}</strong>
        <span class="monthly-price">${monthly ? `with ${data.bundleOptions[bundle].shortLabel} at <b>${money(monthly)}/month</b>` : "No recurring Care plan"}</span>
        <span class="savings${savings ? " is-visible" : ""}">${savings ? `Save ${money(savings)} on the website` : "Website-only price"}</span>
      </div>
      <div class="bundle-selector" role="radiogroup" aria-label="Care bundle for ${pkg.name}">
        ${["none", "care", "carePro"].map((option) => optionMarkup(packageKey, pkg, option)).join("")}
      </div>
      <div class="care-inclusion" data-care-inclusion>
        <span>${care ? `${care.name} includes` : "Website only"}</span>
        <p>${care ? `${care.allowance}, ${care.support.toLowerCase()}, managed hosting, backups and monitoring.` : data.bundleOptions.none.description}</p>
      </div>
      <ul class="package-outcomes">${pkg.outcomes.map((outcome) => `<li>${outcome}</li>`).join("")}</ul>
      <a class="button ${packageKey === "signature" ? "dark" : "ghost"} package-cta" href="${contactUrl(packageKey, bundle)}" data-pricing-cta>Choose ${pkg.name}${ctaSuffix}</a>
    </article>`;
  };

  const renderCards = () => {
    packageGrid.innerHTML = Object.entries(track().packages).map(([key, pkg]) => cardMarkup(key, pkg)).join("");
    const heading = document.querySelector("[data-track-name]");
    const description = document.querySelector("[data-track-description]");
    if (heading) heading.textContent = track().name;
    if (description) description.textContent = track().description;
    updateSticky();
  };

  const updateSticky = () => {
    const pkg = track().packages[activePackage];
    const bundle = selections[activePackage];
    const summary = document.querySelector("[data-sticky-summary]");
    if (!pkg || !summary) return;
    const monthly = monthlyPrice(bundle);
    summary.querySelector("[data-sticky-name]").textContent = `${pkg.name}${bundle === "none" ? "" : ` + ${data.bundleOptions[bundle].shortLabel}`}`;
    summary.querySelector("[data-sticky-price]").textContent = `${money(displayedPrice(pkg, bundle))}${monthly ? ` + ${money(monthly)}/mo` : " one-time"}`;
    const link = summary.querySelector("a");
    link.href = contactUrl(activePackage, bundle);
    link.setAttribute("aria-label", `Continue with ${pkg.name}${bundle === "none" ? "" : ` and ${data.bundleOptions[bundle].shortLabel}`}`);
  };

  document.querySelector("[data-track-switcher]")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-track]");
    if (!button || button.dataset.track === activeTrack) return;
    activeTrack = button.dataset.track;
    document.querySelectorAll("[data-track]").forEach((item) => {
      const selected = item.dataset.track === activeTrack;
      item.setAttribute("aria-selected", String(selected));
      item.classList.toggle("is-active", selected);
    });
    renderCards();
    emit("track_switch", analyticsPayload(activePackage, selections[activePackage]));
  });

  packageGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-package-card]");
    if (!card) return;
    const packageKey = card.dataset.packageCard;
    const bundleButton = event.target.closest("[data-bundle]");
    activePackage = packageKey;
    if (bundleButton && selections[packageKey] !== bundleButton.dataset.bundle) {
      selections[packageKey] = bundleButton.dataset.bundle;
      renderCards();
      const bundle = selections[packageKey];
      emit("care_plan_selected", analyticsPayload(packageKey, bundle));
      if (bundle !== "none") emit("bundle_selected", analyticsPayload(packageKey, bundle));
      document.querySelector(`[data-package-card="${packageKey}"] [data-bundle="${bundle}"]`)?.focus();
      return;
    }
    if (event.target.closest("[data-pricing-cta]")) {
      emit("pricing_cta_clicked", analyticsPayload(packageKey, selections[packageKey]));
    }
    updateSticky();
  });

  configureFoundingOffer();
  renderCarePlans();

  document.querySelectorAll("[data-care-cta]").forEach((link) => link.addEventListener("click", () => {
    const selectedPlan = link.dataset.careCta === "care-pro" ? data.carePlans.carePro : data.carePlans.care;
    emit("pricing_cta_clicked", {
      track: activeTrack,
      website_package: "care-only",
      care_plan: link.dataset.careCta,
      displayed_one_time_price: 0,
      displayed_monthly_price: selectedPlan.price
    });
  }));
  document.querySelectorAll("[data-promotion]").forEach((promotion) => promotion.addEventListener("click", () => {
    emit("promotion_opened", { ...analyticsPayload(activePackage, selections[activePackage]), promotion: promotion.dataset.promotion });
  }));
  document.querySelector("[data-sticky-summary] a")?.addEventListener("click", () => {
    emit("pricing_cta_clicked", analyticsPayload(activePackage, selections[activePackage]));
  });

  const observed = new Set();
  const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || observed.has(entry.target)) return;
      observed.add(entry.target);
      emit(entry.target.matches("[data-comparison]") ? "comparison_viewed" : "pricing_view", analyticsPayload(activePackage, selections[activePackage]));
    });
  }, { threshold: .2 }) : null;
  [packageGrid, document.querySelector("[data-comparison]")].filter(Boolean).forEach((element) => observer?.observe(element));

  const comparisonBody = document.querySelector("[data-comparison-body]");
  if (comparisonBody) {
    comparisonBody.innerHTML = data.comparison.map((row) => `<tr><th scope="row">${row.label}</th>${row.values.map((value) => `<td>${value}</td>`).join("")}</tr>`).join("");
  }

  renderCards();
});
