import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

export function Faq() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          Where is my data kept? Are my unpublished pages backed up?
        </AccordionTrigger>
        <AccordionContent>
          We only store information about your login, basic user details and
          data usage, on top of any files or web pages you upload. Files you
          create or load into your editor are kept <b>only on your computer</b>,
          meaning that for the time being, there is no automatic backup. This is
          to help make Organ affordable, to give you offline access, and to make
          the app fast to use. If you clear the browser data for Organ, any
          unpublished pages you created will also be deleted, so back them up if
          you intend to do this. A simplified data export feature is coming
          soon.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          Help, I don't know how to make my website look nice!
        </AccordionTrigger>
        <AccordionContent>
          With your support, Organ will be able to offer a template marketplace
          for downloading templates. In the meantime, you're welcome to contract
          me to design and build a site for you - then you can just focus on
          updating your content on Organ!
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          Is it possible to have private pages and files?
        </AccordionTrigger>
        <AccordionContent>
          Not currently, but end-to-end encrypted pages and files is another
          feature that I'm hoping to work on in the future. For now, all pages
          and files are public.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>
          How can I collaborate with others on my website?
        </AccordionTrigger>
        <AccordionContent>
          Again, another thing I want to work on soon, but right now given the
          focus on local data, collaborating is a bit tricky and if that's a
          priority I would recommend using something else for now.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <AccordionTrigger>How does Organ work? (technical)</AccordionTrigger>
        <AccordionContent>
          Organ is a React/Astro app with a mostly shadcn interface. The app
          stores your assets in IndexedDB, and it stores your text files in a
          WASM-embedded SQLite database running in memory, which regularly
          exports to IndexedDB. The preview pane takes your source files and a
          map of Blob URIs (window scope references to asset blobs in memory)
          and generates HTML using a custom Rust module compiled to WASM, using
          the <b>handlebars</b> crate for template rendering. This HTML is
          passed via Window messages to an iframe running morphdom, a DOM
          diffing library which doesn't use a virtual DOM. morphdom efficiently
          updates the iframe using the new HTML. This happens on every click and
          keystroke.{" "}
          <a
            href="https://github.com/meri-leeworthy/organ"
            className="underline">
            Source repo
          </a>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-6">
        <AccordionTrigger>
          What happened to the earlier version of Organ?
        </AccordionTrigger>
        <AccordionContent>
          See{" "}
          <a
            href="https://meri.garden/What%20happened%20to%20the%20earlier%20version%20of%20Organ%3F"
            className="underline">
            this article
          </a>
          .
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
