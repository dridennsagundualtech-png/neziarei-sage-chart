# Daily Mass And Mystery

Build "Sinner's Cure", a Catholic Bible and prayer app for phones. It must work with no internet later, so:

- No login, no Lovable Cloud, no database, no AI features, no outside APIs or websites.

- Run everything in the browser: no server functions or server routes.

- Save everything on the device (localStorage).

- Keep all content in files inside the project (src/data/). Use small sample data for the Bible (Genesis 1-3, Psalm 23, John 1-3) and Mass readings (a few days). I will replace these files with the full data later, so keep the format simple and documented.

- Bundle fonts with @fontsource packages, not Google Fonts links.



Tabs at the bottom: Today, Bible, Rosary, Prayers, More.



Today

- Date, the Church season and its color, and a "Today's Mass" card: the celebration name, what it's about in 2-3 sentences, and the reading citations.

- Daily verse, with copy and share.

- Today's rosary mysteries, with a button to start praying.

- Put all of today's content in one function, getToday(date), so a home-screen widget can reuse it later.



Rosary (interactive, one bead at a time)

- Mysteries by day: Monday and Saturday Joyful, Tuesday and Friday Sorrowful, Wednesday and Sunday Glorious, Thursday Luminous. The user can pick another set.

- Order: Sign of the Cross, Apostles' Creed, Our Father, 3 Hail Marys (for faith, hope and charity), Glory Be. Then five decades, each with: the mystery announced with its Scripture reference, its fruit and a short meditation; Our Father; 10 Hail Marys; Glory Be; the Fatima Prayer. Close with Hail Holy Queen, the closing prayer ("O God, whose only begotten Son…") and an optional Prayer to St Michael.

- Full traditional prayer texts. A bead ring shows progress. Tap to go forward, with a back button. Remember progress if the app is closed.

I like this novena rosary please make one exactly like this

https://novenaprayer.com/rosary-sunday/

Bible

- All 73 books in Catholic order, split into Old and New Testament. Chapter picker, text size setting, verse highlights in 4 colors, bookmarks, notes, copy and share, search, and continue where you left off.



Prayers

- Divine Mercy Chaplet (interactive, reusing the bead ring), Angelus, Memorare, Act of Contrition, morning and night prayers, grace before and after meals, Prayer to St Michael.

- A Confession guide with an examination of conscience. Checkmarks stay on the device and can be cleared in one tap.



More

- Reading plans with progress: Bible in a year, Gospels in 30 days, Psalms in 30 days.

- Saved highlights, bookmarks and notes.

- A daily prayer streak.

- Settings: light or dark theme, text size, and a reminder time (just the setting for now; I'll connect the real notification later).



Design: calm and reverent, built for reading. Serif type for Scripture, warm parchment light theme and a deep dark theme, today's liturgical color as the accent. No gradients or glow effects. Large tap targets and readable text sizes.



A light and dark theme, and a larger text feature for older people who have hard time reading texts on phone

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://daily-mass-and-mystery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5489ff2f-6820-4204-b5f0-70474bc03511).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
