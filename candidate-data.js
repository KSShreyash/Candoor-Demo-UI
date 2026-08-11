/**
 * Mock data for the candidate walkthrough — shaped the way the real
 * `/rounds/:id/invitation` and `/sessions/:id/draft` responses are shaped in
 * app.js, but hand-written and fixed rather than fetched.
 *
 * Plain script, not a module — see guide.js for why. Exposed as
 * window.CandoorCandidateData.
 */

const invitation = {
  orgName: "Northwind Robotics",
  theme: "How the Q3 warehouse rollout actually went",
  brief: "work",
  orgContext:
    "We build warehouse robots. About 40 people, shipping weekly, and every team runs its own on-call.",
  manifestFingerprint: "8f2c-19ae-77bd-40f1",
  safeguarding: {
    agreed: true,
    notice:
      "If anything you say points to an immediate risk to someone's safety, the interviewer will pause and tell you how to reach the safeguarding channel below. That is the only reason this conversation would ever be interrupted.",
    channel: "safeguarding@northwindrobotics.example, or your HR business partner directly.",
  },
  reducedDeniabilityNotice: null,
  invitationLines: [
    "Nothing you say is stored until you have read the exact text and approved it.",
    "The conversation itself — audio or transcript — is never kept, only the text you approve.",
    "Names, teams and dates in what you approve are generalized before anyone else reads it.",
    "No one can tell whether you took part. There is no attendance list.",
    "This theme will not ask about your individual performance.",
    "Your response joins at least two others before any theme reaches a report.",
    "This round is for 20 people; if fewer than that take part, the report says so.",
    "Approved text is kept for 12 months, then deleted.",
  ],
};

const transcript = [
  { speaker: "them", text: "Thanks for making the time. In your own words — how did the Q3 rollout actually go?" },
  { speaker: "you", text: "Honestly, the first two weeks were rough. We found out about the cutover date the same week it happened." },
  { speaker: "them", text: "What would have made that easier to absorb?" },
  { speaker: "you", text: "Just more lead time. Even a week would have let us stagger who was on call." },
  { speaker: "them", text: "Was that a one-off, or does timing like that come up often?" },
  { speaker: "you", text: "It comes up most quarters, if I'm being honest. We plan around it now, but we shouldn't have to." },
  { speaker: "them", text: "That's really useful, thank you. Anything that went well worth mentioning too?" },
  { speaker: "you", text: "The new rollback tooling was genuinely great — first time a rollout scare didn't turn into a fire drill." },
];

const draftSegments = [
  "The rollout timeline was communicated with very little lead time, which made staffing on-call difficult.",
  "This kind of short-notice timing has recurred across multiple quarters, not just this one.",
  "The team has adapted by planning around it, but would prefer not to have to.",
  "The new rollback tooling was a clear improvement, and reduced the severity of a rollout issue this quarter.",
];

window.CandoorCandidateData = { invitation, transcript, draftSegments };
