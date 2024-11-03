# Open Map Guesser

Test your knowledge of countries and regions using Open Street Maps.

> This project has been made as part of DurHack 2024, and as such is unlikely to be maintained once the hackathon has
> ended.

## Inspiration

Using Geoguessr to procrastinate on coursework

## What it does

You know those web games where you get a map of the US and have to fill in the states, or a map of Europe and fill in
the countries? Now you can do that with basically anything on demand (by pulling it from open-source map data).

## How we built it

JavaScript and a bunch of APIs.

## Challenges we ran into

Turns out borders can have a lot of detail in them and that makes them very big files. It also turns out that open
source maps maintained by random people for fun can have some small bits of data missing (such as Cumbria).

Also, the borders between internal regions of Cyprus are really weird and bad, and some of them overlap each other
completely. There is exactly one country that doesn't appear in our project.

## Accomplishments that we're proud of

Making it look and feel so much like a proper website when it's basically just two APIs and a framework duct taped
together.

## What we learned

If you're trying to do a hackathon and a CTF at the same time you're probably not going to do very well at either of
them (and also that thing about Cyprus).

## What's next for Open Map Guesser

Honestly we'll probably forget about it once we've slept but I'll send you it for open day demos if you want.
