import { redirect } from "next/navigation";

export default function TrackPage() {
  redirect("/public-dashboard?tab=track");
}
