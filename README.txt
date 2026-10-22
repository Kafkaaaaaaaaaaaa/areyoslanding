Areyos website (areyos.in)
=========================
Static site. No build step, no server code, no external requests.

Deploy: upload the contents of this folder to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, cPanel) so that index.html sits at the root.

Files
  index.html            the page
  assets/styles.css     all styles and design tokens (colors, type)
  assets/main.js        all motion and behaviour
  assets/gsap.min.js, ScrollTrigger.min.js   animation library (GSAP 3.12.5), self-hosted
  assets/inter-*.woff2  Inter variable font, self-hosted
  assets/*.svg, *.png   logos, favicons, share image from the Areyos logo pack

Edit copy directly in index.html. Brand colors are the :root variables at the top of assets/styles.css.
Contact details to change: search index.html for 85914 36477 and areyosdemo.vercel.app.
