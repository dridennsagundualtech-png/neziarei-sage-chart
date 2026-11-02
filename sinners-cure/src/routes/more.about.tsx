import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/app-ui";

export const Route = createFileRoute("/more/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <Page back={{ to: "/more/settings", label: "Settings" }} title="About">
      <article className="space-y-5 text-[1.05rem] leading-relaxed">
        <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">Why I made this</h2>

        <p>
          When I enrolled at Dualtech Training Center, I was close to becoming an atheist. I had
          drifted so far from God that I was being drawn toward something even darker.
        </p>
        <p>
          Dualtech changed that. It changed how I think and what I value, but most of all, it was
          there that I found my way back to God.
        </p>
        <p>
          Everything started there. Every path I take now leads me back toward that same place, and
          toward helping it the way it helped me.
        </p>
        <p>
          This app is my small way of giving back. If you are far from God right now, the way I was,
          you are not too far. He came for sinners. That is why this app is called Sinner's Cure.
        </p>

        <h2 className="pt-4 font-serif text-[1.5rem] font-semibold leading-tight">Thank you</h2>
        <p>
          To my advisor, my mentors and my colleagues at Dualtech: thank you. You were patient with
          me, you believed in me, and you showed me God through the way you live and work. Whatever
          good this app does began with you.
        </p>

        <figure className="border-l-2 border-primary py-1 pl-4">
          <blockquote className="scripture italic">
            They that are whole need not the physician: but they that are sick. I came not to call
            the just, but sinners to penance.
          </blockquote>
          <figcaption className="mt-1 text-[0.95rem] text-muted-foreground">
            Luke 5:31–32
          </figcaption>
        </figure>

        <p className="pt-2 font-serif text-[1.2rem]">
          DWS 12-12
          <span className="block font-sans text-[0.95rem] text-muted-foreground">
            Former student, Dualtech Training Center
          </span>
        </p>
      </article>
    </Page>
  );
}
