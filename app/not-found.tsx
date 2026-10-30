import Link from "next/link";
import { Container, PageTitle } from "@/components/ui";

export default function NotFound() {
  return (
    <Container>
      <PageTitle>Not found</PageTitle>
      <p className="text-center">
        There is no such page. <Link href="/problems" className="text-brand hover:underline">Browse all problems</Link>.
      </p>
    </Container>
  );
}
