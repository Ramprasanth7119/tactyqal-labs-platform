import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { authors, posts } from "@/lib/db/schema";
import { createAuthor, createCategory, listCategories, listTags, createTag } from "./taxonomy";
import { createPost } from "./posts";

type SeedPost = {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: string;
};

/** Titles and dates mirror the six posts on the current tactyqal.com homepage. Bodies are original. */
export const SEED_POSTS: SeedPost[] = [
  {
    slug: "the-elevator-pitch-for-business-entrepreneurs",
    title: "The elevator pitch for business entrepreneurs",
    date: "2024-05-01T09:00:00Z",
    category: "Entrepreneurship",
    tags: ["pitching", "startup basics"],
    excerpt: "You have thirty seconds to make someone care. Here is a simple structure for a pitch that sticks.",
    content: `An elevator pitch is a thirty-second answer to the question "what do you do?" It is not a summary of your business plan. Its only job is to make the listener curious enough to ask a second question.

## The four-part structure

1. **The problem.** Name a specific person and a specific pain. "Small farmers lose a third of their harvest because they guess when to irrigate" beats "agriculture is inefficient".
2. **Your answer.** One sentence, plain words, no jargon. If a ten-year-old cannot repeat it, shorten it.
3. **Proof.** A number, a pilot, a customer quote, anything real. Proof turns a claim into a story.
4. **The ask.** End with a clear next step: a meeting, an intro, a trial.

## An example

> Teenagers have great app ideas but no idea how to build them. We pair each student with a mentor and take them from idea to a working app in eight weeks. Our first cohort shipped twelve apps. We are looking for schools that want to run the next cohort.

That is about fifty words and takes twenty seconds to say.

## Common mistakes

- **Starting with the technology.** People care about the problem first and the tool second.
- **Using big numbers without context.** "A billion-dollar market" means nothing without a first customer.
- **Memorising a script.** Practise the structure, not the words, so you sound like a person.

## Practise it

Record yourself on your phone, then watch it with the sound off. Do you look relaxed? Then listen with the screen off. Is every sentence clear? Try the pitch on three people outside your field and ask them to repeat it back. Whatever they get wrong is the part to rewrite.`,
  },
  {
    slug: "how-to-build-a-tech-startup-team",
    title: "How to build a tech startup team?",
    date: "2024-04-20T09:00:00Z",
    category: "Entrepreneurship",
    tags: ["team building", "startup basics"],
    excerpt: "The first five people shape everything that follows. Here is how to choose them and keep them together.",
    content: `The first handful of people on a startup team decide its culture, its speed and often its survival. Hiring them well matters more than almost any product decision you will make early on.

## Start with the gaps, not the titles

Write down what the company must do in the next six months: build the product, talk to customers, handle money, ship on time. Then mark which of those tasks you can already do. Hire for the rest. A founder who loves selling needs a builder, and a builder usually needs someone who enjoys the customer conversations they avoid.

## What to look for

- **Ownership.** People who finish things without being chased.
- **Curiosity.** Early products change weekly, so the team must learn fast.
- **Complementary skills.** Two people with the same strengths create overlap and silence in the weak spots.
- **Honest communication.** Bad news must travel fast and without fear.

## Where to find people

Start with your network, then widen it. Student communities, hackathons, open-source projects and local meetups all let you see how people work before you commit. A weekend project together tells you more than three interviews.

## Make the deal clear

Early teams often run on trust and goodwill, which is lovely until it is not. Agree in writing on roles, equity, vesting and what happens if someone leaves. It feels awkward for ten minutes and saves months of conflict.

## Keep the team together

Share the goal weekly, celebrate small wins and hold a short retrospective every few weeks: what worked, what hurt, what we change. Teams that talk about how they work get better at working.`,
  },
  {
    slug: "11-reasons-why-startups-fail-at-the-idea-stage",
    title: "11 reasons why startups fail at the idea stage",
    date: "2024-04-10T09:00:00Z",
    category: "Startup Ideas",
    tags: ["validation", "startup basics"],
    excerpt: "Most startups do not die from bad code. They die from weak ideas that were never tested. Eleven traps to avoid.",
    content: `Most failed startups never had a technology problem. They had an idea problem. These are the traps we see most often before a single line of code is written.

1. **No real problem.** The idea is interesting, but nobody is in pain.
2. **No specific customer.** "Everyone" is not a customer. Pick one group and serve it well.
3. **Skipping conversations.** Building for months without talking to a single user.
4. **Falling in love with the solution.** The founder defends the feature instead of testing the need.
5. **Confusing compliments with demand.** "Cool idea" is free. A pre-order or a pilot is not.
6. **A market too small or too crowded.** Check who else solves this and why people would switch.
7. **No way to reach customers.** A great product with no path to its users goes nowhere.
8. **Unclear money.** If you cannot explain who pays and why, you do not have a business yet.
9. **Too big a first version.** Trying to ship everything delays the learning that matters.
10. **A mismatched team.** Nobody who can build, or nobody who can sell.
11. **Giving up too early or holding on too long.** Both come from not measuring anything.

## What to do instead

Write the problem in one sentence. Interview ten people who have it. Sketch the smallest thing that could help them and put it in front of five of them within two weeks. If they use it twice, you have a signal. If not, you learned something cheaply, and that is exactly what the idea stage is for.`,
  },
  {
    slug: "50-no-code-startup-app-ideas",
    title: "50 No-code startup app ideas",
    date: "2025-07-09T09:00:00Z",
    category: "Startup Ideas",
    tags: ["no-code", "app ideas"],
    excerpt: "You do not need to write code to launch. Fifty app ideas you can prototype with no-code tools this month, grouped by theme.",
    content: `No-code tools let you build real products with forms, databases and visual logic. Here are fifty ideas grouped by theme. Pick one that matches a problem you personally know.

## Education (1-10)

Homework planner, flashcard sharing, tutor marketplace for one subject, exam countdown tracker, study group scheduler, reading log for kids, language exchange matcher, school club directory, scholarship tracker, college application checklist.

## Local business (11-20)

Neighbourhood service directory, appointment booking for salons, tiffin or meal subscription manager, local event board, repair shop job tracker, second-hand book swap, rental inventory tracker, loyalty card app, shop-to-doorstep order form, parking space sharing.

## Health and wellbeing (21-30)

Habit tracker, medicine reminder for elders, water and sleep log, gym class booking, mood journal, vaccine schedule keeper, caregiver coordination board, healthy recipe planner, walking buddy matcher, mental health resource finder.

## Community and sustainability (31-40)

Surplus food sharing, tree-planting tracker, community garden planner, repair cafe finder, carpool organiser, clothing swap, plastic-free shop map, volunteer shift scheduler, neighbourhood alert board, energy-saving challenge.

## Work and money (41-50)

Freelancer invoice tracker, simple budget planner, expense splitting for friends, internship board for students, portfolio page builder, event RSVP and payments, team standup bot, inventory counter for small shops, job referral board, skills swap marketplace.

## How to start

Choose one idea, list the three screens it needs and build only those. Airtable, Glide, Softr, Bubble and Zapier cover most of the above. Show the prototype to ten real users before adding anything else.`,
  },
  {
    slug: "30-startup-ideas-to-solve-food-waste-problems",
    title: "30 Startup ideas to solve food waste problems",
    date: "2024-03-15T09:00:00Z",
    category: "Startup Ideas",
    tags: ["sustainability", "app ideas"],
    excerpt: "A third of the world's food is wasted. Thirty startup ideas that turn that waste into opportunity.",
    content: `Roughly a third of all food produced is never eaten. That waste happens on farms, in warehouses, in shops and in our own kitchens, and every stage is a startup opportunity.

## On the farm

1. Crop-ripeness prediction from phone photos
2. Marketplace for "imperfect" produce
3. Cold-storage sharing between small farms
4. Harvest-timing alerts based on weather
5. Gleaning coordination with volunteers
6. Direct farm-to-restaurant ordering

## In transport and storage

7. Low-cost sensors for temperature and humidity
8. Route planning that cuts delivery time for fresh goods
9. Shared refrigerated transport
10. Spoilage prediction for warehouses
11. Smart packaging with freshness indicators
12. Surplus stock alerts for wholesalers

## In shops and restaurants

13. Discount app for near-expiry items
14. Surprise bag from restaurants at closing time
15. Demand forecasting for bakeries
16. Menu planning that reuses ingredients
17. Donation matching to nearby charities
18. Portion-size analytics

## At home

19. Fridge inventory app with expiry reminders
20. Recipe suggestions from leftovers
21. Meal planner that shops once a week
22. Community fridge locator
23. Food-sharing with neighbours
24. Leftover swap for office canteens

## Turning waste into value

25. Composting pickup subscription
26. Food scraps to animal feed
27. Coffee grounds and peels into new products
28. Biogas from restaurant waste
29. Waste tracking dashboard for canteens
30. School programme that measures and reduces lunch waste

Start with the stage you understand best, talk to ten people there and look for the problem they complain about most.`,
  },
  {
    slug: "50-startup-ideas-for-gen-z-entrepreneurs",
    title: "50 Startup ideas for Gen-Z Entrepreneurs",
    date: "2024-03-05T09:00:00Z",
    category: "Startup Ideas",
    tags: ["gen-z", "app ideas"],
    excerpt: "Young founders have an edge: they live in the problem. Fifty ideas built on what your generation already knows.",
    content: `If you are a teenager or a student, you already live inside the problems your generation has. That is an advantage most adult founders would pay for. Here are fifty directions to explore.

## Creator and social

Short-video editing helper, thumbnail design service for small creators, fan community tools, creator income dashboard, portfolio site builder, live-stream clip finder, meme-trend tracker for brands, collaboration matchmaking, sticker pack marketplace, audio-description tools.

## Learning and career

Exam revision planner, peer tutoring network, skill passports for teens, internship finder for under-18s, resume builder for students, interview practice partner, coding challenge community, college essay feedback club, study-abroad guidance, scholarship alerts.

## Money and everyday life

Pocket-money budgeting app, shared expense tracker for hostels, thrift fashion marketplace, secondhand textbook exchange, subscription tracker, part-time job board, side-hustle idea bank, financial literacy games, rent-split tool, student discount aggregator.

## Wellbeing and community

Screen-time challenge app, anonymous peer support, study-break activities, mindful habit tracker, local sports team organiser, volunteering finder, mental health toolkits, sleep routine coach, outdoor meetup planner, eco-challenge leaderboards.

## Tools and games

Educational mobile games, AR campus tour, quiz creator for classrooms, accessibility helper for dyslexia, language learning through games, cheap hardware kits for school projects, pocket science experiments, hackathon team finder, open-source starter kits, app-building clubs.

## Picking one

List three problems you faced this week. Choose the one friends mention too, then build the smallest version in a weekend and ask five classmates to try it.`,
  },
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Entrepreneurship: "Practical advice on pitching, teams and running a venture.",
  "Startup Ideas": "Idea lists and prompts for young founders.",
};

/** Idempotent: safe to run repeatedly. Existing posts (by slug) are left untouched. */
export async function seedDatabase() {
  const db = await getDb();

  let [author] = await db.select().from(authors).where(eq(authors.slug, "tactyqal-team")).limit(1);
  if (!author) {
    author = await createAuthor({
      name: "Tactyqal Team",
      slug: "tactyqal-team",
      bio: "Mentors and engineers helping young founders build real products.",
    });
  }

  const existingCats = new Set((await listCategories()).map((c) => c.name));
  for (const name of Object.keys(CATEGORY_DESCRIPTIONS)) {
    if (!existingCats.has(name)) await createCategory({ name, description: CATEGORY_DESCRIPTIONS[name] });
  }
  const existingTags = new Set((await listTags()).map((t) => t.name));
  for (const name of new Set(SEED_POSTS.flatMap((p) => p.tags))) {
    if (!existingTags.has(name)) await createTag({ name });
  }

  let created = 0;
  for (const p of SEED_POSTS) {
    const [exists] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, p.slug)).limit(1);
    if (exists) continue;
    await createPost({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      status: "published",
      publishedAt: p.date,
      category: p.category,
      tags: p.tags,
      authorId: author.id,
      seoDescription: p.excerpt,
    });
    created++;
  }
  return { created, total: SEED_POSTS.length };
}
