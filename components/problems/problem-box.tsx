import Link from "next/link";
import { MarkdownContent } from "@/components/markdown/markdown";
import { AppleIcon, Clamped, FramedBox, HourglassIcon } from "@/components/ui";
import type { Problem } from "@/lib/data/problems";

/**
 * The boxed problem statement. `heading` makes its title the page's h1. `preview`: only its first lines, fading
 * out, with a link to the problem's page (for the home page, where a long statement would fill the screen).
 */
export function ProblemBox({ problem, heading, link, preview }: { problem: Problem; heading?: boolean; link?: boolean; preview?: boolean }) {
  const statement = <MarkdownContent source={problem.statement} references={problem.references} />;
  return (
    <FramedBox
      titleAs={heading ? "h1" : "div"}
      title={
        <>
          {problem.published ? <AppleIcon variant="white" /> : <HourglassIcon variant="white" />}
          Problem {problem.number}: {problem.title}
        </>
      }
    >
      {preview ? (
        <Clamped lines={7} more={`/problems/${problem.slug}`}>
          {statement}
        </Clamped>
      ) : (
        statement
      )}
      {link && (
        <p className="mt-3.5 text-right text-[0.95rem]">
          <Link href={`/problems/${problem.slug}`} className="text-brand hover:underline">
            Open problem page →
          </Link>
        </p>
      )}
    </FramedBox>
  );
}
