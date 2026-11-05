import Link from "next/link";
import { MarkdownContent } from "@/components/markdown/markdown";
import { AppleIcon, FramedBox } from "@/components/ui";
import type { Problem } from "@/lib/data/problems";

/** The boxed problem statement. `heading` makes its title the page's h1. */
export function ProblemBox({ problem, heading, link }: { problem: Problem; heading?: boolean; link?: boolean }) {
  return (
    <FramedBox
      titleAs={heading ? "h1" : "div"}
      title={
        <>
          <AppleIcon variant="white" />
          Problem {problem.number}: {problem.title}
        </>
      }
    >
      <MarkdownContent source={problem.statement} references={problem.references} />
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
