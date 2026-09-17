---
title: "Your agent writes Python. The Ruby rule cuts that by a third."
description: "Lucian Ghinda published a post arguing you should tell your coding agent to write its throwaway scripts in Ruby. Here is the block he tells you to paste into your agent's instruction file, in full:"
date: "2026-08-06"
tags: ["ruby", "ai", "python", "productivity"]
devto: "https://dev.to/svyatov/your-agent-writes-python-the-ruby-rule-cuts-that-by-a-third-476"
---

Lucian Ghinda [published a post](https://allaboutcoding.ghinda.com/write-agent-scripts-in-ruby/) arguing you should tell your coding agent to write its throwaway scripts in Ruby. Here is the block he tells you to paste into your agent's instruction file, in full:

```markdown
## Scripts

Write throwaway and utility scripts (data munging, one-off migrations,
file renames, glue code) in Ruby, even in projects written in another
language. If it needs a pipe, a loop, a conditional, or more than one
line, it is a script: write it in Ruby, not Python, Node, or bash.
Single self-contained commands (`grep`, `git status`) are fine as-is.

Use only the Ruby standard library. If a gem would clearly save
significant effort, stop and ask before using it.

Put temporary scripts in a scratch or temp directory, not the repo
root, and delete them when done unless asked to keep them.
```

I pasted it into my global `CLAUDE.md` the same evening. His argument is about review: he reads Ruby daily, so when the agent writes Ruby he stays a reviewer instead of nodding at a diff. He gives three reasons and not one of them is cost. So I went looking for the number he left out.

"Does the rule save tokens" only means something against what the agent writes otherwise, so the first thing I had to do was take the block back out of my global config. An agent that already carries the rule cannot tell you what it would do without it.

## Measuring an agent without your config in the room

Every arm below runs through `claude --safe-mode` on Claude Opus 5, which loads no `CLAUDE.md`, no skills, no plugins and no hooks. Two arms deliberately skip that flag, and I name them where they appear: they are the ones that measure what my own setup does to the result. It is worth knowing that my global config alone still carries a line telling the agent to write the minimum code that does the job, and another preferring bun over node.

Four tasks, one for each kind of script the rule names: munge a log, rename a key across a tree of config files, renumber a pile of screenshots, turn one CSV into another. I took them from his list rather than inventing my own, so I could not quietly pick ground that suits Ruby.

Three things about the setup are worth knowing before any number lands. All three are choices I made, and all three are arguable:

- No arm pastes the rule itself. Each names a language and the standard-library constraint directly, which is what the rule produces rather than its own text.
- The bash arm may not use `jq`, since the rule says standard library only and `jq` is a separate install.
- The Ruby arm alone was told one of its brevity idioms is available. That is a thumb on the scale for Ruby, worth about 20 of its 1660 bytes.

Nothing is counted until it is proven equivalent. Every implementation of a task runs against one reference and must produce the same bytes on stdout and the same digest for every file it leaves behind. Comparing the length of programs that do different things is meaningless, so that check gates everything:

```bash
ruby src/run.rb text
```

```plaintext
  t1_logs     count requests and errors per path in an access log    53 impls  identical
  t2_config   rename one key across a tree of .env files, decoy key left alone 53 impls  identical
  t3_rename   renumber screenshot-N.png to zero-padded shot-NNNN.png 53 impls  identical
  t4_csv      filter a CSV to rows with stock, compute totals, write a CSV 53 impls  identical

EQUIVALENT: every implementation matches one reference (stdout + output tree)
```

## The baseline: it writes Python

Ten runs, same four specs, no language named anywhere. Five in the clean room, five with my real setup after the rule came out.

The prompt is not blind, and I should say so. It asks for one sentence on why the agent chose what it chose, which tells it the choice is being watched. A blind version is the run I would do next.

All ten wrote Python.

Not one reached for Ruby, or bash, or JavaScript. The reasons they gave were about the standard library: preinstalled everywhere, handles line-terminator preservation and fixed-decimal formatting without dependencies. So the rule is not choosing between Ruby and some abstract field. It is displacing Python, every time.

Five of those runs had my setup loaded and still chose Python, which is only worth reporting if the setup was genuinely in the room. It was. Asked directly, a session in that condition quotes my `CLAUDE.md` back at me, and the same setup moves the byte counts by up to 59% below. It was read. It simply has nothing left to say about language once the rule is out of it.

That makes the cost question concrete, and the answer is not close:

| bytes, four scripts, neutral prompt | Ruby | Python | bash | JS |
|---|---:|---:|---:|---:|
| source | **1660** | 3644 | 2333 | 3231 |
| vs Ruby | 0% | +120% | +41% | +95% |

Ruby is the shortest of the four, and in the clean room the agent's Python runs to more than twice the source for the same verified behaviour.

That number is condition-dependent, and my own environment is much less flattering. Run it again with my real setup loaded and Python's lead over Ruby drops from 120% to 18%. What the rule buys you depends on what else is already shaping how your agent writes:

| the rule's saving | unprompted default | told Ruby | cut |
|---|---:|---:|---:|
| clean room | 3595 | 1660 | **54%** |
| my real environment | 1932 | 1375 | **29%** |

Both rows are five runs against one, measured the same way. The clean-room row isolates the rule. The bottom row is where you actually are, if your agent is configured at all, and it is the number I would plan against.

The counter drops comments and blank lines but keeps imports, since having to import is a real cost of the language. It also keeps Python docstrings, which is a point against Python that a `#` comment would not have cost it. Those are 8% of the clean-room Python total, and removing them leaves it 101% larger than Ruby instead of 120%.

Nor is the gap all Ruby. Most of that 120% is not the language, it is what the agent wraps around it: the docstring, the `main()`, the `if __name__` guard, the line-ending bookkeeping. Discourage those habits and Python's lead falls to 18%, near the 36% I get writing both by hand.

## What the difference looks like

One task, the config migration, as the neutral prompt produced it. Ruby first:

```ruby
root = ARGV[0]

Dir.glob(File.join(root, "conf", "*.env")).sort.each do |path|
  content = File.read(path)
  renamed = 0

  rewritten = content.lines.map do |line|
    if line.start_with?("CACHE_TTL=")
      renamed += 1
      "TTL_SECONDS=" + line[("CACHE_TTL=".length)..]
    else
      line
    end
  end.join

  File.write(path, rewritten) if renamed > 0
  puts [File.basename(path), renamed].join("\t")
end
```

That is the whole program. Read it once and you know it is right.

Python's version of the same task runs to 38 lines. Here is the middle of it, the loop that does the work:

```python
        renamed = 0
        lines = text.splitlines(keepends=True)
        for i, line in enumerate(lines):
            body = line.rstrip("\r\n")
            ending = line[len(body):]
            key, sep, value = body.partition("=")
            if sep and key == OLD_KEY:
                lines[i] = NEW_KEY + "=" + value + ending
                renamed += 1
```

`text` is the file's contents; `OLD_KEY` and `NEW_KEY` are the two key names, defined at the top of the file. That is the same loop as the Ruby, plus manual line-ending bookkeeping, wrapped in a `main()` with a docstring, four imports and an `if __name__` guard. None of it is bad Python. It is just more of it, and the count agrees:

| neutral prompt | Ruby | Python | bash | JS |
|---|---:|---:|---:|---:|
| lines | **56** | 108 | 101 | 89 |
| distinct words | **104** | 155 | 125 | 118 |
| longest line | 80 | 81 | **65** | 73 |
| punctuation, share of non-space characters | **24%** | **24%** | 37% | 29% |

Ruby wins the two that track reading effort, and loses longest-line to bash. I picked these four before running them and I report all four whichever way they fall, because there is no accepted way to measure readability and a metric chosen after the fact measures the author.

## bash only looks cheap when you ask it to be

Told nothing, the agent writes careful bash: `shopt -s nullglob`, an explicit sort, a temp file per input, and a check for whether the original ended with a newline so it can put it back. That is 2333 bytes, 41% longer than Ruby.

So I ran the neutral prompt a second time with one thing changed: `--safe-mode` off, so my real setup loads instead of the clean room. Same prompt, same specs, same fixture.

| bytes, neutral prompt | Ruby | Python | bash | JS |
|---|---:|---:|---:|---:|
| clean room | **1660** | 3644 | 2333 | 3231 |
| my real setup loaded | 1375 | 1627 | **945** | 2163 |
| change | -17% | -55% | -59% | -33% |

Every language shrinks, and the winner changes. In the clean room Ruby is shortest. Load my setup and bash is shortest by 31%, which is the tidy "just use bash" result, produced entirely by my own environment.

I cannot pin that on one sentence, and should not try. Turning `--safe-mode` off restores my `CLAUDE.md`, skills, hooks and plugins at once, and one of those plugins injects a persona built around writing the shortest thing that works. The honest label on that row is "everything I normally run with".

Both numbers are real. They answer different questions, and only one of them was the question I asked.

## How few words buy terse code

If one line of configuration moves the numbers that far, what is the cheapest instruction that moves them on purpose? I ran a ladder: same specs, same clean room, one agent per language per rung, with only the instruction changing.

| instruction | words | Ruby | Python | bash | JS | all | vs none |
|---|---:|---:|---:|---:|---:|---:|---:|
| (nothing) | 0 | 1660 | 3644 | 2333 | 3231 | 10868 | 0% |
| "Be terse." | 2 | 1275 | 1830 | 906 | 2347 | 6358 | -41% |
| "Golf it." | 2 | 735 | 1033 | 743 | 1369 | 3880 | **-64%** |
| "Shortest code possible." | 3 | 799 | 1151 | 659 | 1448 | 4057 | -63% |
| "Write the shortest X code possible. Minimise source length aggressively." | 10 | 697 | 1062 | 639 | 1322 | 3720 | -66% |
| the same plus six explicit rules | 36 | 685 | 863 | 532 | 1243 | 3323 | -69% |

Two words get you 64 of the 69 points available. The 34 words after them buy the last five, which at one run per cell is inside the noise: adjacent rungs swing by up to 11% per language, and the 2-word rung already beats the 3-word one.

The words themselves matter far more than how many there are. "Be terse." and "Golf it." are both two words, and "Golf it." produces 39% less code overall, and less in every one of the four languages. "Golf" is a term of art, and it drags in everything the phrase "code golf" implies. "Terse" just asks politely.

If you want an agent to write compact code, "Golf it." is the whole prompt.

## What terse code costs

Here is that same config migration again, at the bottom of the ladder:

```ruby
Dir[ARGV[0]+"/conf/*.env"].sort.each{n=0;File.write(it,File.read(it).gsub(/^CACHE_TTL=/){n+=1;"TTL_SECONDS="});puts [File.basename(it),n]*"\t"}
```

One line, 144 bytes against 409, and it passes the same byte-for-byte check.

Three things in there need decoding:

- `it` is Ruby's implicit block parameter, so each `it` is the current filename. It needs Ruby 3.4 or newer. On anything older this line is an error, not a slow read.
- The `gsub` block both counts a match and returns the replacement, so `n` grows as a side effect of building the new text.
- `[File.basename(it),n]*"\t"` is an array joined by a tab, because `*` on an array is `join`.

I had to look twice, in my own language.

The line counts collapse and the lines themselves get worse. Ruby's longest line goes from 80 characters to 151, JavaScript's from 73 to 199, and punctuation climbs from 24% of the non-space characters to 37%. You are not buying compact code. You are buying dense code, and paying in the thing the rule was adopted for.

Then I pointed all 152 implementations at a directory with a space in its name, the six rungs plus the hand-written set as a control. One rung broke, and it is the expensive one: every bash script written under the 36-word instruction failed, all four, while the bash from every shorter rung survived.

```bash
awk '{e[$7]+=$9>=400;t[$7]++}END{for(p in t)print p"\t"e[p]"\t"t[p]}' $1/logs/access.log|LC_ALL=C sort -t$'\t' -k2,2nr -k1,1
```

That `$1` is unquoted. Three of the four exit 0 anyway, because a failing `awk` piped into `sort` reports the exit status of `sort`. Two of those three print nothing at all and the third prints `-1`. The error does reach stderr, so a person watching the terminal sees it. Anything checking only the exit status does not.

So the last 34 words of instruction bought five percentage points of length and broke every bash script they touched. "Golf it." did not.

## The limits

- Length is bytes. I did not run a tokenizer over any of these sets, so every percentage here is a byte percentage, and how closely it tracks a token bill is an assumption I have not tested.
- One agent run per language per rung. The direction is consistent across four languages and six rungs. The exact percentages are not.
- Four tasks, taken from the article's four categories so I could not pick favourable ground, but still four.
- Ten runs is enough to say the default is Python here. It is not enough to put a number on how often.
- The clean room removes configuration, not the model's own priors. "No config" is the honest floor I can reach, not a neutral universe, and a different model may default somewhere else entirely.
- The spaced-path failure is one awkward path on one machine. It shows the failure mode, not a rate that transfers.

## What I would actually tell you

Keep the rule. It wins on cost alone, which is not the argument its author made for it: against Python, the language your agent picks when you say nothing, it cuts source by about a third in a configured setup and by half in a bare one.

Do not reach for a terseness instruction instead. Those cut more than the rule does, but they buy density, not brevity: less code that nobody can read, in a language you did not choose. Push far enough down that ladder and it broke four bash scripts on a path with a space, though "Golf it." itself did not.

Override it in three places. When the library only exists elsewhere, which is Ghinda's own exception. When the script has to run where Ruby is not installed, which the baseline runs raised themselves by picking Python for being preinstalled everywhere. And when the job is one honest shell command, which the rule already exempts.

Ghinda's own reason is still the better one, and it is the one no table here can settle. Reviewability is a fact about the reader. Those same numbers would hold for someone who cannot read Ruby at all, and for them every row above stops meaning anything.

One thing carries past Ruby. Every number here moved, and two of them reversed, depending only on whether my own setup was loaded. If you benchmark an agent, take your config off first, or you are measuring your config.
