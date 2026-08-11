// Wrapped in an IIFE deliberately: this is a plain script sharing one global
// scope with candidate-data.js, which declares its own top-level `const
// invitation` etc. Destructuring those same names at this file's top level
// collided with that declaration ("Identifier 'invitation' has already been
// declared") and silently killed the whole script, including every button
// handler below. A function scope lets these shadow the outer names instead.
(function () {
  const { invitation, transcript, draftSegments } = window.CandoorCandidateData;
  const { startGuide } = window.CandoorGuide;

  const $ = (id) => document.getElementById(id);

  // --- Smooth expand/collapse for every accordion (<details class="disclosure">)
  // on the page, in both sidebars. A generic motion utility, not sidebar
  // component logic — it doesn't care which drawer a disclosure lives in.
  // Native <details> has no animation at all (open/closed is an instant
  // cut); this animates the <details> element's own height instead, rather
  // than restructuring its children into a wrapper, so nothing that depends
  // on the existing DOM shape (e.g. the safeguarding block's `summary ~ *`
  // border rule) is at risk of breaking. Every place in this file that used
  // to write `.open = true/false` directly calls setDisclosureOpen instead,
  // so a guide-driven open animates exactly like a real click. -------------

  const DISCLOSURE_EASING = "cubic-bezier(0.2, 0.7, 0.3, 1)";
  const disclosureAnimations = new WeakMap();

  function setDisclosureOpen(details, open) {
    const running = disclosureAnimations.get(details);
    if (running) {
      running.cancel();
      disclosureAnimations.delete(details);
    }

    if (open === details.open) {
      details.style.height = "";
      details.style.overflow = "";
      return;
    }

    const summary = details.querySelector(":scope > summary");
    const collapsedHeight = summary.getBoundingClientRect().height;

    if (open) {
      details.open = true;
      details.classList.add("is-expanded");
      const expandedHeight = details.scrollHeight;
      details.style.height = `${collapsedHeight}px`;
      details.style.overflow = "hidden";
      void details.offsetHeight; // force reflow so the collapsed start height is registered before animating
      const anim = details.animate(
        [{ height: `${collapsedHeight}px` }, { height: `${expandedHeight}px` }],
        { duration: 280, easing: DISCLOSURE_EASING }
      );
      disclosureAnimations.set(details, anim);
      anim.onfinish = () => {
        details.style.height = "";
        details.style.overflow = "";
        disclosureAnimations.delete(details);
      };
    } else {
      const expandedHeight = details.getBoundingClientRect().height;
      details.classList.remove("is-expanded");
      details.style.height = `${expandedHeight}px`;
      details.style.overflow = "hidden";
      void details.offsetHeight;
      const anim = details.animate(
        [{ height: `${expandedHeight}px` }, { height: `${collapsedHeight}px` }],
        { duration: 240, easing: DISCLOSURE_EASING }
      );
      disclosureAnimations.set(details, anim);
      anim.onfinish = () => {
        details.open = false;
        details.style.height = "";
        details.style.overflow = "";
        disclosureAnimations.delete(details);
      };
    }
  }

  function initSmoothDisclosures() {
    document.querySelectorAll("details.disclosure").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      if (!summary) return;
      summary.addEventListener("click", (event) => {
        event.preventDefault();
        setDisclosureOpen(details, !details.open);
      });
    });
  }

  initSmoothDisclosures();

  // --- Populate the panel from mock data, same shape as the real page's
  // loadInvitation() in app.js -----------------------------------------

  function paintInvitation() {
    $("sea-heading").textContent = invitation.theme;
    $("asking").textContent = `A listening round at ${invitation.orgName}`;

    const list = $("promise-list");
    list.replaceChildren();
    for (const line of invitation.invitationLines) {
      const li = document.createElement("li");
      li.textContent = line;
      list.append(li);
    }
    const n = invitation.invitationLines.length;
    $("promise-count").textContent = `${n} promise${n === 1 ? "" : "s"}, locked`;

    if (invitation.orgContext) {
      $("org-context").textContent = invitation.orgContext;
      $("context-block").hidden = false;
    }

    const BRIEF_LINES = {
      work: "This one is about how the work itself has been going — what worked, what did not, and what you would change.",
      wellbeing:
        "This one is about how you have been finding things — the work, the pace, and how it has been for you. It will not ask about your performance.",
    };
    if (BRIEF_LINES[invitation.brief]) {
      $("brief-line").textContent = BRIEF_LINES[invitation.brief];
      $("brief-line").hidden = false;
    }

    if (invitation.safeguarding?.agreed) {
      $("safeguarding-notice").textContent = invitation.safeguarding.notice;
      $("safeguarding-channel").textContent = invitation.safeguarding.channel;
      $("safeguarding-block").hidden = false;
    }

    if (invitation.reducedDeniabilityNotice) {
      $("reduced-notice").textContent = invitation.reducedDeniabilityNotice;
      $("reduced-notice").hidden = false;
    }

    $("fingerprint").textContent = invitation.manifestFingerprint;
  }

  paintInvitation();

  // --- Populate the INTERVIEW sidebar's own copy of the same promise data.
  // Deliberately a separate function against separate "interview-*" ids,
  // not a call into paintInvitation() above — the two sidebars don't share
  // rendering code, only the same underlying mock `invitation` object. -----

  function paintInterviewPromises() {
    const list = $("interview-promise-list");
    list.replaceChildren();
    for (const line of invitation.invitationLines) {
      const li = document.createElement("li");
      li.textContent = line;
      list.append(li);
    }
    const n = invitation.invitationLines.length;
    $("interview-promise-count").textContent = `${n} promise${n === 1 ? "" : "s"}, locked`;

    if (invitation.orgContext) {
      $("interview-org-context").textContent = invitation.orgContext;
      $("interview-context-block").hidden = false;
    }

    const INTERVIEW_BRIEF_LINES = {
      work: "This one is about how the work itself has been going — what worked, what did not, and what you would change.",
      wellbeing:
        "This one is about how you have been finding things — the work, the pace, and how it has been for you. It will not ask about your performance.",
    };
    if (INTERVIEW_BRIEF_LINES[invitation.brief]) {
      $("interview-brief-line").textContent = INTERVIEW_BRIEF_LINES[invitation.brief];
      $("interview-brief-line").hidden = false;
    }

    if (invitation.safeguarding?.agreed) {
      $("interview-safeguarding-notice").textContent = invitation.safeguarding.notice;
      $("interview-safeguarding-channel").textContent = invitation.safeguarding.channel;
      $("interview-safeguarding-block").hidden = false;
    }

    if (invitation.reducedDeniabilityNotice) {
      $("interview-reduced-notice").textContent = invitation.reducedDeniabilityNotice;
      $("interview-reduced-notice").hidden = false;
    }

    $("interview-fingerprint").textContent = invitation.manifestFingerprint;
  }

  paintInterviewPromises();

  // --- The login sidebar (rules) — its own component, own open/close/toggle
  // functions, not shared with the interview sidebar below. -----------------

  function openLoginSidebar() {
    $("login-sidebar").classList.add("open");
    $("login-sidebar").setAttribute("aria-hidden", "false");
    document.body.classList.add("sidebar-open");
    $("login-sidebar-open").textContent = "Hide rules";
  }

  function closeLoginSidebar() {
    $("login-sidebar").classList.remove("open");
    $("login-sidebar").setAttribute("aria-hidden", "true");
    document.body.classList.remove("sidebar-open");
    $("login-sidebar-open").textContent = "Rules ▸";
  }

  $("login-sidebar-open").addEventListener("click", () => {
    if ($("login-sidebar").classList.contains("open")) closeLoginSidebar();
    else openLoginSidebar();
  });

  closeLoginSidebar();

  // --- The interview sidebar (submission) — its own component, own
  // open/close functions, not shared with the login sidebar above. ---------

  function openInterviewSidebar() {
    $("interview-sidebar").classList.add("open");
    $("interview-sidebar").setAttribute("aria-hidden", "false");
    document.body.classList.add("sidebar-open");
    $("interview-sidebar-open").textContent = "Hide rules & submission";
  }

  function closeInterviewSidebar() {
    $("interview-sidebar").classList.remove("open");
    $("interview-sidebar").setAttribute("aria-hidden", "true");
    document.body.classList.remove("sidebar-open");
    $("interview-sidebar-open").textContent = "Rules & submission ▸";
  }

  $("interview-sidebar-open").addEventListener("click", () => {
    if ($("interview-sidebar").classList.contains("open")) closeInterviewSidebar();
    else openInterviewSidebar();
  });

  closeInterviewSidebar();

  // --- Admission: the "Enter" button on the login card --------------------

  // The guide only starts once the interview begins, so the login card is
  // left exactly as it looks in production — nothing overlaid on it, nothing
  // pointing at it.
  let guideStarted = false;

  // The one place "we're past login" is decided — this is what swaps which
  // of the two sidebars (and toggles) exists at all: the login sidebar is
  // hidden for good, not just collapsed, and the interview sidebar appears
  // for the first time.
  function enterInterview() {
    closeLoginSidebar();
    $("login-sidebar").hidden = true;
    $("login-sidebar-open").hidden = true;

    $("interview-sidebar").hidden = false;
    $("interview-sidebar-open").hidden = false;

    $("admit-step").hidden = true;
    $("interview-step").hidden = false;

    if (!guideStarted) {
      guideStarted = true;
      startCandidateGuide();
    }
  }

  $("admit-form").addEventListener("submit", (event) => {
    // The form has no real backend to post to — this is a mock key, and the
    // point of preventDefault here is exactly what it is on the real page:
    // stop the browser's default GET-and-reload submission and hand control
    // to the app instead.
    event.preventDefault();
    enterInterview();
  });

  // --- The draft: rendered as removable segments --------------------------

  const dropped = new Set();

  function paintDraft() {
    const host = $("draft");
    host.replaceChildren();

    const list = document.createElement("ul");
    list.className = "draft-list";

    draftSegments.forEach((segment, index) => {
      const isDropped = dropped.has(index);
      const row = document.createElement("li");
      const part = document.createElement("button");
      part.type = "button";
      part.className = isDropped ? "seg seg--dropped" : "seg";
      part.textContent = segment;
      part.setAttribute("aria-pressed", isDropped ? "true" : "false");
      part.addEventListener("click", () => {
        if (dropped.has(index)) dropped.delete(index);
        else dropped.add(index);
        paintDraft();
      });
      row.append(part);
      list.append(row);
    });

    host.append(list);

    const removed = dropped.size;
    $("draft-removed").hidden = removed === 0;
    $("draft-removed").textContent =
      removed === 0 ? "" : `${removed} line${removed === 1 ? "" : "s"} will not be sent.`;
  }

  // --- Transcript playback (scripted) --------------------------------------

  let turnsShown = 0;

  function appendNextTurn() {
    if (turnsShown >= transcript.length) return;

    // Before the first turn, interview-step marks itself as the interview —
    // mic button only, no empty chat furniture underneath it. The chat only
    // exists from the moment there's actually something in it to show, and
    // only on the FIRST turn — after that, "hidden" belongs to the
    // transcript-toggle button, not to this function.
    if (turnsShown === 0) {
      $("transcript-toggle").hidden = false;
      $("exchange").hidden = false;
      $("turn-count").hidden = false;
    }

    const { speaker, text } = transcript[turnsShown];
    const li = document.createElement("li");
    li.className = speaker;
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = speaker === "you" ? "You" : "Interviewer";
    const body = document.createElement("span");
    body.textContent = text;
    li.append(who, body);
    $("exchange").append(li);
    $("exchange").scrollTop = $("exchange").scrollHeight;
    turnsShown += 1;

    $("progress").hidden = false;
    $("turn-count").textContent = `${turnsShown} thing${turnsShown === 1 ? "" : "s"} said`;
    $("progress-fill").style.width = `${Math.min(92, turnsShown * 12)}%`;
  }

  // Back to exactly how interview-step looked before anyone said anything —
  // mic button, no chat. Used by the guide once it's shown its brief sample
  // exchange, so the demo doesn't leave a half (or fully) populated
  // transcript sitting there while it moves on to explain the draft.
  function resetInterviewDisplay() {
    turnsShown = 0;
    $("exchange").replaceChildren();
    $("exchange").hidden = true;
    $("transcript-toggle").hidden = true;
    $("turn-count").hidden = true;
    $("progress").hidden = true;
    $("progress-fill").style.width = "0%";
    $("mic-button").setAttribute("aria-pressed", "false");
    $("mic-label").textContent = "Start the interview";
    $("mic-state").textContent = "microphone off";
  }

  // The one place "interview is over" is decided, whether that happened via
  // the guide jumping straight to it or by driving the mic directly after
  // skipping the guide — so both paths fill in and open the draft tab the
  // same way, matching the real page: "Nothing yet." and a disabled Approve
  // until this exact moment, then the real text and a usable button.
  function markInterviewComplete() {
    $("mic-label").textContent = "Interview finished";
    $("mic-button").setAttribute("aria-pressed", "false");
    paintDraft();
    $("approve").disabled = false;
    setDisclosureOpen($("draft-step"), true);
    openInterviewSidebar();
  }

  function playAllTurns() {
    while (turnsShown < transcript.length) appendNextTurn();
    $("progress-fill").style.width = "100%";
    markInterviewComplete();
  }

  $("transcript-toggle").addEventListener("click", () => {
    const expanded = $("transcript-toggle").getAttribute("aria-expanded") === "true";
    $("transcript-toggle").setAttribute("aria-expanded", String(!expanded));
    $("exchange").hidden = expanded;
    $("transcript-toggle").textContent = expanded ? "Show what the interviewer says" : "Hide what the interviewer says";
  });

  $("mic-button").addEventListener("click", () => {
    if ($("mic-button").getAttribute("aria-pressed") === "true") return;
    $("mic-button").setAttribute("aria-pressed", "true");
    $("mic-state").textContent = "listening";
    $("mic-label").textContent = "Listening…";

    // So the page works on its own even if someone skips the guide: the mic
    // plays the same scripted exchange the guide's "Next" button plays,
    // rather than sitting there doing nothing without the guide driving it.
    window.setTimeout(playAllTurns, 1200);
  });

  $("review").addEventListener("click", () => {
    setDisclosureOpen($("draft-step"), true);
  });

  // Approve/discard swap the panel's content exactly like the real page:
  // collapse draft-step (nothing left to review), show done-step, in the
  // SAME column — not a separate "outcome" box bolted on elsewhere.
  $("approve").addEventListener("click", () => {
    $("interview-step").hidden = true;
    setDisclosureOpen($("draft-step"), false);
    $("done-heading").textContent = "Submitted";
    $("done-message").textContent =
      "Exactly the text you approved was stored, with nothing attached to it that could identify you. Thank you.";
    $("done-step").hidden = false;
    openInterviewSidebar();
  });

  $("discard").addEventListener("click", () => {
    $("interview-step").hidden = true;
    setDisclosureOpen($("draft-step"), false);
    $("done-heading").textContent = "Discarded";
    $("done-message").textContent = "Nothing from this interview was stored. There is no record that it happened.";
    $("done-step").hidden = false;
    openInterviewSidebar();
  });

  // --- The guided tour ------------------------------------------------------
  //
  // Deliberately NOT started at page load: the login card and its rules
  // sidebar are left alone, exactly as they look in production, with no
  // guide pointing at either. The tour begins only once the interview does,
  // and only ever touches the interview sidebar's own elements — its
  // "interview-*" promise copy and #draft-step — never the login sidebar's.

  // Every tab in the INTERVIEW sidebar, closed. Called at the START of each
  // step that opens a different one than the step before it, so only the
  // thing currently being explained is ever open, forward or backward
  // through the guide. Only touches "interview-*" ids — collapsing these
  // has no effect on the login sidebar's own (separately-tracked) state.
  function collapseInterviewSidebarSections() {
    setDisclosureOpen($("interview-promise-detail"), false);
    setDisclosureOpen($("interview-safeguarding-block"), false);
    setDisclosureOpen($("interview-context-block"), false);
    setDisclosureOpen($("draft-step"), false);
  }

  // Called once, when the guide itself ends (finished or skipped), not
  // between steps. Only tidies the accordion back shut — it must NOT touch
  // turnsShown/dropped/draft/approve, because by this point those may hold
  // real progress the visitor made themselves (pressing the mic, dropping a
  // line). The guide never writes that state, so it has no business erasing
  // it either.
  function resetToGuideEnd() {
    collapseInterviewSidebarSections();
  }

  function startCandidateGuide() {
    startGuide(
      [
        {
          title: "What this round promises",
          body: "Before anyone speaks, they can open this panel and read every rule this round is bound to — generated from the round's locked configuration, not written to sound reassuring. Use the 'Rules & submission' button any time to see it again.",
          spotlight: "#interview-promise-detail",
          onEnter: () => {
            collapseInterviewSidebarSections();
            openInterviewSidebar();
            setDisclosureOpen($("interview-promise-detail"), true);
          },
        },
        {
          title: "What the AI knows",
          body: "This — and only this — is what the interviewer was given: the org's name, this short paragraph of background, and the theme. Nothing about who the candidate is.",
          spotlight: "#interview-context-block",
          onEnter: () => {
            collapseInterviewSidebarSections();
            openInterviewSidebar();
            setDisclosureOpen($("interview-context-block"), true);
          },
        },
        {
          title: "Talking to the interviewer",
          body: "This is the space itself — nothing scripted to show here, because what goes in it is whatever the candidate actually says. Press “Start the interview” yourself whenever you're ready — the guide never presses it for you.",
          spotlight: "#interview-step",
          onEnter: () => {
            collapseInterviewSidebarSections();
            closeInterviewSidebar();
          },
        },
        {
          title: "What would be submitted",
          body: "This stays exactly like this — “Nothing yet,” Approve disabled — until a real interview actually finishes. Once it does, the candidate's words appear here as removable segments, generalized and ready to review before anything is sent.",
          spotlight: "#draft-step",
          onEnter: () => {
            collapseInterviewSidebarSections();
            openInterviewSidebar();
            setDisclosureOpen($("draft-step"), true);
          },
        },
        {
          title: "Approve or discard",
          body: "Only two ways out from here, both inside this same panel: approve exactly this text, or discard it and leave no trace the interview happened. Approve only turns on once a real interview has actually finished.",
          spotlight: "#draft-step .actions",
          onEnter: () => {
            openInterviewSidebar();
            setDisclosureOpen($("draft-step"), true);
          },
        },
      ],
      { onClose: resetToGuideEnd }
    );
  }
})();
