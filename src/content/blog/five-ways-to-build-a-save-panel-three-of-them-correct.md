---
title: "Five ways to build a save panel, three of them correct"
description: "Here is a save panel: a spinner, an error banner, a dirty marker, a confirm dialog, and a closed flag. Five booleans, so thirty-two combinations. Have you ever written down all thirty-two?"
date: "2026-08-07"
tags: ["typescript", "javascript", "webdev", "programming"]
devto: "https://dev.to/svyatov/five-ways-to-build-a-save-panel-three-of-them-correct-fla"
---

Here is a save panel: a spinner, an error banner, a dirty marker, a confirm dialog, and a closed flag. Five booleans, so thirty-two combinations. Have you ever written down all thirty-two?

I built it five times to find out what a statechart is actually worth. The first version breaks on the very first event I throw at it. The last version is the longest file of the five.

Every number I measured comes out of a script, and the command that printed it sits right above the output. The numbers I did not measure are linked instead. Versions: `xstate@5.32.5`, bun 1.3.14, TypeScript 7.0.2 and 5.9.3, 2026-08-06.

One scope note, because it cuts against the tool I am measuring. All five versions are pure functions from a state and an event to a new state: no view layer, no network, no request that actually goes anywhere. So XState's `invoke` never appears here, and neither does the cancellation that comes with it (which is a real part of what the library is for, and would have made one of the bugs below its problem rather than mine). I measure the shape of the state, and only that.

## The spec, as eight rules

If the rules live in prose, every later claim is an opinion. So they live in code, once, and every implementation gets checked against the same eight. Each rule looks at one transition: the screen before, the screen after, the event, and whether the event was a reply to a save that is no longer running.

```ts
// R3: a reply from a save that is no longer in flight changes nothing.
R3_stale_reply_ignored: ({ stale, before, after, beforeInflight, afterInflight }) =>
  stale && (!sameView(before, after) || beforeInflight !== afterInflight)
    ? "a stale reply changed the screen"
    : null,

// R7: once closed, nothing changes.
R7_closed_is_terminal: ({ before, after }) =>
  before.closed && !sameView(before, after) ? "the screen changed after closing" : null,

// R8: a closed panel is not still saving, erroring, or asking.
R8_closing_stops_everything: ({ after }) =>
  after.closed && (after.spinner || after.errorBanner || after.confirmDialog)
    ? "the panel closed while still saving, showing an error, or asking"
    : null,
```

A rule returns a complaint or `null`, and `sameView` just compares the five on-screen signals. The other five rules cover the ordinary things: no spinner and error banner at once, a new save clears the old error, no second save while one is in flight, a successful save leaves the draft clean, and closing with unsaved edits asks first.

A walker drives all five versions. It starts at the initial state, fires every event, and repeats from everything new it finds. It also invents two kinds of server reply: one for the save the user is watching, and one for a save nobody is watching any more. That second one matters more than it sounds.

## One: five booleans

This is the shape a panel starts as, and I wrote it as well as I could rather than as badly as I could. It already refuses a second save. It already clears the error banner when a new save starts.

```ts
function next(s: S, e: Ev): S {
  if (s.isClosed) return s;
  switch (e.type) {
    case "EDIT":
      return { ...s, isDirty: true };
    case "SAVE":
      if (s.isSaving) return s;
      return { ...s, isSaving: true, hasError: false };
    case "CANCEL":
      return { ...s, isSaving: false };
    case "SAVE_OK":
      return { ...s, isSaving: false, hasError: false, isDirty: false };
    case "SAVE_ERR":
      return { ...s, isSaving: false, hasError: true };
    case "CLOSE":
      if (s.isDirty) return { ...s, isConfirming: true };
      return { ...s, isClosed: true };
    case "CONFIRM_DISCARD":
      return { ...s, isConfirming: false, isClosed: true };
    case "KEEP_EDITING":
      return { ...s, isConfirming: false };
  }
}
```

It breaks R3 on the first event the walker tries.

A `SAVE_ERR` arrives belonging to a save that is not running (the user cancelled, say, and the request landed anyway). The panel shows an error for something nobody is waiting on.

Look at the code and you cannot fix it. `case "SAVE_ERR"` has nothing to compare against. Five booleans can say *a save is happening*. They cannot say *which one*.

That is the point where flags start disagreeing with each other, and it is not the tired `isLoading && isError` complaint. The mainstream answer to that one has been an enum since 2020, when Kent C. Dodds wrote [Stop using isLoading booleans](https://kentcdodds.com/blog/stop-using-isloading-booleans). Your reader already agrees. This is a different failure: the flags are individually correct and collectively meaningless.

## Two: name the request

So a reviewer says: give the request a number. Fine.

```ts
case "SAVE":
  if (s.isSaving) return s;
  return { ...s, isSaving: true, hasError: false, saveToken: s.nextToken, nextToken: s.nextToken + 1 };
case "SAVE_ERR":
  if (e.token !== s.saveToken) return s;
  return { ...s, isSaving: false, hasError: true, saveToken: null };
```

R3 is fixed. R8 still breaks.

`SAVE`, then `CLOSE` on a clean draft. The panel closes with `saveToken` still set and `isSaving` still true. The screen is gone, and the model thinks a save is in flight behind it.

The moment you add a token you have stopped using flags and started storing state. The last three versions are all arguments about *what shape* that state should take.

## Three: a union for the save

Here is the version the skeptic asks for, and the skeptic is not a strawman. Here is one, [in 2023](https://news.ycombinator.com/item?id=35330873): *"I think this is solved more generally with a discriminated union in typescript. A state machine is the wrong solution unless you also need to restrict transitions themselves."*

```ts
type Save = { tag: "idle" } | { tag: "saving"; token: number } | { tag: "error" };

type S = {
  save: Save;
  dirty: boolean;
  confirming: boolean;
  closed: boolean;
  nextToken: number;
};
```

The token now lives inside `saving` and nowhere else. You cannot read a token off an idle save, because there is nothing to read.

It passes all eight rules.

That is worth sitting with, because it is the honest answer to the question everyone asks first. A tagged union and a `switch` solve this feature. No library, twenty-four lines of transition logic, done.

It also answers a question I found asked in April 2026 in an eighty-six comment thread, [with no reply](https://news.ycombinator.com/item?id=47908833): *since the state chart itself doesn't contain any data, where does the data live, and how do you handle data that's only valid in certain states?*

The union's answer is the good one. Data hangs off the state that owns it, so the compiler stops you reading it anywhere else:

```ts
type State =
  | { tag: "guest" }
  | { tag: "member"; user: string };

export function greet(s: State): string {
  // `user` exists on exactly one member of the union, and this reads it from the whole union.
  return s.user;
}
```

```plaintext
error TS2339: Property 'user' does not exist on type 'State'.
  Property 'user' does not exist on type '{ tag: "guest"; }'.
```

XState has no equivalent. Its `context` is one object typed once for the whole machine, so a field that only makes sense in one state is typed as present in all of them:

```plaintext
PASS  context.user is reachable, and null, while the machine is in `guest`
      guest context.user = null (the type says string | null in EVERY state)
```

The union asks the compiler a question the machine cannot be asked. That is a real thing it wins, and none of the articles I read concede it.

So why keep going?

Because the union's clean sheet is held up by two lines somebody has to remember to write:

```ts
const close = (s: S): S => ({
  ...s,
  closed: true,
  confirming: false,
  ...(opts.closeResetsSave ? { save: { tag: "idle" as const } } : null),   // line one
});

function next(s: S, e: Ev): S {
  if (opts.closedGuard && s.closed) return s;                              // line two
```

I made both switchable so the run can price them:

```bash
bun run src/verify-three-ways.ts
```

```plaintext
variant                                                 rules broken  which
union reducer  closedGuard=true closeResetsSave=true    0             none
union reducer  closedGuard=true closeResetsSave=false   1             R8
union reducer  closedGuard=false closeResetsSave=true   2             R7,R8
union reducer  closedGuard=false closeResetsSave=false  2             R8,R7
```

One line says *once closed, ignore everything*. The other says *closing also stops the save*. Neither is enforced by the shape. They are vigilance, written down.

And the shape allows twenty-four of the thirty-two screens while the code only ever reaches fourteen. Ten configurations exist that nothing produces and nothing checks. `closed: true` next to `save: { tag: "saving" }` is one of them.

## Four: a state machine, by hand

A state machine is three things: a set of states, a set of events, and a table saying which event moves you from where to where. That is the whole idea. It predates all of this and needs no library.

Written out, the states cover every combination of what the save is doing and whether the dialog is up. Here is one row of that table, for the state where a save is running and the dialog is down:

```ts
savingHidden: {
  EDIT: { to: "savingHidden", then: dirty },
  CANCEL: { to: "idleHidden", then: clear },
  SAVE_OK: { to: "idleHidden", when: isFresh, then: saved },
  SAVE_ERR: { to: "errorHidden", when: isFresh, then: clear },
  CLOSE: [{ to: "savingConfirming", when: isDirty }, { to: "closed", when: notDirty, then: clear }],
},
```

Three keys, and I picked the names: `to` is the next state, `when` is a guard that has to hold, and `then` updates the data alongside the state. A list is tried in order, so `CLOSE` asks the dialog first and closes only if the draft is clean. The helper named `clear` is the one worth reading twice: it does not clear the error, it forgets the token of the save in flight.

Seven states, twenty-eight arrows, no dependency. It breaks nothing, and it reaches exactly the same fourteen screens as everything that follows.

Note what fixed R8 here, because it is easy to credit the wrong thing. `closed` became a *state* instead of a field sitting beside the save. A state cannot be occupied at the same time as `savingHidden`, so "closed while saving" stopped being expressible. That is states beating flags. It has nothing to do with statecharts yet.

So, do you need the library? At this size: no. GitLab reached the same conclusion and wrote [about a hundred lines](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/assets/javascripts/lib/utils/finite_state_machine.js) of finite state machine into their own utils folder in 2021, where it still sits with no hierarchy and no regions. Expo went further: they keep an XState model of their update logic in TypeScript [as a reference document](https://xstate-in-the-wild.transistor.fm/episodes/xstate-at-expo-with-doug-lowder/transcript) and ship the real thing hand-written in Kotlin and Swift.

Look again at that table, though. `EDIT` appears in every single row. `savingConfirming` exists only because saving and confirming can happen together. Both of those are the smell.

## The two ideas

David Harel worked the two ideas out over 1982 and 1983, and he says what they are in one sentence:

> Besides a host of other constructs, the two main ideas in statecharts are hierarchy and orthogonality, and these can be intermixed on all levels.

Think about the light switches in a house.

**Hierarchy** is the breaker. The kitchen has its own switch, and so does the porch, but there is one breaker upstream of both, and throwing it turns off every room at once. Nobody wires "and also go dark when the breaker trips" into each individual lamp. That is a state containing states: being in `open` means being in exactly one of its children, and anything true of `open` is true of all of them. It is XOR, and it is why `EDIT` is written once on the parent instead of six times on the leaves.

**Orthogonality** is the two switches. The kitchen light does not know or care whether the porch light is on. You could label all four combinations on a single dial (kitchen-on-porch-off, kitchen-off-porch-on, and so on) and it would work, and you would relabel the whole dial the day somebody adds a hallway. Or you keep two switches. That is what the panel's save and its dialog are: one list of seven names becomes two lists of three and two. It is AND, and it is why `savingConfirming` stops needing a name.

The four combinations still exist in the house. You just stopped writing them down.

Harel is careful about what orthogonality is not, and every tutorial I read got this wrong:

> Orthogonal state-components in statecharts are not the same as concurrent or parallel components of the system being specified ... but simply to help structure its state space.

So: not threads, and nothing runs at the same time. Two switches on one wall.

Here is the panel with both ideas applied:

```plaintext
draft
│
├── open              two regions, both live at once
│   │                 on EDIT: mark dirty   <- written once, works from every leaf below
│   │
│   ├── save                          ├── dialog
│   │     idle                        │     hidden
│   │       SAVE          -> saving   │       CLOSE [dirty] -> confirming
│   │     saving                      │       CLOSE [clean] -> closed
│   │       SAVE_OK [fresh] -> idle   │     confirming
│   │       SAVE_ERR [fresh] -> error │       KEEP_EDITING    -> hidden
│   │       CANCEL        -> idle     │       CONFIRM_DISCARD -> closed
│   │     error                       │
│   │       SAVE          -> saving   │
│
└── closed (final)     leaving `open` exits BOTH regions
```

## Five: the statechart

Same spec, same eight rules. The guards and actions get declared first, then the shape.

```ts
export const machine = setup({
  types: {} as { context: Ctx; events: Ev },
  guards: {
    isDirty: ({ context }) => context.dirty,
    isFresh: ({ context, event }) =>
      (event.type === "SAVE_OK" || event.type === "SAVE_ERR") && event.token === context.token,
  },
  actions: {
    startSave: assign({
      token: ({ context }) => context.nextToken,
      nextToken: ({ context }) => context.nextToken + 1,
    }),
    forgetSave: assign({ token: null }),
    markSaved: assign({ dirty: false, token: null }),
    markDirty: assign({ dirty: true }),
  },
```

`isFresh` is the same token check from version two, named once and reused by both replies.

Then the shape. `open` is the parent, `type: "parallel"` makes its children regions rather than alternatives, and `EDIT` sits on the parent:

```ts
}).createMachine({
  id: "draft",
  context: { dirty: false, token: null, nextToken: 0 },
  initial: "open",
  states: {
    open: {
      type: "parallel",
      // Hierarchy: EDIT is written once here and covers every leaf below it.
      on: { EDIT: { actions: "markDirty" } },
      states: {
        // Orthogonality: these two regions are both live and neither knows about the other.
        save: {
          initial: "idle",
          states: {
            idle: { on: { SAVE: { target: "saving", actions: "startSave" } } },
            saving: {
              on: {
                SAVE_OK: { guard: "isFresh", target: "idle", actions: "markSaved" },
                SAVE_ERR: { guard: "isFresh", target: "error", actions: "forgetSave" },
                CANCEL: { target: "idle", actions: "forgetSave" },
                // No handler for SAVE: a second save cannot start while one is in flight.
              },
            },
            error: { on: { SAVE: { target: "saving", actions: "startSave" } } },
          },
        },
```

Read the `saving` block again. The rule against a second save while one is in flight is expressed by leaving something out.

The dialog region never mentions the save. Two things in it need a word. `#draft.closed` is an absolute target: the `#` means "start from the machine's id", which you need here because `closed` is not a sibling of `hidden`. And a list of transitions is tried in order, so the guarded entry gets first refusal and the unguarded one is the fallback:

```ts
        dialog: {
          initial: "hidden",
          states: {
            hidden: {
              on: { CLOSE: [{ guard: "isDirty", target: "confirming" }, { target: "#draft.closed" }] },
            },
            confirming: {
              on: { KEEP_EDITING: { target: "hidden" }, CONFIRM_DISCARD: { target: "#draft.closed" } },
            },
          },
        },
      },
    },
    // Leaving `open` exits both regions. Nothing has to remember to stop the save.
    closed: { type: "final" },
  },
});
```

`closed` is a sibling of `open`, one level up. The save region is never asked to stop. It stops because it no longer exists. (That is the breaker again: nothing tells the kitchen light to go off.)

That is the union reducer's `closeResetsSave` line, deleted and replaced by a shape.

Now run all five:

```bash
bun run src/verify-three-ways.ts
```

```plaintext
SPEC: a draft editor's save panel. 8 rules, 8 events, 5 on-screen signals (2^5 = 32 screens).

implementation                  screens allowed  screens reached  never checked  rules broken
booleans                        32 of 32         21               11             R3,R8
booleans + request token        32 of 32         21               11             R8
union reducer                   24 of 32         14               10             none
flat machine, no library        14 of 32         14               0              none
statechart (XState v5)          14 of 32         14               0              none
```

**On this spec the statechart wins nothing on correctness.** The union reducer catches every rule it catches, and so does a flat machine with no dependency at all. All three reach an identical set of fourteen screens, and the run fails on purpose if they ever diverge.

Do not read too much into the "screens allowed" column, though. It flatters machines by construction (a machine's set of possible states *is* its list of declared states, so its slack is structurally zero), which means it separates machines from flags and tells you nothing about statecharts against flat machines.

And the walker is a search, not a proof: it treats two internal states that look identical on screen as one node. So a second check expands every path to a fixed depth, with no de-duplication at all:

```bash
bun run src/probe-exhaustive.ts
```

```plaintext
The shipped walker de-dups by (screen, save in flight?). This one does not de-dup at all:
every event path to depth 6, on all three implementations that broke no rule.

  union reducer              paths= 352971  violations=none
  flat machine, no library   paths= 374841  violations=none
  statechart (XState v5)     paths= 374841  violations=none

PASS: the de-duplicating walker hid nothing. Same verdict under the exhaustive one.
```

Six events deep is a bound, not a proof. It is a much wider net than the first walk, and it is still a net.

## So what did that buy?

Arrows.

```bash
bun run src/verify-explosion.ts
```

```plaintext
Same spec, same behaviour, two shapes:

  flat machine     7 states, 28 arrows written by hand
  statechart       6 leaf states (10 nodes with parents), 10 arrows written
  ratio            2.8x fewer arrows in the statechart
```

I do not want you to take that on faith, and I did not either. The script flattens the statechart mechanically: cross-product the two regions, copy each leaf's arrows into every combination it appears in, add the parent's arrows once per combination. It gets seven states and twenty-eight arrows. That is the hand-written flat machine, exactly, and the script exits non-zero if it ever stops matching.

Which means I can add concerns and let it do the arithmetic. Each new concern below is a two-state toggle with one arrow per state. An "offline / online" indicator. A "compact / expanded" view.

```plaintext
  extra   flat states   flat arrows   chart leaves   chart arrows   union: allowed / unchecked
  0       7             28            6              10             24 / 10
  1       13            68            8              12             48 / 20
  2       25            160           10             14             96 / 40
  3       49            368           12             16             192 / 80
  4       97            832           14             18             384 / 160
```

Four independent toggles is not an exotic feature (a save panel that also knows about the network, the layout, whether the document is shared, and whether you are on a phone). Ninety-seven states and eight hundred arrows, or fourteen states and eighteen arrows.

But read the last column before you conclude anything, because **the union reducer is not on the exploding side of this table.** A toggle costs it one more boolean field, not a cross product of names. What grows for the union is the space nothing checks: at four toggles its shape admits 384 configurations, 160 of which nothing reaches and no rule inspects. The statechart's figure there is zero at every row, because a machine's shape is its list of states.

So the choice the table actually offers is not statechart or explosion. It is: write the cross product out by hand, or keep a boolean field per concern and accept that most of what your type allows is never looked at.

And here is the caveat that keeps the rest of it honest: **both machine columns describe the same program.** The configuration space did not shrink. Three regions of two states each is eight configurations either way:

```bash
bun run src/verify-orthogonality.ts
```

```json
Three orthogonal regions, two states each:

  written down     6 leaf states, 6 arrows
  reachable        8 configurations
  the formalism    2^3 = 8
  initial value    {"a":"a1","b":"b1","c":"c1"}
```

Orthogonality does not make your program simpler. It makes the description shorter, and the description is the thing a person has to hold in their head.

One more thing before I let the statechart off. Back in section three I knocked out the reducer's two hand-written lines to show they were vigilance rather than structure. It would be unfair to stop there, so I ran the same sweep on the statechart:

```plaintext
statechart     isFresh=true                             0             none
statechart     isFresh=false                            1             R3
```

Turn off the token guard and the statechart breaks R3, exactly the way the flags version did on the very first event. Neither the hierarchy nor the two regions produce that guard. It is a line I wrote by hand, same as the reducer's two, and nothing complains when it goes missing.

So the score is honest: the shape bought R7 and R8, in every version that made `closed` a state. It did not buy R3, in any version. Somebody has to write that one down.

That is the whole trade. A statechart is a notation.

## Harel ranked state explosion second

Which is exactly what it was built to be, and the story is not the one usually told.

In December 1982 Harel took a consulting job: one day a week, Thursdays, at Israel Aircraft Industries, on the avionics team of the Lavi fighter. He describes it himself in a [2007 account](https://www.weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf) that he labels highly personal and subjective, so read it as testimony rather than measurement.

The specification was two volumes of structured English, around a thousand pages each. He asked what he thought was a simple question: what happens when you press this button on the stick?

They answered it. They opened volume B, found the clause, and read it to him. So he added a condition, and they found a different clause in the other volume.

```text
Q1   what happens when you press this button?        volume B, clause 19.11.6.10
Q2   ... even with an infra-red missile locked on a ground target?  volume A, clause 6.12.3.7
Q5   ...                                             the engineers phone the customer
Q8   ...                                             "even those people often did not have an answer"
```

"Those people" is the Air Force team that owned the requirements. The team knew exactly what algorithm the radar used to measure distance to a target, and could not say what happens when you press this button under all possible circumstances.

Now the part everyone gets backwards. Ask why statecharts exist and you will be told: state explosion. Harel puts that second.

> not only because of the number of states ... even more important seemed to be the pragmatic point of view

The more important half, in his words, is that a flat list of states "has no means for modularity, hiding of information, clustering, and separation of concerns". He was complaining that you could not organize the states, not that there were too many of them.

That is a notation problem described in the vocabulary of software design, and it is why the growth table above is the *second* reason to care rather than the first.

The diagrams came last, and by accident. Harel first wrote a textual language, hierarchical "statocols" (structured state protocols, and the name did not survive either), and doodled pictures beside it to explain it. The engineers understood the doodles better than the language. Within weeks he was asking whether the pictures could replace the text rather than illustrate it.

The paper was rejected for about two and a half years. One referee wrote that "the topic is good only for a very narrow audience". [Crossref](https://api.crossref.org/works/10.1016/0167-6423%2887%2990035-9) counted 4,392 citations of it on the day I looked.

And the idea travelled a long way past the fighter jet. [SCXML](https://www.w3.org/TR/scxml/) became a W3C Recommendation in September 2015, with a normative interpretation algorithm and a conformance section, explicitly "based on CCXML and Harel State Tables". [Qt ships an engine for it](https://doc.qt.io/qt-6/qtscxml-index.html) that generates C++. Do not read that as portability for the code in this post, though: XState says it is "inspired by" SCXML and claims no conformance, so a machine written here does not move to another engine. UML state machines are, in the OMG's lineage, an object-based variant of Harel's statechart. NASA JPL [generated flight code from them](https://www.state-machine.com/doc/Benowitz2006.pdf) for the Space Interferometer Mission, and Deep Space 1 was their first mission to do it, though the public JPL autocoder repository is a ground tool whose header reads "(NO FLIGHT CODE ALLOWED)".

One tool that sells the notation, meanwhile, refuses the word. [MathWorks Stateflow](https://www.mathworks.com/products/stateflow.html) generates C, C++, VHDL and Verilog, and its customer stories name surgical device control and antenna stabilization. Its product page never once says "Harel" or "statechart". It says state transition diagrams and truth tables.

## Splitting a machine, and the types

Everything above is one small machine. The complaint I kept running into starts with the second one: people try to split a definition into reusable pieces and the types fight back.

That complaint dates from XState v4, so I re-ran it against what ships today, on both current TypeScript majors:

```bash
bun run src/verify-ts-splitting.ts
```

```plaintext
xstate 5.32.5, tsc --strict, TypeScript 7.0.2 and 5.9.3

                                                            7.0.2           5.9.3
A  shared sub-state object, spread into two machines        FAILS TS2345    FAILS TS2345
A2 the same chunk, with `as const`                          FAILS TS2345    FAILS TS2345
A3 the same chunk, typed from the builder's config type     compiles        compiles
B  split into a child machine and invoked                   compiles        compiles
C  persist a snapshot and restore it, no `any`              compiles        compiles
D  config chunk in another module, guard named in setup()   FAILS TS2345    FAILS TS2345
D2 the same chunk, with `as const`                          compiles        compiles
D3 the same chunk, typed from the builder's config type     compiles        compiles
E  the documented way: setup(...).createStateConfig(...)    compiles        compiles

Both compilers agree on every case.
```

The naive split does still fail. Plain TypeScript causes it, though, not statecharts: pull a chunk into a bare object literal and `"isHigh"` widens from a literal to `string`, and the config type wanted the literal.

The fix is documented and I had missed it. `setup(...).createStateConfig(...)` has shipped since 5.21.0 and it compiles clean with the guard still named as a string, no cast:

```ts
const builder = setup({
  types: {} as { context: Ctx; events: Ev },
  guards: { isHigh: ({ context }) => context.count > 3 },
});

export const states = builder.createStateConfig({
  initial: "low",
  states: {
    low: { on: { BUMP: [{ guard: "isHigh", target: "high" }, { target: "low" }] } },
    high: {},
  },
});
```

Do not reach for `as const` instead. It rescues case D2 and stops working the moment the chunk contains an inline `assign(...)`, which is case A2, still failing above.

Harel, incidentally, would not have started here at all. "No one is encouraged to specify a single statechart for an entire system," he writes, footnoting that his own famous digital-watch example did exactly that for presentation reasons.

## The bill

The statechart is the longest of the five files:

```bash
bun run src/verify-cost.ts
```

```plaintext
lines of code, blank and comment lines dropped:

                       whole file   transition logic only
  booleans             62           23
  booleans + token     68           25
  union reducer        70           24
  flat machine         94           40
  statechart           116          57
  (whole-file counts include the adapter each version needs to join the test harness)
```

Read the right column (the left one counts each version's glue into my test harness, which is my problem and not yours). Fifty-seven lines of transition logic against the union reducer's twenty-four, for identical behaviour. That gap is real, and I did not measure where or whether it closes, so I will not tell you that it does.

Then the bytes. And here I got a surprise, because I assumed the weight was the runtime:

```bash
bun run src/verify-cost.ts   # same script, second half of its output
```

```plaintext
  nothing (baseline)   min     24 B   gzip    44 B   (esbuild    44 B)
  xstate               min  42362 B   gzip 13965 B   (esbuild 12697 B)
    the builder only   min  42333 B   gzip 13947 B   (esbuild 12688 B)
    the runtime only   min   9937 B   gzip  3452 B   (esbuild  3088 B)
    pure transitions   min  10379 B   gzip  3586 B   (esbuild  3225 B)
  @xstate/store        min   7330 B   gzip  2854 B   (esbuild  2789 B)

  the two bundlers differ by at most 11% on any real row.
```

The thing that drives a machine is three and a half kilobytes. The thing that *defines* one is fourteen. Of the 13,965 bytes you actually ship, the runtime is 3,452, so three quarters of it is the notation. (Do not add the builder and the runtime together: they overlap heavily, so the two numbers are not a split of the total. And never quote a kilobyte figure without saying which bundler produced it, which is what that eleven percent is doing there.)

While measuring that, I noticed `@xstate/store` advertises itself as "**Extremely small**: less than 1kb minified/gzipped". Today it measures 2,854 bytes gzipped. I installed version 1.0.0 to check, and there the claim was true: 533 bytes. The package grew and the line did not.

More costs, none of which the field prices:

**What you learn expires.** XState has shipped three incompatible ways to write a machine in three majors.

```text
2018-10-29  v4         Machine(...)         cond:     interpret(...)
2023-12-01  v5         createMachine(...)   guard:    createActor(...)   setup({ types })
2026-06-20  v6 alpha   the v5 action and guard creators removed; schemas replace types
```

The v4-to-v5 [migration guide](https://stately.ai/docs/migration) runs 2,237 lines with 47 breaking changes, and some change meaning rather than spelling: transitions became internal by default, and child state nodes are always re-entered. A chart drawn against v4 behaves differently under v5.

Then [v6 alpha](https://github.com/statelyai/xstate/releases/tag/xstate%406.0.0-alpha.1) arrived in June 2026 and deleted the vocabulary I used above: `assign`, `raise`, `sendTo`, `enqueueActions`, and the `and`, `or` and `not` guards. That is why every snippet here is stamped 5.32.5, and why you should check the date on any XState article before you copy from it, this one included.

**Learning it is the cost everyone names first.** I cannot measure this and neither can anyone else, so here it is as testimony: one practitioner puts the curve "more similar to rx-js or fp-ts than a state manager", another says "building state machines is an art in and of itself and I had to throw away my first implementation". Take those as reports rather than as a number, but notice that three of the four introductions I read name the learning curve as the top cost and then move on.

**The diagram costs money, or is abandoned.** The payoff people rate highest is showing the chart to someone who does not read code. The old visualizer repository is [archived](https://github.com/statelyai/xstate-viz) and its README now reads "XState (Legacy) Visualizer". The VS Code extension was last updated in January 2024 and the docs still say it is not compatible with v5, which shipped in December 2023. The current editor is a product: free if your projects are public, [$33 a month](https://stately.ai/pricing) billed annually or $39 monthly if they are not.

**The other advertised payoff is also between homes.** Generating test paths from the machine is one of the benefits the introductions I read put near the top. I hand-rolled the exhaustive walker above; XState ships that idea too, and its documentation page currently says the utilities have moved into `@xstate/graph` and that the docs for them are "coming soon", while what is written is for a beta of the package they replaced.

**That payoff is also contested.** A former gadget.dev engineer, in the same 2026 thread, reports the opposite result: "we started with hierarchical statecharts as a way for users to specify their behaviour ... No matter what we did, users just found it incredibly confusing." He also reduced "1000+ lines of very hard to read and extend statechart code to a few hundred lines of imperative code" and found that easier than fixing the bugs hiding in it. He is not an opponent ("I love the idea of statecharts, I just have scars from dealing with them"). One person's experience, self-reported, and worth more than a benefits page.

**Some things it will not catch.** Send an event the current state does not handle and XState swallows it: the actor stays where it was, says nothing, and carries on. A typo in a target *does* throw, early, at `createMachine` time before any actor exists, which beats a hand-rolled switch where a mistyped string waits until runtime. But TypeScript will not catch that typo. And this machine constructs without complaint and then never finishes starting:

```ts
createMachine({ initial: "a", states: { a: { always: "b" }, b: { always: "a" } } });
```

The docs say XState "will help guard against most infinite loop scenarios" and give a rule: if a target is declared, it should differ from the current state node. Both of those targets do differ. It hangs anyway.

```bash
bun run src/verify-behaviour.ts
```

```json
PASS  a typo'd target throws at createMachine(), before any actor exists
      Invalid transition definition for state node '(machine).a':
Child state 'typoState' does not exist on '(machine)'
PASS  an unhandled event changes nothing and warns nothing
      value a -> a, can() false, warnings 0
PASS  manipulation check: the same actor DOES move on an event it handles
      a -> b
PASS  a targetless self-transition preserves the active child
      {"process":"step3"}
PASS  a self-transition with an explicit target resets it to the initial child
      {"process":"step1"}
PASS  an always/always cycle constructs fine and then never finishes starting
      printed: "constructed"; killed after 5s
```

The third line is there because the second is a claim about an absence, and an absence proves nothing unless you show the thing was listening.

Lines four and five are one character apart: an explicit target re-enters the state even when it is the state you are already in.

A hand-written transition table does catch the bogus target that XState's types miss, but only if you tie its targets to the state union:

```ts
type Table = { [S in State["tag"]]?: { [E in Event["type"]]?: State["tag"] } };
```

Write the typo into a free-standing literal type instead, with no tie back to `State`, and it compiles clean. The check comes from that line, not from having used a union.

## When not to reach for one

The test is mechanical, and you can run it on your own code in about a minute: **count your nested states and your parallel regions. If both are zero, you have written a state machine and paid for a statechart.**

```plaintext
nested states?      no  ─┐
parallel regions?   no   ├─▶  you have a state machine. Write the switch.
`after` timers?     no   │
history states?     no  ─┘

any of them yes    ─────▶  you are using the notation. Keep it.
```

Timers and history states are on that list because XState hands you both as primitives, `after` being the one-line version of a delayed transition. You can write either by hand, so this is a question of what you are getting for the dependency rather than of what is possible. And it tests the library, not the idea: a flat machine is a fine thing to have, it just does not need fourteen kilobytes to be one.

In October 2025 the mapping library lonboard opened an [issue](https://github.com/developmentseed/lonboard/issues/916) saying "The current XState implementation is overkill for our simple UI interactions". The [migration to Zustand](https://github.com/developmentseed/lonboard/pull/1042) merged that December. The machine they deleted, [pinned at the commit before the merge](https://raw.githubusercontent.com/developmentseed/lonboard/0577b0722ccbcffda86f1a4ff4aedd01394e258c/src/xstate/machine.ts), was 180 lines, three top-level states, six event types, and zero nested-states blocks.

Flat. It was a state machine the whole time.

The honest code delta is small: 375 lines of application source removed, 283 added, so about ninety lines net. The pull request header says +1425/-488, but roughly eleven hundred of that is new Playwright tests, and quoting it as a code-size result would be dishonest. Their own stated goal was not fewer lines. It was to "Lower barrier to entry for JS developers".

The vendor says something close to the same thing, which is stronger evidence than a skeptic saying it, because the vendor has every reason not to. The XState README tells you to start with `@xstate/store` "if you just need a store" and graduate later. When they announced that store in 2024 they wrote that teams were using XState "for simple data updates, where using full state machines may be overkill". The author's own rule, from an April 2026 thread: statecharts "are most useful when you have behavior where the answer to 'what happens next?' depends on both the current state & the event".

Leaving is not free, either. In a 2024 [discussion](https://github.com/statelyai/xstate/discussions/4708) titled "Need suggestions on migrating away from XState", the poster opened with "XState is just way too sophisticated for our needs" and, ten months later, wrote: "We haven't done the migration because this is a big undertaking and we don't have the resources for it at the moment."

And one widely shipped engine threw one of the two ideas away on purpose. [Zag.js](https://github.com/chakra-ui/zag), which drives the components in Chakra UI and Ark UI, says "We don't follow the SCXML specifications" and instructs its own contributors to "Avoid using complex machine concepts like spawn, nested states, etc." Finite states, yes. Hierarchy, no.

## What else is there

**A tagged union and a `switch`.** Already shown. For a flat model it is the right answer, it is shorter, and it types per-state data better.

**Zustand, Redux, `@xstate/store`.** All stores. Worth knowing that `@xstate/store` is not a small statechart: the words `states`, `initial`, `parallel`, `guard`, `entry`, `exit` and `history` appear nowhere in its type surface. It is context and events. And `@xstate/fsm`, the small official state machine, is deprecated, so the ladder now goes from nothing to a store with no states to the full fourteen kilobytes, with nothing in between.

**Behavior trees.** The competitor that won an entire industry. Similar to hierarchical state machines, except the building block is a *task* rather than a state, which turns out to suit game AI better. Halo, BioShock, Spore; Unity and Unreal both support them.

**TLA+ and friends.** A different altitude: you model the algorithm and check the model, rather than running it. The AWS team's [report](https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf) also states the ceiling that applies to everything in this post, statecharts included: "TLA+ cannot verify code, only algorithms. Code can have bugs that the spec does not have."

**Durable workflow engines.** AWS [Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html) calls its workflows state machines outright, and it does the thing a statechart in a browser tab cannot: a run stays alive for up to a year, and you are billed per transition. XState hands you a JSON snapshot and restores from it, which is not the same promise, because you own the storage and the uptime.

One piece of prior art deserves naming, because the shape of this post is not new. In July 2020 Matt Pocock built [a modal three ways](https://dev.to/mattpocockuk/usestate-vs-usereducer-vs-xstate-part-1-modals-569e), counted the refactors each version needed under a changed requirement, and got 4, 4 and 2. Two things about it. The new requirement was a timed transition, which is the one case XState answers with a one-line primitive, so the setup favours the tool. And the promised part two never came. What I did not find anywhere is a discriminated union of *states* entered as a real contender, or anybody reporting a count instead of a verdict.

---

So: count your nested states. Count your regions. If you have neither, write the switch, and know that you are in good company. If you have both, and you are writing `savingConfirming` by hand, you already have a statechart. You are just spelling it out one combination at a time.
