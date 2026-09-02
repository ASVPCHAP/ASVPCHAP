# True Power — Coaching & Personal Training

Marketing and membership site for **True Power**, Kevin Chapman's online coaching business
(nutrition coaching, training, and natural bodybuilding contest prep).

It is a static site: plain HTML, CSS and JavaScript, no build step, no backend.
Open `index.html` in a browser and it works.

## What's on the page

| Section | What it does |
| --- | --- |
| Hero | Brand statement, Psalms 107:14, calls to action |
| About | Kevin's bio, credentials, Instagram link, portrait |
| The Edge | Why a pharmacist-coach is different |
| Gallery | Stage and posing photos with a lightbox |
| How it works | The 4-step coaching process |
| Saturday check-in | Visual of the True Power prep / feedback sheet |
| Memberships | 3 tiers, monthly vs 12-week toggle, "Start" buttons |
| Macro calculator | Interactive lead magnet: calories + training / rest / high-carb macros |
| Results | Client transformations (hidden until you add some) |
| FAQ | Accordion built from config |
| Apply | Application form + contact details |

## Editing the site

Almost everything lives in **`js/config.js`**:

- Business name, email, phone, Instagram handle, verse
- Kevin's bio paragraphs, credentials, photo paths, gallery photos
- Membership names, prices, features and checkout links
- FAQ questions and answers
- Client results

Photos go in `assets/img/`. Replace `coach.jpg` (portrait, 4:5 works best) and
`hero.jpg` (wide background shot) to change the main images. Add gallery photos to
`assets/img/gallery/` and list them in `coach.gallery`.

## Taking payments for memberships

The site does not process cards itself. The simplest setup:

1. Create a [Stripe](https://stripe.com) account (or Square / PayPal).
2. Create a recurring **Payment Link** for each membership tier.
3. Paste each link into `checkoutUrl` for that plan in `js/config.js`.

Once a `checkoutUrl` is set, the plan's **Start** button sends people straight to checkout.
With it empty, the button opens the application form instead.

## Receiving applications

Set `formEndpoint` in `js/config.js` to a form service endpoint, for example a free
[Formspree](https://formspree.io) form (`https://formspree.io/f/xxxxxxx`). Submissions are
emailed to you.

If `formEndpoint` is empty, the form falls back to opening the visitor's email app with the
details pre-filled and addressed to `business.email`.

Optional: set `bookingUrl` to a Calendly link and the "Book a free consult" buttons open it.

## Publishing

**GitHub Pages (free):** in this repository go to *Settings → Pages*, choose
*Deploy from a branch*, pick the branch and `/ (root)`. The site goes live at
`https://<username>.github.io/<repo>/` within a minute or two.

**Netlify / Vercel:** drag the folder in, or connect the repo. No build command, publish
directory is the repo root.

**Custom domain:** point the domain at GitHub Pages / Netlify per their docs and add it in
the project settings.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
