(function () {
  var body = document.body;
  if (!body) return;

  var storageKey = "chrum-theme";
  var toggle = document.getElementById("themeToggle");
  var toggleIcon = document.getElementById("themeToggleIcon");

  function applyTheme(theme) {
    var isDark = theme === "dark";
    body.setAttribute("data-theme", isDark ? "dark" : "light");

    if (!toggle || !toggleIcon) return;

    var labelDark = body.getAttribute("data-theme-label-dark") || "Page theme: dark. Switch to light.";
    var labelLight = body.getAttribute("data-theme-label-light") || "Page theme: light. Switch to dark.";
    var titleDark = body.getAttribute("data-theme-title-dark") || "Page theme: dark";
    var titleLight = body.getAttribute("data-theme-title-light") || "Page theme: light";

    toggleIcon.textContent = isDark ? "☀" : "☾";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? labelDark : labelLight);
    toggle.title = isDark ? titleDark : titleLight;
  }

  var savedTheme = "light";
  try {
    savedTheme = localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
  } catch (error) {
    savedTheme = "light";
  }
  applyTheme(savedTheme);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var currentTheme = body.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch (error) {
        // Ignore storage errors.
      }
    });
  }

  var betaForm = document.getElementById("betaForm");
  var betaEmail = document.getElementById("betaEmail");
  var betaName = document.getElementById("betaName");

  if (betaForm && betaEmail) {
    betaForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var email = betaEmail.value.trim();
      var name = betaName ? betaName.value.trim() : "";

      if (!email) {
        betaEmail.focus();
        return;
      }

      var subject = body.getAttribute("data-mail-subject") || "Chrumek beta - please invite me to TestFlight";
      var intro = body.getAttribute("data-mail-intro") || "I want to join the Chrumek beta list.";
      var nameLabel = body.getAttribute("data-mail-name-label") || "Name";

      var bodyLines = [intro, "", "Email: " + email];
      if (name) {
        bodyLines.push(nameLabel + ": " + name);
      }

      var mailtoLink =
        "mailto:chrumek@chrumek.app?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailtoLink;
    });
  }

  var checklistCard = document.querySelector(".hero-panel .panel-card");
  var checklistItems = Array.prototype.slice.call(document.querySelectorAll(".hero-panel .checklist-item"));

  function setChecklistChecked(checked) {
    checklistItems.forEach(function (item) {
      item.classList.toggle("is-checked", checked);
    });
  }

  if (checklistCard && checklistItems.length) {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setChecklistChecked(true);
    } else {
      var checklistStarted = false;
      var cycleTimer = 0;
      var stepTimers = [];
      var stepDelay = 420;
      var resetDelay = 260;
      var holdDelay = 1300;

      function clearChecklistTimers() {
        clearTimeout(cycleTimer);
        stepTimers.forEach(function (timerId) {
          clearTimeout(timerId);
        });
        stepTimers = [];
      }

      function runChecklistLoop() {
        clearChecklistTimers();
        setChecklistChecked(false);

        checklistItems.forEach(function (item, index) {
          var stepTimer = setTimeout(function () {
            item.classList.add("is-checked");
          }, resetDelay + index * stepDelay);
          stepTimers.push(stepTimer);
        });

        cycleTimer = setTimeout(
          runChecklistLoop,
          resetDelay + checklistItems.length * stepDelay + holdDelay
        );
      }

      function startChecklistLoop() {
        if (checklistStarted) return;
        checklistStarted = true;
        runChecklistLoop();
      }

      if (typeof IntersectionObserver === "undefined") {
        startChecklistLoop();
      } else {
        var checklistObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting || entry.intersectionRatio < 0.4) return;
              startChecklistLoop();
            });
          },
          { threshold: [0.4] }
        );

        checklistObserver.observe(checklistCard);
      }

      window.addEventListener("beforeunload", function () {
        clearChecklistTimers();
      });
    }
  }

  var langSwitch = document.querySelector("[data-lang-switch]");
  if (langSwitch) {
    var langToggle = langSwitch.querySelector(".lang-toggle");
    var langMenu = langSwitch.querySelector(".lang-menu");
    var langLinks = Array.prototype.slice.call(langSwitch.querySelectorAll(".lang-option"));

    function setMenuOpen(open) {
      langSwitch.classList.toggle("is-open", open);
      if (langToggle) {
        langToggle.setAttribute("aria-expanded", open ? "true" : "false");
      }
    }

    function updateLangHrefs() {
      var hash = window.location.hash || "";
      langLinks.forEach(function (link) {
        var base = link.getAttribute("data-base") || link.getAttribute("href");
        link.setAttribute("href", base + hash);
      });
    }

    updateLangHrefs();
    window.addEventListener("hashchange", updateLangHrefs);

    if (langToggle && langMenu) {
      langToggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        setMenuOpen(!langSwitch.classList.contains("is-open"));
      });

      langLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            setMenuOpen(false);
            return;
          }
          event.preventDefault();
          var href = link.getAttribute("href");
          setMenuOpen(false);
          if (href) {
            window.location.href = href;
          }
        });
      });

      document.addEventListener("click", function (event) {
        if (langSwitch.contains(event.target)) return;
        setMenuOpen(false);
      });

      document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        setMenuOpen(false);
      });
    }
  }

  var carousel = document.getElementById("appshotsCarousel");
  var dots = Array.prototype.slice.call(document.querySelectorAll(".appshots-dot"));
  if (!carousel || !dots.length) return;

  var threshold = 5;
  var speed = 1.2;
  var cloneCount = 3;
  var snapThreshold = 24;
  var isPointerDown = false;
  var isDragging = false;
  var suppressClick = false;
  var startX = 0;
  var dragX = 0;
  var dragStartReal = 0;
  var animTimer = 0;
  var scrollRaf = 0;

  var originalSlides = Array.prototype.slice.call(carousel.querySelectorAll(".appshots-item"));
  if (!originalSlides.length) return;
  var realCount = originalSlides.length;

  if (realCount > 1) {
    originalSlides.slice(-cloneCount).forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.setAttribute("data-clone", "start");
      clone.setAttribute("aria-hidden", "true");
      carousel.insertBefore(clone, carousel.firstChild);
    });
    originalSlides.slice(0, cloneCount).forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.setAttribute("data-clone", "end");
      clone.setAttribute("aria-hidden", "true");
      carousel.appendChild(clone);
    });
  }

  var allSlides = Array.prototype.slice.call(carousel.querySelectorAll(".appshots-item"));
  var realSlides = allSlides.slice(cloneCount, cloneCount + realCount);

  function setActive(index) {
    dots.forEach(function (dot, dotIndex) {
      var isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function nearestSlideIndex() {
    var position = carousel.scrollLeft;
    var nearest = 0;
    var minDist = Infinity;
    allSlides.forEach(function (slide, index) {
      var dist = Math.abs(slide.offsetLeft - position);
      if (dist < minDist) {
        minDist = dist;
        nearest = index;
      }
    });
    return nearest;
  }

  function normalizeIndex(index) {
    if (index < cloneCount) return index + realCount;
    if (index >= cloneCount + realCount) return index - realCount;
    return index;
  }

  function syncActiveDot() {
    var normalized = normalizeIndex(nearestSlideIndex());
    setActive(normalized - cloneCount);
  }

  function clearAnimating() {
    carousel.classList.remove("is-animating");
  }

  function withNoSmooth(fn) {
    clearTimeout(animTimer);
    clearAnimating();
    carousel.classList.add("no-smooth");
    fn();
    requestAnimationFrame(function () {
      carousel.classList.remove("no-smooth");
    });
  }

  function smoothTo(left) {
    clearTimeout(animTimer);
    carousel.classList.add("is-animating");
    carousel.scrollTo({ left: left, behavior: "smooth" });
    animTimer = setTimeout(clearAnimating, 340);
  }

  function maybeTeleport() {
    var from = nearestSlideIndex();
    var to = normalizeIndex(from);
    if (from === to) return;
    withNoSmooth(function () {
      carousel.scrollTo({ left: allSlides[to].offsetLeft, behavior: "auto" });
    });
  }

  function clampRealIndex(index) {
    return ((index % realCount) + realCount) % realCount;
  }

  function trackIndexForReal(realIndex) {
    var normalizedReal = clampRealIndex(realIndex);
    var candidates = [cloneCount + normalizedReal];
    if (normalizedReal >= realCount - cloneCount) {
      candidates.push(normalizedReal - (realCount - cloneCount));
    }
    if (normalizedReal < cloneCount) {
      candidates.push(cloneCount + realCount + normalizedReal);
    }

    var current = carousel.scrollLeft;
    var chosen = candidates[0];
    var minDist = Infinity;
    candidates.forEach(function (idx) {
      var dist = Math.abs(allSlides[idx].offsetLeft - current);
      if (dist < minDist) {
        minDist = dist;
        chosen = idx;
      }
    });
    return chosen;
  }

  function syncLoopAndDots() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      maybeTeleport();
      syncActiveDot();
    });
  }

  function goToInitialSlide() {
    if (!realSlides[0]) return;
    withNoSmooth(function () {
      carousel.scrollTo({ left: realSlides[0].offsetLeft, behavior: "auto" });
    });
  }

  function endDrag() {
    if (!isPointerDown) return;
    isPointerDown = false;
    carousel.classList.remove("is-dragging");

    if (isDragging) {
      var totalDelta = dragX - startX;
      var targetReal = dragStartReal;
      if (Math.abs(totalDelta) > snapThreshold) {
        targetReal = dragStartReal + (totalDelta < 0 ? 1 : -1);
      }
      var targetTrack = trackIndexForReal(targetReal);

      suppressClick = true;
      smoothTo(allSlides[targetTrack].offsetLeft);
      setTimeout(function () {
        suppressClick = false;
      }, 0);
    }

    isDragging = false;
  }

  carousel.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return;
    isPointerDown = true;
    isDragging = false;
    startX = event.clientX;
    dragX = event.clientX;
    dragStartReal = normalizeIndex(nearestSlideIndex()) - cloneCount;
  });

  carousel.addEventListener("mousemove", function (event) {
    if (!isPointerDown) return;
    var delta = event.clientX - startX;
    if (!isDragging && Math.abs(delta) > threshold) {
      isDragging = true;
      clearTimeout(animTimer);
      carousel.classList.add("is-dragging");
      dragX = event.clientX;
    }
    if (!isDragging) return;
    event.preventDefault();
    carousel.scrollLeft -= (event.clientX - dragX) * speed;
    dragX = event.clientX;
  });

  carousel.addEventListener("mouseleave", endDrag);
  window.addEventListener("mouseup", endDrag);
  window.addEventListener("blur", endDrag);
  carousel.addEventListener("touchend", function () {
    maybeTeleport();
    syncActiveDot();
  }, { passive: true });
  carousel.addEventListener("touchcancel", function () {
    maybeTeleport();
    syncActiveDot();
  }, { passive: true });

  carousel.addEventListener("dragstart", function (event) {
    event.preventDefault();
  });

  carousel.addEventListener("click", function (event) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      var target = realSlides[index];
      if (!target) return;
      smoothTo(target.offsetLeft);
      setActive(index);
    });
  });

  carousel.addEventListener("scroll", syncLoopAndDots, { passive: true });
  window.addEventListener("resize", function () {
    maybeTeleport();
    syncActiveDot();
  });

  goToInitialSlide();
  syncActiveDot();
})();
